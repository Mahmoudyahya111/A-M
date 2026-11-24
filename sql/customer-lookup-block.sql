-- TELEGANT: customer lookup + block list. Additive. Owner only (same as the admin).
create or replace function public.norm_email(t text) returns text language sql immutable as $$ select nullif(lower(btrim(coalesce(t,''))),'') $$;
create or replace function public.norm_phone(t text) returns text language plpgsql immutable as $f$
declare d text := regexp_replace(coalesce(t,''),'\D','','g');
begin
  if d = '' then return null; end if;
  if d like '0020%' then d := substr(d,5); elsif d like '20%' and length(d) >= 12 then d := substr(d,3); end if;
  if d like '0%' then d := substr(d,2); end if;
  return nullif(d,'');
end $f$;
create table if not exists public.blocked_contacts(id bigserial primary key, kind text not null check (kind in ('email','phone')), value text not null, note text, created_at timestamptz not null default now(), created_by uuid default auth.uid(), unique (kind, value));
alter table public.blocked_contacts enable row level security;
drop policy if exists blocked_owner on public.blocked_contacts;
create policy blocked_owner on public.blocked_contacts for all to authenticated using (coalesce(public.is_owner(),false)) with check (coalesce(public.is_owner(),false));
revoke all on public.blocked_contacts from anon; grant select, insert, update, delete on public.blocked_contacts to authenticated;
grant usage, select on sequence public.blocked_contacts_id_seq to authenticated;
create or replace function public.blocked_contacts_norm() returns trigger language plpgsql as $f$
begin
  if new.kind = 'email' then new.value := norm_email(new.value); else new.value := norm_phone(new.value); end if;
  if new.value is null or length(new.value) < 5 then raise exception 'Enter a valid email or phone number'; end if;
  return new;
end $f$;
drop trigger if exists blocked_contacts_norm on public.blocked_contacts;
create trigger blocked_contacts_norm before insert or update on public.blocked_contacts for each row execute function public.blocked_contacts_norm();
create or replace function public.orders_block_check() returns trigger language plpgsql security definer set search_path to 'public' as $f$
begin
  if exists (select 1 from blocked_contacts b where (b.kind='email' and b.value = norm_email(new.email)) or (b.kind='phone' and b.value = norm_phone(new.phone))) then
    raise exception 'We cannot process this order online right now. Please contact us.' using errcode = 'P0001';
  end if;
  return new;
end $f$;
revoke all on function public.orders_block_check() from public, anon, authenticated;
drop trigger if exists orders_block_check on public.orders;
create trigger orders_block_check before insert on public.orders for each row execute function public.orders_block_check();
create or replace function public.customer_lookup(p_q text) returns jsonb language plpgsql stable security definer set search_path to 'public' as $f$
declare q text := btrim(coalesce(p_q,'')); e text; ph text; r jsonb; isb boolean;
begin
  if not coalesce(is_owner(),false) then raise exception 'not allowed'; end if;
  if length(q) < 5 or length(q) > 120 then raise exception 'Enter a full email or phone number'; end if;
  if position('@' in q) > 0 then e := norm_email(q); else ph := norm_phone(q); end if;
  select exists (select 1 from blocked_contacts b where (e is not null and b.kind='email' and b.value=e) or (ph is not null and b.kind='phone' and b.value=ph)) into isb;
  select jsonb_build_object('kind', case when e is not null then 'email' else 'phone' end, 'key', coalesce(e, ph), 'blocked', isb,
    'orders', coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'number',o.order_number,'created_at',o.created_at,'status',o.status,'payment_method',o.payment_method,'total',o.total,'customer_name',o.customer_name,'items',o.items) order by o.created_at desc) from orders o where (e is not null and norm_email(o.email)=e) or (ph is not null and norm_phone(o.phone)=ph)),'[]'::jsonb)) into r;
  return r;
end $f$;
revoke all on function public.customer_lookup(text) from public, anon; grant execute on function public.customer_lookup(text) to authenticated;
