\set ON_ERROR_STOP on
insert into auth.users(id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
insert into public.admins(user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
insert into public.restaurants(id,name,slug,status,cover_path) values
 ('11111111-1111-1111-1111-111111111111','Published','published','published','11111111-1111-1111-1111-111111111111/cover.webp'),
 ('22222222-2222-2222-2222-222222222222','Draft','draft','draft','22222222-2222-2222-2222-222222222222/cover.webp');
insert into public.categories(id,restaurant_id,name,is_visible) values
 ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','{"uz":"Taomlar","ru":"Блюда"}',true),
 ('44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222','{"uz":"Taomlar","ru":"Блюда"}',true),
 ('55555555-5555-5555-5555-555555555555','11111111-1111-1111-1111-111111111111','{"uz":"Hidden","ru":"Hidden"}',false);
insert into public.menu_items(restaurant_id,category_id,name,price,is_archived,is_visible,image_path) values
 ('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','{"uz":"Visible","ru":"Visible"}',45000,false,true,'11111111-1111-1111-1111-111111111111/dish.webp'),
 ('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','{"uz":"Archived","ru":"Archived"}',45000,true,true,'11111111-1111-1111-1111-111111111111/archive.webp'),
 ('11111111-1111-1111-1111-111111111111','55555555-5555-5555-5555-555555555555','{"uz":"Hidden category","ru":"Hidden category"}',45000,false,true,null),
 ('22222222-2222-2222-2222-222222222222','44444444-4444-4444-4444-444444444444','{"uz":"Draft","ru":"Draft"}',45000,false,true,null);
insert into public.leads(restaurant_name,contact_name,contact_value,city) values('Sample','Private contact','@sample','Tashkent');
insert into storage.objects(bucket_id,name) values
 ('restaurant-images','11111111-1111-1111-1111-111111111111/cover.webp'),
 ('restaurant-images','11111111-1111-1111-1111-111111111111/dish.webp'),
 ('restaurant-images','11111111-1111-1111-1111-111111111111/archive.webp'),
 ('restaurant-images','22222222-2222-2222-2222-222222222222/cover.webp');

set role anon;
do $$begin
 if (select count(*) from public.restaurants) <> 1 then raise exception 'Draft restaurant exposed'; end if;
 if (select count(*) from public.categories) <> 1 then raise exception 'Hidden/draft category exposed'; end if;
 if (select count(*) from public.menu_items) <> 1 then raise exception 'Archived/draft/hidden item exposed'; end if;
 if (select count(*) from storage.objects) <> 2 then raise exception 'Private image exposed or public image blocked'; end if;
 begin perform * from public.leads; raise exception 'Lead PII exposed'; exception when insufficient_privilege then null; end;
 begin insert into public.restaurants(name,slug) values('Unauthorized','unauthorized'); raise exception 'Anonymous write allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;

select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',false);
set role authenticated;
do $$begin
 if (select private.is_admin()) then raise exception 'Ordinary user became admin'; end if;
 if (select count(*) from public.leads) <> 0 then raise exception 'Lead PII exposed to ordinary user'; end if;
 if (select count(*) from public.restaurants) <> 1 then raise exception 'Draft exposed to ordinary user'; end if;
 begin insert into public.admins(user_id) values(auth.uid()); raise exception 'Self admin registration allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.menu_items(restaurant_id,category_id,name,price) values('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','{"uz":"Bad","ru":"Bad"}',1); raise exception 'Ordinary user write allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;

select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',false);
set role authenticated;
do $$begin
 if not (select private.is_admin()) then raise exception 'Admin denied'; end if;
 if (select count(*) from public.restaurants) <> 2 then raise exception 'Admin cannot see drafts'; end if;
 if (select count(*) from public.leads) <> 1 then raise exception 'Admin cannot see leads'; end if;
 if (select count(*) from storage.objects) <> 4 then raise exception 'Admin cannot see private images'; end if;
 update public.restaurants set name='Renamed' where slug='published';
 if not exists(select 1 from public.restaurants where slug='published' and name='Renamed') then raise exception 'Admin editing failed'; end if;
 begin update public.restaurants set slug='changed' where slug='published'; raise exception 'Permanent slug changed'; exception when raise_exception then if SQLERRM <> 'Restaurant slug is permanent; change the display name instead' then raise; end if; end;
 begin insert into public.menu_items(restaurant_id,category_id,name,price) values('11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444','{"uz":"Bad","ru":"Bad"}',1); raise exception 'Cross-restaurant category allowed'; exception when foreign_key_violation then null; end;
 begin insert into public.menu_items(restaurant_id,category_id,name,price) values('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','{"uz":"Bad","ru":"Bad"}',-1); raise exception 'Negative price allowed'; exception when check_violation then null; end;
 begin insert into public.categories(restaurant_id,name) values('11111111-1111-1111-1111-111111111111','{"uz":"Missing Russian"}'); raise exception 'Incomplete translation allowed'; exception when check_violation then null; end;
 update public.restaurants set status='draft' where slug='published';
end$$;
reset role;
set role anon;
do $$begin
 if (select count(*) from public.restaurants) <> 0 then raise exception 'Unpublished restaurant visible'; end if;
 if (select count(*) from public.menu_items) <> 0 then raise exception 'Unpublished dishes visible'; end if;
 if (select count(*) from storage.objects) <> 0 then raise exception 'Unpublished assets visible'; end if;
end$$;
reset role;
select 'PASS: SQL schema, admin access, cross-restaurant FK, prices, translations, immutable slug, publication, RLS and private image policies' as result;
