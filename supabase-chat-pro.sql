-- TELEGANT – professional chat (numbers, hidden staff emails, opening hours, agent presence, reports) + order emails.
-- Run once in Supabase > SQL Editor (after the earlier SQL files).

-- ===== order emails: remember what was already sent =====
alter table public.orders add column if not exists last_emailed_status text, add column if not exists payment_email_sent boolean not null default false, add column if not exists invoice_sent boolean not null default false;

-- ===== chat numbers (CH-1001, CH-1002 ...) and staff display names =====
alter table public.chats add column if not exists code text generated always as ('CH-' || (1000 + id)::text) stored;
alter table public.profiles add column if not exists chat_alias text;

create or replace function public.agent_name(p uuid) returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(trim(chat_alias), ''),
                  nullif(case when full_name like '%@%' then '' else split_part(trim(full_name), ' ', 1) end, ''),
                  'TELEGANT Support') from profiles where id = p $$;

-- remove staff emails from existing chats
update public.chats set claimed_name = public.agent_name(claimed_by) where claimed_by is not null;
update public.chat_messages m set sender_name = public.agent_name(c.claimed_by) from public.chats c where m.chat_id = c.id and m.sender_role = 'staff' and c.claimed_by is not null;
update public.chat_messages set body = regexp_replace(body, '\S+@\S+', 'TELEGANT Support', 'g') where sender_role = 'system' and body like '%@%';

create function public.set_my_alias(p text) returns void language plpgsql security definer set search_path = public as $$
begin if not is_staff() then raise exception 'Not allowed'; end if; update profiles set chat_alias = left(trim(p), 30) where id = auth.uid(); end $$;

-- ===== agent presence + login tracking =====
create table public.agent_presence (user_id uuid primary key references auth.users(id) on delete cascade, status text not null default 'offline' check (status in ('available','break','offline')), since timestamptz default now(), last_seen timestamptz default now());
create table public.agent_logins (id bigint generated always as identity primary key, user_id uuid references auth.users(id) on delete cascade, login_at timestamptz default now(), last_seen timestamptz default now(), logout_at timestamptz);
create table public.presence_log (id bigint generated always as identity primary key, user_id uuid references auth.users(id) on delete cascade, status text check (status in ('available','break')), started_at timestamptz default now(), ended_at timestamptz);
alter table public.agent_presence enable row level security; alter table public.agent_logins enable row level security; alter table public.presence_log enable row level security;
create policy "staff read presence" on public.agent_presence for select using (is_staff());
create policy "owner reads logins" on public.agent_logins for select using (is_owner());
create policy "owner reads presence log" on public.presence_log for select using (is_owner());

create function public.presence_sweep() returns void language plpgsql security definer set search_path = public as $$
begin  -- agents who stopped sending a heartbeat for 3 minutes count as offline
  update agent_logins set logout_at = last_seen where logout_at is null and last_seen < now() - interval '3 minutes';
  update presence_log g set ended_at = (select ap.last_seen from agent_presence ap where ap.user_id = g.user_id)
   where g.ended_at is null and g.user_id in (select user_id from agent_presence where last_seen < now() - interval '3 minutes');
  update agent_presence set status = 'offline', since = now() where status <> 'offline' and last_seen < now() - interval '3 minutes';
end $$;

create function public.agent_login() returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'Not allowed'; end if;
  perform presence_sweep();
  if exists (select 1 from agent_logins where user_id = auth.uid() and logout_at is null) then
    update agent_logins set last_seen = now() where user_id = auth.uid() and logout_at is null;
  else insert into agent_logins(user_id) values (auth.uid()); end if;
  insert into agent_presence(user_id) values (auth.uid()) on conflict (user_id) do update set last_seen = now();
end $$;

