-- TELEGANT – InstaPay "pay now" needs a transfer reference (+ optional screenshot). Run once in Supabase > SQL Editor.
alter table public.orders add column if not exists payment_ref text, add column if not exists payment_proof text;

create or replace function public.place_order(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare n text; it jsonb; pr public.products; q int; unit numeric; tot numeric := 0; fee numeric; ex boolean; items jsonb := '[]'::jsonb; pm text := p->>'payment_method';
begin
  if auth.uid() is null then raise exception 'Please sign in to place an order'; end if;
  if jsonb_array_length(coalesce(p->'items','[]'::jsonb)) = 0 then raise exception 'Your cart is empty'; end if;
  if pm = 'instapay_now' and coalesce(trim(p->>'payment_ref'), '') = '' then raise exception 'Please enter your InstaPay transfer reference first'; end if;
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
  insert into orders(user_id,customer_name,phone,email,address,payment_method,items,subtotal,express,delivery_fee,total,delivery_date,payment_status,payment_ref,payment_proof)
  values (auth.uid(), p->>'customer_name', p->>'phone',
          coalesce(nullif(p->>'email',''), (select email from auth.users where id = auth.uid())),
          p->>'address', pm, items, tot, ex, fee, tot + fee, nullif(p->>'delivery_date','')::date,
          case when pm = 'instapay_now' then 'awaiting' else 'cod' end,
          nullif(trim(p->>'payment_ref'), ''),
          case when p->>'payment_proof' like auth.uid()::text || '/%' then p->>'payment_proof' else null end)
  returning order_number into n;
  insert into order_events(order_id, status, by_role) select id, 'new', 'customer' from orders where order_number = n;
  return n;
end $$;

-- private bucket for transfer screenshots: customers upload to their own folder, only the owner can view
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false) on conflict (id) do nothing;
create policy "customers upload own proof" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner reads proofs" on storage.objects for select using (bucket_id = 'payment-proofs' and public.is_owner());
