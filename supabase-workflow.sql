-- TELEGANT – order workflow. Run once in Supabase > SQL Editor (after the two earlier SQL files).

alter table public.orders add column if not exists product_photo text;
alter table public.orders add column if not exists confirm_sent boolean not null default false;

create table public.order_secrets (
  order_id bigint primary key references public.orders(id) on delete cascade,
  delivery_code text not null, attempts int not null default 0
);
alter table public.order_secrets enable row level security;
-- delivery staff can NOT read the code; only the owner and the customer who placed the order
create policy "owner or customer reads code" on public.order_secrets for select
  using (is_owner() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id bigint references public.orders(id) on delete cascade,
  status text, by_role text, created_at timestamptz default now()
);
alter table public.order_events enable row level security;
create policy "owner or customer reads events" on public.order_events for select
  using (is_owner() or exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));

create function public.my_role() returns text language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid() and status = 'approved' $$;

-- the full chain, in order
create function public.order_flow() returns text[] language sql immutable as $$
  select array['new','obtaining material','cutting','assembling','adding product photo','ready for pickup',
               'on the way to manufacturer','picked up','on the way to customer','arrived at customer','delivered'] $$;

-- change status. Owner: anything. Manufacturer: steps 2-6 one step at a time. Delivery: steps 7-9 one step at a time.
create function public.set_order_status(p_order bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare r text := my_role(); f text[] := order_flow(); cur text; photo text; i int; c int;
begin
  select status, product_photo into cur, photo from orders where id = p_order;
  if cur is null then raise exception 'Order not found'; end if;
  i := array_position(f, p_status); c := coalesce(array_position(f, cur), 0);
  if r = 'owner' then null;
  elsif r = 'manufacturer' and i between 2 and 6 and i = c + 1 then null;
  elsif r = 'delivery'     and i between 7 and 9 and i = c + 1 then null;
  else raise exception 'This step is not allowed from the current status (%).', cur; end if;
  if p_status = 'ready for pickup' and photo is null and r <> 'owner' then raise exception 'Upload the product photo first'; end if;
  update orders set status = p_status where id = p_order;
  insert into order_events(order_id, status, by_role) values (p_order, p_status, r);
end $$;

create function public.set_order_photo(p_order bigint, p_url text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_role() not in ('manufacturer','owner') then raise exception 'Not allowed'; end if;
  update orders set product_photo = p_url where id = p_order;
end $$;

-- delivery agent enters the customer's code
create function public.confirm_delivery(p_order bigint, p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare r text := my_role(); s public.order_secrets; cur text;
begin
  if r not in ('delivery','owner') then raise exception 'Not allowed'; end if;
  select status into cur from orders where id = p_order;
  if cur is distinct from 'arrived at customer' then raise exception 'Order is not at the customer yet'; end if;
  select * into s from order_secrets where order_id = p_order;
  if s.attempts >= 5 then return 'locked'; end if;
  if s.delivery_code <> trim(p_code) then update order_secrets set attempts = attempts + 1 where order_id = p_order; return 'wrong'; end if;
  update orders set status = 'delivered' where id = p_order;
  insert into order_events(order_id, status, by_role) values (p_order, 'delivered', r);
  return 'ok';
end $$;

-- what staff may see (no addresses for the manufacturer, no photos/items detail for delivery)
create function public.staff_orders() returns jsonb language plpgsql security definer set search_path = public as $$
declare r text := my_role();
begin
  if r = 'manufacturer' then
    return coalesce((select jsonb_agg(jsonb_build_object('id',id,'order_number',order_number,'status',status,'items',items,
      'delivery_date',delivery_date,'product_photo',product_photo) order by created_at) from orders
      where status in ('new','obtaining material','cutting','assembling','adding product photo','ready for pickup')), '[]');
  elsif r = 'delivery' then
    return coalesce((select jsonb_agg(jsonb_build_object('id',id,'order_number',order_number,'status',status,'customer_name',customer_name,
      'phone',phone,'address',address,'payment_method',payment_method,'total',total,'delivery_date',delivery_date) order by created_at) from orders
      where status in ('ready for pickup','on the way to manufacturer','picked up','on the way to customer','arrived at customer')), '[]');
  end if;
  raise exception 'Not allowed';
end $$;

-- ordering now REQUIRES sign-in; email defaults to the account email
create or replace function public.place_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if auth.uid() is null then raise exception 'Please sign in to place an order'; end if;
  insert into orders(user_id,customer_name,phone,email,address,payment_method,items,total,delivery_date)
  values (auth.uid(), p->>'customer_name', p->>'phone',
          coalesce(nullif(p->>'email',''), (select email from auth.users where id = auth.uid())),
          p->>'address', p->>'payment_method', p->'items', (p->>'total')::numeric, nullif(p->>'delivery_date','')::date)
  returning order_number into n;
  insert into order_events(order_id, status, by_role) select id, 'new', 'customer' from orders where order_number = n;
  return n;
end $$;
revoke execute on function public.place_order(jsonb) from anon;
grant execute on function public.place_order(jsonb) to authenticated;

-- manufacturer product photos
insert into storage.buckets (id, name, public) values ('order-photos','order-photos',true) on conflict (id) do nothing;
create policy "public reads order photos" on storage.objects for select using (bucket_id = 'order-photos');
create policy "makers upload order photos" on storage.objects for insert
  with check (bucket_id = 'order-photos' and public.my_role() in ('manufacturer','owner'));
