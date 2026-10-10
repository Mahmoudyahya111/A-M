-- TELEGANT – shop sync + server-side pricing. Run once in Supabase > SQL Editor (after the earlier SQL files).

-- 1) each product gets a stable key (matches data-color on shop.html)
alter table public.products add column if not exists slug text;
create unique index if not exists products_slug_key on public.products(slug) where slug is not null;
update public.products set slug = lower(trim(split_part(name_en, '—', 2))) where slug is null and name_en like 'Mock Neck —%';
update public.products set slug = lower(regexp_replace(image_url, '^New-([a-z]+)\.png$', '\1')) where slug is null and image_url ~ '^New-[a-z]+\.png$';

-- 2) the shop must also see archived rows (to hide them); prices are public anyway
drop policy if exists "public sees active" on public.products;
create policy "public sees products" on public.products for select using (true);

-- 3) busy-day counts for the delivery date picker (no personal data)
create function public.delivery_counts() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(delivery_date::text, n), '{}'::jsonb) from
    (select delivery_date, count(*) n from orders where delivery_date >= current_date and status <> 'cancelled' group by delivery_date) t $$;
grant execute on function public.delivery_counts() to anon, authenticated;

-- 4) placing an order: signed-in only, price + stock + delivery fee decided HERE, not by the browser
create or replace function public.place_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare n text; it jsonb; pr public.products; q int; unit numeric; tot numeric := 0; fee numeric; items jsonb := '[]'::jsonb;
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
  fee := case when coalesce((p->>'express')::boolean, false) then 100 else 0 end;
  insert into orders(user_id,customer_name,phone,email,address,payment_method,items,total,delivery_date)
  values (auth.uid(), p->>'customer_name', p->>'phone',
          coalesce(nullif(p->>'email',''), (select email from auth.users where id = auth.uid())),
          p->>'address', p->>'payment_method', items, tot + fee, nullif(p->>'delivery_date','')::date)
  returning order_number into n;
  insert into order_events(order_id, status, by_role) select id, 'new', 'customer' from orders where order_number = n;
  return n;
end $$;
revoke execute on function public.place_order(jsonb) from anon;
grant execute on function public.place_order(jsonb) to authenticated;
