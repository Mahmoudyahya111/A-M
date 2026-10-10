// Sends (1) the order confirmation email and (2) the delivery code email. Uses Gmail SMTP (port 465).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const reply = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const SITE = 'https://mahmoudyahya111.github.io/A-M/';

async function mail(to: string, subject: string, html: string) {
  const user = Deno.env.get('SMTP_USER')!;
  const c = new SMTPClient({ connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: user, password: Deno.env.get('SMTP_PASS')! } } });
  await c.send({ from: `TELEGANT <${user}>`, to, subject, content: 'auto', html });
  await c.close();
}
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const itemsHtml = (items: any) => (Array.isArray(items) ? items : []).map((x) =>
  '<li>' + Object.entries(x || {}).filter(([k, v]) => v !== '' && v != null && !/img|image/i.test(k)).map(([k, v]) => `${esc(k)}: ${esc(typeof v === 'object' ? JSON.stringify(v) : v)}`).join(' · ') + '</li>').join('');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') || '').replace('Bearer ', ''));
    if (!user) throw new Error('Not signed in');
    const { data: me } = await db.from('profiles').select('role,status').eq('id', user.id).single();
    const b = await req.json();
    const { data: o } = await db.from('orders').select('*').eq('id', b.order_id).single();
    if (!o) throw new Error('Order not found');

    if (b.action === 'confirm') {                       // customer, right after placing the order
      if (o.user_id !== user.id && me?.role !== 'owner') throw new Error('Not your order');
      if (o.confirm_sent) return reply({ ok: true, skipped: true });
      if (!o.email) throw new Error('Order has no email');
      await mail(o.email, `Your TELEGANT order ${o.order_number}`,
        `<h2>Thank you for your order!</h2><p>Order number: <b>${esc(o.order_number)}</b></p><ul>${itemsHtml(o.items)}</ul>
         <p>Total: <b>${esc(o.total)} EGP</b> · Payment: ${esc(o.payment_method)}</p>
         <p>You can track it any time from your account: <a href="${SITE}login.html">${SITE}</a></p>`);
      await db.from('orders').update({ confirm_sent: true }).eq('id', o.id);
      return reply({ ok: true });
    }

    if (b.action === 'code') {                          // delivery agent: "I'm at the customer"
      if (!['delivery', 'owner'].includes(me?.role) || me?.status !== 'approved') throw new Error('Not allowed');
      if (!['on the way to customer', 'arrived at customer'].includes(o.status)) throw new Error('Order is not on the way to the customer');
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
      await db.from('order_secrets').upsert({ order_id: o.id, delivery_code: code, attempts: 0 });
      await db.from('orders').update({ status: 'arrived at customer' }).eq('id', o.id);
      await db.from('order_events').insert({ order_id: o.id, status: 'arrived at customer', by_role: me.role });
      let emailed = false;
      if (o.email) { await mail(o.email, `Your TELEGANT delivery code ${o.order_number}`,
        `<p>Your delivery person has arrived with order <b>${esc(o.order_number)}</b>.</p>
         <p>Your confirmation code is: <b style="font-size:24px;letter-spacing:4px">${code}</b></p>
         <p>Give this code to the delivery person only when you have your order in hand.</p>`); emailed = true; }
      return reply({ ok: true, emailed });
    }
    throw new Error('Unknown action');
  } catch (e) { return reply({ error: (e as Error).message }, 400); }
});
