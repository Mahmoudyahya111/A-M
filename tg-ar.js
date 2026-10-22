/* TELEGANT – Arabic translations for PDF / Excel reports. TGAr.spec(spec) returns an Arabic copy of a report spec. */
window.TGAr = (function () {
  var D = {
    'Business Report': 'تقرير الأعمال', 'Account Statement': 'كشف الحساب', 'Customer Service KPIs': 'مؤشرات خدمة العملاء', 'Agent Availability': 'توفّر الموظفين', 'Styling Guide': 'دليل التنسيق', 'Summary': 'الملخص',
    'Revenue': 'الإيرادات', 'Net profit': 'صافي الربح', 'Net margin': 'هامش الربح الصافي', 'Gross margin': 'هامش الربح الإجمالي', 'Orders delivered': 'الطلبات المُسلَّمة', 'Average order value': 'متوسط قيمة الطلب', 'Units sold': 'الوحدات المباعة', 'Cost per order': 'التكلفة لكل طلب',
    'Orders in progress': 'الطلبات قيد التنفيذ', 'Cash to collect on delivery': 'النقد المطلوب تحصيله عند التسليم', 'Awaiting InstaPay': 'بانتظار إنستاباي', 'Cancellation rate': 'نسبة الإلغاء', 'Avg days to deliver': 'متوسط أيام التسليم', 'Repeat customers': 'العملاء المتكررون',
    'Orders to cover expenses': 'الطلبات اللازمة لتغطية المصروفات', 'Stock value': 'قيمة المخزون', 'Refunds paid': 'المبالغ المستردة', 'Cancelled orders': 'الطلبات الملغاة',
    'after materials and expenses': 'بعد المواد والمصروفات', 'sales minus materials': 'المبيعات ناقص المواد',
    'Are we heading the right way?': 'هل نسير في الاتجاه الصحيح؟', 'Monthly performance': 'الأداء الشهري', 'Products': 'المنتجات', 'Payment methods': 'طرق الدفع', 'Spend by category': 'الإنفاق حسب الفئة', 'Top customers': 'أفضل العملاء', 'Low stock': 'مخزون منخفض', 'Cancellations and refunds': 'الإلغاءات والمبالغ المستردة',
    'Indicator': 'المؤشر', 'Status': 'الحالة', 'Value': 'القيمة', 'Guide': 'المعيار', 'Month': 'الشهر', 'Purchases': 'المشتريات', 'Expenses': 'المصروفات', 'Margin': 'الهامش', 'Product': 'المنتج', 'Units': 'الوحدات', 'Share of revenue': 'حصة الإيرادات', 'Method': 'الطريقة', 'Orders': 'الطلبات',
    'Category': 'الفئة', 'Type': 'النوع', 'Amount': 'المبلغ', 'Customer': 'العميل', 'Spend': 'الإنفاق', 'Stock': 'المخزون', 'Cancelled': 'تاريخ الإلغاء', 'Order': 'الطلب', 'By': 'بواسطة', 'Reason': 'السبب', 'Refund status': 'حالة الاسترداد', 'Refunded (EGP)': 'المسترد (ج.م)', 'Refund note': 'ملاحظة الاسترداد',
    'Net profit margin': 'هامش الربح الصافي', 'Gross margin (sales minus materials)': 'هامش الربح الإجمالي (المبيعات ناقص المواد)', 'Revenue growth vs previous period': 'نمو الإيرادات مقارنة بالفترة السابقة', 'Delivery speed (order to delivered)': 'سرعة التسليم (من الطلب إلى التسليم)', 'Orders vs break-even': 'الطلبات مقابل نقطة التعادل',
    'On track': 'على المسار الصحيح', 'Watch': 'يحتاج مراقبة', 'Needs attention': 'يحتاج اهتماماً', 'No data': 'لا توجد بيانات',
    'Healthy: 20% or more': 'الوضع الصحي: 20% أو أكثر', 'Healthy: 50% or more': 'الوضع الصحي: 50% أو أكثر', 'Healthy: not shrinking': 'الوضع الصحي: دون انخفاض', 'Healthy: under 5%': 'الوضع الصحي: أقل من 5%', 'Healthy: 5 days or less': 'الوضع الصحي: 5 أيام أو أقل', 'Orders needed to cover expenses': 'الطلبات اللازمة لتغطية المصروفات',
    'Opening balance': 'الرصيد الافتتاحي', 'Money in (completed orders)': 'الأموال الداخلة (الطلبات المكتملة)', 'Money out (purchases and expenses)': 'الأموال الخارجة (المشتريات والمصروفات)', 'Closing balance': 'الرصيد الختامي',
    'Statement': 'كشف الحساب', 'Order details': 'تفاصيل الطلبات', 'Date': 'التاريخ', 'Reference': 'المرجع', 'Description': 'الوصف', 'Money out': 'مدين (خارج)', 'Money in': 'دائن (داخل)', 'Balance': 'الرصيد', 'Delivered': 'تاريخ التسليم', 'Item': 'الصنف', 'Size': 'المقاس', 'Qty': 'الكمية', 'Unit price': 'سعر الوحدة', 'Line total': 'إجمالي السطر', 'Payment': 'الدفع',
    'Purchase': 'شراء', 'Expense': 'مصروف', 'Other income': 'إيراد آخر', 'Refund': 'استرداد', 'Cash on delivery': 'الدفع عند الاستلام', 'InstaPay - paid now': 'إنستاباي - مدفوع مقدماً', 'InstaPay - pay at delivery': 'إنستاباي - الدفع عند التسليم',
    'NPS': 'صافي نقاط الترويج NPS', 'CSAT (1-5)': 'رضا العملاء CSAT (1-5)', 'FCR': 'الحل من أول تواصل FCR', 'AHT (avg handle time)': 'متوسط وقت المعالجة AHT', 'Agent ease rating (1-5)': 'تقييم سهولة التعامل مع الموظف (1-5)', 'First response time': 'زمن الرد الأول', 'Chats': 'المحادثات', 'Survey response rate': 'نسبة الاستجابة للاستبيان', 'NPS split': 'توزيع NPS',
    'promoters minus detractors': 'المؤيدون ناقص المعارضين', 'resolved, no repeat contact in 7 days': 'تم الحل دون تواصل متكرر خلال 7 أيام',
    'By agent': 'حسب الموظف', 'By day': 'حسب اليوم', 'Customer comments': 'تعليقات العملاء', 'Agent': 'الموظف', 'AHT (s)': 'AHT (ثانية)', 'First response (s)': 'الرد الأول (ثانية)', 'FCR %': 'FCR %', 'Ease': 'السهولة', 'CSAT': 'الرضا', 'Day': 'اليوم', 'Chat no.': 'رقم المحادثة', 'Resolved': 'تم الحل', 'Comment': 'التعليق', 'Closed': 'أُغلقت', 'Yes': 'نعم', 'No': 'لا',
    'Agents': 'الموظفون', 'Break log': 'سجل الاستراحات', 'Login log': 'سجل تسجيل الدخول', 'Role': 'الدور', 'Now': 'الآن', 'First login': 'أول دخول', 'Last logout': 'آخر خروج', 'Online (min)': 'متصل (دقيقة)', 'Available (min)': 'متاح (دقيقة)', 'On break (min)': 'في استراحة (دقيقة)', 'Breaks': 'الاستراحات', 'Avg rating': 'متوسط التقييم',
    'Break started': 'بداية الاستراحة', 'Break ended': 'نهاية الاستراحة', 'Minutes': 'الدقائق', 'Logged in': 'وقت الدخول', 'Logged out': 'وقت الخروج', 'Available': 'متاح', 'On break': 'في استراحة', 'Offline': 'غير متصل', 'owner': 'المالك', 'support': 'الدعم', 'still on break': 'ما زال في استراحة', 'online now': 'متصل الآن',
    'Items in this order': 'أصناف هذا الطلب', 'Best with ALL shirts in this order': 'الأنسب مع جميع القمصان في هذا الطلب', 'Shirt colour': 'لون القميص', 'Trousers': 'البنطلون', 'Shoes': 'الحذاء', 'Best trousers': 'أفضل البناطيل', 'Best shoes': 'أفضل الأحذية', 'Avoid': 'يُفضّل تجنّبه', 'Note': 'ملاحظة', 'Advice': 'نصيحة', 'Shirts': 'القمصان', 'Not covered': 'غير مشمول', 'Colour': 'اللون',
    'No single colour suits every shirt equally. Use the suggestions for each shirt below.': 'لا يوجد لون واحد يناسب جميع القمصان بالتساوي. استخدم اقتراحات كل قميص أدناه.',
    'cod': 'الدفع عند الاستلام', 'instapay_now': 'إنستاباي مدفوع', 'new': 'جديد', 'delivered': 'تم التسليم', 'cancelled': 'ملغي', 'refunded': 'تم الاسترداد', 'due': 'مستحق', 'none': 'لا يوجد', 'customer': 'العميل'
  };
  var PH = [[/ vs previous period$/, ' مقارنة بالفترة السابقة'], [/ vs previous$/, ' مقارنة بالسابق'], [/ EGP\b/g, ' ج.م'], [/(\d)\s?units$/, '$1 وحدة'], [/^(\d+) units$/, '$1 وحدة'], [/^([\d.]+) days$/, '$1 أيام'], [/^(\d+) of (\d+)$/, '$1 من $2'],
    [/^(\d+) promoters \/ (\d+) passives \/ (\d+) detractors$/, '$1 مؤيد / $2 محايد / $3 معارض'], [/^(\d+)% satisfied$/, '$1% راضون'], [/^(\d+)% rated easy$/, '$1% قيّموها بالسهلة'], [/^(\d+) \((\d+) closed\)$/, '$1 ($2 مغلقة)'],
    [/^Payment received for cancelled order - /, 'دفعة مستلمة لطلب ملغى - '], [/^Refund - /, 'استرداد - '], [/ - express \+/, ' - توصيل سريع +'], [/^Order (TG-\d+)/, 'طلب $1'], [/^(\d+) x /, '$1 × ']];
  function tr(s) { if (typeof s !== 'string') return s; if (D[s] !== undefined) return D[s]; var o = s; PH.forEach(function (p) { o = o.replace(p[0], p[1]); }); return o; }
  function cell(c) { if (c && typeof c === 'object') { var o = {}; for (var k in c) o[k] = c[k]; o.v = tr(c.v); return o; } return tr(c); }
  function spec(sp) {
    var o = {}; for (var k in sp) o[k] = sp[k];
    o.title = tr(sp.title); o.subtitle = String(sp.subtitle || '').replace(/^(\S+) to (\S+)$/, 'من $1 إلى $2').replace(/\bstart\b/, 'البداية').replace(/\btoday\b/, 'اليوم').replace(/^Order /, 'طلب ').replace(/^size /, 'المقاس ');
    o.file = sp.file + '-ar'; o.lang = 'ar';
    o.kpis = (sp.kpis || []).map(function (k) { return [tr(k[0]), tr(k[1]), tr(k[2] || '')]; });
    o.sections = (sp.sections || []).map(function (s) { var t = {}; for (var j in s) t[j] = s[j]; t.title = tr(s.title).replace(/^With the (.*) shirt$/, 'مع القميص $1').replace(/^Styling tip: /, 'نصيحة التنسيق: '); t.head = s.head.map(tr); t.rows = s.rows.map(function (r) { return r.map(cell); }); return t; });
    return o;
  }
  return { tr: tr, spec: spec, D: D };
})();
