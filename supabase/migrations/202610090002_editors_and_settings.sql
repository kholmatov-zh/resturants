begin;
create table public.platform_settings (
  id boolean primary key default true check(id),
  brand_name text not null default 'Dasturxon' check(char_length(brand_name) between 1 and 80),
  telegram_url text check(telegram_url is null or telegram_url ~ '^https://t.me/'),
  email text check(email is null or char_length(email) <= 254),
  phone text check(phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  price_uzs bigint check(price_uzs is null or price_uzs between 0 and 9000000000000),
  service_terms jsonb not null default '{"uz":"","ru":""}' check(private.valid_translation(service_terms)),
  executor_name text not null default '', executor_status text not null default '',
  executor_address text not null default '', executor_registration text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.platform_settings(id,telegram_url,email,executor_name) values(true,'https://t.me/khv31','holmatov_j@outlook.com','Jasurbek Kholmatov');
alter table public.platform_settings enable row level security;
grant select on public.platform_settings to anon;
grant select,update on public.platform_settings to authenticated;
revoke insert,delete on public.platform_settings from anon,authenticated;
create policy "Read public platform settings" on public.platform_settings for select to anon,authenticated using(true);
create policy "Admin platform settings" on public.platform_settings for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create trigger platform_settings_updated before update on public.platform_settings for each row execute function private.touch_updated_at();

create table public.legal_documents (
  kind text primary key check(kind in ('privacy','offer')),
  title jsonb not null check(private.valid_translation(title)),
  content jsonb not null default '{"uz":"","ru":""}' check(private.valid_translation(content)),
  is_published boolean not null default false,
  updated_at timestamptz not null default now(),
  check(not is_published or (char_length(content->>'uz') >= 100 and char_length(content->>'ru') >= 100))
);
insert into public.legal_documents(kind,title) values ('privacy','{"uz":"Maxfiylik siyosati","ru":"Политика конфиденциальности"}'),('offer','{"uz":"Ommaviy oferta","ru":"Публичная оферта"}');
update public.legal_documents set content = '{"ru": "ЧЕРНОВИК — требуется заполнить данные и проверить перед публикацией.\n\n1. Оператор и контакты\nОператор сайта: [имя или наименование исполнителя, правовой статус, адрес и реквизиты]. Для вопросов по данным: holmatov_j@outlook.com.\n\n2. Просмотр сайта\nПосетители могут просматривать меню без регистрации. Выбранный язык сохраняется в localStorage браузера. Корзина, оформление заказов и онлайн-оплата на сайте не используются.\n\n3. Обращения\nКнопки связи открывают Telegram или почтовое приложение. При обращении посетитель сам передаёт выбранной службе и исполнителю имя, контакты и содержание сообщения. Обработка данных сторонними службами регулируется их условиями.\n\n4. Административный доступ\nДля владельца платформы используется Supabase Auth. Данные входа передаются сервису авторизации; сессия хранится в защищённых cookies. Публичная регистрация администраторов на сайте отсутствует.\n\n5. Цели, сроки и получатели\nДанные обращений используются для обсуждения услуги и исполнения согласованной работы. [Указать фактические сроки хранения, используемые сервисы, место обработки и порядок удаления данных].\n\n6. Запросы пользователя\nДля вопросов, исправления или удаления предоставленных данных обратитесь по email. [Указать порядок рассмотрения запросов и применимые требования законодательства].\n\n7. Изменения\nАктуальная редакция публикуется на этой странице с датой обновления. Перед публикацией заполните все поля в квадратных скобках.", "uz": "QORALAMA — e’lon qilishdan oldin ma’lumotlarni to‘ldirish va tekshirish zarur.\n\n1. Operator va aloqa\nSayt operatori: [ijrochining ismi yoki tashkilot nomi, huquqiy maqomi, manzili va rekvizitlari]. Ma’lumotlar bo‘yicha savollar: holmatov_j@outlook.com.\n\n2. Saytni ko‘rish\nMehmonlar menuni ro‘yxatdan o‘tmasdan ko‘rishi mumkin. Tanlangan til brauzerning localStorage xotirasida saqlanadi. Saytda savat, buyurtmani rasmiylashtirish va onlayn to‘lov mavjud emas.\n\n3. Murojaatlar\nAloqa tugmalari Telegram yoki email dasturini ochadi. Murojaat qiluvchi o‘zi tanlagan xizmatga va ijrochiga ism, aloqa ma’lumotlari hamda xabar mazmunini yuboradi. Tashqi xizmatlarning ma’lumotlarni qayta ishlashi ularning shartlari bilan tartibga solinadi.\n\n4. Administrator kirishi\nPlatforma egasi uchun Supabase Auth ishlatiladi. Kirish ma’lumotlari avtorizatsiya xizmatiga yuboriladi; sessiya himoyalangan cookies orqali saqlanadi. Saytda administratorlar uchun ochiq ro‘yxatdan o‘tish yo‘q.\n\n5. Maqsadlar, muddatlar va oluvchilar\nMurojaat ma’lumotlari xizmatni muhokama qilish va kelishilgan ishni bajarish uchun ishlatiladi. [Saqlash muddatlari, ishlatiladigan xizmatlar, qayta ishlash joyi va o‘chirish tartibini ko‘rsating].\n\n6. Foydalanuvchi so‘rovlari\nSavollar, tuzatish yoki taqdim etilgan ma’lumotlarni o‘chirish uchun email orqali murojaat qiling. [So‘rovlarni ko‘rib chiqish tartibi va amaldagi qonunchilik talablarini ko‘rsating].\n\n7. O‘zgarishlar\nAmaldagi tahrir ushbu sahifada yangilanish sanasi bilan e’lon qilinadi. E’lon qilishdan oldin kvadrat qavsdagi barcha maydonlarni to‘ldiring."}'::jsonb where kind='privacy';
update public.legal_documents set content = '{"ru": "ЧЕРНОВИК — не является опубликованной офертой. Требуется согласовать условия и заполнить реквизиты.\n\n1. Исполнитель и предмет услуги\n[Имя или наименование, правовой статус, адрес, регистрационные реквизиты исполнителя] предлагает создание и размещение онлайн-меню ресторана на платформе Dasturxon. Состав работ определяется до начала выполнения.\n\n2. Материалы заказчика\nЗаказчик предоставляет меню, цены, логотип, фотографии и контакты, которыми имеет право пользоваться. До публикации стороны согласуют содержимое и оформление сайта.\n\n3. Стоимость и оплата\nСтоимость договорная и согласуется отдельно до начала работы. [Указать порядок оплаты, этапы, сроки и способ подтверждения согласованных условий]. Онлайн-оплата на сайте не производится.\n\n4. Сроки и приёмка\n[Указать сроки создания, порядок передачи результата, срок проверки и приёмки, правила исправления замечаний].\n\n5. Размещение и обновления\n[Указать срок размещения, количество и объём включённых обновлений, стоимость дополнительных изменений и порядок продления]. Изменения меню выполняет администратор по согласованным обращениям.\n\n6. Функции меню\nСайт показывает блюда, цены и контакты. Кнопки заказа и бронирования открывают номер телефона ресторана. Заказы, бронирования и платежи внутри платформы не создаются.\n\n7. Прекращение, возвраты и ответственность\n[Указать порядок прекращения услуги, расчёта возвратов, ответственность сторон и разрешение споров согласно применимому законодательству].\n\n8. Принятие условий\n[Определить действие, которым заказчик принимает оферту, и порядок подтверждения этого действия]. Пока данный документ находится в черновике, публичное принятие оферты на этой странице не предусмотрено.\n\n9. Контакты\nTelegram: https://t.me/khv31. Email: holmatov_j@outlook.com. Перед публикацией заполните все поля в квадратных скобках и проверьте документ.", "uz": "QORALAMA — e’lon qilingan oferta emas. Shartlar va rekvizitlarni to‘ldirish zarur.\n\n1. Ijrochi va xizmat\n[Ijrochining ismi yoki tashkilot nomi, huquqiy maqomi, manzili va ro‘yxatga olish rekvizitlari] Dasturxon platformasida restoran onlayn menusini yaratish va joylashtirish xizmatini taklif qiladi. Ish hajmi ish boshlanishidan oldin belgilanadi.\n\n2. Buyurtmachi materiallari\nBuyurtmachi foydalanishga haqli bo‘lgan menu, narxlar, logotip, suratlar va aloqa ma’lumotlarini taqdim etadi. E’lon qilishdan oldin tomonlar sayt mazmuni va dizaynini kelishadi.\n\n3. Narx va to‘lov\nNarx kelishuv asosida, ish boshlanishidan oldin belgilanadi. [To‘lov tartibi, bosqichlari, muddatlari va kelishilgan shartlarni tasdiqlash usulini ko‘rsating]. Saytda onlayn to‘lov amalga oshirilmaydi.\n\n4. Muddatlar va qabul qilish\n[Yaratish muddati, natijani topshirish, tekshirish va qabul qilish hamda kamchiliklarni tuzatish tartibini ko‘rsating].\n\n5. Joylashtirish va yangilanishlar\n[Joylashtirish muddati, kiritilgan yangilanishlar soni va hajmi, qo‘shimcha o‘zgartirishlar narxi va uzaytirish tartibini ko‘rsating]. Menu o‘zgarishlarini administrator kelishilgan murojaatlar asosida bajaradi.\n\n6. Menu imkoniyatlari\nSayt taomlar, narxlar va aloqa ma’lumotlarini ko‘rsatadi. Buyurtma va stol band qilish tugmalari restoran telefonini ochadi. Platforma ichida buyurtma, bron va to‘lov yaratilmaydi.\n\n7. To‘xtatish, qaytarish va javobgarlik\n[Amaldagi qonunchilikka muvofiq xizmatni to‘xtatish, mablag‘ni qaytarish, tomonlar javobgarligi va nizolarni hal qilish tartibini ko‘rsating].\n\n8. Shartlarni qabul qilish\n[Ofertani qabul qilish deb hisoblanadigan harakatni va uni tasdiqlash tartibini belgilang]. Hujjat qoralama bo‘lganida bu sahifada ofertani ommaviy qabul qilish ko‘zda tutilmagan.\n\n9. Aloqa\nTelegram: https://t.me/khv31. Email: holmatov_j@outlook.com. E’lon qilishdan oldin kvadrat qavsdagi barcha maydonlarni to‘ldiring va hujjatni tekshiring."}'::jsonb where kind='offer';
alter table public.legal_documents enable row level security;
grant select on public.legal_documents to anon;
grant select,update on public.legal_documents to authenticated;
revoke insert,delete on public.legal_documents from anon,authenticated;
create policy "Read published legal documents" on public.legal_documents for select to anon,authenticated using(is_published);
create policy "Admin legal document management" on public.legal_documents for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create trigger legal_document_updated before update on public.legal_documents for each row execute function private.touch_updated_at();

create function public.set_restaurant_status(target_id uuid, next_status public.restaurant_status) returns void language plpgsql security invoker set search_path = '' as $$
declare r public.restaurants;
begin
 if not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 select * into r from public.restaurants where id=target_id for update;
 if not found then raise exception 'Restaurant not found' using errcode='P0002'; end if;
 if next_status='published' then
  if r.phone is null or r.address->>'uz'='' or r.address->>'ru'='' or r.working_hours->>'uz'='' or r.working_hours->>'ru'='' then raise exception 'Fill phone, address and working hours before publishing' using errcode='22023'; end if;
  if not exists(select 1 from public.menu_items m join public.categories c on c.id=m.category_id and c.restaurant_id=m.restaurant_id where m.restaurant_id=target_id and m.is_visible and not m.is_archived and c.is_visible) then raise exception 'Add a visible category and dish before publishing' using errcode='22023'; end if;
 end if;
 update public.restaurants set status=next_status where id=target_id;
end;
$$;
revoke all on function public.set_restaurant_status(uuid,public.restaurant_status) from public,anon;
grant execute on function public.set_restaurant_status(uuid,public.restaurant_status) to authenticated;

create function public.bulk_menu_items(target_restaurant uuid, item_ids uuid[], operation text) returns void language plpgsql security invoker set search_path = '' as $$
declare affected integer; expected integer;
begin
 if not private.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if operation not in ('show','hide','available','unavailable','archive','restore') then raise exception 'Invalid operation' using errcode='22023'; end if;
 select count(distinct id) into expected from unnest(item_ids) as id;
 if expected<1 or expected>100 then raise exception 'Select 1 to 100 items' using errcode='22023'; end if;
 perform 1 from public.menu_items where restaurant_id=target_restaurant and id=any(item_ids) for update;
 if (select count(*) from public.menu_items where restaurant_id=target_restaurant and id=any(item_ids)) <> expected then raise exception 'Items do not belong to restaurant' using errcode='22023'; end if;
 update public.menu_items set
  is_visible=case operation when 'show' then true when 'hide' then false else is_visible end,
  is_available=case operation when 'available' then true when 'unavailable' then false else is_available end,
  is_archived=case operation when 'archive' then true when 'restore' then false else is_archived end
 where restaurant_id=target_restaurant and id=any(item_ids);
 get diagnostics affected = row_count;
 if affected<>expected then raise exception 'Incomplete operation'; end if;
end;
$$;
revoke all on function public.bulk_menu_items(uuid,uuid[],text) from public,anon;
grant execute on function public.bulk_menu_items(uuid,uuid[],text) to authenticated;

create function private.touch_restaurant_menu() returns trigger language plpgsql security invoker set search_path = '' as $$
begin update public.restaurants set updated_at=now() where id=coalesce(new.restaurant_id,old.restaurant_id); return null; end;
$$;
create trigger category_menu_updated after insert or update or delete on public.categories for each row execute function private.touch_restaurant_menu();
create trigger dish_menu_updated after insert or update or delete on public.menu_items for each row execute function private.touch_restaurant_menu();
commit;
