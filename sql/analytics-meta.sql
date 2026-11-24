-- TELEGANT: Meta ads attribution on page views. Additive (nullable columns, new trigger and function). Existing rows and the page_stats view are untouched.
alter table public.page_events add column if not exists utm_source text, add column if not exists utm_medium text, add column if not exists utm_campaign text, add column if not exists utm_content text,
  add column if not exists has_fbclid boolean, add column if not exists ref_host text, add column if not exists channel text, add column if not exists platform text, add column if not exists inapp boolean;
create or replace function public.page_events_classify() returns trigger language plpgsql set search_path to 'public' as $f$
declare src text; med text; rh text; fbsrc boolean; paidmed boolean; fbref boolean;
begin
  if new.event_type <> 'view' then new.utm_source:=null; new.utm_medium:=null; new.utm_campaign:=null; new.utm_content:=null; new.has_fbclid:=null; new.ref_host:=null; new.channel:=null; new.platform:=null; new.inapp:=null; return new; end if;
  src := lower(coalesce(left(new.utm_source,60),'')); med := lower(coalesce(left(new.utm_medium,60),'')); rh := lower(coalesce(left(new.ref_host,100),''));
  new.utm_source := nullif(src,''); new.utm_medium := nullif(med,''); new.utm_campaign := nullif(left(new.utm_campaign,100),''); new.utm_content := nullif(left(new.utm_content,100),''); new.ref_host := nullif(rh,'');
  fbsrc := src ~ '^(fb|facebook|meta|ig|instagram|an|audience_network|messenger)' or src like '%facebook%' or src like '%instagram%';
  paidmed := med ~ '(cpc|ppc|paid|cpm|cpv|ads?$|social_paid|paid_social|boost)';
  fbref := rh ~ '(^|\.)(facebook\.com|fb\.com|fb\.me|instagram\.com|messenger\.com)$';
  if (fbsrc and paidmed) or (coalesce(new.has_fbclid,false) and paidmed) then new.channel := 'meta_paid';
  elsif coalesce(new.has_fbclid,false) or fbsrc then new.channel := 'meta_click';
  elsif fbref then new.channel := 'meta_organic';
  elsif rh <> '' then new.channel := 'referral';
  else new.channel := 'direct'; end if;
  new.platform := case when src like '%insta%' or src = 'ig' or rh like '%instagram%' then 'instagram' when fbsrc or coalesce(new.has_fbclid,false) or fbref then 'facebook' else null end;
  return new;
end $f$;
drop trigger if exists page_events_classify on public.page_events;
create trigger page_events_classify before insert on public.page_events for each row execute function public.page_events_classify();

create or replace function public.meta_ads_summary(p_days int default 30) returns jsonb language plpgsql stable security definer set search_path to 'public' as $f$
declare since timestamptz := now() - make_interval(days => least(greatest(p_days,1),365)); r jsonb;
begin
  if not coalesce(public.is_owner(),false) then raise exception 'not allowed'; end if;
  with v as (select * from page_events where event_type='view' and created_at >= since and channel is not null)
  select jsonb_build_object(
    'tracked_views',(select count(*) from v),
    'inapp_views',(select count(*) from v where inapp),
    'channels',(select coalesce(jsonb_agg(x order by (x->>'views')::int desc),'[]') from (select jsonb_build_object('ch',channel,'views',count(*),'visitors',count(distinct visitor_id)) x from v group by channel) q),
    'by_page',(select coalesce(jsonb_agg(x order by (x->>'paid_views')::int desc,(x->>'click_views')::int desc),'[]') from (select jsonb_build_object('page',page,'paid_visitors',count(distinct visitor_id) filter (where channel='meta_paid'),'paid_views',count(*) filter (where channel='meta_paid'),'click_visitors',count(distinct visitor_id) filter (where channel='meta_click'),'click_views',count(*) filter (where channel='meta_click'),'organic_visitors',count(distinct visitor_id) filter (where channel='meta_organic')) x from v where channel like 'meta_%' group by page) q),
    'campaigns',(select coalesce(jsonb_agg(x order by (x->>'views')::int desc),'[]') from (select jsonb_build_object('campaign',coalesce(utm_campaign,'(no campaign tag)'),'source',utm_source,'medium',utm_medium,'content',utm_content,'platform',platform,'ch',channel,'views',count(*),'visitors',count(distinct visitor_id)) x from v where channel in ('meta_paid','meta_click') group by utm_campaign,utm_source,utm_medium,utm_content,platform,channel order by count(*) desc limit 30) q)
  ) into r;
  return r;
end $f$;
revoke all on function public.meta_ads_summary(int) from public, anon; grant execute on function public.meta_ads_summary(int) to authenticated;
