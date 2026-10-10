/* TELEGANT – luxury category navigation (shop page + catalog pages). Load AFTER tg-core.js. */
(async function () {
  var TG = window.TG; if (!TG || TG.catsOn) return; TG.catsOn = 1;
  var host = document.getElementById('products-container'); if (!host) return;
  var ar = document.documentElement.lang === 'ar', sb = TG.sb, here = new URLSearchParams(location.search).get('c');
  var r = await Promise.all([
    sb.from('categories').select('*').eq('active', true).order('name_en'),
    sb.from('pages').select('slug').eq('kind', 'category').eq('published', true)]);
  var ok = {}; (r[1].data || []).forEach(function (p) { ok[p.slug] = 1; });
  var C = (r[0].data || []).filter(function (c) { return ok['c-' + c.slug]; });
  var tops = C.filter(function (c) { return !c.parent_id; });
  var isCat = !!document.getElementById('cat-grid');
  if (!tops.length && !isCat) return;

  var st = document.createElement('style');
  st.textContent =
    '.tgcat{max-width:1000px;margin:0 auto 38px;padding:0 14px;text-align:center}' +
    '.tgcat-rule{display:flex;align-items:center;gap:14px;max-width:520px;margin:0 auto;color:#c9a24b;font-size:9px}' +
    '.tgcat-rule::before,.tgcat-rule::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,#c9a24b)}' +
    '.tgcat-rule::after{background:linear-gradient(270deg,transparent,#c9a24b)}' +
    '.tgcat-main{display:flex;flex-wrap:nowrap;gap:22px 56px;margin:26px 0;padding:0 28px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity;-webkit-mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}' +
    '.tgcat-main::-webkit-scrollbar{display:none}.tgcat-main>:first-child{margin-inline-start:auto}.tgcat-main>:last-child{margin-inline-end:auto}' +
    '.tgcat-g{display:flex;flex:0 0 auto;flex-direction:column;align-items:center;gap:10px;scroll-snap-align:center}' +
    '.tgcat a{text-decoration:none;background:linear-gradient(#c9a24b,#c9a24b) bottom center/0 1px no-repeat;transition:background-size .35s,color .25s,opacity .25s}' +
    '.tgcat a:hover,.tgcat a.on{background-size:100% 1px}' +
    '.tgcat-t{font-size:1.02rem;font-weight:500;letter-spacing:.32em;text-transform:uppercase;color:#e8cf86;padding:0 0 7px .32em}' +
    '.tgcat-s{display:flex;flex-wrap:nowrap;justify-content:center}' +
    '.tgcat a{white-space:nowrap}' +
    '.tgcat-s a{font-size:.74rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(241,233,214,.68);padding:0 0 5px .2em}' +
    '.tgcat-s a:hover,.tgcat-s a.on{color:#e8cf86}.tgcat-s a+a{border-inline-start:1px solid rgba(201,162,75,.5);margin-inline-start:16px;padding-inline-start:16px;border-radius:0}' +
    '.tgcat-t:hover,.tgcat-t.on{color:#fff}' +
    '.tgcat-back{display:inline-block;margin:0 0 20px;font-size:.78rem;letter-spacing:.22em;text-transform:uppercase;color:#e8cf86;padding:0 0 5px .22em}' +
    'html[data-tg-theme="light"] .tgcat-back{color:#8a6a1f}' +
    'html[data-tg-theme="light"] .tgcat-t{color:#8a6a1f}html[data-tg-theme="light"] .tgcat-t:hover,html[data-tg-theme="light"] .tgcat-t.on{color:#2a2114}' +
    'html[data-tg-theme="light"] .tgcat-s a{color:rgba(42,33,20,.7)}html[data-tg-theme="light"] .tgcat-s a:hover,html[data-tg-theme="light"] .tgcat-s a.on{color:#8a6a1f}' +
    /* the option you are on: bright white, bold, glowing gold underline and a ◆ marker */
    '.tgcat a.on{color:#fff;font-weight:700;background-size:100% 2px;text-shadow:0 0 16px rgba(232,207,134,.7)}' +
    '.tgcat a.on::before{content:"◆";font-size:.55em;color:#c9a24b;margin-inline-end:.9em;vertical-align:middle;text-shadow:none}' +
    '.tgcat-t.in{color:#fff}' +
    'html[data-tg-theme="light"] .tgcat a.on{color:#2a2114;font-weight:700;text-shadow:none}html[data-tg-theme="light"] .tgcat-t.in{color:#2a2114}' +
    'html[lang="ar"] .tgcat a{letter-spacing:0;text-transform:none}';
  document.head.appendChild(st);

  var nm = function (c) { return (ar && c.name_ar) || c.name_en; };
  var link = function (c, cls) {
    var a = document.createElement('a'); a.href = 'catalog.html?c=' + encodeURIComponent(c.slug); a.textContent = nm(c);
    a.className = cls + (c.slug === here ? ' on' : ''); return a;
  };
  var bar = document.createElement('nav'); bar.className = 'tgcat'; bar.setAttribute('aria-label', ar ? 'الأقسام' : 'Categories');
  if (isCat) {                                              // way back from a category page
    var bk = document.createElement('a'); bk.className = 'tgcat-back'; bk.href = 'shop.html';
    bk.textContent = ar ? 'العودة إلى المتجر ←' : '← Back to shop'; var bw = document.createElement('div'); bw.appendChild(bk); bar.appendChild(bw);
  }
  if (!tops.length) { host.insertBefore(bar, host.firstChild); return; }
  var top = document.createElement('div'); top.className = 'tgcat-rule'; top.textContent = '◆'; bar.appendChild(top);
  var main = document.createElement('div'); main.className = 'tgcat-main';
  var all = document.createElement('div'); all.className = 'tgcat-g';                  // "All" = the full shop
  var al = document.createElement('a'); al.href = 'shop.html'; al.textContent = ar ? 'الكل' : 'All'; al.className = 'tgcat-t' + (isCat ? '' : ' on');
  all.appendChild(al); main.appendChild(all);
  tops.forEach(function (t) {
    var g = document.createElement('div'); g.className = 'tgcat-g';
    var kids = C.filter(function (c) { return c.parent_id === t.id; });
    var ta = link(t, 'tgcat-t'); if (kids.some(function (k) { return k.slug === here; })) ta.className += ' in'; g.appendChild(ta);
    if (kids.length) { var s = document.createElement('div'); s.className = 'tgcat-s'; kids.forEach(function (k) { s.appendChild(link(k, '')); }); g.appendChild(s); }
    main.appendChild(g);
  });
  bar.appendChild(main);
  var bot = document.createElement('div'); bot.className = 'tgcat-rule'; bot.textContent = '◆'; bar.appendChild(bot);
  host.insertBefore(bar, host.firstChild);
  try { var cur = bar.querySelector('.on'); if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) {}
})();