create function public.set_presence(p text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'Not allowed'; end if;
  if p not in ('available','break','offline') then raise exception 'Invalid status'; end if;
  perform agent_login();
  if (select status from agent_presence where user_id = auth.uid()) = p then return; end if;
  update presence_log set ended_at = now() where user_id = auth.uid() and ended_at is null;
  if p <> 'offline' then insert into presence_log(user_id, status) values (auth.uid(), p); end if;
  update agent_presence set status = p, since = now(), last_seen = now() where user_id = auth.uid();
end $$;

create function public.agent_logout() returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then return; end if;
  update presence_log set ended_at = now() where user_id = auth.uid() and ended_at is null;
  update agent_logins set logout_at = now() where user_id = auth.uid() and logout_at is null;
  update agent_presence set status = 'offline', since = now() where user_id = auth.uid();
end $$;

-- ===== opening hours: the widget asks this (works for signed-out visitors too) =====
insert into public.site_settings values ('chat_schedule', '{"mode":"always","days":{}}') on conflict do nothing;
create function public.chat_open_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare en boolean; sc jsonb; d jsonb; n int; o boolean; t timestamp := (now() at time zone 'Africa/Cairo');
        hm text := to_char((now() at time zone 'Africa/Cairo'), 'HH24:MI');
begin
  perform presence_sweep();
  select coalesce((value->>'on')::boolean, false) into en from site_settings where key = 'chat_enabled';
  select value into sc from site_settings where key = 'chat_schedule';
  o := coalesce(en, false);
  if o and coalesce(sc->>'mode', 'always') = 'schedule' then
    d := (sc->'days')->(extract(dow from t)::int::text);
    o := coalesce((d->>'on')::boolean, false) and hm >= coalesce(d->>'from', '00:00') and hm < coalesce(d->>'to', '24:00');
  end if;
  select count(*) into n from agent_presence ap join profiles p on p.id = ap.user_id where ap.status = 'available' and p.status = 'approved';
  return jsonb_build_object('open', o, 'agents', n);
end $$;
grant execute on function public.chat_open_state() to anon, authenticated;

-- ===== chat functions (now use display names, hours and availability) =====
create or replace function public.chat_start(p_body text) returns bigint language plpgsql security definer set search_path = public as $$
declare c bigint; nm text; em text;
begin
  if auth.uid() is null then raise exception 'Please sign in to chat'; end if;
  if not coalesce((chat_open_state()->>'open')::boolean, false) then raise exception 'Chat is currently offline'; end if;
  select coalesce(nullif(full_name,''), split_part(email,'@',1)), email into nm, em from profiles where id = auth.uid();
  select id into c from chats where user_id = auth.uid() and status <> 'closed' limit 1;
  if c is null then insert into chats(user_id, customer_name, customer_email) values (auth.uid(), nm, em) returning id into c; end if;
  insert into chat_messages(chat_id, sender_role, sender_name, body) values (c, 'customer', nm, left(p_body, 2000));
  return c;
end $$;

create or replace function public.chat_send(p_chat bigint, p_body text, p_as text default 'auto') returns void language plpgsql security definer set search_path = public as $$
declare ch chats; nm text;
begin
  select * into ch from chats where id = p_chat; if not found then raise exception 'Chat not found'; end if;
  if ch.status = 'closed' then raise exception 'This chat is closed'; end if;
  if p_as = 'customer' or (p_as = 'auto' and ch.user_id = auth.uid()) then
    if ch.user_id <> auth.uid() then raise exception 'Not your chat'; end if;
    select coalesce(nullif(full_name,''), split_part(email,'@',1)) into nm from profiles where id = auth.uid();
    insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'customer', nm, left(p_body, 2000));
  else
    if not (is_staff() and ch.claimed_by = auth.uid()) then raise exception 'Only the agent who took this chat can reply'; end if;
    insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'staff', agent_name(auth.uid()), left(p_body, 2000));
  end if;
end $$;

create or replace function public.chat_claim(p_chat bigint) returns void language plpgsql security definer set search_path = public as $$
declare ch chats; nm text;
begin
  if not is_staff() then raise exception 'Not allowed'; end if;
  select * into ch from chats where id = p_chat for update; if not found then raise exception 'Chat not found'; end if;
  if ch.status = 'closed' then raise exception 'This chat is closed'; end if;
  if my_role() = 'support' and coalesce((select status from agent_presence where user_id = auth.uid()), 'offline') <> 'available' then
    raise exception 'Set yourself to Available before taking chats'; end if;
  if ch.claimed_by is not null and ch.claimed_by <> auth.uid() and my_role() <> 'owner' then raise exception 'Already taken by %', ch.claimed_name; end if;
  nm := agent_name(auth.uid());
  update chats set status = 'claimed', claimed_by = auth.uid(), claimed_name = nm where id = p_chat;
  insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'system', nm, nm || ' joined the chat');
end $$;

create or replace function public.chat_transfer(p_chat bigint, p_to uuid) returns void language plpgsql security definer set search_path = public as $$
declare ch chats; nm text;
begin
  select * into ch from chats where id = p_chat for update; if not found then raise exception 'Chat not found'; end if;
  if ch.status = 'closed' then raise exception 'This chat is closed'; end if;
  if not (ch.claimed_by = auth.uid() or my_role() = 'owner') then raise exception 'Only the agent who took this chat can transfer it'; end if;
  if not exists (select 1 from profiles where id = p_to and role in ('owner','support') and status = 'approved') then raise exception 'That person cannot take chats'; end if;
  nm := agent_name(p_to);
  update chats set claimed_by = p_to, claimed_name = nm where id = p_chat;
  insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'system', nm, 'Chat transferred to ' || nm);
end $$;

create or replace function public.staff_list() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'Not allowed'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', agent_name(p.id), 'status', coalesce(ap.status, 'offline')))
                   from profiles p left join agent_presence ap on ap.user_id = p.id where p.role in ('owner','support') and p.status = 'approved'), '[]');
end $$;

