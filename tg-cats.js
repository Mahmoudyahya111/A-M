/* TELEGANT – shows active categories + sub-categories as a bar on the shop page. Load AFTER tg-core.js. */
(async function () {
  var TG = window.TG; if (!TG || TG.catsOn) return; TG.catsOn = 1;
  var host = document.getElementById('products-container');
  if (!host || document.getElementById('cat-grid')) return;               // shop page only (catalog.html has its own bar)
  var ar = document.documentElement.lang === 'ar', sb = TG.sb;
  var r = await Promise.all([
    sb.from('categories').select('*').eq('active', true).order('name_en'),
    sb.from('pages').select('slug').eq('kind', 'category').eq('published', true)]);
  var ok = {}; (r[1].data || []).forEach(function (p) { ok[p.slug] = 1; });
  var C = (r[0].data || []).filter(function (c) { return ok['c-' + c.slug]; });
  var tops = C.filter(function (c) { return !c.parent_id; });
  if (!tops.length) return;
  var nm = function (c) { return (ar && c.name_ar) || c.name_en; };
  var link = function (c, sub) {
    var a = document.createElement('a'); a.href = 'catalog.html?c=' + encodeURIComponent(c.slug); a.textContent = nm(c);
    a.style.cssText = 'padding:' + (sub ? '4px 12px' : '7px 18px') + ';border:1px solid #c9a24b;border-radius:99px;text-decoration:none;color:inherit;font-size:' + (sub ? '.85em' : '1em') + ';' + (sub ? 'opacity:.85' : 'font-weight:700');
    return a;
  };
  var bar = document.createElement('div');
  bar.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:10px 22px;margin:0 auto 22px;padding:0 12px;max-width:1000px';
  tops.forEach(function (t) {
    var g = document.createElement('div'); g.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center';
    g.appendChild(link(t, false));
    C.filter(function (c) { return c.parent_id === t.id; }).forEach(function (s) { g.appendChild(link(s, true)); });
    bar.appendChild(g);
  });
  host.insertBefore(bar, host.firstChild);
})();
