import bidiFactory from 'bidi-js';
const bidi = bidiFactory();

function visual(str, dir='rtl'){
  const emb = bidi.getEmbeddingLevels(str, dir);
  const segs = bidi.getReorderSegments(str, emb);
  let chars = Array.from(str);
  for (const [start,end] of segs){
    const slice = chars.slice(start, end+1).reverse();
    for (let i=0;i<slice.length;i++) chars[start+i]=slice[i];
  }
  return chars.join('');
}
// show only the digit/dash skeleton so it is readable in a terminal
function skeleton(s){ return Array.from(s).filter(c=>/[0-9.,%\u2013\u2212\u2010-\u2015()\u002d]/.test(c)).join(''); }

const cases = [
  ['YearControl.tsx:22', "أظهر الفارق (2026 \u2212 2024)"],
  ['DivergingChangeChart.tsx:20', "التغيّر في الجهات المرصودة (2026 \u2212 2024)"],
  ['StageCompositionChart.tsx:46', "الفارق في الجهات المرصودة (2026 - 2024)"],
  ['kpis.json:90', "3\u20135 مليارات دولار"],
  ['kpis.json:108', "6\u20138 مليارات دولار"],
  ['SiteNav.tsx:75', "2024\u20132026"],
  ['i18n.ts:84 ctaCompare', "استكشف التحوّل 2024-2026"],
  ['i18n.ts:90 arrow head', "105 \u2190 130"],
  ['i18n.ts:90 tail', "جهة فاعلة مُدرَجة عبر الطبقات الأربع، 2024-2026؛"],
  ['kpis.json:64 nazaa', "لنزاع 2023-24. هذا احتياج"],
  ['kpis.json:12 refPeriod', "8 تشرين الأول 2023 - 20 كانون الأول 2024"],
  ['FunctionSpeedChart:133', "الزمن المنقضي للتحوّلات المرصودة، 2024-2026."],
  ['InstitutionalStructures:494', "حصة التمويل العام من الاحتياجات: نحو 3-5 مليارات دولار"],
  ['service-impact figureAr', "نحو 37,836-40,000 وحدة سكنية"],
  ['SvgLebanonMap:162', "مراحل سلسلة القيمة 1-12 (مرّر المؤشر للأسماء)"],
  ['--- PROPOSED FIX kpis hyphen (standalone)', "3-5 مليارات دولار"],
  ['--- PROPOSED FIX kpis hyphen preceded by arabic', "نحو 3-5 مليارات دولار"],
  ['--- PROPOSED FIX YearControl isolate', "أظهر الفارق \u2066(2026 \u2212 2024)\u2069"],
  ['--- ALT kpis LRI isolate', "\u20663\u20135\u2069 مليارات دولار"],
  ['--- ALT SiteNav dir=ltr span (own paragraph ltr)', "2024\u20132026"],
];
for (const [name,s] of cases){
  const v = visual(s, name.includes('dir=ltr') ? 'ltr' : 'rtl');
  console.log(name.padEnd(46), '| logical', JSON.stringify(skeleton(s)), '-> visual', JSON.stringify(skeleton(v)), v===s?'(SAME)':'');
}
