/* TELEGANT - page on/off. Reads site_pages (managed in Admin > Pages). Hidden pages show "not available", are set to noindex and their links disappear from menu and footer. */
(function () {
  var f = (location.pathname.split('/').pop() || 'index.html'), TG = window.TG; if (!TG || !TG.sb) return;
  var off = null;
  function hideLinks() {
    if (!off) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = (a.getAttribute('href') || '').split('#')[0].split('?')[0].split('/').pop();
      if (off[h] && !a.dataset.tgg) { a.dataset.tgg = 1; var li = a.closest('li'); (li || a).style.display = 'none'; }
    });
  }
  TG.sb.from('site_pages').select('file,active').then(function (r) {
    if (!r.data) return; off = {}; r.data.forEach(function (p) { if (!p.active) off[p.file] = 1; });
    if (!Object.keys(off).length) return;
    var go = function () {
      hideLinks(); new MutationObserver(hideLinks).observe(document.body, { childList: true, subtree: true });
      if (off[f]) {
        var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
        var ar = document.documentElement.lang === 'ar', c = document.querySelector('main') || document.body;
        document.title = 'TELEGANT';
        Array.prototype.slice.call(document.body.children).forEach(function (n) { if (n.tagName !== 'SCRIPT' && n.tagName !== 'NAV' && n.tagName !== 'HEADER' && n.tagName !== 'FOOTER' && !/navbar|nav|footer/i.test(n.className + n.id)) n.style.display = 'none'; });
        var d = document.createElement('div'); d.style.cssText = 'max-width:520px;margin:90px auto;padding:0 20px;text-align:center;font-family:inherit';
        d.innerHTML = '<h1 style="font-size:26px;margin-bottom:12px">' + (ar ? 'هذه الصفحة غير متاحة' : 'This page is not available') + '</h1><p style="margin-bottom:22px">' + (ar ? 'يمكنك متابعة التسوق من الصفحة الرئيسية.' : 'You can keep browsing from the home page.') + '</p><a href="' + (off['index.html'] ? 'shop.html' : 'index.html') + '" style="display:inline-block;padding:12px 26px;border:1px solid currentColor;border-radius:8px;text-decoration:none;color:inherit">' + (ar ? 'الصفحة الرئيسية' : 'Go to home page') + '</a>';
        document.body.appendChild(d);
      }
    };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  });
})();
