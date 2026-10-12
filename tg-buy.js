/* TELEGANT – "Add to Cart" (stay on page) + "Buy Now" (straight to checkout). Both ask for sign-in first.
   Load AFTER tg-core.js on shop.html and catalog.html. */
(function () {
  var TG = window.TG; if (!TG || TG.buyOn) return; TG.buyOn = 1; TG.mode = 'buy';
  var ar = function () { return document.documentElement.lang === 'ar'; };
  var L = function () { return ar() ? { go: 'متابعة إلى إتمام الطلب', added: 'تمت الإضافة إلى السلة ✓', view: 'عرض السلة' } : { go: 'Continue to checkout', added: 'Added to cart ✓', view: 'View cart' }; };

  /* which button opened the size picker: "Buy Now" = buy, "Add to Cart" = cart */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[name="buy-now"]');
    if (b) { TG.mode = 'buy'; setTimeout(label, 0); }
  }, true);
  function label() {
    var m = document.getElementById('add-to-cart-btn'); if (!m) return;
    if (TG.mode === 'cart') { m.setAttribute('data-i18n', 'add_to_cart'); m.textContent = ar() ? 'أضف إلى السلة' : 'Add to Cart'; }
    else { m.removeAttribute('data-i18n'); m.textContent = L().go; }
  }

  /* add a second "Add to Cart" button under every "Buy Now" */
  function scan() {
    document.querySelectorAll('.product-card').forEach(function (card) {
      var bn = card.querySelector('[name="buy-now"]'); if (!bn) return;
      var a = card.querySelector('.tg-add');
      if (!a) {
        a = document.createElement('button'); a.className = 'tg-add'; a.setAttribute('data-i18n', 'add_to_cart');
        a.textContent = ar() ? 'أضف إلى السلة' : 'Add to Cart';
        var cs = getComputedStyle(bn);
        a.style.cssText = 'width:100%;margin-top:8px;cursor:pointer;background:transparent;border:1px solid #c9a24b;color:#e8cf86;box-sizing:border-box;' +
          'padding:' + cs.padding + ';border-radius:' + cs.borderRadius + ';font:' + cs.font + ';letter-spacing:' + cs.letterSpacing + ';text-transform:' + cs.textTransform;
        a.onclick = function () { if (bn.disabled) return; bn.click(); TG.mode = 'cart'; label(); };
        bn.insertAdjacentElement('afterend', a);
      }
      a.disabled = bn.disabled; a.style.opacity = bn.disabled ? '.5' : '1'; a.style.cursor = bn.disabled ? 'default' : 'pointer';
    });
  }
  scan(); document.addEventListener('DOMContentLoaded', scan);
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });

  /* size picker: "learn more" link + help for the Custom option (same numbers as the size guide page) */
  var SZ = { en: { learn: 'Learn more about sizes and how to measure →', hint: 'Measure a T-shirt you love, lying flat. Chest: armpit to armpit. Length: top of shoulder to hem. Shoulder: seam to seam. Allowed: chest 44-70, length 60-82, shoulder 40-58 cm.' },
             ar: { learn: 'تعرّف أكثر على المقاسات وطريقة القياس ←', hint: 'قِس تيشيرتاً تحبه وهو مفرود. الصدر: من الإبط إلى الإبط. الطول: من أعلى الكتف إلى الحافة السفلية. الكتف: من درزة إلى درزة. المسموح: صدر ٤٤-٧٠، طول ٦٠-٨٢، كتف ٤٠-٥٨ سم.' } };
  function sizeUi() {
    var grid = document.getElementById('size-options'), cf = document.getElementById('custom-fields'); if (!grid || !cf || document.getElementById('tg-learn')) return;
    var l = TG.lang ? TG.lang() : (ar() ? 'ar' : 'en'), a = document.createElement('a');
    a.id = 'tg-learn'; a.href = 'size-guide.html'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = SZ[l].learn;
    a.style.cssText = 'display:inline-block;margin:0 0 14px;color:#c9a24b;font-size:.85rem;text-decoration:underline'; grid.insertAdjacentElement('afterend', a);
    var h = document.createElement('small'); h.id = 'tg-hint'; h.textContent = SZ[l].hint; h.style.cssText = 'display:none;margin:-6px 0 14px;opacity:.8;line-height:1.55'; cf.insertAdjacentElement('afterend', h);
    new MutationObserver(function () { h.style.display = cf.classList.contains('show') ? 'block' : 'none'; }).observe(cf, { attributes: true, attributeFilter: ['class'] });
    function lim() { var R = window.TGSizes && TGSizes.ranges; if (!R) return; [['custom-chest', 'chest'], ['custom-length', 'length'], ['custom-shoulder', 'shoulder']].forEach(function (p) { var i = document.getElementById(p[0]); if (i) { i.min = R[p[1]][0]; i.max = R[p[1]][1]; i.placeholder = R[p[1]][0] + '-' + R[p[1]][1]; } }); }
    if (window.TGSizes) lim(); else { var s = document.createElement('script'); s.src = 'tg-sizes.js'; s.onload = lim; document.head.appendChild(s); }
  }
  sizeUi(); document.addEventListener('DOMContentLoaded', sizeUi);

  /* called by the size picker after the item is put in the cart */
  TG.afterAdd = async function () {
    var mode = TG.mode, s = (await TG.sb.auth.getSession()).data.session;
    if (!s) { location.href = 'login.html?next=' + encodeURIComponent(mode === 'cart' ? location.href : 'cart.html'); return; }   // sign in first
    if (mode !== 'cart') { location.href = 'cart.html'; return; }
    if (window.TelegantShop) window.TelegantShop.Cart.renderBadge();
    toast();
  };
  function toast() {
    if (!document.getElementById('tg-toast-css')) {
      var st = document.createElement('style'); st.id = 'tg-toast-css';
      st.textContent = '.tg-toast{position:fixed;inset-inline:0;bottom:26px;margin:auto;width:max-content;max-width:90vw;z-index:9500;background:#c9a24b;color:#16110a;padding:12px 20px;border-radius:99px;font:600 14px system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.45);animation:tgtoast .35s both}.tg-toast a{color:#16110a;margin-inline-start:14px;text-decoration:underline}@keyframes tgtoast{from{transform:translateY(24px);opacity:0}}';
      document.head.appendChild(st);
    }
    var t = document.createElement('div'); t.className = 'tg-toast'; t.textContent = L().added;
    var v = document.createElement('a'); v.href = 'cart.html'; v.textContent = L().view; t.appendChild(v);
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3600);
  }
})();
