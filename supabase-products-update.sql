-- TELEGANT – run once in Supabase > SQL Editor (after supabase-setup.sql)

-- 1) stock column
alter table public.products add column if not exists stock int not null default 0;

-- 2) load the 5 current shop products (skips any already added)
insert into public.products (name_en, price, image_url, stock)
select v.n, 600, v.img, 0
from (values
  ('Mock Neck — Navy',  'New-navy.png'),
  ('Mock Neck — White', 'New-white.png'),
  ('Mock Neck — Black', 'New-black.png'),
  ('Mock Neck — Grey',  'New-grey.png'),
  ('Mock Neck — Red',   'New-red.png')
) as v(n, img)
where not exists (select 1 from public.products p where p.image_url = v.img);

-- 3) picture uploads (public bucket, only the owner can write)
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public reads product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "owner uploads product images" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_owner());
create policy "owner updates product images" on storage.objects for update using (bucket_id = 'product-images' and public.is_owner());
create policy "owner deletes product images" on storage.objects for delete using (bucket_id = 'product-images' and public.is_owner());
