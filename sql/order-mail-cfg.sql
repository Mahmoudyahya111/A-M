-- TELEGANT: owner settings for outgoing mail. Additive. Defaults = today's behavior (everything ON, Gmail SMTP, name TELEGANT).
create table if not exists public.order_mail_cfg(id int primary key default 1 check (id = 1),
  types jsonb not null default '{}'::jsonb,           -- {"confirm":false,...}; missing key = ON
  provider text not null default 'gmail' check (provider in ('gmail','resend')),
  from_name text not null default 'TELEGANT', from_email text not null default '');
insert into public.order_mail_cfg(id) values (1) on conflict do nothing;
alter table public.order_mail_cfg enable row level security;
drop policy if exists order_mail_cfg_owner on public.order_mail_cfg;
create policy order_mail_cfg_owner on public.order_mail_cfg for all to authenticated using (public.is_owner()) with check (public.is_owner());
revoke all on public.order_mail_cfg from anon; grant select, insert, update on public.order_mail_cfg to authenticated;