-- ===== owner reports =====
create function public.agent_report(p_from date, p_to date) returns jsonb language plpgsql security definer set search_path = public as $$
declare tz text := 'Africa/Cairo';
begin
  if not is_owner() then raise exception 'Owner only'; end if;
  perform presence_sweep();
  return jsonb_build_object(
   'agents', coalesce((select jsonb_agg(x order by x->>'name') from (
     select jsonb_build_object('name', agent_name(p.id), 'role', p.role, 'status', coalesce(ap.status, 'offline'),
       'first_login', (select min(login_at) from agent_logins l where l.user_id = p.id and (l.login_at at time zone tz)::date between p_from and p_to),
       'last_logout', (select max(coalesce(logout_at, last_seen)) from agent_logins l where l.user_id = p.id and (l.login_at at time zone tz)::date between p_from and p_to),
       'online_s', (select coalesce(sum(extract(epoch from coalesce(logout_at, now()) - login_at)), 0) from agent_logins l where l.user_id = p.id and (l.login_at at time zone tz)::date between p_from and p_to),
       'available_s', (select coalesce(sum(extract(epoch from coalesce(ended_at, now()) - started_at)), 0) from presence_log g where g.user_id = p.id and g.status = 'available' and (g.started_at at time zone tz)::date between p_from and p_to),
       'break_s', (select coalesce(sum(extract(epoch from coalesce(ended_at, now()) - started_at)), 0) from presence_log g where g.user_id = p.id and g.status = 'break' and (g.started_at at time zone tz)::date between p_from and p_to),
       'breaks', (select count(*) from presence_log g where g.user_id = p.id and g.status = 'break' and (g.started_at at time zone tz)::date between p_from and p_to),
       'chats', (select count(*) from chats c where c.claimed_by = p.id and (c.created_at at time zone tz)::date between p_from and p_to),
       'avg_rating', (select round(avg(rating), 2) from chats c where c.claimed_by = p.id and (c.created_at at time zone tz)::date between p_from and p_to)) as x
     from profiles p left join agent_presence ap on ap.user_id = p.id where p.role in ('owner','support') and p.status = 'approved') t), '[]'),
   'breaks', coalesce((select jsonb_agg(jsonb_build_object('name', agent_name(g.user_id), 'start', g.started_at, 'end', g.ended_at, 'secs', extract(epoch from coalesce(g.ended_at, now()) - g.started_at)) order by g.started_at desc)
     from (select * from presence_log where status = 'break' and (started_at at time zone tz)::date between p_from and p_to order by started_at desc limit 300) g), '[]'),
   'logins', coalesce((select jsonb_agg(jsonb_build_object('name', agent_name(l.user_id), 'in', l.login_at, 'out', coalesce(l.logout_at, case when l.last_seen < now() - interval '3 minutes' then l.last_seen end), 'secs', extract(epoch from coalesce(l.logout_at, l.last_seen) - l.login_at)) order by l.login_at desc)
     from (select * from agent_logins where (login_at at time zone tz)::date between p_from and p_to order by login_at desc limit 300) l), '[]'));
end $$;

create function public.csat_report(p_from date, p_to date) returns jsonb language plpgsql security definer set search_path = public as $$
declare tz text := 'Africa/Cairo';
begin
  if not is_owner() then raise exception 'Owner only'; end if;
  return (with c as (
      select ch.*, (select extract(epoch from (min(m.created_at) filter (where m.sender_role = 'staff') - min(m.created_at) filter (where m.sender_role = 'customer')))
                    from chat_messages m where m.chat_id = ch.id) as frt
      from chats ch where (ch.created_at at time zone tz)::date between p_from and p_to)
    select jsonb_build_object(
      'total', (select count(*) from c), 'closed', (select count(*) from c where status = 'closed'), 'rated', (select count(*) from c where rating is not null),
      'avg_rating', (select round(avg(rating), 2) from c), 'avg_frt', (select round(avg(frt)) from c where frt is not null),
      'avg_dur', (select round(avg(extract(epoch from closed_at - created_at))) from c where closed_at is not null),
      'dist', (select coalesce(jsonb_object_agg(rating::text, n), '{}'::jsonb) from (select rating, count(*) n from c where rating is not null group by rating) d),
      'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'chats', n, 'avg', a) order by d), '[]'::jsonb) from (select (created_at at time zone tz)::date d, count(*) n, round(avg(rating), 2) a from c group by 1) t),
      'by_agent', (select coalesce(jsonb_agg(jsonb_build_object('name', agent_name(claimed_by), 'chats', n, 'rated', r, 'avg', a, 'frt', f)), '[]'::jsonb)
                   from (select claimed_by, count(*) n, count(rating) r, round(avg(rating), 2) a, round(avg(frt)) f from c where claimed_by is not null group by claimed_by) t),
      'recent', (select coalesce(jsonb_agg(jsonb_build_object('code', code, 'customer', customer_name, 'rating', rating, 'feedback', feedback, 'agent', claimed_name, 'at', closed_at) order by closed_at desc), '[]'::jsonb)
                 from (select * from c where rating is not null order by closed_at desc limit 50) r2)));
end $$;
