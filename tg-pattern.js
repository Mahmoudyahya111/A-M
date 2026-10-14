/* TELEGANT – pattern maker: finished garment measurements (cm) -> professional PDF for the manufacturer.
   Mock-neck short-sleeve T-shirt: FRONT + BACK (cut 1 on fold), SLEEVE (cut 2), COLLAR (cut 1). Needs tg-report.js and tg-sizes.js. */
window.TGPattern = (function () {
  var SA = 1, HEM = 2, SHEM = 1.5;
  var PROMPT = 'You are a senior garment pattern maker and technologist. I am attaching a photo of a short-sleeve mock-neck T-shirt. Estimate its FLAT finished measurements in centimetres.\n' +
    'To scale the photo I give you ONE known measurement: [WRITE IT HERE, for example "chest width flat = 51 cm" or "the model is 178 cm tall"].\n' +
    'If the photo is not a flat lay, correct for perspective and for the fit on the body, and say what you assumed.\n' +
    'Return ONLY valid JSON, no other text, with these number fields (cm): {"chest":0,"length":0,"shoulder":0,"sleeve":0,"neckW":0,"frontDrop":0,"backDrop":0,"armhole":0,"collarH":0,"sleeveW":0,"confidence":"low|medium|high","assumptions":"short text"}\n' +
    'Definitions: chest = flat width armpit to armpit. length = highest shoulder point beside the neck to the bottom hem. shoulder = seam to seam across the back. sleeve = shoulder seam to sleeve hem along the outside. neckW = neck opening width between the shoulder seams. frontDrop / backDrop = depth of the neck opening below the shoulder-neck point. armhole = straight depth from the shoulder tip down to the underarm. collarH = finished height of the mock-neck collar. sleeveW = sleeve width at the underarm.';

  function defaults(sz) { var c = TGSizes.chart[sz] || TGSizes.chart.m;
    return { chest: c.chest, length: c.length, shoulder: c.shoulder, sleeve: c.sleeve, neckW: Math.round(c.shoulder * 0.37), frontDrop: 7, backDrop: 2, armhole: Math.round(c.chest * 0.46), collarH: 4.5, sleeveW: Math.round(c.chest * 0.4) }; }

  function fromMeasures(c, l, s) { return { chest: c, length: l, shoulder: s, sleeve: Math.round(s * 0.45), neckW: Math.round(s * 0.37), frontDrop: 7, backDrop: 2, armhole: Math.round(c * 0.46), collarH: 4.5, sleeveW: Math.round(c * 0.4) }; }

  /* ---------- geometry (cm; x to the right, y downwards) ---------- */
  function bez(a, b, c, d, n) { var o = [], i, t, u; for (i = 0; i <= n; i++) { t = i / n; u = 1 - t; o.push([u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]); } return o; }
  function neck(N, d, n) { var o = [], i, a; for (i = 0; i <= n; i++) { a = i / n * Math.PI / 2; o.push([N * Math.sin(a), d * Math.cos(a)]); } return o; }
  function len(p) { var s = 0; for (var i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }
  function offset(p, d) {                                           // mitred outward offset of a closed polygon
    var n = p.length, ar = 0, i; for (i = 0; i < n; i++) { var q = p[(i + 1) % n]; ar += p[i][0] * q[1] - q[0] * p[i][1]; } var sg = ar > 0 ? 1 : -1;
    function nrm(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [sg * dy / l, -sg * dx / l]; }
    return p.map(function (pt, i) { var a = p[(i + n - 1) % n], b = p[(i + 1) % n], n1 = nrm(a, pt), n2 = nrm(pt, b), k = Math.max(0.35, 1 + n1[0] * n2[0] + n1[1] * n2[1]);
      return [pt[0] + d * (n1[0] + n2[0]) / k, pt[1] + d * (n1[1] + n2[1]) / k]; });
  }
  function bbox(p) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; p.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }); return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0 }; }

  function body(m, back) {                                          // half front / half back, fold on x = 0
    var C = m.chest / 2, S = m.shoulder / 2, N = m.neckW / 2, nd = back ? m.backDrop : m.frontDrop, sd = 4.5, AH = m.armhole, L = m.length + (back ? 1 : 0);
    var nk = neck(N, nd, 14), ya = sd + AH, arm = back ? bez([S, sd], [S - 1.8, sd + AH * 0.38], [C - 2.6, sd + AH * 0.85], [C, ya], 16) : bez([S, sd], [S - 2.2, sd + AH * 0.40], [C - 3.2, sd + AH * 0.85], [C, ya], 16);
    var pts = nk.concat(arm, [[C + 0.4, L], [0, L]]), armStart = nk.length, sew = pts.slice();
    var cut = offset(pts, SA); cut.forEach(function (q, i) { if (pts[i][0] === 0) q[0] = 0; if (pts[i][1] === L) q[1] = L + HEM; });
    return { key: back ? 'BACK' : 'FRONT', cut: 'Cut 1 on fold', fold: true, sew: sew, out: cut, neckLen: len(nk), armLen: len(arm), L: L,
      notches: [{ i: armStart + 8, n: 1 }, { i: armStart, n: 1 }], dims: [{ a: [0, ya], b: [C, ya], t: 'Chest ' + m.chest + ' (half ' + C + ')', off: [0, 2.5] }, { a: [-3, 0], b: [-3, L], t: 'Length ' + m.length }, { a: [0, -3], b: [S, -3], t: 'Shoulder ' + m.shoulder + ' (half ' + S + ')' }] };
  }
  function sleeve(m) {
    var SW = m.sleeveW * 2, CH = Math.round(m.armhole * 0.47 * 10) / 10, SL = m.sleeve, SO = 2 * (m.sleeveW - 3);
    var l = bez([-SW / 2, CH], [-SW / 2 + 1.2, CH * 0.45], [-SW * 0.2, 0], [0, 0], 14), r = bez([0, 0], [SW * 0.2, 0], [SW / 2 - 1.2, CH * 0.45], [SW / 2, CH], 14);
    var pts = l.concat(r.slice(1), [[SO / 2, SL], [-SO / 2, SL]]), cut = offset(pts, SA); cut.forEach(function (q, i) { if (pts[i][1] === SL) q[1] = SL + SHEM; });
    return { key: 'SLEEVE', cut: 'Cut 2 (mirror pair)', fold: false, sew: pts, out: cut, capLen: len(l) + len(r), SL: SL, SO: SO, notches: [{ i: l.length - 1, n: 1 }],
      dims: [{ a: [-SW / 2, CH + 1.5], b: [SW / 2, CH + 1.5], t: 'Width ' + SW + ' (flat ' + m.sleeveW + ' x 2)' }, { a: [SW / 2 + 3, 0], b: [SW / 2 + 3, SL], t: 'Length ' + (Math.round(SL * 10) / 10) }] };
  }
  function collar(m, neckCirc) {
    var W = Math.round(neckCirc * 0.9 * 10) / 10, H = m.collarH * 2, pts = [[0, 0], [W, 0], [W, H], [0, H]], cut = offset(pts, SA);
    return { key: 'COLLAR', cut: 'Cut 1 (fold in half lengthwise, join at centre back)', fold: false, sew: pts, out: cut, W: W, H: H, notches: [{ i: 0, n: 1 }], marks: [W / 4, W / 2, W * 3 / 4],
      dims: [{ a: [0, H + 1.5], b: [W, H + 1.5], t: 'Length ' + W + ' (neck ' + (Math.round(neckCirc * 10) / 10) + ' x 0.9)' }, { a: [W + 2.5, 0], b: [W + 2.5, H], t: 'Height ' + H }] };
  }
  function build(m) { var f = body(m, false), b = body(m, true), neckCirc = 2 * (f.neckLen + b.neckLen); return { f: f, b: b, s: sleeve(m), c: collar(m, neckCirc), neckCirc: neckCirc }; }

  /* ---------- drawing ---------- */
  function T(k, ox, oy) { return function (p) { return [ox + p[0] * k, oy + p[1] * k]; }; }
  function poly(doc, pts, tf, close) { for (var i = 1; i < pts.length; i++) { var a = tf(pts[i - 1]), b = tf(pts[i]); doc.line(a[0], a[1], b[0], b[1]); } if (close) { var a2 = tf(pts[pts.length - 1]), b2 = tf(pts[0]); doc.line(a2[0], a2[1], b2[0], b2[1]); } }
  function arrow(doc, a, b) { var ang = Math.atan2(b[1] - a[1], b[0] - a[0]), s = 1.6;[[a, ang], [b, ang + Math.PI]].forEach(function (z) { doc.line(z[0][0], z[0][1], z[0][0] + s * Math.cos(z[1] + 0.4), z[0][1] + s * Math.sin(z[1] + 0.4)); doc.line(z[0][0], z[0][1], z[0][0] + s * Math.cos(z[1] - 0.4), z[0][1] + s * Math.sin(z[1] - 0.4)); }); }
  function normalAt(P, i) { var n = P.sew.length, a = P.sew[(i + n - 1) % n], b = P.sew[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ar = 0, j;
    for (j = 0; j < n; j++) { var q = P.sew[(j + 1) % n]; ar += P.sew[j][0] * q[1] - q[0] * P.sew[j][1]; } var sg = ar > 0 ? 1 : -1; return [sg * dy / l, -sg * dx / l]; }
  function drawPiece(doc, P, tf, k, o) {
    doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.45); poly(doc, P.out, tf, !P.fold);                                  // cutting line
    if (P.fold) { var a = tf(P.out[0]), b = tf(P.out[P.out.length - 1]); }
    doc.setLineWidth(0.25); doc.setDrawColor(90, 90, 90); doc.setLineDashPattern([1.6, 1.2], 0); poly(doc, P.sew, tf, !P.fold); doc.setLineDashPattern([], 0);   // sewing line
    if (P.fold) { doc.setDrawColor(201, 162, 75); doc.setLineWidth(0.6); doc.setLineDashPattern([4, 1, 1, 1], 0); var f0 = tf([0, P.sew[0][1] - 1]), f1 = tf([0, P.L + 1]); doc.line(f0[0], f0[1], f1[0], f1[1]); doc.setLineDashPattern([], 0); doc.setFontSize(6); doc.setTextColor(150, 120, 40); doc.text('FOLD', f0[0] + 1, f0[1] + 6, { angle: 90 }); }
    doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.3);
    (P.notches || []).forEach(function (nt) { var p = P.sew[nt.i], n = normalAt(P, nt.i), q = tf(p), e = tf([p[0] + n[0] * (SA + 0.1), p[1] + n[1] * (SA + 0.1)]); doc.line(q[0], q[1], e[0], e[1]); });
    (P.marks || []).forEach(function (x) { var q = tf([x, 0]), e = tf([x, -SA - 0.1]); doc.line(q[0], q[1], e[0], e[1]); });
    var bb = bbox(P.sew), cx = (bb.x0 + bb.x1) / 2, g0 = tf([cx, bb.y0 + bb.h * 0.28]), g1 = tf([cx, bb.y0 + bb.h * 0.72]);                          // grainline
    doc.setLineWidth(0.4); doc.line(g0[0], g0[1], g1[0], g1[1]); arrow(doc, g0, g1); doc.setFontSize(6); doc.setTextColor(60, 60, 60); doc.text('GRAIN', g0[0] + 1.2, (g0[1] + g1[1]) / 2, { angle: 90 });
    var lb = tf([cx, bb.y0 + bb.h * 0.5]); doc.setFont('helvetica', 'bold'); doc.setFontSize(o && o.big ? 11 : 8); doc.setTextColor(20, 20, 20); doc.text(P.key + ' · ' + o.size, lb[0] + 2.5, lb[1] - 4, { align: 'left' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(o && o.big ? 8 : 6.5); doc.text(P.cut, lb[0] + 2.5, lb[1], { align: 'left', maxWidth: 60 });
  }
  function dim(doc, d, tf) { var a = tf(d.a), b = tf(d.b); doc.setDrawColor(201, 162, 75); doc.setLineWidth(0.2); doc.line(a[0], a[1], b[0], b[1]); arrow(doc, a, b); doc.setFontSize(6.5); doc.setTextColor(120, 90, 20);
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, vert = Math.abs(b[1] - a[1]) > Math.abs(b[0] - a[0]); if (vert) doc.text(d.t, mx - 1, my, { angle: 90, align: 'center' }); else doc.text(d.t, mx, my - 1.2, { align: 'center' }); }

  /* ---------- PDF ---------- */
  async function pdf(spec) {
    await Promise.all([TGReport.load('j'), TGReport.load('a')]); var lg = await TGReport.logo().catch(function () { return null; });
    var m = spec.m, size = spec.size || 'CUSTOM', P = build(m), doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), M = 12, W = 210;
    function head(w, title, sub) { doc.setFillColor(17, 17, 17); doc.rect(0, 0, w, 28, 'F'); if (lg) doc.addImage(lg.data, 'PNG', M, 5, 17 * lg.w / lg.h, 17); doc.setTextColor(201, 162, 75); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(title, w - M, 12, { align: 'right' }); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(220, 220, 220); doc.text(sub, w - M, 19, { align: 'right' }); }
    /* page 1: tech spec */
    head(W, 'Pattern & Tech Pack', 'Mock neck T-shirt · size ' + size + (spec.ref ? ' · ' + spec.ref : '') + ' · ' + new Date().toISOString().slice(0, 10));
    var rows = [['A', 'Chest width (flat, armpit to armpit)', m.chest], ['B', 'Body length (highest shoulder point to hem)', m.length], ['C', 'Shoulder width (seam to seam)', m.shoulder], ['D', 'Sleeve length (shoulder seam to hem)', m.sleeve], ['E', 'Sleeve width at underarm', m.sleeveW], ['F', 'Sleeve opening width (flat)', P.s.SO / 2], ['G', 'Neck opening width', m.neckW], ['H', 'Front neck drop', m.frontDrop], ['I', 'Back neck drop', m.backDrop], ['J', 'Armhole depth (straight)', m.armhole], ['K', 'Collar height (finished)', m.collarH]];
    doc.autoTable({ startY: 34, margin: { left: M, right: spec.photo ? 92 : M }, head: [['', 'Point of measure (finished, flat)', 'cm']], body: rows, styles: { fontSize: 8.5, cellPadding: 1.8 }, headStyles: { fillColor: [201, 162, 75], textColor: [17, 17, 17] }, columnStyles: { 0: { cellWidth: 8, fontStyle: 'bold' }, 2: { halign: 'right', cellWidth: 16 } }, alternateRowStyles: { fillColor: [250, 247, 240] } });
    if (spec.photo) { var ph = spec.photo, bw = 78, bh = 100, r = Math.min(bw / ph.w, bh / ph.h); doc.setFontSize(8); doc.setTextColor(110, 90, 50); doc.text('Reference photo', 120, 36); doc.addImage(ph.data, 'JPEG', 120, 39, ph.w * r, ph.h * r); }
    var y = Math.max(doc.lastAutoTable.finalY, spec.photo ? 145 : 0) + 8;
    doc.autoTable({ startY: y, margin: { left: M, right: M }, head: [['Piece', 'Cut', 'Notes']], body: [['FRONT', '1 on fold', 'Neck drop ' + m.frontDrop + ' cm. Fold line is the centre front.'], ['BACK', '1 on fold', 'Neck drop ' + m.backDrop + ' cm, 1 cm longer than front. Fold is the centre back.'], ['SLEEVE', '2 (mirror pair)', 'Sleeve cap ' + P.s.capLen.toFixed(1) + ' cm sews to the armholes (front + back ' + (P.f.armLen + P.b.armLen).toFixed(1) + ' cm): ' + (P.s.capLen - (P.f.armLen + P.b.armLen) >= 0 ? '+' : '') + (P.s.capLen - (P.f.armLen + P.b.armLen)).toFixed(1) + ' cm ease.'], ['COLLAR', '1', 'Length ' + P.c.W + ' cm (90% of the ' + P.neckCirc.toFixed(1) + ' cm neck opening so it sits close). Fold in half lengthwise.']], styles: { fontSize: 8.5, cellPadding: 1.8 }, headStyles: { fillColor: [17, 17, 17], textColor: [201, 162, 75] }, alternateRowStyles: { fillColor: [250, 247, 240] } });
    y = doc.lastAutoTable.finalY + 6; doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(30, 24, 12); doc.text('Construction and finishing', M, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    var lines = ['Seam allowance ' + SA + ' cm on all seams; body hem ' + HEM + ' cm; sleeve hem ' + SHEM + ' cm (already included in the cutting line).', 'Fabric: ' + (spec.fabric || 'cotton jersey with a little stretch, about 190 gsm, pre-shrunk') + '. Cut with the grain running down the body.', 'Order: shoulder seams, join collar into a loop, attach collar to neck, set sleeves in the round, close side and sleeve seams in one pass, hem.', 'Use a stretch stitch on all seams. Tolerance on every measurement: +/- 1 cm.', 'Notches mark the front armhole, sleeve cap centre and collar quarters. Match them when sewing.'];
    if (spec.note) lines.push('Note: ' + spec.note); lines.forEach(function (l) { var t = doc.splitTextToSize('• ' + l, W - 2 * M); doc.text(t, M, y + 6); y += 4.4 * t.length; });
    /* page 2: overview, scale about 1:5 (landscape) */
    doc.addPage('a4', 'l'); var LW = 297; head(LW, 'Pattern overview', 'size ' + size + ' · dashed = sewing line, solid = cutting line (seam allowance included)');
    var bf = bbox(P.f.out), bs = bbox(P.s.out), bc = bbox(P.c.out), gap = 12, colW = [bf.w + 8, bf.w + 8, Math.max(bs.w, bc.w) + 8], totW = colW[0] + colW[1] + colW[2] + 2 * gap, totH = Math.max(bf.h + 8, bs.h + bc.h + 22);
    var k = Math.min((LW - 2 * M) / totW, (210 - 28 - 26) / totH), x0 = M + ((LW - 2 * M) - totW * k) / 2, y0 = 28 + 14;
    var sc = (10 / k); doc.setFontSize(8); doc.setTextColor(60, 60, 60); doc.text('Scale about 1:' + sc.toFixed(1) + '  ·  all dimensions in cm', M, 36);
    var pieces = [[P.f, x0 - bf.x0 * k + 4 * k, y0 - bf.y0 * k + 4 * k], [P.b, x0 + (colW[0] + gap) * k - bbox(P.b.out).x0 * k + 4 * k, y0 - bbox(P.b.out).y0 * k + 4 * k], [P.s, x0 + (colW[0] + colW[1] + 2 * gap) * k - bs.x0 * k + 4 * k, y0 - bs.y0 * k + 4 * k], [P.c, x0 + (colW[0] + colW[1] + 2 * gap) * k - bc.x0 * k + 4 * k, y0 + (bs.h + 14) * k - bc.y0 * k]];
    pieces.forEach(function (z) { var tf = T(k, z[1], z[2]); drawPiece(doc, z[0], tf, k, { size: size }); z[0].dims.forEach(function (d) { dim(doc, d, tf); }); });
    /* optional: full-size sheets, 1:1, printed at 100% */
    if (spec.full) {
      var PW = 190, PH = 277, OV = 10;
      [P.f, P.b, P.s, P.c].forEach(function (pc) {
        var bb = bbox(pc.out), w = bb.w * 10, h = bb.h * 10, cols = Math.max(1, Math.ceil((w - OV) / (PW - OV))), rws = Math.max(1, Math.ceil((h - OV) / (PH - OV))), r, c;
        for (r = 0; r < rws; r++) for (c = 0; c < cols; c++) {
          doc.addPage('a4', 'p'); var ox = 10 - (bb.x0 * 10 + c * (PW - OV)), oy = 10 - (bb.y0 * 10 + r * (PH - OV)), tf = T(10, ox, oy);
          drawPiece(doc, pc, tf, 10, { size: size, big: true });
          doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, 10, 'F'); doc.rect(0, 287, W, 10, 'F'); doc.rect(0, 0, 10, 297, 'F'); doc.rect(200, 0, 10, 297, 'F');       // mask the margins
          doc.setDrawColor(0); doc.setLineWidth(0.2); [[10, 10], [200, 10], [10, 287], [200, 287]].forEach(function (q) { doc.line(q[0] - 4, q[1], q[0] + 4, q[1]); doc.line(q[0], q[1] - 4, q[0], q[1] + 4); });
          doc.setFontSize(8); doc.setTextColor(40, 40, 40); doc.text(pc.key + ' · size ' + size + ' · sheet ' + (r * cols + c + 1) + ' of ' + (cols * rws) + ' (row ' + (r + 1) + ', column ' + (c + 1) + ')  ·  join sheets by the marks, overlap 1 cm', 12, 8);
          doc.setDrawColor(0); doc.rect(12, 276, 50, 8); doc.setFontSize(6.5); doc.text('PRINT AT 100%. This box must measure 5 x 0.8 cm', 14, 281);
        }
      });
    }
    var n = doc.getNumberOfPages(); for (var p = 1; p <= n; p++) { doc.setPage(p); doc.setFontSize(7); doc.setTextColor(130, 130, 130); var pw = doc.internal.pageSize.getWidth(), ph2 = doc.internal.pageSize.getHeight(); if (p <= 2) doc.text('TELEGANT · pattern ' + p + ' of ' + n + ' · confidential', M, ph2 - 6); }
    doc.save('telegant-pattern-' + (spec.ref || size) + '.pdf');
  }
  return { PROMPT: PROMPT, defaults: defaults, fromMeasures: fromMeasures, build: build, pdf: pdf, bbox: bbox };
})();
