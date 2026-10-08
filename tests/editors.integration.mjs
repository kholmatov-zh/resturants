// Runs the application against REAL local PostgreSQL/PostgREST.
// Auth and file transport use local test adapters. Never point this at production.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHmac,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import sharp from 'sharp';
const rest=process.env.POSTGREST_TEST_URL||'http://127.0.0.1:54325';
assert.ok(['127.0.0.1','localhost'].includes(new URL(rest).hostname),'Only local validation databases are allowed');
const adminId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', normalId='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const secret='local-postgrest-validation-secret-at-least-32';
function token(sub){const input=Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');return input+'.'+createHmac('sha256',secret).update(input).digest('base64url');}
const adminToken=token(adminId),normalToken=token(normalId);
const tokens=new Map([[adminToken,adminId],[normalToken,normalId]]);
const user=id=>({id,aud:'authenticated',role:'authenticated',email:id===adminId?'admin@example.test':'user@example.test',created_at:'2026-01-01T00:00:00Z',app_metadata:{provider:'email'},user_metadata:{},identities:[]});
const files=new Map();
async function database(path,{method='GET',body,authorization,storage=false,headers={}}={}){
 return fetch(rest+path,{method,headers:{'Content-Type':'application/json',...(tokens.has((authorization||'').replace('Bearer ',''))?{Authorization:authorization}:{}),...(storage?{'Accept-Profile':'storage','Content-Profile':'storage'}:{}),...headers},body:body?JSON.stringify(body):undefined});
}
const adapter=createServer(async(req,res)=>{
 try{
 let body=Buffer.alloc(0);for await(const chunk of req)body=Buffer.concat([body,chunk]);
 const url=new URL(req.url,'http://localhost');const authorization=req.headers.authorization;const id=tokens.get((authorization||'').replace('Bearer ',''));
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 if(url.pathname==='/auth/v1/token'){const input=JSON.parse(body.toString());if(input.password!=='valid-password')return json(400,{code:'invalid_credentials',msg:'Invalid credentials'});const uid=input.email==='admin@example.test'?adminId:normalId;return json(200,{access_token:uid===adminId?adminToken:normalToken,expires_in:3600,token_type:'bearer',refresh_token:'local-refresh',user:user(uid)});}
 if(url.pathname==='/auth/v1/user')return id?json(200,user(id)):json(401,{code:'bad_jwt',msg:'Invalid token'});
 if(url.pathname==='/auth/v1/logout'){res.writeHead(204);res.end();return;}
 if(url.pathname.startsWith('/rest/v1/')){const headers={};for(const key of ['accept','prefer','range','range-unit','accept-profile','content-profile'])if(req.headers[key])headers[key]=req.headers[key];const r=await database(url.pathname.replace('/rest/v1','')+url.search,{method:req.method,body:body.length?JSON.parse(body.toString()):undefined,authorization,headers});const out={};for(const key of ['content-type','content-range','preference-applied'])if(r.headers.has(key))out[key]=r.headers.get(key);res.writeHead(r.status,out);res.end(Buffer.from(await r.arrayBuffer()));return;}
 const uploadPrefix='/storage/v1/object/restaurant-images/';
 const readPrefix=uploadPrefix;
 if(url.pathname.startsWith(uploadPrefix)&&req.method==='POST'){
  const path=decodeURIComponent(url.pathname.slice(uploadPrefix.length));const r=await database('/objects',{method:'POST',authorization,storage:true,body:{bucket_id:'restaurant-images',name:path}});if(!r.ok)return json(r.status,{message:'Storage RLS denied'});files.set(path,body);return json(200,{Key:'restaurant-images/'+path,Id:randomUUID()});
 }
 if(url.pathname.startsWith(readPrefix)&&req.method==='GET'){
  const path=decodeURIComponent(url.pathname.slice(readPrefix.length));const r=await database('/objects?bucket_id=eq.restaurant-images&name=eq.'+encodeURIComponent(path)+'&select=id',{authorization,storage:true});const rows=await r.json();if(!r.ok||!rows.length||!files.has(path))return json(404,{message:'Not found'});res.writeHead(200,{'Content-Type':'image/webp'});res.end(files.get(path));return;
 }
 if(url.pathname==='/storage/v1/object/restaurant-images'&&req.method==='DELETE'){
  const {prefixes}=JSON.parse(body);for(const path of prefixes){const r=await database('/objects?bucket_id=eq.restaurant-images&name=eq.'+encodeURIComponent(path),{method:'DELETE',authorization,storage:true});if(!r.ok)return json(r.status,{message:'Denied'});files.delete(path);}return json(200,[]);
 }
 json(404,{message:'Unknown test endpoint'});
 }catch(error){res.writeHead(500);res.end('Test adapter error');console.error(error.message);}
});
adapter.listen(0,'127.0.0.1');await once(adapter,'listening');const port=adapter.address().port;
const appPort=3112;let logs='';const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(appPort)],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${port}`,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_local_editor_test_only'},stdio:['ignore','pipe','pipe']});app.stdout.on('data',v=>logs+=v);app.stderr.on('data',v=>logs+=v);
let browser;
try{
 const base=`http://localhost:${appPort}`;for(let n=0;n<100;n++){try{await fetch(base+'/admin/login');break;}catch{if(app.exitCode!==null)throw new Error('App startup failed');await new Promise(r=>setTimeout(r,100));}}
 browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const slug='browser-'+Date.now();
 await page.goto(base+'/admin/restaurants/new');assert.equal(new URL(page.url()).pathname,'/admin/login');
 await page.getByLabel('Email администратора').fill('admin@example.test');await page.getByLabel('Пароль',{exact:true}).fill('valid-password');await page.getByRole('button',{name:'Войти в панель'}).click();await page.waitForURL(base+'/admin');
 await page.goto(base+'/admin/restaurants/new');await page.getByLabel('Название',{exact:true}).fill('Browser Restaurant');await page.getByLabel('Постоянный адрес меню (латиница)').fill(slug);await page.getByRole('button',{name:'Создать черновик'}).click();await page.waitForURL(/\/admin\/restaurants\/[a-f0-9-]{36}$/);const editorUrl=page.url();assert.match(new URL(editorUrl).pathname.split('/').pop(),/^[a-f0-9-]{36}$/);
 await page.getByLabel('Телефон (+998…)').fill('+998 90 000 00 00');
 for(const lang of ['O‘zbekcha','Русский']){await page.getByLabel('Адрес · '+lang,{exact:true}).fill('Test address');await page.getByLabel('Часы работы · '+lang,{exact:true}).fill('10:00–22:00');}
 await page.getByRole('button',{name:'Сохранить ресторан',exact:true}).click();await page.getByRole('status').filter({hasText:'Ресторан сохранён'}).waitFor();
 const guest=await browser.newContext();const publicPage=await guest.newPage();assert.equal((await publicPage.goto(base+'/r/'+slug)).status(),404);
 await page.locator('summary').filter({hasText:'Добавить категорию'}).click();const categoryForm=page.locator('form').filter({has:page.getByRole('button',{name:'Добавить категорию',exact:true})});await categoryForm.getByLabel('Название категории · O‘zbekcha').fill('Taomlar');await categoryForm.getByLabel('Название категории · Русский').fill('Блюда');await categoryForm.getByRole('button',{name:'Добавить категорию'}).click();await categoryForm.getByRole('status').filter({hasText:'Категория сохранена'}).waitFor();
 await page.locator('summary').filter({hasText:'Добавить блюдо'}).click();const dishForm=page.locator('form').filter({has:page.getByRole('button',{name:'Добавить блюдо',exact:true})});await dishForm.getByLabel('Название блюда · O‘zbekcha').fill('Sinov taomi');await dishForm.getByLabel('Название блюда · Русский').fill('Тестовое блюдо');await dishForm.getByLabel('Цена, сум').fill('25000');
 // Actual PNG bytes go through signature checks + sharp optimization + storage RLS.
 const png=await sharp({create:{width:32,height:32,channels:3,background:'#abc123'}}).png().toBuffer();await dishForm.getByLabel('Фотография блюда').setInputFiles({name:'dish.png',mimeType:'image/png',buffer:png});await dishForm.getByRole('button',{name:'Добавить блюдо'}).click();await dishForm.getByRole('status').filter({hasText:'Блюдо сохранено'}).waitFor();
 await page.getByLabel('Новый статус').selectOption('published');await page.getByRole('button',{name:'Изменить статус'}).click();await page.getByRole('status').filter({hasText:'Меню опубликовано'}).waitFor();
 assert.equal((await publicPage.goto(base+'/r/'+slug)).status(),200);await publicPage.getByRole('button',{name:'RU',exact:true}).click();await publicPage.getByRole('heading',{name:'Тестовое блюдо',exact:true}).waitFor();assert.match(await publicPage.locator('.dish-price').innerText(),/25.000/);await publicPage.getByRole('button',{name:'Заказать',exact:true}).click();assert.equal(await publicPage.getByRole('dialog').getByRole('link',{name:'Позвонить'}).getAttribute('href'),'tel:+998900000000');await publicPage.keyboard.press('Escape');
 const imageUrl=await publicPage.locator('.dish-image img').getAttribute('src');assert.equal((await guest.request.get(base+imageUrl)).status(),200);
 // Edit the persisted item and verify the public page sees its updated price.
 await page.locator('summary').filter({hasText:'Тестовое блюдо ·'}).click();const editForm=page.locator('form').filter({has:page.getByLabel('Цена, сум')}).last();await editForm.getByLabel('Цена, сум').fill('30000');await editForm.getByRole('button',{name:'Сохранить',exact:true}).click();await editForm.getByRole('status').filter({hasText:'Блюдо сохранено'}).waitFor();await publicPage.reload();assert.match(await publicPage.locator('.dish-price').innerText(),/30.000/);
 await page.getByRole('checkbox',{name:'Выбрать Тестовое блюдо'}).check();await page.locator('select[name=operation]').selectOption('hide');await page.getByRole('button',{name:'Применить к выбранным'}).click();await page.getByRole('status').filter({hasText:'Выбранные блюда обновлены'}).waitFor();await publicPage.reload();assert.equal(await publicPage.locator('.dish-card').count(),0);assert.equal((await guest.request.get(base+imageUrl)).status(),404);
 await page.locator('select[name=operation]').selectOption('show');await page.getByRole('button',{name:'Применить к выбранным'}).click();await page.getByRole('status').filter({hasText:'Выбранные блюда обновлены'}).waitFor();
 await page.getByLabel('Новый статус').selectOption('draft');await page.getByRole('button',{name:'Изменить статус'}).click();await page.getByRole('status').filter({hasText:'снято с публикации'}).waitFor();assert.equal((await publicPage.goto(base+'/r/'+slug)).status(),404);assert.equal((await guest.request.get(base+imageUrl)).status(),404);
 await page.goto(base+'/admin/settings');await page.getByRole('heading',{name:'Контакты и документы',exact:true}).waitFor();await page.getByLabel('Стоимость, сум (пусто — договорная)').fill('');await page.getByRole('button',{name:'Сохранить',exact:true}).first().click();await page.getByRole('status').filter({hasText:'Контакты и условия сохранены'}).waitFor();
 await page.locator('summary').filter({hasText:'Политика конфиденциальности'}).click();const privacyForm=page.locator('form').filter({has:page.locator('input[name=kind][value=privacy]')});await privacyForm.getByLabel('Полный текст · Русский').fill('ЧЕРНОВИК [Реквизиты] '+ 'Тестовый текст. '.repeat(12));await privacyForm.getByLabel('Полный текст · O‘zbekcha').fill('QORALAMA [Ma’lumotlar] '+ 'Sinov matni. '.repeat(12));await privacyForm.getByLabel('Опубликовать документ').check();await privacyForm.getByRole('button',{name:'Сохранить',exact:true}).click();await privacyForm.getByRole('alert').filter({hasText:'заполните все поля'}).waitFor();assert.match(await privacyForm.getByLabel('Полный текст · Русский').inputValue(),/ЧЕРНОВИК/);await privacyForm.getByLabel('Опубликовать документ').uncheck();await privacyForm.getByRole('button',{name:'Сохранить',exact:true}).click();await privacyForm.getByRole('status').filter({hasText:'Черновик сохранён'}).waitFor();
 await publicPage.goto(base+'/');await publicPage.getByRole('button',{name:'RU',exact:true}).click();assert.equal(await publicPage.getByRole('link',{name:'Написать в Telegram'}).getAttribute('href'),'https://t.me/khv31');assert.equal(await publicPage.getByRole('link',{name:'Написать на почту'}).getAttribute('href'),'mailto:holmatov_j@outlook.com');assert.equal(await publicPage.locator('.footer-owner').innerText(),'Jasurbek Kholmatov');assert.equal(await publicPage.locator('.footer-right').locator('p').last().getAttribute('class'),'footer-owner');
 await publicPage.getByRole('link',{name:'Публичная оферта'}).click();await publicPage.getByRole('heading',{name:'Документ ещё не опубликован.'}).waitFor();assert.equal(await publicPage.getByText('Jasurbek Kholmatov',{exact:true}).count(),0);
 for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`settings overflow ${width}`);await publicPage.setViewportSize({width,height:900});assert.equal(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await page.goto(editorUrl);for(const width of [320,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`editor overflow ${width}`);}
 assert.deepEqual(errors,[]);await guest.close();
 console.log('PASS: REAL PostgreSQL/PostgREST CRUD, optimized image upload/serving, publication/unpublication, actual price changes, atomic bulk hide/show, image RLS, contact settings and buttons, legal draft privacy, name only in home footer, responsive editors. Auth/Storage HTTP transport uses local test adapters.');
}catch(error){console.error(error);if(process.env.DEBUG_EDITOR_TEST)console.error(logs);process.exitCode=1;}
finally{await browser?.close();app.kill('SIGTERM');adapter.close();}
