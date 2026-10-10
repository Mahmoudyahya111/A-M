/* TELEGANT core. Include on EVERY page, after the supabase-js script:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
   <script src="tg-core.js"></script> */
(function () {
  var CFG = { url: 'https://YOUR-PROJECT-REF.supabase.co', key: 'YOUR-ANON-PUBLIC-KEY' };
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
})();
