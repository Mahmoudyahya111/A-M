/* TELEGANT – colour pairing rules (menswear, shirt -> trousers + shoes). Score 5 = best, 1 = weak. */
window.TGColors = (function () {
  var HEX = { navy: '#1f2a44', white: '#f5f5f2', black: '#121212', grey: '#8a8d91', red: '#b3262c', charcoal: '#3a3d42', lightgrey: '#c9ccd0', beige: '#d8c3a5', khaki: '#b5a27a', olive: '#5f6b3a', tan: '#b08d57', brown: '#5b3a29', burgundy: '#6d1a2a', denim: '#2b3f5e', lightdenim: '#6f8fb5', cream: '#efe6d2' };
  var NAME = { navy: ['Navy', 'كحلي'], white: ['White', 'أبيض'], black: ['Black', 'أسود'], grey: ['Grey', 'رمادي'], red: ['Red', 'أحمر'], charcoal: ['Charcoal', 'فحمي'], lightgrey: ['Light grey', 'رمادي فاتح'], beige: ['Beige', 'بيج'], khaki: ['Khaki', 'كاكي'], olive: ['Olive', 'زيتي'], tan: ['Tan', 'جملي فاتح'], brown: ['Brown', 'بني'], burgundy: ['Burgundy', 'عنابي'], denim: ['Dark denim', 'جينز غامق'], lightdenim: ['Light denim', 'جينز فاتح'], cream: ['Cream', 'كريمي'] };
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
  function label(kind, k, i) { var n = NAME[k][i], x = (kind === 'pants' ? PANTS : SHOES)[k]; return i === 1 ? ((kind === 'pants' ? 'بنطلون ' : '') + n + (x ? ' ' + x[1] : (kind === 'shoes' ? ' حذاء' : ''))) : (n + ' ' + (x ? x[0] : (kind === 'pants' ? 'trousers' : 'shoes'))); }
  function top(map, n) { return Object.keys(map).map(function (k) { return { k: k, score: map[k] }; }).sort(function (a, b) { return b.score - a.score; }).slice(0, n || 5); }
  function combine(lists, n) {                                            // colours that suit EVERY shirt (lowest score decides)
    var keys = {}; lists.forEach(function (l) { for (var k in l) keys[k] = 1; });
    var out = Object.keys(keys).map(function (k) { var sc = lists.map(function (l) { return l[k] || 0; }), min = Math.min.apply(null, sc), avg = sc.reduce(function (a, b) { return a + b; }, 0) / sc.length; return { k: k, score: min, avg: avg }; });
    out = out.filter(function (x) { return x.score >= 3; }).sort(function (a, b) { return b.score - a.score || b.avg - a.avg; }); return out.slice(0, n || 5);
  }
  function advise(tops) {
    var known = tops.filter(function (t) { return R[t]; }), items = known.map(function (t) { return { top: t, pants: top(R[t].p), shoes: top(R[t].s), avoid: R[t].x, tip: R[t].tip }; });
    var avoid = {}; known.forEach(function (t) { R[t].x.forEach(function (k) { avoid[k] = 1; }); });
    return { items: items, pants: combine(known.map(function (t) { return R[t].p; })), shoes: combine(known.map(function (t) { return R[t].s; })), avoid: Object.keys(avoid), unknown: tops.filter(function (t) { return !R[t]; }) };
  }
  function check(t, p, s) {                                               // rate a chosen outfit
    var r = R[t]; if (!r) return null; var ps = p ? (r.p[p] || (r.x.indexOf(p) > -1 ? 1 : 2)) : null, ss = s ? (r.s[s] || 2) : null, v = [ps, ss].filter(Boolean);
    if (!v.length) return null; var avg = v.reduce(function (a, b) { return a + b; }, 0) / v.length; if (p && r.x.indexOf(p) > -1) avg = Math.min(avg, 2);
    return { score: avg, level: avg >= 4.5 ? 0 : avg >= 3.5 ? 1 : avg >= 2.5 ? 2 : 3 };   // 0 excellent 1 good 2 okay 3 avoid
  }
  return { HEX: HEX, NAME: NAME, R: R, tops: Object.keys(R), label: label, advise: advise, check: check };
})();
