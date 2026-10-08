\set ON_ERROR_STOP on
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',false);
set role authenticated;
insert into public.restaurants(id,name,slug) values('66666666-6666-6666-6666-666666666666','Editor fixture','editor-fixture');
do $$begin
 begin perform public.set_restaurant_status('66666666-6666-6666-6666-666666666666','published');raise exception 'Incomplete restaurant published';exception when invalid_parameter_value then null;end;
end$$;
update public.restaurants set phone='+998900000000',address='{"uz":"Address","ru":"Address"}',working_hours='{"uz":"Hours","ru":"Hours"}' where id='66666666-6666-6666-6666-666666666666';
insert into public.categories(id,restaurant_id,name) values('77777777-7777-7777-7777-777777777777','66666666-6666-6666-6666-666666666666','{"uz":"Food","ru":"Food"}');
insert into public.menu_items(id,restaurant_id,category_id,name,price) values('88888888-8888-8888-8888-888888888888','66666666-6666-6666-6666-666666666666','77777777-7777-7777-7777-777777777777','{"uz":"Dish","ru":"Dish"}',10000);
select public.set_restaurant_status('66666666-6666-6666-6666-666666666666','published');
do $$begin
 begin perform public.bulk_menu_items('66666666-6666-6666-6666-666666666666',array['88888888-8888-8888-8888-888888888888','99999999-9999-9999-9999-999999999999']::uuid[],'hide');raise exception 'Invalid mixed bulk operation accepted';exception when invalid_parameter_value then null;end;
 if not (select is_visible from public.menu_items where id='88888888-8888-8888-8888-888888888888') then raise exception 'Bulk failure modified a valid item';end if;
end$$;
select public.bulk_menu_items('66666666-6666-6666-6666-666666666666',array['88888888-8888-8888-8888-888888888888']::uuid[],'hide');
reset role;
set role anon;
do $$begin
 if exists(select 1 from public.menu_items where id='88888888-8888-8888-8888-888888888888') then raise exception 'Bulk hidden item exposed';end if;
 if (select count(*) from public.legal_documents)<>0 then raise exception 'Legal drafts exposed';end if;
 if (select count(*) from public.platform_settings)<>1 then raise exception 'Contacts unavailable';end if;
 begin perform public.bulk_menu_items('66666666-6666-6666-6666-666666666666',array['88888888-8888-8888-8888-888888888888']::uuid[],'show');raise exception 'Anon bulk operation allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',false);
set role authenticated;
do $$declare changed integer;begin
 update public.platform_settings set executor_name='Unauthorized';get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Ordinary user changed contacts';end if;
 begin perform public.set_restaurant_status('66666666-6666-6666-6666-666666666666','draft');raise exception 'Ordinary user changed publication';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',false);
set role authenticated;
select public.bulk_menu_items('66666666-6666-6666-6666-666666666666',array['88888888-8888-8888-8888-888888888888']::uuid[],'show');
select public.bulk_menu_items('66666666-6666-6666-6666-666666666666',array['88888888-8888-8888-8888-888888888888']::uuid[],'archive');
do $$begin
 begin delete from public.categories where id='77777777-7777-7777-7777-777777777777';raise exception 'Category with archived dish deleted';exception when foreign_key_violation then null;end;
end$$;
select public.set_restaurant_status('66666666-6666-6666-6666-666666666666','draft');
reset role;
select 'PASS: editors RPC, publishing requirements, atomic bulk operations, draft legal privacy and settings permissions' as result;
