/* TELEGANT core. Include on EVERY page, after the supabase-js script:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
   <script src="tg-core.js"></script> */
(function () {
  if (window.TG) return;
  var CFG = { url: 'https://vjnaaubbxpqlolvgtweo.supabase.co', key: 'sb_publishable_JOuhaVO8GiMUGKfur_5Thg_4F-jfJtS' };
  var OWNER = 'mahmoudyahya66@gmail.com';

  /* ---- theme -> sets <html data-tg-theme="dark|light"> for tg-theme.css ---- */
  function detect() {
    var h = document.documentElement, b = document.body || h, d;
    var a = (h.getAttribute('data-theme') || b.getAttribute('data-theme') || '').toLowerCase();
    var c = (h.className + ' ' + b.className).toLowerCase();
    if (/dark/.test(a) || /dark/.test(c)) d = 1;
    else if (/light/.test(a) || /light/.test(c)) d = 0;
    else { // fall back to text colour: light text = dark theme
      var m = (getComputedStyle(b).color.match(/\d+/g) || [0, 0, 0]).map(Number);
      d = (m[0] * 299 + m[1] * 587 + m[2] * 114) / 1000 > 140 ? 1 : 0;
    }
    h.setAttribute('data-tg-theme', d ? 'dark' : 'light');
  }
  detect();
  document.addEventListener('DOMContentLoaded', function () {
    detect();
    var o = new MutationObserver(detect), opt = { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] };
    o.observe(document.documentElement, opt); o.observe(document.body, opt);
    document.addEventListener('click', function () { setTimeout(detect, 60); });
  });

  /* ---- Supabase ---- */
  var sb = window.supabase.createClient(CFG.url, CFG.key);
  var TG = (window.TG = { sb: sb, OWNER: OWNER });

  TG.signUp = function (email, password, name, role) {
    return sb.auth.signUp({ email: email, password: password, options: {
      data: { full_name: name, requested_role: role },
      emailRedirectTo: new URL('login.html', location.href).href } });
  };
  TG.signIn = function (email, password) { return sb.auth.signInWithPassword({ email: email, password: password }); };
  TG.signOut = function () { return sb.auth.signOut(); };
  TG.resetPassword = function (email) {
    return sb.auth.resetPasswordForEmail(email, { redirectTo: new URL('login.html', location.href).href });
  };
  TG.profile = async function () {
    var r = await sb.auth.getUser(); if (!r.data.user) return null;
    var p = await sb.from('profiles').select('*').eq('id', r.data.user.id).single();
    return p.data;
  };
  /* Call from your checkout. o = {customer_name, phone, email, address, payment_method,
     items:[...], total, delivery_date}. Returns the order number, e.g. "TG-10001". */
  TG.placeOrder = async function (o) {
    var r = await sb.rpc('place_order', { p: o });
    if (r.error) throw r.error; return r.data;
  };
  /* Call from Survey.html: TG.sendFeedback('Name', 'text', 5) */
  TG.sendFeedback = function (author, body, rating) {
    return sb.from('reviews').insert({ kind: 'feedback', author: author, body: body, rating: rating || null, visible: false });
  };

  /* ---- visitor tracking (skipped on admin/login pages) ---- */
  var page = location.pathname.split('/').pop() || 'index.html';
  if (page !== 'admin.html' && page !== 'login.html') {
    var sid = sessionStorage.tg_sid || (sessionStorage.tg_sid = crypto.randomUUID());
    var vid = localStorage.tg_vid || (localStorage.tg_vid = crypto.randomUUID());
    var ev = function (t, target) {
      sb.from('page_events').insert({ session_id: sid, visitor_id: vid, page: page, event_type: t, target: target || null }).then(function () {});
    };
    ev('view');
    var eng = 0, engage = function () { if (!eng) { eng = 1; ev('engaged'); } };
    setTimeout(engage, 15000); // stayed 15s = actually reviewing
    addEventListener('scroll', function () { if (scrollY > innerHeight * 0.4) engage(); }, { passive: true });
    document.addEventListener('click', function (e) { // clicked out of the site
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin) ev('exit_click', a.href.slice(0, 200));
    });
  }

  /* ---- celebration overlay (welcome + thank-you) ---- */
  TG.celebrate = function (o) {
    if (!document.getElementById('tg-fx')) {
      var s = document.createElement('style'); s.id = 'tg-fx';
      s.textContent = '.tgfx{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(10,8,5,.8);backdrop-filter:blur(6px);animation:tgfade .35s both;overflow:hidden}' +
        '.tgfx i{position:absolute;top:-24px;width:9px;height:15px;border-radius:2px;animation:tgfall linear infinite}' +
        '.tgfx-box{position:relative;background:linear-gradient(160deg,#1c150b,#0d0a06);border:1px solid #c9a24b;border-radius:20px;padding:34px 30px;max-width:380px;width:88%;text-align:center;color:#f1e9d6;box-shadow:0 0 60px rgba(201,162,75,.35);animation:tgpop .7s cubic-bezier(.2,1.4,.4,1) both}' +
        '.tgfx-ck{width:84px;height:84px;margin-bottom:8px}.tgfx-ck circle{fill:none;stroke:#e8cf86;stroke-width:2.5;stroke-dasharray:151;stroke-dashoffset:151;animation:tgdraw .8s .25s forwards}' +
        '.tgfx-ck path{fill:none;stroke:#e8cf86;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:40;stroke-dashoffset:40;animation:tgdraw .5s .9s forwards}' +
        '.tgfx h2{margin:6px 0;font:600 26px Georgia,serif;color:#e8cf86;animation:tgrise .6s .5s both}.tgfx p{margin:0 0 16px;opacity:.9;animation:tgrise .6s .7s both;line-height:1.5}' +
        '.tgfx-b{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;animation:tgrise .6s .9s both}.tgfx-b a,.tgfx-b button{padding:10px 16px;border-radius:99px;border:1px solid #c9a24b;background:none;color:#e8cf86;font:inherit;font-weight:600;cursor:pointer;text-decoration:none}' +
        '.tgfx-b .p{background:#c9a24b;color:#16110a}' +
        '@keyframes tgfade{from{opacity:0}}@keyframes tgpop{from{transform:scale(.4);opacity:0}}@keyframes tgdraw{to{stroke-dashoffset:0}}@keyframes tgrise{from{transform:translateY(14px);opacity:0}}' +
        '@keyframes tgfall{to{transform:translateY(112vh) rotate(720deg)}}@media(prefers-reduced-motion:reduce){.tgfx i{display:none}}';
      document.head.appendChild(s);
    }
    var d = document.createElement('div'), h = ''; d.className = 'tgfx';
    for (var i = 0; i < 48; i++) h += '<i style="left:' + (Math.random() * 100) + '%;background:' + ['#e8cf86', '#c9a24b', '#fff', '#b8892f'][i % 4] + ';animation-delay:' + (Math.random() * 1.4) + 's;animation-duration:' + (2.6 + Math.random() * 2.2) + 's"></i>';
    d.innerHTML = h + '<div class="tgfx-box"><svg viewBox="0 0 52 52" class="tgfx-ck"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg><h2></h2><p></p><div class="tgfx-b"></div></div>';
    d.querySelector('h2').textContent = o.title; d.querySelector('p').textContent = o.text || '';
    var close = function () { d.remove(); };
    (o.buttons || []).forEach(function (b, k) {
      var e = document.createElement(b.href ? 'a' : 'button'); e.textContent = b.t; if (b.href) e.href = b.href; if (k === 0) e.className = 'p';
      e.onclick = b.fn ? function () { close(); b.fn(); } : null; d.querySelector('.tgfx-b').appendChild(e);
    });
    d.addEventListener('click', function (e) { if (e.target === d && !o.sticky) close(); });
    document.body.appendChild(d); if (o.auto) setTimeout(close, o.auto);
  };
  /* welcome popup right after a customer signs in (login.html sets the flag) */
  document.addEventListener('DOMContentLoaded', function () {
    var n = sessionStorage.tg_welcome; if (!n) return; sessionStorage.removeItem('tg_welcome');
    var ar = document.documentElement.lang === 'ar';
    TG.celebrate({ title: ar ? 'أهلاً بك، ' + n + '!' : 'Welcome, ' + n + '!', text: ar ? 'سعداء بوجودك في TELEGANT.' : 'So glad to have you at TELEGANT.',
      buttons: [{ t: ar ? 'ابدأ التسوق' : 'Start shopping' }], auto: 5200 });
  });
     if (!/^(admin|staff|login|chat-admin|survey-chat|my-orders)\.html$/.test(page)) {
       var cs = document.createElement('script'); cs.src = 'tg-chat.js'; cs.defer = true; document.head.appendChild(cs);
     }
})();
