"use client";

import YearControl, { type YearMode } from "@/components/YearControl";
import { useUrlState } from "@/lib/useUrlState";
import type { Locale } from "@/lib/vocab";

type Side = { label: string; y2024: string; y2026: string; change: string };

type Dimension = {
  id: string;
  kind: "gain" | "partial" | "none" | "redirected";
  en: Side;
  ar: Side;
};

const DIMENSIONS: Dimension[] = [
  {
    id: "authority",
    kind: "gain",
    en: {
      label: "Authority",
      y2024:
        "Dispersed by default: territorial bodies held damage claims by legacy, ministries held sectors by statute, and no institution held the whole.",
      y2026:
        "Consolidated inside a project perimeter - cabinet for policy, Public Works for execution leadership, CDR for implementation, World Bank rules - while the Council for the South, the Higher Relief Commission and the parallel track kept the real authority outside it.",
      change: "Consolidated, selectively: a clear hierarchy inside the perimeter, the old answer outside it.",
    },
    ar: {
      label: "السلطة",
      y2024:
        "مشتّتة في الواقع: هيئات المناطق تمسك بمطالبات الأضرار بحكم الإرث، والوزارات تمسك بالقطاعات بحكم النص، ولا مؤسسة تمسك بالمجموع.",
      y2026:
        "مجمَّعة داخل محيط المشروع - مجلس الوزراء للسياسة، والأشغال العامة لقيادة التنفيذ، ومجلس الإنماء والإعمار للتنفيذ، وقواعد البنك الدولي - بينما احتفظ مجلس الجنوب والهيئة العليا للإغاثة والمسار الموازي بسلطة فعلية خارجه.",
      change: "تجميع انتقائي: تراتبية واضحة داخل المحيط، والجواب القديم خارجه.",
    },
  },
  {
    id: "coordination",
    kind: "gain",
    en: {
      label: "Coordination",
      y2024:
        "Emergency layers worked as designed - the Government Emergency Committee, the DRM Unit and the operations room - but held information-and-convening authority, not budget-and-contract authority.",
      y2026:
        "The same machine, rehearsed: the emergency operations room activated within hours; MoSA's single humanitarian channel was formalised; a deliberate firewall separated the emergency chain from the project chain.",
      change: "Straightforwardly better at the same task; predicts nothing about reconstruction.",
    },
    ar: {
      label: "التنسيق",
      y2024:
        "طبقات الطوارئ عملت كما صُمّمت - اللجنة الحكومية للطوارئ، ووحدة إدارة الكوارث، وغرفة العمليات - لكنها ملكت سلطة المعلومة والدعوة إلى الاجتماع، لا سلطة الموازنة والعقد.",
      y2026:
        "الآلة نفسها بعد تمرين: غرفة العمليات الطارئة فُعّلت خلال ساعات؛ ورُسّمت القناة الإنسانية الواحدة لوزارة الشؤون الاجتماعية؛ وفصل جدار مقصود سلسلة الطوارئ عن سلسلة المشروع.",
      change: "أفضل بوضوح في المهمة نفسها؛ ولا يتنبّأ بشيء عن إعادة الإعمار.",
    },
  },
  {
    id: "finance",
    kind: "partial",
    en: {
      label: "Finance",
      y2024:
        "Needs eventually quantified at US$11 billion, financed at zero. Humanitarian money only; reported parallel-track cash was the only compensation moving.",
      y2026:
        "Structured and small: US$250 million effective within a US$1 billion framework, 1.65% disbursed by 29 June, a US$750 million gap explicitly awaiting partners.",
      change: "From absent to structured-and-small; the binding constraint moved from 'no vehicle' to 'no passengers'.",
    },
    ar: {
      label: "التمويل",
      y2024:
        "احتياجات قُدّرت في النهاية بـ11 مليار دولار، ومُوّلت بصفر. مال إنساني فقط؛ والنقد المعلَن في المسار الموازي كان التعويض الوحيد المتحرّك.",
      y2026:
        "منظَّم وصغير: 250 مليون دولار نافذة ضمن إطار بمليار دولار، ودُفع منها 1.65% حتى 29 حزيران، وفجوة 750 مليون دولار معلَّقة صراحةً بانتظار الشركاء.",
      change: "من الغياب إلى المنظَّم الصغير؛ والقيد الملزِم انتقل من «لا مركبة» إلى «لا ركّاب».",
    },
  },
  {
    id: "assessment",
    kind: "gain",
    en: {
      label: "Assessment",
      y2024:
        "Four non-additive damage tracks, national scope, months of latency, internationally produced; a usable national baseline only in March 2025.",
      y2026:
        "Bounded products in weeks, jointly produced with a Lebanese scientific institution (CNRS-L), plus a real-time national database - but covering two zones, with the Bekaa and the North unassessed at the cut-off.",
      change: "The cleanest capability gain of any function; coverage was traded for speed.",
    },
    ar: {
      label: "التقييم",
      y2024:
        "أربعة مسارات أضرار غير قابلة للجمع، بنطاق وطني، وبتأخّر شهور، ومن إنتاج دولي؛ ولم يتوفّر خط أساس وطني صالح للاستعمال قبل آذار 2025.",
      y2026:
        "منتجات محدودة النطاق أُنجزت في أسابيع، بإنتاج مشترك مع مؤسسة علمية لبنانية (المجلس الوطني للبحوث العلمية)، مع قاعدة معطيات وطنية آنية - لكنها تغطّي منطقتين، وبقي البقاع والشمال بلا تقييم حتى تاريخ التوقف.",
      change: "أنظف مكسب في القدرة بين كل الوظائف؛ وقد بودلت التغطية بالسرعة.",
    },
  },
  {
    id: "procurement",
    kind: "partial",
    en: {
      label: "Procurement",
      y2024:
        "Traced public procurement consisted essentially of one rubble tender launched on 27 December under the general procurement law.",
      y2026:
        "A rule-bound multi-package pipeline: three consulting packages published, none awarded at the 17 July portal check; a 56-week baseline works-contract cycle against a 12-week target.",
      change: "Form transformed, throughput not yet: 2024's risk was capture without process, 2026's is process without output.",
    },
    ar: {
      label: "الشراء",
      y2024:
        "الشراء العام المرصود كان في جوهره مناقصة أنقاض واحدة أُطلقت في 27 كانون الأول بموجب قانون الشراء العام.",
      y2026:
        "مسار متعدّد الحزم محكوم بالقواعد: ثلاث حزم استشارية منشورة، ولا إرساء لأي منها عند مراجعة البوابة في 17 تموز؛ ودورة عقد أشغال بخط أساس 56 أسبوعاً مقابل هدف 12 أسبوعاً.",
      change: "الشكل تبدّل، أما الإنتاجية فلا: خطر 2024 كان الاستحواذ بلا إجراء، وخطر 2026 هو الإجراء بلا إنتاج.",
    },
  },
  {
    id: "implementation",
    kind: "none",
    en: {
      label: "Physical implementation",
      y2024:
        "Emergency logic only: roads patched, utilities re-strung locally, self-financed repair - no programme works existed.",
      y2026:
        "Still emergency logic: ministry campaigns without published quantities, municipal and volunteer clearance - programme works remained preparatory with zero awarded contracts.",
      change: "No material change in what was actually delivered; the delivery category 'reconstruction' stayed empty in both years.",
    },
    ar: {
      label: "التنفيذ المادي",
      y2024:
        "منطق طوارئ لا غير: ترقيع طرق، وإعادة مدّ شبكات محلياً، وترميم بتمويل ذاتي - ولا أشغال برنامجية أصلاً.",
      y2026:
        "منطق طوارئ أيضاً: حملات وزارية بلا كميات منشورة، وتنظيف بلدي وتطوّعي - وبقيت أشغال البرنامج تحضيرية وبصفر عقود مُرساة.",
      change: "لا تغيّر جوهري في ما أُنجز فعلاً؛ وخانة «إعادة الإعمار» بقيت فارغة في السنتين.",
    },
  },
  {
    id: "humanitarian",
    kind: "gain",
    en: {
      label: "Humanitarian delivery",
      y2024:
        "Shelter for nearly 190,000 people at peak; relief at scale; the system emptied within days of the ceasefire.",
      y2026:
        "Shelter for more than 136,000 at peak; relief at larger scale with faster registration; the same cycle ran further and faster.",
      change: "Proven competence, twice - and in both years the delivered output was humanitarian, not reconstructive.",
    },
    ar: {
      label: "الإنجاز الإنساني",
      y2024:
        "إيواء لقرابة 190,000 شخص في الذروة؛ وإغاثة بحجم كبير؛ والنظام أُفرغ خلال أيام من وقف النار.",
      y2026:
        "إيواء لأكثر من 136,000 في الذروة؛ وإغاثة بحجم أكبر وتسجيل أسرع؛ والدورة نفسها جرت أبعد وأسرع.",
      change: "كفاءة مثبتة مرتين - وفي السنتين كان المُنجَز إنسانياً لا إعمارياً.",
    },
  },
  {
    id: "municipal",
    kind: "none",
    en: {
      label: "Municipal authority",
      y2024:
        "Sensors and shock absorbers: damage reporting, shelter hosting, local access - with zero traced roles in finance, procurement, direct reconstruction and oversight.",
      y2026:
        "Intake and certification nodes in longer chains - with zero traced roles in finance, procurement, direct reconstruction and oversight.",
      change: "The comparison's null result: no empowerment in either year, and thinner traced presence (19 → 12 entries).",
    },
    ar: {
      label: "السلطة البلدية",
      y2024:
        "حسّاسات وممتصّات صدمات: إبلاغ عن الأضرار، واستضافة إيواء، وتأمين وصول محلي - وبصفر أدوار مرصودة في التمويل والشراء وإعادة الإعمار المباشرة والرقابة.",
      y2026:
        "نقاط استقبال وإفادة في سلاسل أطول - وبصفر أدوار مرصودة في التمويل والشراء وإعادة الإعمار المباشرة والرقابة.",
      change: "النتيجة الصفرية في هذه المقارنة: لا تمكين في أي من السنتين، وحضور مرصود أنحف (19 ← 12 مدخلاً).",
    },
  },
  {
    id: "community",
    kind: "redirected",
    en: {
      label: "Community substitution",
      y2024:
        "The largest traced presence in every downstream stage - clearing, repairing, financing recovery from savings, remittances and labour.",
      y2026:
        "Grew overall (145 → 172 entries) while rotating into relief, coordination and shelter and out of finance, rubble and physical reconstruction.",
      change: "Substitution changed currency, not size: the system consumed savings and labour in 2024, care capacity and volunteer time in 2026.",
    },
    ar: {
      label: "إحلال المجتمع المحلي",
      y2024:
        "أكبر حضور مرصود في كل مرحلة لاحقة - تنظيف وترميم وتمويل تعافٍ من المدّخرات والتحويلات والعمل.",
      y2026:
        "اتّسع إجمالاً (145 ← 172 مدخلاً) مع انتقال نحو الإغاثة والتنسيق والإيواء، وخروج من التمويل والأنقاض وإعادة الإعمار المادية.",
      change: "الإحلال بدّل عملته لا حجمه: استهلك النظام المدّخرات والعمل في 2024، وطاقة الرعاية ووقت المتطوّعين في 2026.",
    },
  },
  {
    id: "oversight",
    kind: "partial",
    en: {
      label: "Oversight",
      y2024:
        "Residual: general controls with little public money to grip; civil-society analyses supplied much of the traced scrutiny.",
      y2026:
        "A project-perimeter accountability stack - portal, grievance address, disclosed results, planned third-party monitoring - mostly unexercised by the cut-off, with the monitoring agent itself in tender.",
      change: "Fiduciary accountability built; political accountability essentially untouched. Strongest oversight sits where the least money moved.",
    },
    ar: {
      label: "الرقابة",
      y2024:
        "متبقّية: رقابات عامة بلا مال عام كافٍ تمسك به؛ وتحليلات المجتمع المدني وفّرت جانباً كبيراً من التدقيق المرصود.",
      y2026:
        "طبقة مساءلة داخل محيط المشروع - بوابة، وعنوان للشكاوى، ونتائج معلَنة، ورقابة مقرَّرة من طرف ثالث - بقيت غير مُفعَّلة إلى حد بعيد حتى تاريخ التوقف، وجهة الرقابة نفسها كانت في المناقصة.",
      change: "بُنيت المساءلة المالية؛ أما المساءلة السياسية فبقيت على حالها تقريباً. وأقوى رقابة تجلس حيث تحرّك أقل قدر من المال.",
    },
  },
  {
    id: "outputs",
    kind: "none",
    en: {
      label: "Confirmed outputs",
      y2024:
        "No financed programme existed, so no programme outputs; restoration ran on emergency budgets and self-help, quantities unpublished.",
      y2026:
        "Zero awarded works contracts, zero publicly confirmed completed reconstruction outputs, zero confirmed state compensation payments by 31 July 2026.",
      change: "Empty in both years - the report's most uncomfortable finding, and the one the next reporting cycle can falsify.",
    },
    ar: {
      label: "الإنجازات المؤكَّدة",
      y2024:
        "لم يوجد برنامج مموَّل، فلم توجد إنجازات برنامجية؛ والترميم جرى على موازنات الطوارئ والعون الذاتي، بكميات غير منشورة.",
      y2026:
        "صفر عقود أشغال مُرساة، وصفر إنجازات إعادة إعمار مكتملة ومُعلَنة، وصفر دفعات تعويض حكومية مؤكَّدة حتى 31 تموز 2026.",
      change: "فارغة في السنتين - أكثر خلاصات التقرير إزعاجاً، وأولاها بالنفي في دورة الإبلاغ المقبلة.",
    },
  },
];

