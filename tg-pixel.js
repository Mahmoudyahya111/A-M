/* TELEGANT Meta (Facebook) Pixel. Loads ONLY when the owner saved a numeric Pixel ID (Admin > Marketing > Facebook Pixel).
   Also remembers UTM / fbclid on the first visit (30 days) and saves it with the order. Load AFTER tg-core.js. */
(function () {
  var TG = window.TG; if (!TG || TG.px) return;
  var UK = 'tg_utm', page = location.pathname.split('/').pop() || 'index.html', queue = [];
  try {
    var q = new URLSearchParams(location.search), keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'], got = {};
    keys.forEach(function (k) { if (q.get(k)) got[k] = String(q.get(k)).slice(0, 120); });
    if (Object.keys(got).length) { got.landing = page; got.ts = Date.now(); localStorage.setItem(UK, JSON.stringify(got)); }
  } catch (e) { }
  var px = TG.px = { id: null, utm: function () { try { var u = JSON.parse(localStorage.getItem(UK)); if (u && Date.now() - u.ts < 30 * 864e5) return u; } catch (e) { } return null; } };
  var cur = function (x) { return Object.assign({ currency: 'EGP' }, x || {}); };
  function track(ev, data, opt) { if (!px.id) return; if (!window.fbq) { queue.push([ev, data, opt]); return; } try { opt ? fbq('track', ev, data || {}, opt) : fbq('track', ev, data || {}); } catch (e) { } }
  px.track = track;
  function cart() { try { return JSON.parse(localStorage.getItem('telegant-cart')) || []; } catch (e) { return []; } }
  function val(items) { return items.reduce(function (a, i) { return a + (Number(i.price) || 0) * (i.qty || 1); }, 0); }
  function load(id) {
    if (!/^\d{8,20}$/.test(id) || window.fbq) return;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    px.id = id; fbq('init', id); fbq('track', 'PageView');
    queue.splice(0).forEach(function (a) { track(a[0], a[1], a[2]); });
    if (page === 'cart.html') { var c = cart(); if (c.length) track('InitiateCheckout', cur({ value: val(c), num_items: c.reduce(function (a, i) { return a + (i.qty || 1); }, 0), content_ids: c.map(function (i) { return String(i.color); }), content_type: 'product' })); }
  }
  /* settings are public-read; no setting = nothing loads */
  TG.sb.from('site_settings').select('value').eq('key', 'pixel').maybeSingle().then(function (r) { var id = r && r.data && r.data.value && String(r.data.value.id || '').trim(); if (id) load(id); }, function () { });
  /* AddToCart: wrap the shared cart */
  function wrapCart() { var S = window.TelegantShop; if (!S || !S.Cart || S.Cart._px) return; var oa = S.Cart.add; S.Cart._px = 1; S.Cart.add = function (item) { var r = oa.apply(this, arguments); track('AddToCart', cur({ content_type: 'product', content_ids: [String(item.color)], content_name: item.name, value: (Number(item.price) || 0) * (item.qty || 1) })); return r; }; }
  wrapCart(); document.addEventListener('DOMContentLoaded', wrapCart);
  /* ViewContent: a shopper opens a product (Buy now / Add to cart) */
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[name="buy-now"],.tg-add'); if (!b) return; var card = b.closest('.product-card'), h = card && card.querySelector('h2,h3,.product-title,.product-name'); track('ViewContent', cur({ content_type: 'product', content_name: h ? h.textContent.trim() : undefined })); }, true);
  /* Contact: WhatsApp / chat */
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('a[href*="wa.me"],a[href*="whatsapp"],#tg-chat-btn,.tg-chat-btn,[data-chat]'); if (t) track('Contact', cur({ content_name: /wa\.me|whatsapp/.test(t.getAttribute('href') || '') ? 'whatsapp' : 'chat' })); }, true);
  /* Purchase + attribution: wrap placeOrder */
  var op = TG.placeOrder; TG.placeOrder = async function (o) { var items = (o && o.items) || [], u = px.utm(); if (u) o = Object.assign({}, o, { attribution: u }); var num = await op.call(TG, o); track('Purchase', cur({ value: val(items) + (o && o.express ? 100 : 0), content_type: 'product', content_ids: items.map(function (i) { return String(i.color); }), num_items: items.reduce(function (a, i) { return a + (i.qty || 1); }, 0) }), { eventID: String(num) }); return num; };
})();
