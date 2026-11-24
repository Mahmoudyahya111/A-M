-- TELEGANT: real-time visitors. One small row per active browser tab, refreshed by a heartbeat. Additive.
create table if not exists public.live_presence(
  session_id text primary key, path text not null, channel text not null default 'direct', platform text, device text,
  utm_campaign text, last_seen timestamptz not null default now());
alter table public.live_presence enable row level security;
revoke all on public.live_presence from anon, authenticated;
create or replace function public.track_ping(p_session text, p_path text, p_ref text, p_source text, p_medium text, p_campaign text, p_fbclid boolean, p_device text) returns void language plpgsql security definer set search_path to 'public' as $f$
declare ch text; pf text; src text := lower(coalesce(left(p_source,60),'')); med text := lower(coalesce(left(p_medium,60),'')); rh text := lower(coalesce(left(p_ref,100),'')); fbsrc boolean; paidmed boolean; fbref boolean;
begin
  if p_session is null or length(p_session) < 8 or length(p_session) > 64 or p_path is null or length(p_path) > 200 then return; end if;
  fbsrc := src ~ '^(fb|facebook|meta|ig|instagram|an|audience_network|messenger)' or src like '%facebook%' or src like '%instagram%';
  paidmed := med ~ '(cpc|ppc|paid|cpm|cpv|ads?$|social_paid|paid_social|boost)';
  fbref := rh ~ '(^|\.)(facebook\.com|fb\.com|fb\.me|instagram\.com|messenger\.com|l\.facebook\.com|lm\.facebook\.com|l\.instagram\.com)$';
  if (fbsrc and paidmed) or (p_fbclid and paidmed) then ch := 'meta_paid'; elsif p_fbclid or fbsrc then ch := 'meta_click'; elsif fbref then ch := 'meta_organic'; elsif rh <> '' then ch := 'referral'; else ch := 'direct'; end if;
  pf := case when src like '%insta%' or src = 'ig' or rh like '%instagram%' then 'instagram' when fbsrc or p_fbclid or fbref then 'facebook' else null end;
  insert into live_presence(session_id,path,channel,platform,device,utm_campaign,last_seen) values (p_session,left(p_path,200),ch,pf,left(p_device,12),nullif(left(p_campaign,100),''),now())
  on conflict (session_id) do update set path=excluded.path, channel=excluded.channel, platform=excluded.platform, device=excluded.device, utm_campaign=excluded.utm_campaign, last_seen=now();
  if random() < 0.02 then delete from live_presence where last_seen < now() - interval '1 day'; end if;
end $f$;
grant execute on function public.track_ping(text,text,text,text,text,text,boolean,text) to anon, authenticated;
create or replace function public.live_summary() returns jsonb language plpgsql stable security definer set search_path to 'public' as $f$
declare r jsonb;
begin
  if not coalesce(public.is_owner(),false) then raise exception 'not allowed'; end if;
  with l as (select * from live_presence where last_seen > now() - interval '90 seconds')
  select jsonb_build_object('now',(select count(*) from l),
    'ads',(select count(*) from l where channel in ('meta_paid','meta_click')),
    'paid',(select count(*) from l where channel='meta_paid'),
    'organic',(select count(*) from l where channel not in ('meta_paid','meta_click')),
    'pages',(select coalesce(jsonb_agg(x order by (x->>'visitors')::int desc),'[]') from (select jsonb_build_object('path',path,'visitors',count(*),'ads',count(*) filter (where channel in ('meta_paid','meta_click'))) x from l group by path) q),
    'campaigns',(select coalesce(jsonb_agg(x),'[]') from (select jsonb_build_object('campaign',coalesce(utm_campaign,'(no campaign tag)'),'platform',platform,'visitors',count(*)) x from l where channel in ('meta_paid','meta_click') group by utm_campaign,platform) q)
  ) into r; return r;
end $f$;
revoke all on function public.live_summary() from public, anon; grant execute on function public.live_summary() to authenticated;
