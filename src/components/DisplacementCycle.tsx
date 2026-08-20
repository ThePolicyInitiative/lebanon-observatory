import type { Locale } from "@/lib/vocab";

/**
 * The shelter-and-return cycle ran twice with the same machine and faster
 * clocks. Movement statistics are not proof of durable return.
 */
type Row = { metric: string; y2024: string; y2026: string };

const ROWS: { en: Row; ar: Row }[] = [
  {
    en: {
      metric: "Peak traced displacement",
      y2024: ">834,000 traced IDPs (≈1.2M including movement into Syria)",
      y2026: ">1 million displaced; registration exceeded 667,000 within eight days",
    },
    ar: {
      metric: "ذروة النزوح المرصود",
      y2024: "أكثر من 834,000 نازح مرصود (نحو 1.2 مليون مع الحركة نحو سوريا)",
      y2026: "أكثر من مليون نازح؛ وتجاوز التسجيل 667,000 خلال ثمانية أيام",
    },
  },
  {
    en: {
      metric: "Shelter mobilisation",
      y2024: ">1,100 collective shelters - overwhelmingly public schools - at 84% capacity",
      y2026: "344 schools converted within nine days (92% full); 660 sites at peak",
    },
    ar: {
      metric: "تعبئة الإيواء",
      y2024: "أكثر من 1,100 مركز إيواء جماعي - معظمها مدارس رسمية - بامتلاء 84%",
      y2026: "تحويل 344 مدرسة خلال تسعة أيام (امتلاء 92%)؛ و660 موقعاً في الذروة",
    },
  },
  {
    en: {
      metric: "Peak shelter population",
      y2024: "≈190,000 people",
      y2026: ">136,000 people",
    },
    ar: {
      metric: "ذروة عدد المقيمين في مراكز الإيواء",
      y2024: "نحو 190,000 شخص",
      y2026: "أكثر من 136,000 شخص",
    },
  },
  {
    en: {
      metric: "Relief scale",
      y2024: "4.2M hot and cold meals; 73,000 ready-to-eat kits; emergency cash to 226,000 people within 24 hours of displacement",
      y2026: ">14.5M meals by late June; WASH for >1M people; cash-for-shelter standing up with initial capacity ≈8,200 households",
    },
    ar: {
      metric: "حجم الإغاثة",
      y2024: "4.2 مليون وجبة ساخنة وباردة؛ و73,000 حصة جاهزة للأكل؛ ونقد طارئ لـ226,000 شخص خلال 24 ساعة من النزوح",
      y2026: "أكثر من 14.5 مليون وجبة حتى أواخر حزيران؛ ومياه وصرف لأكثر من مليون شخص؛ ومساعدة نقدية للإيواء انطلقت بطاقة أولية نحو 8,200 أسرة",
    },
  },
  {
    en: {
      metric: "Emptying after cessation",
      y2024: "≈76% of shelter residents left within two days of 27 November; 296 of 1,009 monitored sites closed by 29 November",
      y2026: "From >136,000 to 29,700 people in 278 sites across six weeks of June–July",
    },
    ar: {
      metric: "الإفراغ بعد وقف الأعمال العدائية",
      y2024: "غادر نحو 76% من قاطني مراكز الإيواء خلال يومين من 27 تشرين الثاني؛ وأُقفل 296 من أصل 1,009 مواقع مرصودة حتى 29 تشرين الثاني",
      y2026: "من أكثر من 136,000 إلى 29,700 شخص في 278 موقعاً خلال ستة أسابيع في حزيران وتموز",
    },
  },
  {
    en: {
      metric: "Residual displacement",
      y2024: ">100,000 people still displaced into January 2025, many returned to damaged buildings",
      y2026: "741,111 reported returned by 15 July; 412,700 still displaced",
    },
    ar: {
      metric: "النزوح المتبقّي",
      y2024: "أكثر من 100,000 شخص ما زالوا نازحين حتى كانون الثاني 2025، وكثيرون عادوا إلى أبنية متضرّرة",
      y2026: "741,111 عودة معلَنة حتى 15 تموز؛ و412,700 ما زالوا نازحين",
    },
  },
];

const DURABLE_RETURN: { en: [string, string]; ar: [string, string] }[] = [
  {
    en: ["Housing", "Unrepaired - no financed instrument for either war's private damage"],
    ar: ["السكن", "بلا ترميم - ولا أداة تمويل لأضرار القطاع الخاص في أي من الحربين"],
  },
  {
    en: [
      "Services",
      "Partially restored - three hospitals and 35 health centres closed at 6 July; water and electricity led reported gaps in return areas",
    ],
    ar: [
      "الخدمات",
      "مستعادة جزئياً - ثلاثة مستشفيات و35 مركزاً صحياً مقفلة في 6 تموز؛ والمياه والكهرباء تتصدّران الثغرات المعلَنة في مناطق العودة",
    ],
  },
  {
    en: [
      "Safety",
      "Unresolved south of the Litani - continuing ordnance, strikes and occupied border villages",
    ],
    ar: [
      "الأمان",
      "غير محسوم جنوب الليطاني - ذخائر مستمرة وغارات وقرى حدودية محتلة",
    ],
  },
  {
    en: ["Tenure", "Unaddressed - co-ownership, inheritance, tenancy and entries gaps untouched"],
    ar: ["الحيازة", "غير معالَجة - الشيوع والإرث والإيجار وثغرات القيود بقيت على حالها"],
  },
  {
    en: [
      "Livelihoods",
      "Unprogrammed - the largest loss lines had no institutional owner in either year",
    ],
    ar: [
      "سبل العيش",
      "بلا برنامج - أكبر بنود الخسارة لم يكن لها صاحب مؤسسي في أي من السنتين",
    ],
  },
];

