begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create type public.restaurant_status as enum ('draft','published','archived');
create type public.lead_status as enum ('new','contacted','in_progress','completed','rejected');

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "Admins may read own membership" on public.admins for select to authenticated using (user_id = (select auth.uid()));
-- There is deliberately no public insert/update policy for admin membership.

create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create function private.valid_translation(value jsonb) returns boolean language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(value) = 'object'
    and jsonb_typeof(value->'uz') = 'string' and jsonb_typeof(value->'ru') = 'string',false);
$$;

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  description jsonb not null default '{"uz":"","ru":""}' check (private.valid_translation(description)),
  logo_path text, cover_path text,
  primary_color text not null default '#324b38' check(primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#e2e8d4' check(secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  address jsonb not null default '{"uz":"","ru":""}' check (private.valid_translation(address)),
  working_hours jsonb not null default '{"uz":"","ru":""}' check (private.valid_translation(working_hours)),
  map_url text check (map_url is null or map_url ~ '^https://'),
  instagram_url text check (instagram_url is null or instagram_url ~ '^https://'),
  telegram_url text check (telegram_url is null or telegram_url ~ '^https://'),
  status public.restaurant_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  name jsonb not null check (private.valid_translation(name)),
  sort_order integer not null default 0 check(sort_order >= 0),
  is_visible boolean not null default true,
  unique(restaurant_id,id)
);
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  category_id uuid not null,
  name jsonb not null check (private.valid_translation(name)),
  description jsonb not null default '{"uz":"","ru":""}' check (private.valid_translation(description)),
  price bigint not null check(price >= 0 and price <= 9000000000000),
  image_path text,
  is_available boolean not null default true, is_visible boolean not null default true,
  is_archived boolean not null default false,
  sort_order integer not null default 0 check(sort_order >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(restaurant_id,category_id) references public.categories(restaurant_id,id) on delete restrict
);
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null check(char_length(restaurant_name) between 1 and 160),
  contact_name text not null check(char_length(contact_name) between 1 and 160),
  contact_value text not null check(char_length(contact_value) between 3 and 200),
  city text not null check(char_length(city) between 1 and 120),
  message text not null default '' check(char_length(message) <= 3000),
  status public.lead_status not null default 'new',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index restaurants_status_updated_idx on public.restaurants(status,updated_at desc);
create index categories_restaurant_order_idx on public.categories(restaurant_id,sort_order);
create index menu_items_restaurant_category_order_idx on public.menu_items(restaurant_id,category_id,sort_order);
create index leads_status_created_idx on public.leads(status,created_at desc);

create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger restaurant_updated before update on public.restaurants for each row execute function private.touch_updated_at();
create trigger menu_item_updated before update on public.menu_items for each row execute function private.touch_updated_at();
create trigger lead_updated before update on public.leads for each row execute function private.touch_updated_at();
create function private.keep_restaurant_slug() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.slug is distinct from old.slug then raise exception 'Restaurant slug is permanent; change the display name instead'; end if;
  return new;
end;
$$;
create trigger permanent_restaurant_slug before update on public.restaurants for each row execute function private.keep_restaurant_slug();

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.leads enable row level security;

create policy "Read published restaurants" on public.restaurants for select to anon, authenticated using(status='published');
create policy "Admin restaurant management" on public.restaurants for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy "Read visible published categories" on public.categories for select to anon, authenticated using(
  is_visible and exists(select 1 from public.restaurants r where r.id=restaurant_id and r.status='published')
);
create policy "Admin category management" on public.categories for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy "Read visible published dishes" on public.menu_items for select to anon, authenticated using(
  is_visible and not is_archived
  and exists(select 1 from public.restaurants r where r.id=restaurant_id and r.status='published')
  and exists(select 1 from public.categories c where c.id=menu_items.category_id and c.restaurant_id=menu_items.restaurant_id and c.is_visible)
);
create policy "Admin dish management" on public.menu_items for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create policy "Admin lead management" on public.leads for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
-- Lead creation is intentionally not exposed to anon. A validated, rate-limited server operation will be added in stage 7.

revoke insert,update,delete on public.restaurants,public.categories,public.menu_items from anon;
grant select on public.restaurants, public.categories, public.menu_items to anon;
grant select on public.admins to authenticated;
grant select,insert,update,delete on public.restaurants,public.categories,public.menu_items,public.leads to authenticated;
revoke all on public.leads, public.admins from anon;
revoke insert,update,delete on public.admins from authenticated;

-- Draft images stay private. Paths use <restaurant UUID>/<file name>.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('restaurant-images','restaurant-images',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Read published restaurant images" on storage.objects for select to anon,authenticated using(
  bucket_id='restaurant-images' and exists(
    select 1 from public.restaurants r where r.id::text=(storage.foldername(storage.objects.name))[1] and r.status='published'
    and (r.logo_path=storage.objects.name or r.cover_path=storage.objects.name
      or exists(select 1 from public.menu_items mi where mi.restaurant_id=r.id and mi.image_path=storage.objects.name and mi.is_visible and not mi.is_archived))
  )
);
create policy "Admin image management" on storage.objects for all to authenticated using(
  bucket_id='restaurant-images' and (select private.is_admin())
) with check (
  bucket_id='restaurant-images' and (select private.is_admin())
  and exists(select 1 from public.restaurants r where r.id::text=(storage.foldername(storage.objects.name))[1])
);

commit;
