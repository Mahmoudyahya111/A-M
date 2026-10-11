/* TELEGANT – single source of truth for sizes (shop, size guide, custom-size limits). cm. Regular fit, about 10 cm chest ease. */
window.TGSizes = {
  order: ['s', 'm', 'l', 'xl', 'xxl', 'xxxl'],
  chart: {
    s:    { label: 'S',    length: 66, chest: 48, shoulder: 43, sleeve: 19, body: '86–91',   height: '165–170', weight: '55–65' },
    m:    { label: 'M',    length: 68, chest: 51, shoulder: 45, sleeve: 20, body: '92–97',   height: '170–175', weight: '65–75' },
    l:    { label: 'L',    length: 70, chest: 54, shoulder: 47, sleeve: 21, body: '98–103',  height: '175–180', weight: '75–85' },
    xl:   { label: 'XL',   length: 72, chest: 57, shoulder: 49, sleeve: 22, body: '104–109', height: '180–185', weight: '85–95' },
    xxl:  { label: 'XXL',  length: 74, chest: 60, shoulder: 51, sleeve: 23, body: '110–115', height: '185–190', weight: '95–105' },
    xxxl: { label: 'XXXL', length: 76, chest: 63, shoulder: 53, sleeve: 24, body: '116–121', height: '190–195', weight: '105–115' }
  },
  ranges: { chest: [44, 70], length: [60, 82], shoulder: [40, 58] },     // limits for the Custom option
  EASE: 10,                                                              // garment circumference minus body chest
  fromBody: function (bodyChest, bodyShoulder, torso) {                  // body measurements -> garment measurements
    return { chest: Math.round((bodyChest + this.EASE) / 2), shoulder: Math.round(bodyShoulder + 2), length: Math.round(torso + 12) };
  },
  nearest: function (chestFlat) {
    var best = 's', d = 1e9; for (var k in this.chart) { var x = Math.abs(this.chart[k].chest - chestFlat); if (x < d) { d = x; best = k; } } return best;
  }
};
