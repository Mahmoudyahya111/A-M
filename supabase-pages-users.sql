-- TELEGANT – page templates + menu. Run once in Supabase > SQL Editor (after the earlier SQL files).
alter table public.pages
  add column if not exists title_ar text,
  add column if not exists template text not null default 'text',
  add column if not exists in_menu boolean not null default false,
  add column if not exists sort int not null default 0;
update public.pages set template = 'shop' where kind = 'category';
update public.pages set template = 'product' where kind = 'product';
