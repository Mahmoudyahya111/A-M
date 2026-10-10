-- TELEGANT – live chat + categories + pages. Run once in Supabase > SQL Editor
-- (after supabase-workflow.sql and supabase-accounting.sql, which create my_role() and the "support" role).

create table public.site_settings (key text primary key, value jsonb not null);
alter table public.site_settings enable row level security;
create policy "anyone reads settings" on public.site_settings for select using (true);
create policy "owner writes settings" on public.site_settings for all using (is_owner()) with check (is_owner());
insert into public.site_settings values ('chat_enabled', '{"on": false}') on conflict do nothing;

create function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(my_role() in ('owner','support'), false) $$;

create table public.chats (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text, customer_email text,
  status text not null default 'open' check (status in ('open','claimed','closed')),
  claimed_by uuid, claimed_name text,
  notified boolean not null default false, survey_sent boolean not null default false,
  rating int check (rating between 1 and 5), feedback text,
  created_at timestamptz default now(), closed_at timestamptz
);
create table public.chat_messages (
  id bigint generated always as identity primary key,
  chat_id bigint references public.chats(id) on delete cascade,
  sender_role text, sender_name text, body text not null, created_at timestamptz default now()
);
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
create policy "read chats" on public.chats for select using (user_id = auth.uid() or is_staff());
create policy "read messages" on public.chat_messages for select
  using (is_staff() or exists (select 1 from chats c where c.id = chat_id and c.user_id = auth.uid()));
-- no direct writes: everything goes through the functions below

create function public.chat_start(p_body text) returns bigint language plpgsql security definer set search_path = public as $$
declare c bigint; nm text; em text;
begin
  if auth.uid() is null then raise exception 'Please sign in to chat'; end if;
  if not coalesce((select (value->>'on')::boolean from site_settings where key = 'chat_enabled'), false) then raise exception 'Chat is currently offline'; end if;
  select coalesce(nullif(full_name,''), email), email into nm, em from profiles where id = auth.uid();
  select id into c from chats where user_id = auth.uid() and status <> 'closed' limit 1;
  if c is null then insert into chats(user_id, customer_name, customer_email) values (auth.uid(), nm, em) returning id into c; end if;
  insert into chat_messages(chat_id, sender_role, sender_name, body) values (c, 'customer', nm, left(p_body, 2000));
  return c;
end $$;

create function public.chat_send(p_chat bigint, p_body text) returns void language plpgsql security definer set search_path = public as $$
declare ch chats; nm text;
begin
  select * into ch from chats where id = p_chat; if not found then raise exception 'Chat not found'; end if;
  if ch.status = 'closed' then raise exception 'This chat is closed'; end if;
  select coalesce(nullif(full_name,''), email) into nm from profiles where id = auth.uid();
  if ch.user_id = auth.uid() then
    insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'customer', nm, left(p_body, 2000));
  elsif is_staff() and ch.claimed_by = auth.uid() then
    insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'staff', nm, left(p_body, 2000));
  else raise exception 'Only the agent who took this chat can reply'; end if;
end $$;

-- take a chat. Others are then locked out. The owner may take over.
create function public.chat_claim(p_chat bigint) returns void language plpgsql security definer set search_path = public as $$
declare ch chats; nm text;
begin
  if not is_staff() then raise exception 'Not allowed'; end if;
  select * into ch from chats where id = p_chat for update; if not found then raise exception 'Chat not found'; end if;
  if ch.status = 'closed' then raise exception 'This chat is closed'; end if;
  if ch.claimed_by is not null and ch.claimed_by <> auth.uid() and my_role() <> 'owner' then raise exception 'Already taken by %', ch.claimed_name; end if;
  select coalesce(nullif(full_name,''), email) into nm from profiles where id = auth.uid();
  update chats set status = 'claimed', claimed_by = auth.uid(), claimed_name = nm where id = p_chat;
  insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'system', nm, nm || ' joined the chat');
end $$;

create function public.chat_transfer(p_chat bigint, p_to uuid) returns void language plpgsql security definer set search_path = public as $$
declare ch chats; nm text;
begin
  select * into ch from chats where id = p_chat for update; if not found then raise exception 'Chat not found'; end if;
  if ch.status = 'closed' then raise exception 'This chat is closed'; end if;
  if not (ch.claimed_by = auth.uid() or my_role() = 'owner') then raise exception 'Only the agent who took this chat can transfer it'; end if;
  select coalesce(nullif(full_name,''), email) into nm from profiles where id = p_to and role in ('owner','support') and status = 'approved';
  if nm is null then raise exception 'That person cannot take chats'; end if;
  update chats set claimed_by = p_to, claimed_name = nm where id = p_chat;
  insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'system', nm, 'Chat transferred to ' || nm);
end $$;

create function public.chat_close(p_chat bigint) returns void language plpgsql security definer set search_path = public as $$
declare ch chats;
begin
  select * into ch from chats where id = p_chat for update; if not found then raise exception 'Chat not found'; end if;
  if not (ch.user_id = auth.uid() or ch.claimed_by = auth.uid() or my_role() = 'owner') then raise exception 'Not allowed'; end if;
  if ch.status = 'closed' then return; end if;
  update chats set status = 'closed', closed_at = now() where id = p_chat;
  insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'system', '', 'Chat closed');
end $$;

create function public.chat_rate(p_chat bigint, p_rating int, p_fb text) returns void language plpgsql security definer set search_path = public as $$
begin
  update chats set rating = p_rating, feedback = left(p_fb, 1000)
   where id = p_chat and user_id = auth.uid() and status = 'closed' and rating is null;
  if not found then raise exception 'Survey already sent or chat not found'; end if;
end $$;

create function public.staff_list() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'Not allowed'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', coalesce(nullif(full_name,''), email))) from profiles
                   where role in ('owner','support') and status = 'approved'), '[]');
end $$;

-- ===== categories + pages =====
create table public.categories (
  id bigint generated always as identity primary key,
  parent_id bigint references public.categories(id) on delete cascade,
  name_en text not null, name_ar text, slug text unique not null,
  active boolean not null default true, created_at timestamptz default now()
);
alter table public.products add column if not exists category_id bigint references public.categories(id) on delete set null;
create table public.pages (
  id bigint generated always as identity primary key,
  slug text unique not null, title text not null,
  kind text not null check (kind in ('category','product','custom')),
  target text, content text, published boolean not null default true, created_at timestamptz default now()
);
alter table public.categories enable row level security;
alter table public.pages enable row level security;
create policy "public reads categories" on public.categories for select using (active or is_owner());
create policy "owner writes categories" on public.categories for all using (is_owner()) with check (is_owner());
create policy "public reads pages" on public.pages for select using (published or is_owner());
create policy "owner writes pages" on public.pages for all using (is_owner()) with check (is_owner());
