-- TELEGANT: owner on/off switch for the new-chat email alert. Additive; default ON keeps today's behavior. The mail function is not changed:
-- when OFF, new chats are inserted already marked as notified, which the existing function treats as "skip".
create table if not exists public.chat_alert_cfg(id int primary key default 1 check (id = 1), enabled boolean not null default true);
insert into public.chat_alert_cfg(id) values (1) on conflict do nothing;
alter table public.chat_alert_cfg enable row level security;
drop policy if exists chat_alert_cfg_owner on public.chat_alert_cfg;
create policy chat_alert_cfg_owner on public.chat_alert_cfg for all to authenticated using (public.is_owner()) with check (public.is_owner());
revoke all on public.chat_alert_cfg from anon; grant select, insert, update on public.chat_alert_cfg to authenticated;
create or replace function public.chat_alert_gate() returns trigger language plpgsql security definer set search_path to 'public' as $f$
begin
  if not coalesce((select enabled from chat_alert_cfg where id=1), true) then new.notified := true; end if;
  return new;
end $f$;
revoke all on function public.chat_alert_gate() from public, anon, authenticated;
drop trigger if exists chat_alert_gate on public.chats;
create trigger chat_alert_gate before insert on public.chats for each row execute function public.chat_alert_gate();
