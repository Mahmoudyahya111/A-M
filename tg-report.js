/* TELEGANT – professional PDF + Excel reports with the logo. TGReport.pdf(spec) / TGReport.xlsx(spec)
   spec = { file, title, subtitle, landscape, kpis:[[label,value,note]], sections:[{ title, head:[...], rows:[[cell...]], fmt:['text','money','pct',...], widths:[...] }] }
   a cell is a value, or { v, c:'#hex' } to show a colour swatch */
window.TGReport = (function () {
  var LIB = { x: 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js', j: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', a: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js' }, P = {};
  function load(k) { return P[k] || (P[k] = new Promise(function (res, rej) { var s = document.createElement('script'); s.src = LIB[k]; s.onload = res; s.onerror = function () { rej(new Error('Could not load the report library. Check your internet connection.')); }; document.head.appendChild(s); })); }
  var LP; function logo() { return LP || (LP = fetch('MEBG-GOLDEN.png').then(function (r) { return r.blob(); }).then(function (b) { return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { var im = new Image(); im.onload = function () { res({ data: fr.result, w: im.width, h: im.height }); }; im.src = fr.result; }; fr.readAsDataURL(b); }); })); }
  var NUM = { int: 1, money: 1, pct: 1, dec1: 1 };
  function fmt(c, f) { var v = (c && typeof c === 'object') ? c.v : c; if (v === null || v === undefined || v === '') return ''; if (typeof v !== 'number' || !f) return String(v);
    return f === 'pct' ? (v * 100).toFixed(1) + '%' : f === 'dec1' ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'); }
  var hex = function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; };
  function save(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

  async function pdf(spec) {
    await Promise.all([load('j'), load('a')]); var lg = await logo().catch(function () { return null; });
    var doc = new window.jspdf.jsPDF({ orientation: spec.landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' }), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 12;
    function head() { doc.setFillColor(17, 17, 17); doc.rect(0, 0, W, 30, 'F'); if (lg) doc.addImage(lg.data, 'PNG', M, 6, 18 * lg.w / lg.h, 18);
      doc.setTextColor(201, 162, 75); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(spec.title, W - M, 14, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(220, 220, 220); doc.text(spec.subtitle || '', W - M, 21, { align: 'right' }); }
    head(); var y = 38;
    if (spec.kpis && spec.kpis.length) {
      var cw = (W - 2 * M - 8) / 3, ch = 19;
      spec.kpis.forEach(function (k, i) { var x = M + (i % 3) * (cw + 4), yy = y + Math.floor(i / 3) * (ch + 4);
        doc.setFillColor(247, 242, 230); doc.setDrawColor(201, 162, 75); doc.roundedRect(x, yy, cw, ch, 2, 2, 'FD');
        doc.setTextColor(110, 90, 50); doc.setFontSize(7); doc.text(String(k[0]).toUpperCase(), x + 3, yy + 5.5);
        doc.setTextColor(30, 24, 12); doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.text(String(k[1]), x + 3, yy + 12.5);
        if (k[2]) { doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(120, 120, 120); doc.text(String(k[2]), x + 3, yy + 16.8); } doc.setFont('helvetica', 'normal'); });
      y += Math.ceil(spec.kpis.length / 3) * (ch + 4) + 4;
    }
    (spec.sections || []).forEach(function (s) {
      if (y > H - 50) { doc.addPage(); head(); y = 38; }
      doc.setTextColor(30, 24, 12); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(s.title, M, y); doc.setFont('helvetica', 'normal');
      var cs = {}; (s.fmt || []).forEach(function (f, i) { if (NUM[f]) cs[i] = { halign: 'right' }; });
      doc.autoTable({ startY: y + 3, margin: { left: M, right: M, top: 36, bottom: 16 }, head: [s.head],
        body: s.rows.map(function (r) { return r.map(function (c, i) { var o = (c && typeof c === 'object') ? c : { v: c }; return { content: fmt(o, (s.fmt || [])[i]), sw: o.c, styles: o.c ? { cellPadding: { left: 8, top: 1.8, right: 2, bottom: 1.8 } } : {} }; }); }),
        styles: { fontSize: 8, cellPadding: 1.8, lineColor: [230, 224, 210], lineWidth: 0.1, textColor: [40, 34, 22] }, headStyles: { fillColor: [201, 162, 75], textColor: [17, 17, 17], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 247, 240] }, columnStyles: cs,
        didDrawPage: function (d) { if (d.pageNumber > 1) head(); },
        didDrawCell: function (d) { var c = d.cell.raw; if (d.section === 'body' && c && c.sw) { var r = hex(c.sw); doc.setFillColor(r[0], r[1], r[2]); doc.setDrawColor(150, 150, 150); doc.rect(d.cell.x + 2, d.cell.y + (d.cell.height - 4) / 2, 4, 4, 'FD'); } } });
      y = doc.lastAutoTable.finalY + 10;
    });
    var n = doc.getNumberOfPages(); for (var p = 1; p <= n; p++) { doc.setPage(p); doc.setFontSize(7.5); doc.setTextColor(130, 130, 130);
      doc.text('TELEGANT · Confidential · generated ' + new Date().toISOString().slice(0, 10), M, H - 7); doc.text('Page ' + p + ' of ' + n, W - M, H - 7, { align: 'right' }); }
    doc.save(spec.file + '.pdf');
  }

  async function xlsx(spec) {
    await load('x'); var lg = await logo().catch(function () { return null; }), wb = new window.ExcelJS.Workbook(); wb.creator = 'TELEGANT';
    var img = lg ? wb.addImage({ base64: lg.data, extension: 'png' }) : null;
    function sheet(name, head, rows, fm, widths) {
      var ws = wb.addWorksheet(name.replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31), { views: [{ state: 'frozen', ySplit: 5, showGridLines: false }] }), n = Math.max(head.length, 4);
      for (var i = 0; i < n; i++) ws.getColumn(i + 1).width = (widths && widths[i]) || 18;
      for (var r = 1; r <= 3; r++) { ws.getRow(r).height = 24; for (var c = 1; c <= n; c++) ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } }; }
      if (img) ws.addImage(img, { tl: { col: 0.2, row: 0.15 }, ext: { width: 56 * lg.w / lg.h, height: 56 } });
      ws.getCell(1, 3).value = spec.title; ws.getCell(1, 3).font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFC9A24B' } };
      ws.getCell(2, 3).value = spec.subtitle || ''; ws.getCell(2, 3).font = { size: 10, color: { argb: 'FFDDDDDD' } };
      ws.getCell(3, 3).value = name; ws.getCell(3, 3).font = { size: 10, italic: true, color: { argb: 'FFC9A24B' } };
      head.forEach(function (h, i) { var c = ws.getCell(5, i + 1); c.value = h; c.font = { bold: true, color: { argb: 'FF111111' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC9A24B' } }; c.alignment = { vertical: 'middle', wrapText: true }; c.border = { bottom: { style: 'thin', color: { argb: 'FF8A6A1F' } } }; });
      ws.getRow(5).height = 22;
      rows.forEach(function (row, ri) { row.forEach(function (v, ci) { var o = (v && typeof v === 'object') ? v : { v: v }, c = ws.getCell(6 + ri, ci + 1); c.value = o.v === undefined ? '' : o.v; c.alignment = { vertical: 'top', wrapText: true };
          var f = (fm || [])[ci]; if (f === 'money' || f === 'int') c.numFmt = '#,##0'; else if (f === 'pct') c.numFmt = '0.0%'; else if (f === 'dec1') c.numFmt = '0.0';
          c.border = { bottom: { style: 'hair', color: { argb: 'FFD9D2C0' } } }; if (ri % 2) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF7F0' } };
          if (o.c) { var h = o.c.replace('#', '').toUpperCase(), r = hex(o.c); c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + h } }; c.font = { color: { argb: (r[0] * 299 + r[1] * 587 + r[2] * 114) / 1000 > 150 ? 'FF111111' : 'FFFFFFFF' }, bold: true }; } }); });
      ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: head.length } };
    }
    if (spec.kpis && spec.kpis.length) sheet('Summary', ['Metric', 'Value', 'Note'], spec.kpis.map(function (k) { return [k[0], k[1], k[2] || '']; }), [], [34, 24, 46]);
    (spec.sections || []).forEach(function (s) { sheet(s.title, s.head, s.rows, s.fmt, s.widths); });
    var buf = await wb.xlsx.writeBuffer(); save(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), spec.file + '.xlsx');
  }
  return { pdf: pdf, xlsx: xlsx };
})();
