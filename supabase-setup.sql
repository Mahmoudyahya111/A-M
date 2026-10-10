-- TELEGANT – run once in Supabase > SQL Editor

-- ========== PROFILES / ROLES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'customer' check (role in ('owner','manufacturer','delivery','customer')),
  status text not null default 'approved' check (status in ('approved','pending','rejected')),
  created_at timestamptz default now()
);

create function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'owner' and status = 'approved')
$$;

-- On every sign-up: owner email -> owner; manufacturer/delivery -> pending; anything else -> customer
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'requested_role', 'customer');
begin
  if lower(new.email) = 'mahmoudyahya66@gmail.com' then
    insert into profiles(id,email,full_name,role,status) values (new.id,new.email,new.raw_user_meta_data->>'full_name','owner','approved');
  elsif r in ('manufacturer','delivery') then
    insert into profiles(id,email,full_name,role,status) values (new.id,new.email,new.raw_user_meta_data->>'full_name',r,'pending');
  else
    insert into profiles(id,email,full_name,role,status) values (new.id,new.email,new.raw_user_meta_data->>'full_name','customer','approved');
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table profiles enable row level security;
create policy "read own or owner" on profiles for select using (id = auth.uid() or is_owner());
create policy "owner updates"     on profiles for update using (is_owner());
create policy "owner deletes"     on profiles for delete using (is_owner());
-- no insert policy: only the trigger creates profiles; users can never change their own role

-- ========== VISITOR TRACKING ==========
create table public.page_events (
  id bigint generated always as identity primary key,
  session_id text, visitor_id text, page text,
  event_type text check (event_type in ('view','engaged','exit_click')),
  target text, created_at timestamptz default now()
);
alter table page_events enable row level security;
create policy "anyone logs"  on page_events for insert to anon, authenticated with check (true);
create policy "owner reads"  on page_events for select using (is_owner());

create view public.page_stats with (security_invoker = true) as
select page,
  count(*) filter (where event_type='view')                          as views,
  count(distinct visitor_id) filter (where event_type='view')        as visitors,
  count(distinct session_id) filter (where event_type='view')        as sessions,
  count(distinct session_id) filter (where event_type='engaged')     as engaged,
  count(distinct session_id) filter (where event_type='exit_click')  as exits
from page_events where created_at > now() - interval '30 days' group by page;

-- ========== ORDERS ==========
create sequence public.order_seq start 10001;
create table public.orders (
  id bigint generated always as identity primary key,
  order_number text unique not null default ('TG-' || nextval('order_seq')),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text, phone text, email text, address text,
  payment_method text,           -- cash on delivery / instapay transfer / instapay on delivery
  items jsonb, total numeric, delivery_date date,
  status text not null default 'new',
  created_at timestamptz default now()
);
alter table orders enable row level security;
create policy "owner or own" on orders for select using (is_owner() or user_id = auth.uid());
create policy "owner updates" on orders for update using (is_owner());

create function public.place_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  insert into orders(user_id,customer_name,phone,email,address,payment_method,items,total,delivery_date)
  values (auth.uid(), p->>'customer_name', p->>'phone', p->>'email', p->>'address', p->>'payment_method',
          p->'items', (p->>'total')::numeric, nullif(p->>'delivery_date','')::date)
  returning order_number into n;
  return n;
end $$;
grant execute on function public.place_order(jsonb) to anon, authenticated;

-- ========== PRODUCTS ==========
create table public.products (
  id bigint generated always as identity primary key,
  name_en text not null, name_ar text,
  price numeric not null, sale_price numeric, offer_label text, offer_ends_at date,
  image_url text, archived boolean not null default false,
  created_at timestamptz default now()
);
alter table products enable row level security;
create policy "public sees active" on products for select using (archived = false or is_owner());
create policy "owner writes" on products for all using (is_owner()) with check (is_owner());

-- ========== REVIEWS + FEEDBACK ==========
create table public.reviews (
  id bigint generated always as identity primary key,
  kind text not null default 'review' check (kind in ('review','feedback')),
  author text, rating int check (rating between 1 and 5), body text,
  visible boolean not null default true,
  created_at timestamptz default now()
);
alter table reviews enable row level security;
create policy "public sees visible" on reviews for select using (visible or is_owner());
create policy "anyone sends feedback" on reviews for insert to anon, authenticated
  with check (kind = 'feedback' and visible = false);
create policy "owner manages" on reviews for all using (is_owner()) with check (is_owner());
