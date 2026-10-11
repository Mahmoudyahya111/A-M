-- TELEGANT – order details, InstaPay payment confirmation, statement dates. Run once in Supabase > SQL Editor.

alter table public.orders
  add column if not exists express boolean not null default false,
  add column if not exists delivery_fee numeric not null default 0,
  add column if not exists subtotal numeric,
  add column if not exists payment_status text not null default 'cod',
  add column if not exists paid_at timestamptz,
  add column if not exists delivered_at timestamptz;
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('cod','awaiting','received'));
update public.orders set subtotal = total where subtotal is null;
update public.orders set delivered_at = created_at where status = 'delivered' and delivered_at is null;
update public.orders set payment_status = 'received' where payment_method = 'instapay_now';  -- old orders must not be blocked

-- stamp the date an order is delivered / paid (used by the accounting statement)
create function public.orders_stamp() returns trigger language plpgsql as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then new.delivered_at := now(); end if;
  if new.payment_status = 'received' and old.payment_status is distinct from 'received' then new.paid_at := now(); end if;
  return new;
end $$;
create trigger orders_stamp before update on public.orders for each row execute function public.orders_stamp();

-- new orders: remember express + fee + subtotal; InstaPay "pay now" waits for the owner to confirm the money
create or replace function public.place_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare n text; it jsonb; pr public.products; q int; unit numeric; tot numeric := 0; fee numeric; ex boolean; items jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'Please sign in to place an order'; end if;
  if jsonb_array_length(coalesce(p->'items','[]'::jsonb)) = 0 then raise exception 'Your cart is empty'; end if;
  for it in select value from jsonb_array_elements(p->'items') loop
    q := greatest(coalesce((it->>'qty')::int, 1), 1);
    select * into pr from products where slug = it->>'color' for update;
    if not found or pr.archived then raise exception 'Sorry, % is no longer available', coalesce(it->>'name','an item'); end if;
    if pr.stock < q then raise exception 'Sorry, % is out of stock', pr.name_en; end if;
    update products set stock = stock - q where id = pr.id;
    unit := case when pr.sale_price is not null and (pr.offer_ends_at is null or pr.offer_ends_at >= current_date) then pr.sale_price else pr.price end;
    tot := tot + unit * q;
    items := items || jsonb_build_array(it || jsonb_build_object('price', unit, 'qty', q));
  end loop;
  ex := coalesce((p->>'express')::boolean, false); fee := case when ex then 100 else 0 end;
  insert into orders(user_id,customer_name,phone,email,address,payment_method,items,subtotal,express,delivery_fee,total,delivery_date,payment_status)
  values (auth.uid(), p->>'customer_name', p->>'phone',
          coalesce(nullif(p->>'email',''), (select email from auth.users where id = auth.uid())),
          p->>'address', p->>'payment_method', items, tot, ex, fee, tot + fee, nullif(p->>'delivery_date','')::date,
          case when p->>'payment_method' = 'instapay_now' then 'awaiting' else 'cod' end)
  returning order_number into n;
  insert into order_events(order_id, status, by_role) select id, 'new', 'customer' from orders where order_number = n;
  return n;
end $$;

-- owner confirms the InstaPay transfer arrived
create function public.confirm_payment(p_order bigint) returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() <> 'owner' then raise exception 'Only the owner can confirm payments'; end if;
  update orders set payment_status = 'received' where id = p_order and payment_status = 'awaiting';
  insert into order_events(order_id, status, by_role) values (p_order, 'payment received', 'owner');
end $$;

-- manufacturer / delivery can NOT move an order that is still waiting for payment
create or replace function public.set_order_status(p_order bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare r text := my_role(); f text[] := order_flow(); cur text; photo text; pay text; i int; c int;
begin
  select status, product_photo, payment_status into cur, photo, pay from orders where id = p_order;
  if cur is null then raise exception 'Order not found'; end if;
  i := array_position(f, p_status); c := coalesce(array_position(f, cur), 0);
  if r = 'owner' then null;
  elsif pay = 'awaiting' then raise exception 'Waiting for the owner to confirm the payment';
  elsif r = 'manufacturer' and i between 2 and 6 and i = c + 1 then null;
  elsif r = 'delivery'     and i between 7 and 9 and i = c + 1 then null;
  else raise exception 'This step is not allowed from the current status (%).', cur; end if;
  if p_status = 'ready for pickup' and photo is null and r <> 'owner' then raise exception 'Upload the product photo first'; end if;
  update orders set status = p_status where id = p_order;
  insert into order_events(order_id, status, by_role) values (p_order, p_status, r);
end $$;

-- the manufacturer only SEES orders whose payment is not pending
create or replace function public.staff_orders() returns jsonb language plpgsql security definer set search_path = public as $$
declare r text := my_role();
begin
  if r = 'manufacturer' then
    return coalesce((select jsonb_agg(jsonb_build_object('id',id,'order_number',order_number,'status',status,'items',items,
      'delivery_date',delivery_date,'product_photo',product_photo) order by created_at) from orders
      where payment_status <> 'awaiting' and status in ('new','obtaining material','cutting','assembling','adding product photo','ready for pickup')), '[]');
  elsif r = 'delivery' then
    return coalesce((select jsonb_agg(jsonb_build_object('id',id,'order_number',order_number,'status',status,'customer_name',customer_name,
      'phone',phone,'address',address,'payment_method',payment_method,'total',total,'delivery_date',delivery_date) order by created_at) from orders
      where payment_status <> 'awaiting' and status in ('ready for pickup','on the way to manufacturer','picked up','on the way to customer','arrived at customer')), '[]');
  end if;
  raise exception 'Not allowed';
end $$;
