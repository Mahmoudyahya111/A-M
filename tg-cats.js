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
  if (!tops.length) return;

  var st = document.createElement('style');
  st.textContent =
    '.tgcat{max-width:1000px;margin:0 auto 38px;padding:0 14px;text-align:center}' +
    '.tgcat-rule{display:flex;align-items:center;gap:14px;max-width:520px;margin:0 auto;color:#c9a24b;font-size:9px}' +
    '.tgcat-rule::before,.tgcat-rule::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,transparent,#c9a24b)}' +
    '.tgcat-rule::after{background:linear-gradient(270deg,transparent,#c9a24b)}' +
    '.tgcat-main{display:flex;flex-wrap:wrap;justify-content:center;gap:22px 56px;margin:26px 0}' +
    '.tgcat-g{display:flex;flex-direction:column;align-items:center;gap:10px}' +
    '.tgcat a{text-decoration:none;background:linear-gradient(#c9a24b,#c9a24b) bottom center/0 1px no-repeat;transition:background-size .35s,color .25s,opacity .25s}' +
    '.tgcat a:hover,.tgcat a.on{background-size:100% 1px}' +
    '.tgcat-t{font-size:1.02rem;font-weight:500;letter-spacing:.32em;text-transform:uppercase;color:#e8cf86;padding:0 0 7px .32em}' +
    '.tgcat-s{display:flex;flex-wrap:wrap;justify-content:center}' +
    '.tgcat-s a{font-size:.74rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(241,233,214,.68);padding:0 0 5px .2em}' +
    '.tgcat-s a:hover,.tgcat-s a.on{color:#e8cf86}.tgcat-s a+a{border-inline-start:1px solid rgba(201,162,75,.5);margin-inline-start:16px;padding-inline-start:16px;border-radius:0}' +
    '.tgcat-t:hover,.tgcat-t.on{color:#fff}' +
    'html[data-tg-theme="light"] .tgcat-t{color:#8a6a1f}html[data-tg-theme="light"] .tgcat-t:hover,html[data-tg-theme="light"] .tgcat-t.on{color:#2a2114}' +
    'html[data-tg-theme="light"] .tgcat-s a{color:rgba(42,33,20,.7)}html[data-tg-theme="light"] .tgcat-s a:hover,html[data-tg-theme="light"] .tgcat-s a.on{color:#8a6a1f}' +
    'html[lang="ar"] .tgcat a{letter-spacing:0;text-transform:none}';
  document.head.appendChild(st);

  var nm = function (c) { return (ar && c.name_ar) || c.name_en; };
  var link = function (c, cls) {
    var a = document.createElement('a'); a.href = 'catalog.html?c=' + encodeURIComponent(c.slug); a.textContent = nm(c);
    a.className = cls + (c.slug === here ? ' on' : ''); return a;
  };
  var bar = document.createElement('nav'); bar.className = 'tgcat'; bar.setAttribute('aria-label', ar ? 'الأقسام' : 'Categories');
  var top = document.createElement('div'); top.className = 'tgcat-rule'; top.textContent = '◆'; bar.appendChild(top);
  var main = document.createElement('div'); main.className = 'tgcat-main';
  tops.forEach(function (t) {
    var g = document.createElement('div'); g.className = 'tgcat-g'; g.appendChild(link(t, 'tgcat-t'));
    var kids = C.filter(function (c) { return c.parent_id === t.id; });
    if (kids.length) { var s = document.createElement('div'); s.className = 'tgcat-s'; kids.forEach(function (k) { s.appendChild(link(k, '')); }); g.appendChild(s); }
    main.appendChild(g);
  });
  bar.appendChild(main);
  var bot = document.createElement('div'); bot.className = 'tgcat-rule'; bot.textContent = '◆'; bar.appendChild(bot);
  host.insertBefore(bar, host.firstChild);
})();
