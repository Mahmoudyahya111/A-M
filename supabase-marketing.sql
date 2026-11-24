-- Marketing workspace (admin > Marketing). Additive only: one new table, owner-only access.
create table if not exists public.marketing_items (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('plan','post','campaign')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.marketing_items enable row level security;
drop policy if exists "owner manages marketing" on public.marketing_items;
create policy "owner manages marketing" on public.marketing_items for all using (public.is_owner()) with check (public.is_owner());
-- rollback: drop table public.marketing_items;
