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
async function mail(to, subject, html) {
  const user = Deno.env.get('SMTP_USER');
  const c = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: {
        username: user,
        password: Deno.env.get('SMTP_PASS')
      }
    }
  });
  await c.send({
    from: `TELEGANT <${user}>`,
    to,
    subject,
    content: 'auto',
    html
  });
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
/* esm.sh - @supabase/supabase-js@2.45.4 */
import "/@supabase/auth-js@2.65.0/denonext/auth-js.mjs";
import "/@supabase/functions-js@2.4.1/denonext/functions-js.mjs";
import "/@supabase/node-fetch@2.6.15/denonext/node-fetch.mjs";
import "/@supabase/postgrest-js@1.16.1/denonext/postgrest-js.mjs";
import "/@supabase/realtime-js@2.10.2/denonext/realtime-js.mjs";
import "/@supabase/storage-js@2.7.0/denonext/storage-js.mjs";
export * from "/@supabase/supabase-js@2.45.4/denonext/supabase-js.mjs";
/* esm.sh - @supabase/auth-js@2.65.0 */
var K="2.65.0";var ne="http://localhost:9999",ae="supabase.auth.token";var le={"X-Client-Info":`gotrue-js/${K}`},X=10;var $="X-Supabase-Api-Version",Z={"2024-01-01":{timestamp:Date.parse("2024-01-01T00:00:00.0Z"),name:"2024-01-01"}};function ce(o){return Math.round(Date.now()/1e3)+o}function ue(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(o){let e=Math.random()*16|0;return(o=="x"?e:e&3|8).toString(16)})}var g=()=>typeof document<"u",T={tested:!1,writable:!1},k=()=>{if(!g())return!1;try{if(typeof globalThis.localStorage!="object")return!1}catch{return!1}if(T.tested)return T.writable;let o=`lswt-${Math.random()}${Math.random()}`;try{globalThis.localStorage.setItem(o,o),globalThis.localStorage.removeItem(o),T.tested=!0,T.writable=!0}catch{T.tested=!0,T.writable=!1}return T.writable};function z(o){let e={},t=new URL(o);if(t.hash&&t.hash[0]==="#")try{new URLSearchParams(t.hash.substring(1)).forEach((s,i)=>{e[i]=s})}catch{}return t.searchParams.forEach((r,s)=>{e[s]=r}),e}var W=o=>{let e;return o?e=o:typeof fetch>"u"?e=(...t)=>import("/@supabase/node-fetch@^2.6.14?target=denonext").then(({default:r})=>r(...t)):e=fetch,(...t)=>e(...t)},he=o=>typeof o=="object"&&o!==null&&"status"in o&&"ok"in o&&"json"in o&&typeof o.json=="function",Q=async(o,e,t)=>{await o.setItem(e,JSON.stringify(t))},U=async(o,e)=>{let t=await o.getItem(e);if(!t)return null;try{return JSON.parse(t)}catch{return t}},N=async(o,e)=>{await o.removeItem(e)};function Ee(o){let e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",t="",r,s,i,n,a,l,c,h=0;for(o=o.replace("-","+").replace("_","/");h<o.length;)n=e.indexOf(o.charAt(h++)),a=e.indexOf(o.charAt(h++)),l=e.indexOf(o.charAt(h++)),c=e.indexOf(o.charAt(h++)),r=n<<2|a>>4,s=(a&15)<<4|l>>2,i=(l&3)<<6|c,t=t+String.fromCharCode(r),l!=64&&s!=0&&(t=t+String.fromCharCode(s)),c!=64&&i!=0&&(t=t+String.fromCharCode(i));return t}var j=class o{constructor(){this.promise=new o.promiseConstructor((e,t)=>{this.resolve=e,this.reject=t})}};j.promiseConstructor=Promise;function ee(o){let e=/^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}=?$|[a-z0-9_-]{2}(==)?$)$/i,t=o.split(".");if(t.length!==3)throw new Error("JWT is not valid: not a JWT structure");if(!e.test(t[1]))throw new Error("JWT is not valid: payload is not in base64url format");let r=t[1];return JSON.parse(Ee(r))}async function de(o){return await new Promise(e=>{setTimeout(()=>e(null),o)})}function fe(o,e){return new Promise((r,s)=>{(async()=>{for(let i=0;i<1/0;i++)try{let n=await o(i);if(!e(i,null,n)){r(n);return}}catch(n){if(!e(i,n)){s(n);return}}})()})}function Ie(o){return("0"+o.toString(16)).substr(-2)}function Re(){let e=new Uint32Array(56);if(typeof crypto>"u"){let t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~",r=t.length,s="";for(let i=0;i<56;i++)s+=t.charAt(Math.floor(Math.random()*r));return s}return crypto.getRandomValues(e),Array.from(e,Ie).join("")}async function Oe(o){let t=new TextEncoder().encode(o),r=await crypto.subtle.digest("SHA-256",t),s=new Uint8Array(r);return Array.from(s).map(i=>String.fromCharCode(i)).join("")}function Ce(o){return btoa(o).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}async function Pe(o){if(!(typeof crypto<"u"&&typeof crypto.subtle<"u"&&typeof TextEncoder<"u"))return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."),o;let t=await Oe(o);return Ce(t)}async function x(o,e,t=!1){let r=Re(),s=r;t&&(s+="/PASSWORD_RECOVERY"),await Q(o,`${e}-code-verifier`,s);let i=await Pe(r);return[i,r===i?"plain":"s256"]}var Le=/^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;function _e(o){let e=o.headers.get($);if(!e||!e.match(Le))return null;try{return new Date(`${e}T00:00:00.0Z`)}catch{return null}}var D=class extends Error{constructor(e,t,r){super(e),this.__isAuthError=!0,this.name="AuthError",this.status=t,this.code=r}};function u(o){return typeof o=="object"&&o!==null&&"__isAuthError"in o}var J=class extends D{constructor(e,t,r){super(e,t,r),this.name="AuthApiError",this.status=t,this.code=r}};function ge(o){return u(o)&&o.name==="AuthApiError"}var C=class extends D{constructor(e,t){super(e),this.name="AuthUnknownError",this.originalError=t}},b=class extends D{constructor(e,t,r,s){super(e,r,s),this.name=t,this.status=r}},w=class extends b{constructor(){super("Auth session missing!","AuthSessionMissingError",400,void 0)}};function we(o){return u(o)&&o.name==="AuthSessionMissingError"}var P=class extends b{constructor(){super("Auth session or user missing","AuthInvalidTokenResponseError",500,void 0)}},A=class extends b{constructor(e){super(e,"AuthInvalidCredentialsError",400,void 0)}},E=class extends b{constructor(e,t=null){super(e,"AuthImplicitGrantRedirectError",500,void 0),this.details=null,this.details=t}toJSON(){return{name:this.name,message:this.message,status:this.status,details:this.details}}},q=class extends b{constructor(e,t=null){super(e,"AuthPKCEGrantCodeExchangeError",500,void 0),this.details=null,this.details=t}toJSON(){return{name:this.name,message:this.message,status:this.status,details:this.details}}},L=class extends b{constructor(e,t){super(e,"AuthRetryableFetchError",t,void 0)}};function B(o){return u(o)&&o.name==="AuthRetryableFetchError"}var M=class extends b{constructor(e,t,r){super(e,"AuthWeakPasswordError",t,"weak_password"),this.reasons=r}};function Ye(o){return u(o)&&o.name==="AuthWeakPasswordError"}var $e=function(o,e){var t={};for(var r in o)Object.prototype.hasOwnProperty.call(o,r)&&e.indexOf(r)<0&&(t[r]=o[r]);if(o!=null&&typeof Object.getOwnPropertySymbols=="function")for(var s=0,r=Object.getOwnPropertySymbols(o);s<r.length;s++)e.indexOf(r[s])<0&&Object.prototype.propertyIsEnumerable.call(o,r[s])&&(t[r[s]]=o[r[s]]);return t},I=o=>o.msg||o.message||o.error_description||o.error||JSON.stringify(o),je=[502,503,504];async function pe(o){var e;if(!he(o))throw new L(I(o),0);if(je.includes(o.status))throw new L(I(o),o.status);let t;try{t=await o.json()}catch(i){throw new C(I(i),i)}let r,s=_e(o);if(s&&s.getTime()>=Z["2024-01-01"].timestamp&&typeof t=="object"&&t&&typeof t.code=="string"?r=t.code:typeof t=="object"&&t&&typeof t.error_code=="string"&&(r=t.error_code),r){if(r==="weak_password")throw new M(I(t),o.status,((e=t.weak_password)===null||e===void 0?void 0:e.reasons)||[]);if(r==="session_not_found")throw new w}else if(typeof t=="object"&&t&&typeof t.weak_password=="object"&&t.weak_password&&Array.isArray(t.weak_password.reasons)&&t.weak_password.reasons.length&&t.weak_password.reasons.reduce((i,n)=>i&&typeof n=="string",!0))throw new M(I(t),o.status,t.weak_password.reasons);throw new J(I(t),o.status||500,r)}var Ue=(o,e,t,r)=>{let s={method:o,headers:e?.headers||{}};return o==="GET"?s:(s.headers=Object.assign({"Content-Type":"application/json;charset=UTF-8"},e?.headers),s.body=JSON.stringify(r),Object.assign(Object.assign({},s),t))};async function d(o,e,t,r){var s;let i=Object.assign({},r?.headers);i[$]||(i[$]=Z["2024-01-01"].name),r?.jwt&&(i.Authorization=`Bearer ${r.jwt}`);let n=(s=r?.query)!==null&&s!==void 0?s:{};r?.redirectTo&&(n.redirect_to=r.redirectTo);let a=Object.keys(n).length?"?"+new URLSearchParams(n).toString():"",l=await Ne(o,e,t+a,{headers:i,noResolveJson:r?.noResolveJson},{},r?.body);return r?.xform?r?.xform(l):{data:Object.assign({},l),error:null}}async function Ne(o,e,t,r,s,i){let n=Ue(e,r,s,i),a;try{a=await o(t,Object.assign({},n))}catch(l){throw console.error(l),new L(I(l),0)}if(a.ok||await pe(a),r?.noResolveJson)return a;try{return await a.json()}catch(l){await pe(l)}}function m(o){var e;let t=null;De(o)&&(t=Object.assign({},o),o.expires_at||(t.expires_at=ce(o.expires_in)));let r=(e=o.user)!==null&&e!==void 0?e:o;return{data:{session:t,user:r},error:null}}function te(o){let e=m(o);return!e.error&&o.weak_password&&typeof o.weak_password=="object"&&Array.isArray(o.weak_password.reasons)&&o.weak_password.reasons.length&&o.weak_password.message&&typeof o.weak_password.message=="string"&&o.weak_password.reasons.reduce((t,r)=>t&&typeof r=="string",!0)&&(e.data.weak_password=o.weak_password),e}function v(o){var e;return{data:{user:(e=o.user)!==null&&e!==void 0?e:o},error:null}}function ye(o){return{data:o,error:null}}function ve(o){let{action_link:e,email_otp:t,hashed_token:r,redirect_to:s,verification_type:i}=o,n=$e(o,["action_link","email_otp","hashed_token","redirect_to","verification_type"]),a={action_link:e,email_otp:t,hashed_token:r,redirect_to:s,verification_type:i},l=Object.assign({},n);return{data:{properties:a,user:l},error:null}}function be(o){return o}function De(o){return o.access_token&&o.refresh_token&&o.expires_in}var qe=function(o,e){var t={};for(var r in o)Object.prototype.hasOwnProperty.call(o,r)&&e.indexOf(r)<0&&(t[r]=o[r]);if(o!=null&&typeof Object.getOwnPropertySymbols=="function")for(var s=0,r=Object.getOwnPropertySymbols(o);s<r.length;s++)e.indexOf(r[s])<0&&Object.prototype.propertyIsEnumerable.call(o,r[s])&&(t[r[s]]=o[r[s]]);return t},S=class{constructor({url:e="",headers:t={},fetch:r}){this.url=e,this.headers=t,this.fetch=W(r),this.mfa={listFactors:this._listFactors.bind(this),deleteFactor:this._deleteFactor.bind(this)}}async signOut(e,t="global"){try{return await d(this.fetch,"POST",`${this.url}/logout?scope=${t}`,{headers:this.headers,jwt:e,noResolveJson:!0}),{data:null,error:null}}catch(r){if(u(r))return{data:null,error:r};throw r}}async inviteUserByEmail(e,t={}){try{return await d(this.fetch,"POST",`${this.url}/invite`,{body:{email:e,data:t.data},headers:this.headers,redirectTo:t.redirectTo,xform:v})}catch(r){if(u(r))return{data:{user:null},error:r};throw r}}async generateLink(e){try{let{options:t}=e,r=qe(e,["options"]),s=Object.assign(Object.assign({},r),t);return"newEmail"in r&&(s.new_email=r?.newEmail,delete s.newEmail),await d(this.fetch,"POST",`${this.url}/admin/generate_link`,{body:s,headers:this.headers,xform:ve,redirectTo:t?.redirectTo})}catch(t){if(u(t))return{data:{properties:null,user:null},error:t};throw t}}async createUser(e){try{return await d(this.fetch,"POST",`${this.url}/admin/users`,{body:e,headers:this.headers,xform:v})}catch(t){if(u(t))return{data:{user:null},error:t};throw t}}async listUsers(e){var t,r,s,i,n,a,l;try{let c={nextPage:null,lastPage:0,total:0},h=await d(this.fetch,"GET",`${this.url}/admin/users`,{headers:this.headers,noResolveJson:!0,query:{page:(r=(t=e?.page)===null||t===void 0?void 0:t.toString())!==null&&r!==void 0?r:"",per_page:(i=(s=e?.perPage)===null||s===void 0?void 0:s.toString())!==null&&i!==void 0?i:""},xform:be});if(h.error)throw h.error;let _=await h.json(),f=(n=h.headers.get("x-total-count"))!==null&&n!==void 0?n:0,p=(l=(a=h.headers.get("link"))===null||a===void 0?void 0:a.split(","))!==null&&l!==void 0?l:[];return p.length>0&&(p.forEach(y=>{let Y=parseInt(y.split(";")[0].split("=")[1].substring(0,1)),V=JSON.parse(y.split(";")[1].split("=")[1]);c[`${V}Page`]=Y}),c.total=parseInt(f)),{data:Object.assign(Object.assign({},_),c),error:null}}catch(c){if(u(c))return{data:{users:[]},error:c};throw c}}async getUserById(e){try{return await d(this.fetch,"GET",`${this.url}/admin/users/${e}`,{headers:this.headers,xform:v})}catch(t){if(u(t))return{data:{user:null},error:t};throw t}}async updateUserById(e,t){try{return await d(this.fetch,"PUT",`${this.url}/admin/users/${e}`,{body:t,headers:this.headers,xform:v})}catch(r){if(u(r))return{data:{user:null},error:r};throw r}}async deleteUser(e,t=!1){try{return await d(this.fetch,"DELETE",`${this.url}/admin/users/${e}`,{headers:this.headers,body:{should_soft_delete:t},xform:v})}catch(r){if(u(r))return{data:{user:null},error:r};throw r}}async _listFactors(e){try{let{data:t,error:r}=await d(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/factors`,{headers:this.headers,xform:s=>({data:{factors:s},error:null})});return{data:t,error:r}}catch(t){if(u(t))return{data:null,error:t};throw t}}async _deleteFactor(e){try{return{data:await d(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/factors/${e.id}`,{headers:this.headers}),error:null}}catch(t){if(u(t))return{data:null,error:t};throw t}}};var me={getItem:o=>k()?globalThis.localStorage.getItem(o):null,setItem:(o,e)=>{k()&&globalThis.localStorage.setItem(o,e)},removeItem:o=>{k()&&globalThis.localStorage.removeItem(o)}};function re(o={}){return{getItem:e=>o[e]||null,setItem:(e,t)=>{o[e]=t},removeItem:e=>{delete o[e]}}}function ke(){if(typeof globalThis!="object")try{Object.defineProperty(Object.prototype,"__magic__",{get:function(){return this},configurable:!0}),__magic__.globalThis=__magic__,delete Object.prototype.__magic__}catch{typeof self<"u"&&(self.globalThis=self)}}var R={debug:!!(globalThis&&k()&&globalThis.localStorage&&globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug")==="true")},F=class extends Error{constructor(e){super(e),this.isAcquireTimeout=!0}},H=class extends F{};async function se(o,e,t){R.debug&&console.log("@supabase/gotrue-js: navigatorLock: acquire lock",o,e);let r=new globalThis.AbortController;return e>0&&setTimeout(()=>{r.abort(),R.debug&&console.log("@supabase/gotrue-js: navigatorLock acquire timed out",o)},e),await globalThis.navigator.locks.request(o,e===0?{mode:"exclusive",ifAvailable:!0}:{mode:"exclusive",signal:r.signal},async s=>{if(s){R.debug&&console.log("@supabase/gotrue-js: navigatorLock: acquired",o,s.name);try{return await t()}finally{R.debug&&console.log("@supabase/gotrue-js: navigatorLock: released",o,s.name)}}else{if(e===0)throw R.debug&&console.log("@supabase/gotrue-js: navigatorLock: not immediately available",o),new H(`Acquiring an exclusive Navigator LockManager lock "${o}" immediately failed`);if(R.debug)try{let i=await globalThis.navigator.locks.query();console.log("@supabase/gotrue-js: Navigator LockManager state",JSON.stringify(i,null,"  "))}catch(i){console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state",i)}return console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request"),await t()}})}ke();var Me={url:ne,storageKey:ae,autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,headers:le,flowType:"implicit",debug:!1,hasCustomAuthorizationHeader:!1},G=30*1e3,Se=3;async function Te(o,e,t){return await t()}var O=class o{constructor(e){var t,r;this.memoryStorage=null,this.stateChangeEmitters=new Map,this.autoRefreshTicker=null,this.visibilityChangedCallback=null,this.refreshingDeferred=null,this.initializePromise=null,this.detectSessionInUrl=!0,this.hasCustomAuthorizationHeader=!1,this.suppressGetSessionWarning=!1,this.lockAcquired=!1,this.pendingInLock=[],this.broadcastChannel=null,this.logger=console.log,this.instanceID=o.nextInstanceID,o.nextInstanceID+=1,this.instanceID>0&&g()&&console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");let s=Object.assign(Object.assign({},Me),e);if(this.logDebugMessages=!!s.debug,typeof s.debug=="function"&&(this.logger=s.debug),this.persistSession=s.persistSession,this.storageKey=s.storageKey,this.autoRefreshToken=s.autoRefreshToken,this.admin=new S({url:s.url,headers:s.headers,fetch:s.fetch}),this.url=s.url,this.headers=s.headers,this.fetch=W(s.fetch),this.lock=s.lock||Te,this.detectSessionInUrl=s.detectSessionInUrl,this.flowType=s.flowType,this.hasCustomAuthorizationHeader=s.hasCustomAuthorizationHeader,s.lock?this.lock=s.lock:g()&&(!((t=globalThis?.navigator)===null||t===void 0)&&t.locks)?this.lock=se:this.lock=Te,this.mfa={verify:this._verify.bind(this),enroll:this._enroll.bind(this),unenroll:this._unenroll.bind(this),challenge:this._challenge.bind(this),listFactors:this._listFactors.bind(this),challengeAndVerify:this._challengeAndVerify.bind(this),getAuthenticatorAssuranceLevel:this._getAuthenticatorAssuranceLevel.bind(this)},this.persistSession?s.storage?this.storage=s.storage:k()?this.storage=me:(this.memoryStorage={},this.storage=re(this.memoryStorage)):(this.memoryStorage={},this.storage=re(this.memoryStorage)),g()&&globalThis.BroadcastChannel&&this.persistSession&&this.storageKey){try{this.broadcastChannel=new globalThis.BroadcastChannel(this.storageKey)}catch(i){console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available",i)}(r=this.broadcastChannel)===null||r===void 0||r.addEventListener("message",async i=>{this._debug("received broadcast notification from other tab or client",i),await this._notifyAllSubscribers(i.data.event,i.data.session,!1)})}this.initialize()}_debug(...e){return this.logDebugMessages&&this.logger(`GoTrueClient@${this.instanceID} (${K}) ${new Date().toISOString()}`,...e),this}async initialize(){return this.initializePromise?await this.initializePromise:(this.initializePromise=(async()=>await this._acquireLock(-1,async()=>await this._initialize()))(),await this.initializePromise)}async _initialize(){try{let e=g()?await this._isPKCEFlow():!1;if(this._debug("#_initialize()","begin","is PKCE flow",e),e||this.detectSessionInUrl&&this._isImplicitGrantFlow()){let{data:t,error:r}=await this._getSessionFromURL(e);if(r)return this._debug("#_initialize()","error detecting session from URL",r),r?.message==="Identity is already linked"||r?.message==="Identity is already linked to another user"?{error:r}:(await this._removeSession(),{error:r});let{session:s,redirectType:i}=t;return this._debug("#_initialize()","detected session in URL",s,"redirect type",i),await this._saveSession(s),setTimeout(async()=>{i==="recovery"?await this._notifyAllSubscribers("PASSWORD_RECOVERY",s):await this._notifyAllSubscribers("SIGNED_IN",s)},0),{error:null}}return await this._recoverAndRefresh(),{error:null}}catch(e){return u(e)?{error:e}:{error:new C("Unexpected error during initialization",e)}}finally{await this._handleVisibilityChange(),this._debug("#_initialize()","end")}}async signInAnonymously(e){var t,r,s;try{let i=await d(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{data:(r=(t=e?.options)===null||t===void 0?void 0:t.data)!==null&&r!==void 0?r:{},gotrue_meta_security:{captcha_token:(s=e?.options)===null||s===void 0?void 0:s.captchaToken}},xform:m}),{data:n,error:a}=i;if(a||!n)return{data:{user:null,session:null},error:a};let l=n.session,c=n.user;return n.session&&(await this._saveSession(n.session),await this._notifyAllSubscribers("SIGNED_IN",l)),{data:{user:c,session:l},error:null}}catch(i){if(u(i))return{data:{user:null,session:null},error:i};throw i}}async signUp(e){var t,r,s;try{let i;if("email"in e){let{email:h,password:_,options:f}=e,p=null,y=null;this.flowType==="pkce"&&([p,y]=await x(this.storage,this.storageKey)),i=await d(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,redirectTo:f?.emailRedirectTo,body:{email:h,password:_,data:(t=f?.data)!==null&&t!==void 0?t:{},gotrue_meta_security:{captcha_token:f?.captchaToken},code_challenge:p,code_challenge_method:y},xform:m})}else if("phone"in e){let{phone:h,password:_,options:f}=e;i=await d(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{phone:h,password:_,data:(r=f?.data)!==null&&r!==void 0?r:{},channel:(s=f?.channel)!==null&&s!==void 0?s:"sms",gotrue_meta_security:{captcha_token:f?.captchaToken}},xform:m})}else throw new A("You must provide either an email or phone number and a password