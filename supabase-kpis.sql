-- TELEGANT – customer-service KPIs (AHT, FCR, NPS, ease rating, CSAT). Run once in Supabase > SQL Editor (after supabase-chat-pro.sql).

alter table public.chats
  add column if not exists claimed_at timestamptz,
  add column if not exists resolved boolean,
  add column if not exists nps int check (nps between 0 and 10),
  add column if not exists ease int check (ease between 1 and 5);
update public.chats set claimed_at = created_at where claimed_by is not null and claimed_at is null;

-- stamp the moment an agent first takes the chat (used for Average Handle Time)
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
  update chats set status = 'claimed', claimed_by = auth.uid(), claimed_name = nm, claimed_at = coalesce(claimed_at, now()) where id = p_chat;
  insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'system', nm, nm || ' joined the chat');
end $$;

-- the customer's survey: stars, resolved?, recommend 0-10, ease 1-5, comment
create function public.chat_survey(p_chat bigint, p_rating int, p_resolved boolean, p_nps int, p_ease int, p_fb text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update chats set rating = p_rating, resolved = p_resolved, nps = p_nps, ease = p_ease, feedback = left(p_fb, 1000)
   where id = p_chat and user_id = auth.uid() and status = 'closed' and rating is null;
  if not found then raise exception 'Survey already sent or chat not found'; end if;
end $$;

create function public.service_report(p_from date, p_to date) returns jsonb language plpgsql security definer set search_path = public as $$
declare tz text := 'Africa/Cairo';
begin
  if not is_owner() then raise exception 'Owner only'; end if;
  return (with c as (
      select ch.*,
        (select extract(epoch from (min(m.created_at) filter (where m.sender_role = 'staff') - min(m.created_at) filter (where m.sender_role = 'customer'))) from chat_messages m where m.chat_id = ch.id) as frt,
        case when ch.closed_at is not null then extract(epoch from ch.closed_at - coalesce(ch.claimed_at, ch.created_at)) end as aht,
        -- first contact resolution: customer said "resolved" AND did not contact us again within 7 days
        case when ch.resolved is not null and ch.closed_at is not null then
          (ch.resolved and not exists (select 1 from chats x where x.user_id = ch.user_id and x.id <> ch.id and x.created_at > ch.closed_at and x.created_at <= ch.closed_at + interval '7 days')) end as fcr
      from chats ch where (ch.created_at at time zone tz)::date between p_from and p_to)
    select jsonb_build_object(
      'total', (select count(*) from c), 'closed', (select count(*) from c where status = 'closed'), 'surveyed', (select count(*) from c where rating is not null),
      'csat', (select round(avg(rating), 2) from c),
      'csat_pct', (select round(100.0 * count(*) filter (where rating >= 4) / nullif(count(rating), 0)) from c),
      'ease', (select round(avg(ease), 2) from c),
      'ease_pct', (select round(100.0 * count(*) filter (where ease >= 4) / nullif(count(ease), 0)) from c),
      'nps', (select round(100.0 * (count(*) filter (where nps >= 9) - count(*) filter (where nps <= 6)) / nullif(count(nps), 0)) from c),
      'promoters', (select count(*) from c where nps >= 9), 'passives', (select count(*) from c where nps between 7 and 8), 'detractors', (select count(*) from c where nps <= 6),
      'fcr', (select round(100.0 * count(*) filter (where fcr) / nullif(count(fcr), 0)) from c),
      'aht', (select round(avg(aht)) from c where aht is not null), 'frt', (select round(avg(frt)) from c where frt is not null),
      'by_agent', (select coalesce(jsonb_agg(jsonb_build_object('name', agent_name(claimed_by), 'chats', n, 'aht', aht, 'frt', frt, 'fcr', fcr, 'nps', nps, 'ease', ease, 'csat', csat)), '[]'::jsonb) from (
          select claimed_by, count(*) n, round(avg(aht)) aht, round(avg(frt)) frt,
                 round(100.0 * count(*) filter (where fcr) / nullif(count(fcr), 0)) fcr,
                 round(100.0 * (count(*) filter (where nps >= 9) - count(*) filter (where nps <= 6)) / nullif(count(nps), 0)) nps,
                 round(avg(ease), 2) ease, round(avg(rating), 2) csat
          from c where claimed_by is not null group by claimed_by) t),
      'by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'chats', n, 'csat', a) order by d), '[]'::jsonb) from (select (created_at at time zone tz)::date d, count(*) n, round(avg(rating), 2) a from c group by 1) t),
      'recent', (select coalesce(jsonb_agg(jsonb_build_object('code', code, 'customer', customer_name, 'rating', rating, 'nps', nps, 'ease', ease, 'resolved', resolved, 'feedback', feedback, 'agent', claimed_name, 'at', closed_at) order by closed_at desc), '[]'::jsonb)
                 from (select * from c where rating is not null order by closed_at desc limit 50) r2)));
end $$;
