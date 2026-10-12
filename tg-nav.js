/* TELEGANT – adds published pages marked "Show in menu" to the website menu. Loaded automatically by tg-chat.js. */
(async function () {
  var TG = window.TG; if (!TG || TG.navOn) return; TG.navOn = 1;
  var ul = document.querySelector('.navbar-links'); if (!ul) return;
  var ar = document.documentElement.lang === 'ar';
  var r = await Promise.all([
    TG.sb.from('pages').select('slug,title,title_ar,kind,target,sort').eq('in_menu', true).eq('published', true).order('sort'),
    TG.sb.from('categories').select('slug').eq('active', true)]);
  var okCat = {}; (r[1].data || []).forEach(function (c) { okCat[c.slug] = 1; });
  var here = location.pathname.split('/').pop() + location.search;
  [['size-guide.html', 'Size guide', 'دليل المقاسات'], ['colors.html', 'Colour guide', 'دليل الألوان']].forEach(function (g) {
    var li = document.createElement('li'), a = document.createElement('a'); a.href = g[0]; a.textContent = ar ? g[2] : g[1]; if (here.indexOf(g[0]) === 0) a.className = 'active'; li.appendChild(a); ul.appendChild(li);
  });
  (r[0].data || []).forEach(function (p) {
    if (p.kind === 'category' && !okCat[p.target]) return;
    var href = p.kind === 'category' ? 'catalog.html?c=' + p.target : p.kind === 'product' ? 'catalog.html?p=' + p.target : 'catalog.html?page=' + p.slug;
    var li = document.createElement('li'), a = document.createElement('a');
    a.href = href; a.textContent = (ar && p.title_ar) || p.title; if (here === href) a.className = 'active';
    li.appendChild(a); ul.appendChild(li);
  });
})();
