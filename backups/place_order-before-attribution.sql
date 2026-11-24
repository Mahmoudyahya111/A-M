CREATE OR REPLACE FUNCTION public.place_order(p jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
