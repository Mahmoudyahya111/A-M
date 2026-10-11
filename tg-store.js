/* TELEGANT store sync. Load AFTER tg-core.js on shop.html, cart.html (and track.html). */
(function () {
  var TG = window.TG; if (!TG || TG.store) return; TG.store = 1;
  var ar = function () { return document.documentElement.lang === 'ar'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var eff = function (p) {
    var live = p.sale_price != null && (!p.offer_ends_at || p.offer_ends_at >= new Date().toISOString().slice(0, 10));
    return live ? Number(p.sale_price) : Number(p.price);
  };
  TG.products = async function () { var r = await TG.sb.from('products').select('*'); return r.error ? null : r.data; };

  /* shop page: apply price / offer / stock / archive / picture from the database */
  async function syncShop() {
    var cards = document.querySelectorAll('.product-card[data-color]'); if (!cards.length) return;
    var rows = await TG.products(), by = {}; if (!rows) return;
    rows.forEach(function (p) { if (p.slug) by[p.slug] = p; });
    if (!Object.keys(by).length) return;               // not set up yet: keep the page as it is
    var st = document.createElement('style');
    st.textContent = '.tg-offer{background:#c9a24b;color:#16110a;border-radius:99px;padding:1px 9px;font-size:.8em;margin-inline-start:6px}';
    document.head.appendChild(st);
    cards.forEach(function (card) {
      var p = by[card.dataset.color];
      if (!p || p.archived) { card.style.display = 'none'; return; }
      var price = eff(p); card.dataset.price = price;
      var pe = card.querySelector('.product-info p');
      pe.innerHTML = price < Number(p.price)
        ? '<s style="opacity:.6">' + esc(p.price) + '</s> <b>' + price + ' EGP</b>' + (p.offer_label ? '<span class="tg-offer">' + esc(p.offer_label) + '</span>' : '')
        : price + ' EGP';
      var img = card.querySelector('img'); if (p.image_url && img.getAttribute('src') !== p.image_url) img.setAttribute('src', p.image_url);
      var b = card.querySelector('[name="buy-now"]');
      if (p.stock <= 0) { b.removeAttribute('data-i18n'); b.disabled = true; b.style.opacity = '.5'; b.textContent = ar() ? 'نفد المخزون' : 'Out of stock'; }
    });
  }

  /* cart page: refresh prices from the database and load busy delivery days */
  TG.prepCart = async function () {
    try {
      var S = window.TelegantShop, rows = await TG.products();
      if (rows && S) {
        var by = {}; rows.forEach(function (p) { if (p.slug) by[p.slug] = p; });
        var items = S.Cart.all(), ch = false;
        items.forEach(function (it) { var p = by[it.color]; if (p && !p.archived) { var e = eff(p); if (it.price !== e) { it.price = e; ch = true; } } });
        if (ch) S.Cart.save(items);
      }
      var r = await TG.sb.rpc('delivery_counts');
      if (r.data) localStorage.setItem('telegant-order-counts', JSON.stringify(r.data));
      var s = (await TG.sb.auth.getSession()).data.session, btn = document.getElementById('place-order-btn');
      if (btn && !s) btn.textContent = ar() ? 'سجّل الدخول لإتمام الطلب' : 'Sign in to place your order';
      if (btn && s) {
        var p = await TG.profile(), n = document.getElementById('cust-name'), m = document.getElementById('cust-email');
        if (n && !n.value && p && p.full_name) n.value = p.full_name;
        if (m && !m.value) m.value = s.user.email;
      }
    } catch (e) { /* keep page working with what it has */ }
  };
  TG.thanks = function (num, pending) {
    TG.celebrate({ title: ar() ? 'شكراً لطلبك!' : 'Thank you for your order!',
      text: (ar() ? 'رقم طلبك ' : 'Your order number is ') + num + (ar() ? '. أرسلنا لك رسالة تأكيد على بريدك.' : '. A confirmation email is on its way.') + (pending ? (ar() ? ' سنؤكد التحويل ثم نبدأ التصنيع.' : ' We will confirm your InstaPay transfer, then start making your order.') : ''),
      buttons: [{ t: ar() ? 'تتبع طلبي' : 'Track my order', href: 'my-orders.html' }, { t: ar() ? 'متابعة التسوق' : 'Keep shopping', href: 'shop.html' }] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncShop); else syncShop();
})();
