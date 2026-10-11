/* TELEGANT – branded, animated pop-ups (replaces the browser's alert/confirm) + welcome / thank-you screens. Follows the site language. */
(function () {
  var TG = window.TG; if (!TG || TG.uiOn) return; TG.uiOn = 1;
  var STR = { en: { ok: 'OK', cancel: 'Cancel', yes: 'Yes, continue' }, ar: { ok: 'حسناً', cancel: 'إلغاء', yes: 'نعم، متابعة' } };
  TG.lang = function () { var l = ''; try { l = localStorage.getItem('telegant-lang'); } catch (e) {} l = l || document.documentElement.lang || 'en'; return l === 'ar' ? 'ar' : 'en'; };
  function css() {
    if (document.getElementById('tg-ui-css')) return; var s = document.createElement('style'); s.id = 'tg-ui-css';
    s.textContent = '.tgu{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(8,6,3,.72);backdrop-filter:blur(7px);animation:tguf .25s both;overflow:hidden}.tgu.out{animation:tguo .22s forwards}' +
      '.tgu-box{position:relative;width:min(410px,90vw);padding:28px 26px 24px;text-align:center;background:linear-gradient(160deg,#1c150b,#0d0a06);color:#f1e9d6;border:1px solid #c9a24b;border-radius:20px;box-shadow:0 20px 70px rgba(0,0,0,.6),0 0 60px rgba(201,162,75,.22);animation:tgup .55s cubic-bezier(.2,1.3,.4,1) both;font:15px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}' +
      'html[data-tg-theme=light] .tgu-box{background:linear-gradient(160deg,#fffaf0,#f3e8cc);color:#2a2114;border-color:#b8892f}' +
      '.tgu-logo{height:46px;margin-bottom:4px;filter:drop-shadow(0 0 8px rgba(201,162,75,.5))}.tgu-ic{width:62px;height:62px;margin:2px auto 8px;display:block}' +
      '.tgu-ic circle{fill:none;stroke:#c9a24b;stroke-width:2.5;stroke-dasharray:151;stroke-dashoffset:151;animation:tgud .8s .15s forwards}' +
      '.tgu-ic path{fill:none;stroke:#e8cf86;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:60;stroke-dashoffset:60;animation:tgud .5s .8s forwards}' +
      'html[data-tg-theme=light] .tgu-ic path{stroke:#8a6a1f}.tgu h2{margin:4px 0 6px;font:600 25px Georgia,serif;color:#e8cf86;animation:tgur .55s .45s both}html[data-tg-theme=light] .tgu h2{color:#8a6a1f}' +
      '.tgu-msg{margin:0 0 18px;animation:tgur .5s .4s both;white-space:pre-line;word-break:break-word}.tgu-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;animation:tgur .5s .6s both}' +
      '.tgu-btns button,.tgu-btns a{padding:10px 24px;border-radius:99px;border:1px solid #c9a24b;background:none;color:#e8cf86;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;transition:transform .15s,background .2s}' +
      'html[data-tg-theme=light] .tgu-btns button,html[data-tg-theme=light] .tgu-btns a{color:#8a6a1f}.tgu-btns .p{background:#c9a24b!important;color:#16110a!important}.tgu-btns button:hover,.tgu-btns a:hover{transform:translateY(-2px)}' +
      '.tgu i{position:absolute;top:-24px;width:9px;height:15px;border-radius:2px;animation:tgufall linear infinite}' +
      '@keyframes tguf{from{opacity:0}}@keyframes tguo{to{opacity:0}}@keyframes tgup{from{transform:scale(.45) translateY(30px);opacity:0}}@keyframes tgud{to{stroke-dashoffset:0}}@keyframes tgur{from{transform:translateY(14px);opacity:0}}@keyframes tgufall{to{transform:translateY(112vh) rotate(720deg)}}' +
      '@media(prefers-reduced-motion:reduce){.tgu i{display:none}.tgu-box,.tgu-ic circle,.tgu-ic path{animation:none;stroke-dashoffset:0}}';
    document.head.appendChild(s);
  }
  var ICON = { ok: 'M14 27l8 8 16-17', warn: 'M26 14v17M26 37v1', ask: 'M20 20c0-8 12-8 12 0 0 5-6 5-6 11M26 37v1' };
  function modal(o) {
    css();
    return new Promise(function (res) {
      var ar = TG.lang() === 'ar', d = document.createElement('div'); d.className = 'tgu';
      d.innerHTML = '<div class="tgu-box" dir="' + (ar ? 'rtl' : 'ltr') + '"><img class="tgu-logo" src="MEBG-GOLDEN.png" alt=""><svg class="tgu-ic" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="' + ICON[o.icon] + '"/></svg><p class="tgu-msg"></p><div class="tgu-btns"></div></div>';
      d.querySelector('.tgu-msg').textContent = o.msg;
      var close = function (v) { document.removeEventListener('keydown', key); d.classList.add('out'); setTimeout(function () { d.remove(); res(v); }, 220); };
      var key = function (e) { if (e.key === 'Escape') close(o.buttons.length > 1 ? false : true); };
      o.buttons.forEach(function (b) { var e = document.createElement('button'); e.textContent = b.t; if (b.p) e.className = 'p'; e.onclick = function () { close(b.v); }; d.querySelector('.tgu-btns').appendChild(e); });
      document.addEventListener('keydown', key); document.body.appendChild(d); var f = d.querySelector('.p') || d.querySelector('button'); if (f) f.focus();
    });
  }
  TG.say = function (m) {
    var s = String(m == null ? '' : m), ok = /^(saved|added|created|sent|delivered|page created|product page|reset link|opening hours saved|thank)|✔|✓/i.test(s), L = STR[TG.lang()];
    return modal({ msg: s, icon: ok ? 'ok' : 'warn', buttons: [{ t: L.ok, v: true, p: true }] });
  };
  TG.ask = function (m) { var L = STR[TG.lang()]; return modal({ msg: String(m), icon: 'ask', buttons: [{ t: L.cancel, v: false }, { t: L.yes, v: true, p: true }] }); };
  window.alert = function (m) { TG.say(m); };

  TG.celebrate = function (o) {                                   // welcome + thank-you: confetti, drawn tick, logo
    css();
    var d = document.createElement('div'), h = ''; d.className = 'tgu';
    for (var i = 0; i < 48; i++) h += '<i style="left:' + (Math.random() * 100) + '%;background:' + ['#e8cf86', '#c9a24b', '#fff', '#b8892f'][i % 4] + ';animation-delay:' + (Math.random() * 1.4) + 's;animation-duration:' + (2.6 + Math.random() * 2.2) + 's"></i>';
    d.innerHTML = h + '<div class="tgu-box" dir="' + (TG.lang() === 'ar' ? 'rtl' : 'ltr') + '"><img class="tgu-logo" src="MEBG-GOLDEN.png" alt=""><svg class="tgu-ic" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="' + ICON.ok + '"/></svg><h2></h2><p class="tgu-msg"></p><div class="tgu-btns"></div></div>';
    d.querySelector('h2').textContent = o.title; d.querySelector('.tgu-msg').textContent = o.text || '';
    var close = function () { d.classList.add('out'); setTimeout(function () { d.remove(); }, 220); };
    (o.buttons || []).forEach(function (b, k) { var e = document.createElement(b.href ? 'a' : 'button'); e.textContent = b.t; if (b.href) e.href = b.href; if (k === 0) e.className = 'p'; e.onclick = b.fn ? function () { close(); b.fn(); } : (b.href ? null : close); d.querySelector('.tgu-btns').appendChild(e); });
    d.addEventListener('click', function (e) { if (e.target === d && !o.sticky) close(); });
    document.body.appendChild(d); if (o.auto) setTimeout(close, o.auto);
  };
  function welcome() {
    var n = sessionStorage.tg_welcome2; if (!n) return; sessionStorage.removeItem('tg_welcome2'); var ar = TG.lang() === 'ar';
    TG.celebrate({ title: ar ? 'أهلاً بك، ' + n + '!' : 'Welcome, ' + n + '!', text: ar ? 'سعداء بوجودك في TELEGANT.' : 'So glad to have you at TELEGANT.', buttons: [{ t: ar ? 'ابدأ التسوق' : 'Start shopping' }], auto: 5200 });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', welcome); else welcome();
})();