/** The verdict colours, for the overview bar and the per-card track. */
const KIND_COLOR: Record<Dimension["kind"], string> = {
  gain: "var(--color-teal)",
  partial: "#D69600",
  none: "var(--color-rust)",
  redirected: "var(--color-magenta)",
};

const KIND_ORDER: Dimension["kind"][] = ["gain", "partial", "none", "redirected"];

const KIND_BADGE: Record<
  Dimension["kind"],
  { label: string; labelAr: string; cls: string }
> = {
  gain: {
    label: "Formalised / improved",
    labelAr: "رُسّم أو تحسّن",
    cls: "bg-[#E8F1F3] text-[color:var(--color-teal)]",
  },
  partial: {
    label: "Built, not yet delivering",
    labelAr: "بُني ولم يُنجز بعد",
    cls: "bg-[#FAF3E3] text-[#8a6200]",
  },
  none: {
    label: "No material change",
    labelAr: "لا تغيّر جوهري",
    cls: "bg-[#F7E9E5] text-[color:var(--color-rust)]",
  },
  redirected: {
    label: "Redirected",
    labelAr: "أُعيد توجيهه",
    cls: "bg-[#F4EAF0] text-[color:var(--color-magenta)]",
  },
};

const T = {
  en: {
    change: "Change: ",
    overview: "The eleven dimensions at a glance",
    overviewSub:
      "Each dimension's verdict, counted. Four improved, three were built without yet delivering, three did not move at all, and one changed direction rather than size.",
    of: (n: number, total: number) => `${n} of ${total}`,
    arrow: "→",
    trackLabel: (kind: string) => `2024 to 2026: ${kind}`,
  },
  ar: {
    change: "الفارق: ",
    overview: "الأبعاد الأحد عشر في لمحة",
    overviewSub:
      "حكم كل بُعد، معدوداً. أربعة تحسّنت، وثلاثة بُنيت ولم تُنجز بعد، وثلاثة لم تتحرّك إطلاقاً، وواحد بدّل وجهته لا حجمه.",
    of: (n: number, total: number) => `${n} من ${total}`,
    arrow: "←",
    trackLabel: (kind: string) => `من 2024 إلى 2026: ${kind}`,
  },
} as const;

