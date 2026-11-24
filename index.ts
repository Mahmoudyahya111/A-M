// TELEGANT emails (Gmail SMTP, port 465): order confirmation, every status update, delivery code, invoice, payment received, chat alerts + survey.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const reply = (o, s = 200)=>new Response(JSON.stringify(o), {
    status: s,
    headers: {
      ...cors,
      'Content-Type': 'application/json'
    }
  });
const SITE = 'https://mahmoudyahya111.github.io/A-M/';
const LOGO = SITE + 'MEBG-GOLDEN.png';
let CFG = { types: {}, provider: 'gmail', from_name: 'TELEGANT', from_email: '' };
let CUR = '';
const MAILTYPE = { chat_new: 'chat_new', chat_close: 'survey', confirm: 'confirm', payment: 'payment', cancel: 'cancel', refund: 'refund', code: 'code' };
async function mail(to, subject, html) {
  // owner settings (order_mail_cfg): a missing key means ON, so default behaviour is unchanged. Manual owner emails are never blocked.
  let t = MAILTYPE[CUR] || (CUR === 'status' ? (/invoice/i.test(subject) ? 'invoice' : 'status') : '');
  if (t && CFG.types && CFG.types[t] === false) return;
  const name = (CFG.from_name || 'TELEGANT').replace(/[<>"\r\n]/g, '').slice(0, 60) || 'TELEGANT';
  if (CFG.provider === 'resend' && Deno.env.get('RESEND_API_KEY') && CFG.from_email) {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + Deno.env.get('RESEND_API_KEY'), 'Content-Type': 'application/json' }, body: JSON.stringify({ from: `${name} <${CFG.from_email}>`, to: Array.isArray(to) ? to : [to], subject, html }) });
    if (!r.ok) throw new Error('Resend error ' + r.status);
    return;
  }
  const user = Deno.env.get('SMTP_USER');
  const c = new SMTPClient({ connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: user, password: Deno.env.get('SMTP_PASS') } } });
  await c.send({ from: `${name} <${user}>`, to, subject, content: 'auto', html });
  await c.close();
}
const esc = (s)=>String(s ?? '').replace(/[&<>"']/g, (c)=>({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[c]);
const money = (n)=>Math.round(Number(n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' EGP';
const PM = {
  cod: 'Cash on delivery',
  instapay_now: 'InstaPay (paid in advance)',
  instapay_delivery: 'InstaPay (pay at delivery)'
};
// branded wrapper with the logo
const shell = (title, inner)=>`<div style="background:#f4efe3;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#2a2114">
 <div style="max-width:640px;margin:auto;background:#ffffff;border-radius:10px;overflow:hidden">
  <div style="background:#111;padding:24px;text-align:center"><img src="${LOGO}" alt="TELEGANT" height="64" style="height:64px"><div style="color:#c9a24b;letter-spacing:4px;font-size:11px;margin-top:8px">DEFINED BY ELEGANCE</div></div>
  <div style="padding:28px"><h2 style="margin:0 0 16px;font-weight:600">${title}</h2>${inner}</div>
  <div style="background:#111;color:#bbb;padding:14px;text-align:center;font-size:12px">TELEGANT · mahmoudyahya66@gmail.com · +20 110 163 2040</div></div></div>`;
const itemRows = (items)=>(Array.isArray(items) ? items : []).map((x)=>{
    const d = x.sizeDetail || {}, size = x.size === 'Custom' || d.label === 'Custom' ? `Custom (chest ${d.chest}, length ${d.length}, shoulder ${d.shoulder} cm)` : x.size || '';
    const q = Number(x.qty || 1), p = Number(x.price || 0);
    return `<tr><td style="padding:9px 6px;border-bottom:1px solid #eee">${esc(x.name || x.color)}${size ? `<br><span style="color:#777;font-size:12px">${esc(size)}</span>` : ''}</td>
   <td style="padding:9px 6px;border-bottom:1px solid #eee;text-align:center">${q}</td><td style="padding:9px 6px;border-bottom:1px solid #eee;text-align:right">${money(p)}</td><td style="padding:9px 6px;border-bottom:1px solid #eee;text-align:right">${money(p * q)}</td></tr>`;
  }).join('');
const table = (o)=>`<table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="background:#f4efe3"><th style="padding:8px 6px;text-align:left">Item</th><th style="padding:8px 6px">Qty</th><th style="padding:8px 6px;text-align:right">Price</th><th style="padding:8px 6px;text-align:right">Total</th></tr>${itemRows(o.items)}</table>
 <table style="width:100%;font-size:14px;margin-top:10px"><tr><td style="text-align:right">Items</td><td style="text-align:right;width:130px">${money(o.subtotal ?? o.total)}</td></tr>
 <tr><td style="text-align:right">Shipping${o.express ? ' (express)' : ''}</td><td style="text-align:right">${Number(o.delivery_fee) ? money(o.delivery_fee) : 'Free'}</td></tr>
 <tr><td style="text-align:right;font-weight:bold;font-size:16px">Total</td><td style="text-align:right;font-weight:bold;font-size:16px">${money(o.total)}</td></tr></table>`;
const STEP = {
  'obtaining material': 'We are sourcing the materials for your order.',
  'cutting': 'Your fabric is being cut to your size.',
  'assembling': 'Your pieces are being assembled.',
  'adding product photo': 'Final quality check: we are photographing your finished piece.',
  'ready for pickup': 'Your order is finished and ready for our delivery partner.',
  'on the way to manufacturer': 'Our delivery partner is on the way to collect your order.',
  'picked up': 'Your order has been picked up.',
  'on the way to customer': 'Your order is on the way to you!',
  'cancelled': 'Your order has been cancelled. Please contact us if this is unexpected.'
};
const invoiceHtml = (o)=>{
  const n = String(o.order_number).replace(/\D/g, '');
  return shell('Invoice', `<table style="width:100%;font-size:14px;margin-bottom:16px"><tr><td><b>Invoice no.</b> INV-${n}<br><b>Order</b> ${esc(o.order_number)}<br><b>Delivered</b> ${new Date(o.delivered_at || Date.now()).toISOString().slice(0, 10)}</td>
   <td style="text-align:right"><b>Billed to</b><br>${esc(o.customer_name)}<br>${esc(o.address)}<br>${esc(o.phone)}</td></tr></table>${table(o)}
   <p style="font-size:14px;margin-top:16px"><b>Payment:</b> ${esc(PM[o.payment_method] || o.payment_method)}${o.payment_status === 'received' ? ' (received)' : ''}</p>
   <p style="margin-top:18px">Thank you for choosing TELEGANT. We hope you love it.</p>`);
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: cors
  });
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: { user } } = await db.auth.getUser((req.headers.get('Authorization') || '').replace('Bearer ', ''));
    // guests (not signed in) may only trigger their own order confirmation, checked below by order number + checkout email
    const b0 = await req.clone().json().catch(()=>({}));
    const guestConfirm = !user && b0.action === 'confirm';
    CUR = String(b0.action || '');
    { const { data: cf } = await db.from('order_mail_cfg').select('*').eq('id', 1).maybeSingle(); if (cf) CFG = cf; }
    if (!user && !guestConfirm) throw new Error('Not signed in');
    const { data: me } = user ? await db.from('profiles').select('role,status').eq('id', user.id).single() : {
      data: null
    };
    const approved = me?.status === 'approved';
    const b = await req.json();
    if (b.action === 'analyze') {
      if (me?.role !== 'owner' || !approved) throw new Error('Owner only');
      const key = Deno.env.get('ANTHROPIC_API_KEY');
      if (!key) throw new Error('The AI key is not set yet. In Supabase open Edge Functions > Secrets and add ANTHROPIC_API_KEY.');
      const ref = b.reference || {}, val = Number(ref.value);
      if (!b.image || !(val > 0)) throw new Error('Choose the scale reference and type its value in cm first.');
      const refText = ref.type === 'height' ? `The person in the photo is ${val} cm tall (use this to scale the garment).` : ref.type === 'length' ? `The garment's body length (highest shoulder point to hem) is exactly ${val} cm.` : `The garment's chest width, flat, armpit to armpit, is exactly ${val} cm.`;
      const prompt = `You are a senior garment pattern maker. The photo shows a short-sleeve mock-neck T-shirt. Estimate its FLAT finished measurements in centimetres.\nScale: ${refText}\nIf the garment is worn or photographed at an angle, correct for perspective and for stretch on the body, and say what you assumed.\nReturn ONLY valid JSON with number fields in cm: {"chest":0,"length":0,"shoulder":0,"sleeve":0,"neckW":0,"frontDrop":0,"backDrop":0,"armhole":0,"collarH":0,"sleeveW":0,"confidence":"low|medium|high","assumptions":"short text"}\nDefinitions: chest = flat width armpit to armpit. length = highest shoulder point beside the neck to the hem. shoulder = seam to seam across the back. sleeve = shoulder seam to sleeve hem along the outside. neckW = neck opening width between the shoulder seams. frontDrop/backDrop = depth of the neck opening below the shoulder-neck point. armhole = straight depth from shoulder tip to underarm. collarH = finished height of the mock-neck collar. sleeveW = flat sleeve width at the underarm.`;
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: Deno.env.get('ANTHROPIC_MODEL') || 'claude-sonnet-5-5',
          max_tokens: 700,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: b.mediaType || 'image/jpeg',
                    data: b.image
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j && j.error && j.error.message || 'The AI request failed');
      const text = (j.content || []).map((c)=>c.text || '').join(''), m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('The AI did not return measurements. Try a clearer photo.');
      return reply({
        ok: true,
        data: JSON.parse(m[0])
      });
    }
    /* ---------- live chat ---------- */ if (b.action === 'chat_new' || b.action === 'chat_close') {
      const { data: ch } = await db.from('chats').select('*').eq('id', b.chat_id).single();
      if (!ch) throw new Error('Chat not found');
      const staff = approved && [
        'owner',
        'support'
      ].includes(me?.role);
      if (b.action === 'chat_new') {
        if (ch.user_id !== user.id) throw new Error('Not your chat');
        if (ch.notified) return reply({
          ok: true,
          skipped: true
        });
        const { data: team } = await db.from('profiles').select('id,email,role').in('role', [
          'owner',
          'support'
        ]).eq('status', 'approved');
        const { data: av } = await db.from('agent_presence').select('user_id').eq('status', 'available').gte('last_seen', new Date(Date.now() - 180000).toISOString());
        const ids = new Set((av || []).map((a)=>a.user_id));
        let to = (team || []).filter((t)=>t.role === 'owner' || ids.has(t.id)).map((t)=>t.email);
        if (!(av || []).length) to = (team || []).map((t)=>t.email);
        to = to.filter(Boolean);
        if (to.length) await mail(to, `New chat ${ch.code} waiting`, shell('New customer chat', `<p><b>${esc(ch.code)}</b> from ${esc(ch.customer_name)} is waiting for an agent.</p><p><a href="${SITE}chat-admin.html?c=${ch.id}" style="background:#c9a24b;color:#111;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">Open the console</a></p>`));
        await db.from('chats').update({
          notified: true
        }).eq('id', ch.id);
        return reply({
          ok: true
        });
      }
      if (ch.user_id !== user.id && !staff) throw new Error('Not allowed');
      if (ch.status !== 'closed') throw new Error('Chat is not closed');
      if (ch.survey_sent || !ch.customer_email) return reply({
        ok: true,
        skipped: true
      });
      await mail(ch.customer_email, `How was your TELEGANT chat? (${ch.code})`, shell('How did we do?', `<p>Thanks for chatting with us (reference <b>${esc(ch.code)}</b>).</p><p>Please rate your experience, it takes 20 seconds:</p><p><a href="${SITE}survey-chat.html?c=${ch.id}" style="background:#c9a24b;color:#111;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">Take the survey</a></p>`));
      await db.from('chats').update({
        survey_sent: true
      }).eq('id', ch.id);
      return reply({
        ok: true
      });
    }
    /* ---------- orders ---------- */ const { data: o } = await db.from('orders').select('*').eq(b.order_number ? 'order_number' : 'id', b.order_number ?? b.order_id).single();
    if (!o) throw new Error('Order not found');
    if (b.action === 'confirm') {
      if (!user) {
        if (o.user_id || !b.email || String(b.email).trim().toLowerCase() !== String(o.email || '').trim().toLowerCase()) throw new Error('Not your order');
      } else if (o.user_id !== user.id && me?.role !== 'owner') throw new Error('Not your order');
      if (o.confirm_sent) return reply({
        ok: true,
        skipped: true
      });
      if (!o.email) throw new Error('Order has no email');
      await mail(o.email, `Order confirmed ${o.order_number}`, shell('Thank you for your order!', `<p>Your order number is <b>${esc(o.order_number)}</b>. We will email you at every step.</p>${table(o)}
         <p style="font-size:14px"><b>Payment:</b> ${esc(PM[o.payment_method] || o.payment_method)}<br><b>Delivery date:</b> ${esc(o.delivery_date || '-')}</p>
         ${o.payment_status === 'awaiting' ? `<p style="background:#fff7e0;padding:12px;border-radius:6px"><b>Next step:</b> we will confirm your InstaPay transfer (ref ${esc(o.payment_ref || '-')}) and then start making your order.</p>` : ''}
         <p>Track it any time: <a href="${SITE}my-orders.html">My orders</a></p>`));
      await db.from('orders').update({
        confirm_sent: true
      }).eq('id', o.id);
      return reply({
        ok: true
      });
    }
    if (b.action === 'payment') {
      if (me?.role !== 'owner' || !approved) throw new Error('Owner only');
      if (o.payment_status !== 'received' || o.payment_email_sent || !o.email) return reply({
        ok: true,
        skipped: true
      });
      await mail(o.email, `Payment received ${o.order_number}`, shell('Payment received', `<p>We confirmed your InstaPay transfer for order <b>${esc(o.order_number)}</b>. Production starts now.</p><p>We will keep you updated at every step.</p>`));
      await db.from('orders').update({
        payment_email_sent: true
      }).eq('id', o.id);
      return reply({
        ok: true
      });
    }
    if (b.action === 'cancel') {
      if (o.status !== 'cancelled') throw new Error('Order is not cancelled');
      if (o.user_id !== user.id && !(me?.role === 'owner' && approved)) throw new Error('Not allowed');
      if (o.cancel_notified) return reply({
        ok: true,
        skipped: true
      });
      const by = o.cancelled_by === 'owner' ? 'TELEGANT' : 'the customer';
      const refundLine = o.refund_status === 'due' ? `<p style="background:#fff7e0;padding:12px;border-radius:6px">You already paid ${money(o.total)}. We will refund it and email you as soon as it is done.</p>` : '';
      if (o.email) await mail(o.email, `Order ${o.order_number} cancelled`, shell('Your order was cancelled', `<p>Order <b>${esc(o.order_number)}</b> was cancelled by ${by}.</p><p><b>Reason:</b> ${esc(o.cancel_reason)}</p>${refundLine}<p>If this is a surprise, just reply to this email and we will help.</p>`));
      const { data: team } = await db.from('profiles').select('email,role').in('role', [
        'owner',
        'manufacturer'
      ]).eq('status', 'approved');
      const to = (team || []).map((t)=>t.email).filter(Boolean);
      if (to.length) await mail(to, `CANCELLED: order ${o.order_number}`, shell('Order cancelled: stop work', `<p>Order <b>${esc(o.order_number)}</b> was cancelled by <b>${by}</b>. Do not continue making it.</p><p><b>Reason:</b> ${esc(o.cancel_reason)}</p><p><b>Status when cancelled:</b> ${esc(o.last_emailed_status || 'new')}</p><ul>${itemsHtml(o.items)}</ul>${o.refund_status === 'due' ? '<p><b>Owner:</b> this order was paid, so a refund is due.</p>' : ''}`));
      await db.from('orders').update({
        cancel_notified: true
      }).eq('id', o.id);
      return reply({
        ok: true
      });
    }
    if (b.action === 'refund') {
      if (me?.role !== 'owner' || !approved) throw new Error('Owner only');
      if (o.refund_status !== 'refunded' || o.refund_emailed || !o.email) return reply({
        ok: true,
        skipped: true
      });
      await mail(o.email, `Refund for order ${o.order_number}`, shell('Your refund', `<p>We refunded <b>${money(o.refund_amount)}</b> for order <b>${esc(o.order_number)}</b>.</p><p><b>Note:</b> ${esc(o.refund_reason)}</p><p>Depending on your bank or InstaPay it can take a little while to show.</p>`));
      await db.from('orders').update({
        refund_emailed: true
      }).eq('id', o.id);
      return reply({
        ok: true
      });
    }
    if (b.action === 'manual') {
      if (me?.role !== 'owner' || !approved) throw new Error('Owner only');
      if (!o.email) throw new Error('This order has no email address');
      const subject = String(b.subject || '').trim().slice(0, 150), msg = String(b.message || '').trim().slice(0, 4000);
      if (!subject || !msg) throw new Error('Write a subject and a message');
      await mail(o.email, subject, shell(esc(subject), `<p style="white-space:pre-line">${esc(msg)}</p><p style="color:#777;font-size:12px;margin-top:20px">About order ${esc(o.order_number)} · <a href="${SITE}my-orders.html">track it here</a></p>`));
      await db.from('order_emails').insert({
        order_id: o.id,
        subject,
        body: msg,
        sent_by: user.id
      });
      return reply({
        ok: true
      });
    }
    if (b.action === 'status') {
      if (!approved || ![
        'owner',
        'manufacturer',
        'delivery'
      ].includes(me?.role)) throw new Error('Not allowed');
      if (!o.email || o.status === o.last_emailed_status || o.status === 'new' || o.status === 'arrived at customer' || o.status === 'cancelled') return reply({
        ok: true,
        skipped: true
      });
      if (o.status === 'delivered') {
        if (!o.invoice_sent) await mail(o.email, `Your TELEGANT invoice ${o.order_number}`, invoiceHtml(o));
        await db.from('orders').update({
          invoice_sent: true,
          last_emailed_status: 'delivered'
        }).eq('id', o.id);
      } else if (STEP[o.status]) {
        await mail(o.email, `Order ${o.order_number}: ${o.status}`, shell('Order update', `<p>Order <b>${esc(o.order_number)}</b></p><p style="font-size:16px"><b>${esc(o.status)}</b></p><p>${STEP[o.status]}</p><p><a href="${SITE}my-orders.html">Track your order</a></p>`));
        await db.from('orders').update({
          last_emailed_status: o.status
        }).eq('id', o.id);
      }
      return reply({
        ok: true
      });
    }
    if (b.action === 'code') {
      if (![
        'delivery',
        'owner'
      ].includes(me?.role) || !approved) throw new Error('Not allowed');
      if (![
        'on the way to customer',
        'arrived at customer'
      ].includes(o.status)) throw new Error('Order is not on the way to the customer');
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
      await db.from('order_secrets').upsert({
        order_id: o.id,
        delivery_code: code,
        attempts: 0
      });
      await db.from('orders').update({
        status: 'arrived at customer',
        last_emailed_status: 'arrived at customer'
      }).eq('id', o.id);
      await db.from('order_events').insert({
        order_id: o.id,
        status: 'arrived at customer',
        by_role: me.role
      });
      let emailed = false;
      if (o.email) {
        await mail(o.email, `Your delivery code ${o.order_number}`, shell('Your delivery is here', `<p>Your delivery person has arrived with order <b>${esc(o.order_number)}</b>.</p><p>Your confirmation code:</p><p style="font-size:30px;letter-spacing:6px;font-weight:bold;color:#b8892f">${code}</p><p>Give this code to the delivery person only when you have your order in hand.</p>`));
        emailed = true;
      }
      return reply({
        ok: true,
        emailed
      });
    }
    throw new Error('Unknown action');
  } catch (e) {
    return reply({
      error: e.message
    }, 400);
  }
});