const T = {
  en: {
    title: "The shelter-and-return cycle, run twice",
    sub: "Shelter is the state-plus-humanitarian system's proven competence - and durable return is nobody's mandate. “Returned” counts registrations of movement; it cannot see secondary displacement or doubling-up, and the series splices different reporting systems at different dates.",
    caption: "Displacement and shelter metrics for the 2024 and 2026 cycles.",
    metric: "Metric",
    cycle2024: "2024 cycle",
    cycle2026: "2026 cycle",
    testHead: "Why movement is not durable return (situation at the cut-off)",
    testSub: "The durable-return test - housing, services, safety, tenure, livelihoods - was failed on at least three of five dimensions for large populations, and aid financing threatened food, rent and protection support from September.",
    caveat:
      "Both post-war moments produced the same risk at the same point: populations living in damaged structures through a winter while institutions process - except 2026 added occupied and demolished border villages whose residents cannot even return to rubble. July's reassuring return curves will be cited to close the emergency exactly when the unfinanced phase begins.",
  },
  ar: {
    title: "دورة الإيواء والعودة، جرت مرتين",
    sub: "الإيواء هو الكفاءة المثبتة لنظام الدولة مع القطاع الإنساني - أما العودة الدائمة فليست تفويض أحد. و«العائد» يُحصى بتسجيل الحركة؛ ولا يرى النزوح الثانوي ولا التكدّس في مسكن واحد، والسلسلة تجمع نظامَي إبلاغ مختلفين في تواريخ مختلفة.",
    caption: "مؤشرات النزوح والإيواء في دورتَي 2024 و2026.",
    metric: "المؤشر",
    cycle2024: "دورة 2024",
    cycle2026: "دورة 2026",
    testHead: "لماذا الحركة ليست عودة دائمة (الوضع عند تاريخ التوقف)",
    testSub: "اختبار العودة الدائمة - السكن والخدمات والأمان والحيازة وسبل العيش - سقط في ثلاثة من خمسة أبعاد على الأقل بالنسبة إلى أعداد كبيرة من الناس، وتمويل المساعدات كان يهدّد دعم الغذاء والإيجار والحماية اعتباراً من أيلول.",
    caveat:
      "أنتجت اللحظتان بعد الحربين الخطر نفسه عند النقطة نفسها: ناس يعيشون في أبنية متضرّرة طوال شتاء بينما تُنجز المؤسسات إجراءاتها - إلا أن 2026 أضافت قرى حدودية محتلة ومهدَّمة لا يستطيع أهلها العودة حتى إلى الركام. ومنحنيات العودة المطمئنة في تموز ستُستشهَد بها لإقفال الطوارئ في اللحظة نفسها التي تبدأ فيها المرحلة غير المموَّلة.",
  },
} as const;

export default function DisplacementCycle({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  return (
    <figure className="card p-3.5 sm:p-4">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          {tr.title}
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          {tr.sub}
        </p>
      </figcaption>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-[13px]">
          <caption className="sr-only">{tr.caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2.5 py-2 text-start font-semibold text-[color:var(--color-navy)]">{tr.metric}</th>
              <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2.5 py-2 text-start font-semibold" style={{ color: "var(--color-y2024)" }}>{tr.cycle2024}</th>
              <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2.5 py-2 text-start font-semibold" style={{ color: "var(--color-y2026)" }}>{tr.cycle2026}</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const r = row[locale];
              return (
                <tr key={r.metric} className="odd:bg-[color:var(--color-bg)] align-top">
                  <th scope="row" className="border-b border-[color:var(--color-border)] px-2.5 py-2 text-start font-medium">{r.metric}</th>
                  <td className="border-b border-[color:var(--color-border)] px-2.5 py-2">{r.y2024}</td>
                  <td className="border-b border-[color:var(--color-border)] px-2.5 py-2">{r.y2026}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 panel-sunken p-4">
        <h4 className="text-sm font-semibold text-[color:var(--color-navy)]">
          {tr.testHead}
        </h4>
        <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
          {tr.testSub}
        </p>
        <ul className="mt-3 space-y-1.5 text-[13px]">
          {DURABLE_RETURN.map((d) => {
            const [dim, state] = d[locale];
            return (
              <li key={dim} className="flex gap-2">
                <span className="w-24 shrink-0 font-semibold text-[color:var(--color-rust)]">{dim}</span>
                <span>{state}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-3 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        {tr.caveat}
      </p>
    </figure>
  );
}