export default function ComparePanel({ locale = "en" }: { locale?: Locale } = {}) {
  const { get, set } = useUrlState({ view: "side" });
  const mode = (get("view") as YearMode) || "side";
  const t = T[locale];
  const ar = locale === "ar";

  return (
    <div>
      <div className="sticky top-[var(--header-h)] z-40 -mx-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <YearControl
          mode={mode}
          onChange={(m) => set("view", m)}
          idPrefix="compare"
          locale={locale}
        />
      </div>

      {/* The eleven verdicts, counted and coloured. Nothing else on the
          page draws the dimensions themselves - the charts below are all
          about actor layers and stages - so this is the one place the
          comparison's own shape is visible. */}
      <figure className="mt-6 card p-3.5 sm:p-4">
        <figcaption>
          <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
            {t.overview}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            {t.overviewSub}
          </p>
        </figcaption>
        <div
          aria-hidden
          className="mt-3 flex h-4 w-full overflow-hidden rounded-sm"
        >
          {KIND_ORDER.map((kind) => {
            const n = DIMENSIONS.filter((d) => d.kind === kind).length;
            if (n === 0) return null;
            return (
              <div
                key={kind}
                style={{
                  width: `${(n / DIMENSIONS.length) * 100}%`,
                  background: KIND_COLOR[kind],
                }}
              />
            );
          })}
        </div>
        <ul className="mt-2.5 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {KIND_ORDER.map((kind) => {
            const list = DIMENSIONS.filter((d) => d.kind === kind);
            if (list.length === 0) return null;
            return (
              <li key={kind} className="text-[12px]">
                <p className="flex items-center gap-1.5 font-semibold">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: KIND_COLOR[kind] }}
                  />
                  <span style={{ color: KIND_COLOR[kind] }}>
                    {ar ? KIND_BADGE[kind].labelAr : KIND_BADGE[kind].label}
                  </span>
                  <span className="tabular-nums text-[color:var(--color-text-secondary)]">
                    {t.of(list.length, DIMENSIONS.length)}
                  </span>
                </p>
                <p className="mt-0.5 ps-4 leading-snug text-[color:var(--color-text-secondary)]">
                  {list.map((d) => d[locale].label).join(" · ")}
                </p>
              </li>
            );
          })}
        </ul>
      </figure>

      <div className="mt-6 space-y-4">
        {DIMENSIONS.map((d) => {
          const c = d[locale];
          const badge = KIND_BADGE[d.kind];
          return (
            <section
              key={d.id}
              aria-label={c.label}
              className="rounded-md border border-[color:var(--color-border)] bg-white"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] px-4 py-2.5">
                <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                  {c.label}
                </h3>
                <span className="flex items-center gap-2.5">
                  {/* 2024 to 2026 for this dimension, in its verdict
                      colour: a solid run for a gain, dashed where
                      something was built but has not delivered, flat and
                      grey where nothing moved. The years dim to match
                      whichever the control is showing. */}
                  <span
                    aria-label={t.trackLabel(ar ? badge.labelAr : badge.label)}
                    role="img"
                    className="flex items-center gap-1 text-[10px] font-bold tabular-nums"
                  >
                    <span
                      className={mode === "2026" ? "opacity-30" : ""}
                      style={{ color: "var(--color-y2024)" }}
                    >
                      2024
                    </span>
                    <span
                      aria-hidden
                      className="h-0 w-8 sm:w-12"
                      style={{
                        borderTopWidth: d.kind === "none" ? 1 : 2,
                        borderTopStyle: d.kind === "partial" ? "dashed" : "solid",
                        borderTopColor:
                          d.kind === "none"
                            ? "var(--color-border)"
                            : KIND_COLOR[d.kind],
                      }}
                    />
                    <span aria-hidden style={{ color: KIND_COLOR[d.kind] }}>
                      {d.kind === "none" ? "·" : t.arrow}
                    </span>
                    <span
                      className={mode === "2024" ? "opacity-30" : ""}
                      style={{ color: "var(--color-y2026)" }}
                    >
                      2026
                    </span>
                  </span>
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${badge.cls}`}
                  >
                    {ar ? badge.labelAr : badge.label}
                  </span>
                </span>
              </header>
              <div
                className={`grid gap-0 ${
                  mode === "side" || mode === "change" ? "md:grid-cols-2" : ""
                }`}
              >
                {(mode === "2024" || mode === "side" || mode === "change") && (
                  <div className="border-b border-[color:var(--color-border)] p-4 md:border-b-0 md:border-e">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2024)]">
                      2024
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[color:var(--color-text)]">
                      {c.y2024}
                    </p>
                  </div>
                )}
                {(mode === "2026" || mode === "side" || mode === "change") && (
                  <div className="p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2026)]">
                      2026
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[color:var(--color-text)]">
                      {c.y2026}
                    </p>
                  </div>
                )}
              </div>
              {mode === "change" ? (
                <p className="border-t border-dashed border-[color:var(--color-border)] px-4 py-3 text-[13px] leading-relaxed">
                  <span className="font-semibold text-[color:var(--color-rust)]">
                    {t.change}
                  </span>
                  {c.change}
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
