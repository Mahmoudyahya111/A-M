-- Guest checkout (24 Nov 2026)
-- What this does:
--   1. place_order: guests (not signed in) can place orders. user_id is null for guest orders.
--      An email is required when there is no signed-in user - the email is the guest's reference.
--   2. track_order: lets a guest see one order only if they know its order number AND the email
--      used at checkout. Signed-in owners keep their normal access. Nothing else becomes readable.
--   3. claim_my_orders: after sign-in/sign-up, links earlier guest orders that used the same
--      email to the account, so "My orders" shows them.
-- How to apply: Supabase dashboard -> SQL editor -> paste this whole file -> Run. Safe to re-run.
-- NOTE: stock is checked and decremented inside place_order exactly as before.

-- 1) place_order with guest support (same body as before, only the sign-in gate changes)
create or replace function public.place_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare n text; it jsonb; pr public.products; q int; unit numeric; tot numeric := 0; fee numeric; ex boolean; items jsonb := '[]'::jsonb;
begin
  if auth.uid() is null and nullif(p->>'email','') is null then raise exception 'An email address is required to place an order'; end if;
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

-- 2) guest tracking: order number + checkout email must both match
create or replace function public.track_order(p_order_number text, p_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from orders where order_number = upper(trim(p_order_number));
  if not found then return null; end if;
  if not (o.user_id is not null and o.user_id = auth.uid())
     and (nullif(trim(p_email),'') is null or lower(coalesce(o.email,'')) <> lower(trim(p_email))) then
    return null;
  end if;
  return jsonb_build_object(
    'order_number', o.order_number, 'customer_name', o.customer_name, 'delivery_date', o.delivery_date,
    'items', o.items, 'status', o.status,
    'cancelled_by', o.cancelled_by, 'cancel_reason', o.cancel_reason,
    'refund_status', o.refund_status, 'refund_amount', o.refund_amount, 'refund_reason', o.refund_reason);
end $$;

-- 3) link past guest orders to a freshly signed-in account with the same email
create or replace function public.claim_my_orders() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then return 0; end if;
  update orders set user_id = auth.uid()
   where user_id is null
     and lower(email) = (select lower(email) from auth.users where id = auth.uid());
  get diagnostics n = row_count;
  return n;
end $$;
