-- TELEGANT – chat fix. Run once in Supabase > SQL Editor.
-- Lets a message be sent "as customer" or "as staff", so testing with one account works too.
drop function if exists public.chat_send(bigint, text);

create function public.chat_send(p_chat bigint, p_body text, p_as text default 'auto') returns void
language plpgsql security definer set search_path = public as $$
declare ch chats; nm text;
begin
  select * into ch from chats where id = p_chat; if not found then raise exception 'Chat not found'; end if;
  if ch.status = 'closed' then raise exception 'This chat is closed'; end if;
  select coalesce(nullif(full_name,''), email) into nm from profiles where id = auth.uid();
  if p_as = 'customer' or (p_as = 'auto' and ch.user_id = auth.uid()) then
    if ch.user_id <> auth.uid() then raise exception 'Not your chat'; end if;
    insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'customer', nm, left(p_body, 2000));
  else
    if not (is_staff() and ch.claimed_by = auth.uid()) then raise exception 'Only the agent who took this chat can reply'; end if;
    insert into chat_messages(chat_id, sender_role, sender_name, body) values (p_chat, 'staff', nm, left(p_body, 2000));
  end if;
end $$;
