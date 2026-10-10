/* TELEGANT live chat widget – loaded automatically by tg-core.js. Shows only when the owner turns chat ON. */
(function () {
  var TG = window.TG; if (!TG || TG.chatOn) return; TG.chatOn = 1;
  var sb = TG.sb, ar = document.documentElement.lang === 'ar', cur = null, timer = null, note = false, lastN = -1;
  var L = ar ? { t: 'تحدث معنا', ph: 'اكتب رسالتك…', send: 'إرسال', end: 'إنهاء المحادثة', wait: 'نرد عليك خلال لحظات…', w: 'تتحدث مع ', login: 'سجّل الدخول للدردشة معنا', lb: 'تسجيل الدخول', ended: 'انتهت المحادثة. أرسلنا لك استبياناً قصيراً على بريدك.', first: 'اكتب رسالتك وسيرد عليك أحد أفراد الفريق.', conf: 'إنهاء المحادثة؟' }
    : { t: 'Chat with us', ph: 'Type your message…', send: 'Send', end: 'End chat', wait: 'Waiting for an agent…', w: 'You are chatting with ', login: 'Please sign in to chat with us', lb: 'Sign in', ended: 'Chat ended. We emailed you a short survey.', first: 'Write your message and a team member will reply.', conf: 'End this chat?' };
  var $ = function (i) { return document.getElementById(i); };

  sb.from('site_settings').select('value').eq('key', 'chat_enabled').maybeSingle().then(function (r) {
    if (r.data && r.data.value && r.data.value.on) mount();
  });

  function mount() {
    var st = document.createElement('style');
    st.textContent = '#tgc-btn{position:fixed;inset-block-end:18px;inset-inline-end:18px;z-index:9000;width:56px;height:56px;border-radius:50%;border:0;background:#c9a24b;color:#16110a;font-size:26px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.4)}' +
      '#tgc-box{position:fixed;inset-block-end:86px;inset-inline-end:18px;z-index:9000;width:min(340px,calc(100vw - 28px));height:min(460px,70vh);display:none;flex-direction:column;background:#17120a;color:#f1e9d6;border:1px solid #c9a24b;border-radius:14px;overflow:hidden;font:14px/1.45 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5)}' +
      '#tgc-box .h{display:flex;justify-content:space-between;padding:12px 14px;background:#c9a24b;color:#16110a;font-weight:700}#tgc-x{cursor:pointer}' +
      '#tgc-m{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}#tgc-s{padding:4px 12px;font-size:12px;opacity:.75}' +
      '.tgc-b{max-width:80%;padding:8px 11px;border-radius:12px;word-break:break-word}.tgc-c{align-self:flex-end;background:#c9a24b;color:#16110a}.tgc-a{align-self:flex-start;background:#2a2114}.tgc-y{align-self:center;font-size:12px;opacity:.7}' +
      '#tgc-box .f{display:flex;gap:6px;padding:10px;border-top:1px solid #3a2e1a}#tgc-i{flex:1;padding:9px;border-radius:8px;border:1px solid #3a2e1a;background:#0d0a06;color:#f1e9d6;font:inherit}' +
      '#tgc-g{padding:0 14px;border:0;border-radius:8px;background:#c9a24b;color:#16110a;font-weight:700;cursor:pointer}#tgc-e{display:block;text-align:center;padding:0 0 8px;font-size:12px;color:#e8cf86;cursor:pointer}';
    document.head.appendChild(st);
    var b = document.createElement('button'); b.id = 'tgc-btn'; b.setAttribute('aria-label', L.t); b.textContent = '💬';
    var x = document.createElement('div'); x.id = 'tgc-box';
    x.innerHTML = '<div class="h"><span>' + L.t + '</span><span id="tgc-x">✕</span></div><div id="tgc-m"></div><div id="tgc-s"></div><div class="f"><input id="tgc-i" maxlength="500" placeholder="' + L.ph + '"><button id="tgc-g">' + L.send + '</button></div><a id="tgc-e">' + L.end + '</a>';
    document.body.appendChild(b); document.body.appendChild(x);
    b.onclick = function () { var o = x.style.display === 'flex'; x.style.display = o ? 'none' : 'flex'; clearInterval(timer); if (!o) { load(); timer = setInterval(load, 4000); } };
    $('tgc-x').onclick = function () { x.style.display = 'none'; clearInterval(timer); };
    $('tgc-g').onclick = send; $('tgc-i').onkeydown = function (e) { if (e.key === 'Enter') send(); };
    $('tgc-e').onclick = end;
  }
  function bubble(cls, text) { var d = document.createElement('div'); d.className = 'tgc-b ' + cls; d.textContent = text; return d; }
  async function load() {
    var m = $('tgc-m'), s = (await sb.auth.getSession()).data.session;
    if (!s) {
      m.innerHTML = ''; var p = bubble('tgc-y', L.login), a = document.createElement('a');
      a.textContent = L.lb; a.href = 'login.html?next=' + encodeURIComponent(location.href); a.style.cssText = 'align-self:center;color:#e8cf86;font-weight:700';
      m.appendChild(p); m.appendChild(a); $('tgc-s').textContent = ''; lastN = -1; return;
    }
    var q = (await sb.from('chats').select('*').eq('user_id', s.user.id).order('id', { ascending: false }).limit(1)).data, c = q && q[0];
    if (c && c.status === 'closed') { if (cur === c.id) note = true; cur = null; c = null; lastN = -1; }
    if (!c) { m.innerHTML = ''; m.appendChild(bubble('tgc-y', note ? L.ended : L.first)); $('tgc-s').textContent = ''; return; }
    cur = c.id; note = false;
    var msgs = (await sb.from('chat_messages').select('*').eq('chat_id', c.id).order('id')).data || [];
    if (msgs.length !== lastN) {
      lastN = msgs.length; m.innerHTML = '';
      msgs.forEach(function (x) { m.appendChild(bubble(x.sender_role === 'customer' ? 'tgc-c' : x.sender_role === 'system' ? 'tgc-y' : 'tgc-a', x.body)); });
      m.scrollTop = m.scrollHeight;
    }
    $('tgc-s').textContent = c.status === 'claimed' ? L.w + (c.claimed_name || '') : L.wait;
  }
  async function send() {
    var i = $('tgc-i'), v = i.value.trim(); if (!v) return; i.value = '';
    try {
      if (cur) { var r = await sb.rpc('chat_send', { p_chat: cur, p_body: v }); if (r.error) throw r.error; }
      else { var r2 = await sb.rpc('chat_start', { p_body: v }); if (r2.error) throw r2.error; cur = r2.data; lastN = -1; sb.functions.invoke('swift-action', { body: { action: 'chat_new', chat_id: cur } }); }
    } catch (e) { alert(e.message || e); i.value = v; }
    load();
  }
  async function end() {
    if (!cur || !confirm(L.conf)) return;
    var id = cur, r = await sb.rpc('chat_close', { p_chat: id }); if (r.error) return alert(r.error.message);
    sb.functions.invoke('swift-action', { body: { action: 'chat_close', chat_id: id } }); note = true; cur = null; lastN = -1; load();
  }
})();
