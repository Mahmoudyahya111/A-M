/* TELEGANT – colour pairing rules (menswear, shirt -> trousers + shoes). Score 5 = best, 1 = weak. */
window.TGColors = (function () {
  var HEX = { navy: '#1f2a44', white: '#f5f5f2', black: '#121212', grey: '#8a8d91', red: '#b3262c', charcoal: '#3a3d42', lightgrey: '#c9ccd0', beige: '#d8c3a5', khaki: '#b5a27a', olive: '#5f6b3a', tan: '#b08d57', brown: '#5b3a29', burgundy: '#6d1a2a', denim: '#2b3f5e', lightdenim: '#6f8fb5', cream: '#efe6d2', royalblue: '#2a4fb0', skyblue: '#8fb8e0', forest: '#2e4a3a', teal: '#1f6f73', purple: '#5b3a8a', pink: '#e7a1b0', orange: '#d9722a', mustard: '#d4a017' };
  var NAME = { navy: ['Navy', 'كحلي'], white: ['White', 'أبيض'], black: ['Black', 'أسود'], grey: ['Grey', 'رمادي'], red: ['Red', 'أحمر'], charcoal: ['Charcoal', 'فحمي'], lightgrey: ['Light grey', 'رمادي فاتح'], beige: ['Beige', 'بيج'], khaki: ['Khaki', 'كاكي'], olive: ['Olive', 'زيتي'], tan: ['Tan', 'جملي فاتح'], brown: ['Brown', 'بني'], burgundy: ['Burgundy', 'عنابي'], denim: ['Dark denim', 'جينز غامق'], lightdenim: ['Light denim', 'جينز فاتح'], cream: ['Cream', 'كريمي'], royalblue: ['Royal blue', 'أزرق ملكي'], skyblue: ['Sky blue', 'أزرق سماوي'], forest: ['Forest green', 'أخضر غامق'], teal: ['Teal', 'أخضر مزرق'], purple: ['Purple', 'بنفسجي'], pink: ['Pink', 'وردي'], orange: ['Orange', 'برتقالي'], mustard: ['Mustard', 'خردلي'] };
  var PANTS = { denim: ['jeans', 'جينز'], lightdenim: ['jeans', 'جينز'] };
  var SHOES = { white: ['sneakers', 'حذاء رياضي'], grey: ['sneakers', 'حذاء رياضي'], black: ['shoes', 'حذاء'], navy: ['suede shoes', 'حذاء سويد'], tan: ['leather shoes', 'حذاء جلد'], brown: ['leather shoes', 'حذاء جلد'], beige: ['suede shoes', 'حذاء سويد'] };
  var R = {
    white: { p: { navy: 5, charcoal: 5, beige: 5, khaki: 5, denim: 5, olive: 4, black: 4, lightdenim: 4, brown: 3 }, s: { white: 5, tan: 5, brown: 4, black: 4, navy: 3 }, x: [],
      tip: ['White works with everything. Use texture or a darker bottom so the look has contrast, and avoid head-to-toe white unless the fabrics differ.', 'الأبيض يناسب كل شيء. اختر بنطلوناً أغمق أو بقوام مختلف لتحصل على تباين، وتجنّب الأبيض الكامل إلا مع اختلاف الأقمشة.'] },
    black: { p: { white: 5, charcoal: 4, black: 4, lightgrey: 4, denim: 4, beige: 4, khaki: 3, olive: 3, burgundy: 3 }, s: { black: 5, white: 5, grey: 4, tan: 2, brown: 2 }, x: ['navy'],
      tip: ['Black is strongest against light or neutral bottoms. All-black is sharp; keep shoes black or white. Avoid navy with black, the two look like a mismatch.', 'الأسود أقوى مع الألوان الفاتحة أو المحايدة. الأسود الكامل أنيق؛ اجعل الحذاء أسود أو أبيض. تجنّب الكحلي مع الأسود.'] },
    navy: { p: { beige: 5, khaki: 5, lightgrey: 5, charcoal: 4, grey: 4, white: 4, olive: 4, tan: 4, denim: 3, black: 2 }, s: { tan: 5, brown: 5, white: 5, grey: 3, navy: 3, black: 2 }, x: ['black', 'burgundy', 'red'],
      tip: ['Navy is a deep neutral. Warm neutrals (beige, khaki, tan) give the classic contrast. Black trousers with navy lack contrast, so avoid them.', 'الكحلي لون محايد عميق. الألوان الدافئة (بيج، كاكي، جملي) تعطي التباين الكلاسيكي. تجنّب البنطلون الأسود مع الكحلي.'] },
    grey: { p: { black: 5, navy: 5, white: 4, beige: 4, olive: 4, burgundy: 4, denim: 4, charcoal: 3, lightgrey: 2 }, s: { white: 5, black: 5, tan: 4, brown: 4, grey: 2 }, x: ['lightgrey'],
      tip: ['Mid grey is flexible. Pair it with dark or crisp light bottoms. Grey on a similar grey looks washed out.', 'الرمادي المتوسط مرن. اختر معه قطعاً غامقة أو فاتحة واضحة. الرمادي مع رمادي مشابه يبدو باهتاً.'] },
    red: { p: { black: 5, navy: 4, charcoal: 4, grey: 4, white: 4, denim: 4, beige: 3 }, s: { black: 5, white: 5, grey: 4, brown: 3 }, x: ['olive', 'burgundy', 'tan'],
      tip: ['Red is the statement piece, so keep the rest quiet: black, navy, grey or white. Avoid green or olive (clash) and burgundy (too close).', 'الأحمر هو القطعة المميزة، لذا اجعل الباقي هادئاً: أسود، كحلي، رمادي أو أبيض. تجنّب الأخضر والزيتي (تعارض) والعنابي (قريب جداً).'] }
  };
  var SHIRTS = ['navy', 'white', 'black', 'grey', 'red', 'charcoal', 'lightgrey', 'cream', 'beige', 'khaki', 'olive', 'forest', 'brown', 'burgundy', 'royalblue', 'skyblue', 'teal', 'purple', 'pink', 'orange', 'mustard', 'denim', 'lightdenim', 'tan'];
  var SYN = { gray: 'grey', 'dark blue': 'navy', darkblue: 'navy', 'light blue': 'skyblue', 'sky blue': 'skyblue', sky: 'skyblue', blue: 'royalblue', royal: 'royalblue', 'royal blue': 'royalblue', green: 'forest', 'dark green': 'forest', maroon: 'burgundy', wine: 'burgundy', yellow: 'mustard', 'mustard yellow': 'mustard', violet: 'purple', lilac: 'purple', rose: 'pink', ivory: 'cream', 'off white': 'cream', sand: 'beige', stone: 'beige', camel: 'tan', chocolate: 'brown', silver: 'lightgrey', 'light gray': 'lightgrey', 'light grey': 'lightgrey', 'dark gray': 'charcoal', 'dark grey': 'charcoal', turquoise: 'teal', coral: 'orange', 'أزرق': 'royalblue', 'سماوي': 'skyblue', 'أخضر': 'forest', 'أصفر': 'mustard', 'نبيتي': 'burgundy', 'زيتوني': 'olive', 'ذهبي': 'mustard' };
  function hsl(hex) { var r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = 0, h = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; } return { h: h, s: s, l: l }; }
  function gen(hex) {                                                     // colour-wheel rules for any other shirt colour
    var c = hsl(hex); if (c.s < 0.14) return c.l > 0.78 ? R.white : c.l < 0.2 ? R.black : R.grey;
    var warm = c.h < 70 || c.h >= 330, blue = c.h >= 190 && c.h < 260, green = c.h >= 70 && c.h < 170, dark = c.l < 0.35, light = c.l > 0.7, red = c.h >= 300 || c.h < 20;
    var p = { black: light ? 4 : 5, charcoal: 5, white: dark ? 5 : light ? 3 : 4, lightgrey: dark ? 4 : light ? 2 : 3, grey: light ? 3 : 4, navy: blue ? 2 : dark ? 3 : 4, denim: blue ? 3 : 4, lightdenim: blue ? 2 : dark ? 4 : 3, beige: warm ? 4 : 3, khaki: 3, cream: dark ? 4 : 3, olive: green ? 1 : warm ? 2 : 3, brown: warm && !light ? 2 : 3, burgundy: red ? 1 : 3, tan: 3 };
    var sh = { white: 5, black: 5, grey: 4, brown: warm ? 4 : 3, tan: light ? 4 : 3, navy: 2 }, x = Object.keys(p).filter(function (k) { return p[k] <= 1; });
    var tip = warm ? ['Warm colours look best against calm neutrals. Keep trousers and shoes simple so the shirt stays the focus.', 'الألوان الدافئة تظهر أجمل مع الألوان الهادئة. اجعل البنطلون والحذاء بسيطين ليبقى القميص هو المميز.']
      : green ? ['Greens pair well with earthy neutrals (beige, brown, khaki) and with dark denim. Avoid putting a second strong colour next to it.', 'الأخضر يناسب الألوان الترابية (بيج، بني، كاكي) والجينز الغامق. تجنّب إضافة لون قوي آخر بجانبه.']
      : ['Cool colours pair well with crisp neutrals: black, charcoal, white or denim. Brown shoes add a warm contrast.', 'الألوان الباردة تناسب الألوان الواضحة المحايدة: أسود، فحمي، أبيض أو جينز. الحذاء البني يضيف تبايناً دافئاً.'];
    return { p: p, s: sh, x: x, tip: tip };
  }
  function toHex(t) { return /^#[0-9a-f]{6}$/i.test(t) ? t.toLowerCase() : HEX[t] || null; }
  function rule(t) { return R[t] || (toHex(t) ? gen(toHex(t)) : null); }
  function nearest(hex) { var a = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)], best = 'grey', bd = 1e9;
    Object.keys(HEX).forEach(function (k) { var h = HEX[k], b = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], rb = (a[0] + b[0]) / 2, d = (2 + rb / 256) * Math.pow(a[0] - b[0], 2) + 4 * Math.pow(a[1] - b[1], 2) + (2 + (255 - rb) / 256) * Math.pow(a[2] - b[2], 2); if (d < bd) { bd = d; best = k; } }); return best; }
  function resolve(t) { var hex = toHex(t), custom = !HEX[t], key = custom ? nearest(hex) : t; return { hex: hex, key: key, custom: custom, name: NAME[key] }; }
  function parse(text) {                                                  // a colour name (English / Arabic / any CSS name) or a #hex
    var t = String(text || '').trim().toLowerCase(); if (!t) return null; if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(t)) { if (t.length === 4) t = '#' + t[1] + t[1] + t[2] + t[2] + t[3] + t[3]; return { hex: t, key: null }; }
    var k = Object.keys(NAME).filter(function (x) { return NAME[x][0].toLowerCase() === t || NAME[x][1] === t; })[0] || SYN[t]; if (k) return { hex: HEX[k], key: k };
    try { var d = document.createElement('div'); d.style.color = t; if (!d.style.color) return null; document.body.appendChild(d); var m = getComputedStyle(d).color.match(/\d+/g); d.remove();
      if (m) return { hex: '#' + [0, 1, 2].map(function (i) { return ('0' + (+m[i]).toString(16)).slice(-2); }).join(''), key: null }; } catch (e) {} return null;
  }
  function label(kind, k, i) { var n = NAME[k][i], x = (kind === 'pants' ? PANTS : SHOES)[k]; return i === 1 ? ((kind === 'pants' ? 'بنطلون ' : '') + n + (x ? ' ' + x[1] : (kind === 'shoes' ? ' حذاء' : ''))) : (n + ' ' + (x ? x[0] : (kind === 'pants' ? 'trousers' : 'shoes'))); }
  function top(map, n) { return Object.keys(map).map(function (k) { return { k: k, score: map[k] }; }).sort(function (a, b) { return b.score - a.score; }).slice(0, n || 5); }
  function combine(lists, n) {                                            // colours that suit EVERY shirt (lowest score decides)
    var keys = {}; lists.forEach(function (l) { for (var k in l) keys[k] = 1; });
    var out = Object.keys(keys).map(function (k) { var sc = lists.map(function (l) { return l[k] || 0; }), min = Math.min.apply(null, sc), avg = sc.reduce(function (a, b) { return a + b; }, 0) / sc.length; return { k: k, score: min, avg: avg }; });
    out = out.filter(function (x) { return x.score >= 3; }).sort(function (a, b) { return b.score - a.score || b.avg - a.avg; }); return out.slice(0, n || 5);
  }
  function advise(tops) {
    var known = tops.filter(function (t) { return rule(t); }), items = known.map(function (t) { var r = rule(t); return { top: t, pants: top(r.p), shoes: top(r.s), avoid: r.x, tip: r.tip }; });
    var avoid = {}; known.forEach(function (t) { rule(t).x.forEach(function (k) { avoid[k] = 1; }); });
    return { items: items, pants: combine(known.map(function (t) { return rule(t).p; })), shoes: combine(known.map(function (t) { return rule(t).s; })), avoid: Object.keys(avoid), unknown: tops.filter(function (t) { return !rule(t); }) };
  }
  function check(t, p, s) {                                               // rate a chosen outfit
    var r = rule(t); if (!r) return null; var ps = p ? (r.p[p] || (r.x.indexOf(p) > -1 ? 1 : 2)) : null, ss = s ? (r.s[s] || 2) : null, v = [ps, ss].filter(Boolean);
    if (!v.length) return null; var avg = v.reduce(function (a, b) { return a + b; }, 0) / v.length; if (p && r.x.indexOf(p) > -1) avg = Math.min(avg, 2);
    return { score: avg, level: avg >= 4.5 ? 0 : avg >= 3.5 ? 1 : avg >= 2.5 ? 2 : 3 };   // 0 excellent 1 good 2 okay 3 avoid
  }
  return { HEX: HEX, NAME: NAME, R: R, SHIRTS: SHIRTS, tops: Object.keys(R), label: label, advise: advise, check: check, parse: parse, resolve: resolve, nearest: nearest };
})();
