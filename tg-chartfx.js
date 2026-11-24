/* Admin chart motion (additive, presentation only): KPI count-up, bars that grow, and a "Views by page" bar chart built from the Analytics table (real rows only).
   Respects reduced-motion. Remove the <script> tag to revert. */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches, seen = {}, host = null, busy = false;
  var css = document.createElement('style');
  css.textContent = '@keyframes fxgrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}@keyframes fxw{from{width:0}}.bars div{transform-origin:bottom;animation:fxgrow .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*18ms)}.fxc{margin:0 0 14px}.fxc h3{margin:0 0 10px}.fxr{display:grid;grid-template-columns:minmax(80px,32%) 1fr auto;gap:10px;align-items:center;margin:7px 0;font-size:.9rem}.fxr span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fxr i{display:block;height:12px;border-radius:6px;background:var(--gold,#c9a45c);width:var(--w);animation:fxw .8s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*60ms)}.fxr b{font-variant-numeric:tabular-nums}@media(prefers-reduced-motion:reduce){.bars div,.fxr i{animation:none!important}}';
  document.head.appendChild(css);
  function count(el, key) {
    var t = el.textContent.trim(), m = t.match(/^([^\d-]*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!m || t.length > 28 || el.getAttribute('data-fx') === t) return;
    el.setAttribute('data-fx', t); if (seen[key] === t) return; seen[key] = t;
    var raw = m[2], dec = (raw.split('.')[1] || '').length, comma = raw.indexOf(',') > -1, to = parseFloat(raw.replace(/,/g, '')), t0 = performance.now(), D = 700;
    if (!isFinite(to) || to === 0 || RM) return;
    function fmt(v) { var s = v.toFixed(dec); if (comma) { var p = s.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); s = p.join('.'); } return m[1] + s + m[3]; }
    (function step(n) { var k = Math.min(1, (n - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = k >= 1 ? t : fmt(to * e); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  function run() {
    if (!host || busy) return; busy = true;
    try {
      host.querySelectorAll('.kpi').forEach(function (k, i) { var b = k.querySelector('b'), s = k.querySelector('span'); if (b) count(b, 'a:' + (s ? s.textContent : i)); });
      host.querySelectorAll('.card > small + h3').forEach(function (h, i) { count(h, 't:' + h.previousElementSibling.textContent); });
      host.querySelectorAll('.bars').forEach(function (b) { Array.prototype.forEach.call(b.children, function (c, i) { c.style.setProperty('--i', i); }); });
      host.querySelectorAll('table').forEach(function (tb) {
        if (tb.getAttribute('data-fxc') || tb.parentNode.previousElementSibling && tb.parentNode.previousElementSibling.classList.contains('fxc')) return;
        var th = [].map.call(tb.rows[0] ? tb.rows[0].cells : [], function (c) { return c.textContent.trim(); });
        if (th[0] !== 'Page' || th[1] !== 'Views') return; tb.setAttribute('data-fxc', 1);
        var rows = [].slice.call(tb.rows, 1).map(function (r) { return [r.cells[0].textContent.trim(), parseFloat(r.cells[1].textContent.replace(/,/g, ''))]; }).filter(function (r) { return r[1] > 0; }).slice(0, 8);
        if (!rows.length) return; var mx = rows[0][1], d = document.createElement('div'); d.className = 'card fxc';
        d.innerHTML = '<h3>Views by page</h3>' + rows.map(function (r, i) { var s = document.createElement('span'); s.textContent = r[0]; return '<div class="fxr" style="--i:' + i + '"><span>' + s.innerHTML + '</span><i style="--w:' + Math.max(2, r[1] / mx * 100) + '%"></i><b>' + r[1] + '</b></div>'; }).join('');
        (tb.closest('.card') || tb).insertAdjacentElement('beforebegin', d);
      });
    } finally { busy = false; }
  }
  function start() {
    host = document.getElementById('v') || document.getElementById('view'); if (!host) return setTimeout(start, 500);
    var tm; new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(run, 60); }).observe(host, { childList: true, subtree: true });
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#nav,.tabs,[data-t]')) { seen = {}; } }, true); run();
  }
  start();
})();
