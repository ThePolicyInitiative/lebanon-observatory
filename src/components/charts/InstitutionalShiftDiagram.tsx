import type { Locale } from "@/lib/vocab";

type ShiftKind = "formalised" | "built_not_delivering" | "unchanged" | "redirected";

const KIND_COLOR: Record<ShiftKind, { color: string; bg: string }> = {
  formalised: { color: "#177384", bg: "#E8F1F3" },
  built_not_delivering: { color: "#8a6200", bg: "#FAF3E3" },
  unchanged: { color: "#B04A37", bg: "#F7E9E5" },
  redirected: { color: "#A34F7C", bg: "#F4EAF0" },
};

const KIND_LABEL: Record<Locale, Record<ShiftKind, string>> = {
  en: {
    formalised: "Formalised and functioning",
    built_not_delivering: "Built, not yet matched by confirmed delivery",
    unchanged: "No material change",
    redirected: "Redirected activity",
  },
  ar: {
    formalised: "تحوّل إلى صيغة رسمية وهو يعمل",
    built_not_delivering: "بُني، ولم يقابله إنجاز مؤكَّد بعد",
    unchanged: "لا تغيّر فعلي",
    redirected: "نشاط أُعيد توجيهه",
  },
};

type Row = {
  kind: ShiftKind;
  dimension: string;
  y2024: string;
  y2026: string;
};

const ROWS: Record<Locale, Row[]> = {
  en: [
    {
      kind: "formalised",
      dimension: "Strategic direction",
      y2024:
        "Caretaker cabinet and emergency committee: convening and coordination authority without the ability to commit funds or launch a programme.",
      y2026:
        "Elected president, empowered cabinet and Prime Minister's Office guidance over a formal project structure, with prioritisation fixed by cabinet decision.",
    },
    {
      kind: "built_not_delivering",
      dimension: "Finance",
      y2024:
        "No financed reconstruction programme. Humanitarian funding and reported parallel-track cash were the only money moving; needs were quantified at US$11 billion and financed at zero.",
      y2026:
        "US$250 million effective within a US$1 billion framework; US$4.13 million (1.65%) disbursed by 29 June 2026; a compensation framework designed but with no confirmed payment.",
    },
    {
      kind: "built_not_delivering",
      dimension: "Implementation",
      y2024:
        "Households, municipalities, volunteers and agencies performed works by substitution - self-financed repair, improvised clearance, projectised patches.",
      y2026:
        "CDR project unit staffed, framework agreements prepared, contractors designated as implementers - and zero works contracts awarded by the cut-off.",
    },
    {
      kind: "unchanged",
      dimension: "Local government",
      y2024:
        "Frontline sensors and shock absorbers: damage reporting, shelter hosting, local access, volunteer marshalling - with collapsed revenues and no reconstruction mandate.",
      y2026:
        "Repositioned as intake, certification and interface nodes in longer chains - still without reconstruction budgets, contractor-selection power or oversight authority.",
    },
    {
      kind: "built_not_delivering",
      dimension: "Accountability",
      y2024:
        "Residual oversight: general controls with little public money to grip; civil-society analysis supplied much of the traced scrutiny.",
      y2026:
        "A project-perimeter stack - published procurement portal, grievance address, disclosed results, planned third-party monitoring - mostly unexercised by the cut-off, with the TPMA itself still in tender.",
    },
    {
      kind: "redirected",
      dimension: "Community role",
      y2024:
        "The largest traced presence in most downstream stages: finance substitution, rubble clearance, reconstruction, relief - funded by savings, remittances and labour.",
      y2026:
        "Expanded overall but redirected: relief, coordination and shelter grew while finance, rubble clearance and reconstruction contracted.",
    },
  ],
  ar: [
    {
      kind: "formalised",
      dimension: "التوجيه الاستراتيجي",
      y2024:
        "حكومة تصريف أعمال ولجنة طوارئ: صلاحية دعوة وتنسيق من دون القدرة على رصد أموال أو إطلاق برنامج.",
      y2026:
        "رئيس منتخَب، وحكومة كاملة الصلاحيات، وتوجيه من رئاسة مجلس الوزراء على بنية مشروع رسمية، مع أولويات ثبّتها قرار حكومي.",
    },
    {
      kind: "built_not_delivering",
      dimension: "التمويل",
      y2024:
        "لا برنامج إعادة إعمار مموَّل. التمويل الإنساني والأموال المُبلَّغ عنها في المسار الموازي كانا المال الوحيد المتحرك؛ الاحتياج قُدّر بـ11 مليار دولار ومُوِّل بصفر.",
      y2026:
        "250 مليون دولار نافذة ضمن إطار بمليار دولار؛ و4.13 ملايين دولار (1.65%) دُفعت حتى 29 حزيران 2026؛ وإطار تعويض مصمَّم بلا دفعة واحدة مؤكَّدة.",
    },
    {
      kind: "built_not_delivering",
      dimension: "التنفيذ",
      y2024:
        "الأسر والبلديات والمتطوعون والوكالات نفّذوا الأشغال بالاستبدال - ترميم على النفقة الخاصة، ورفع أنقاض مرتجل، ورقع على شكل مشاريع.",
      y2026:
        "وحدة مشروع في مجلس الإنماء والإعمار مزوّدة بالملاك، واتفاقات إطارية مُعدّة، ومتعهدون مُعيَّنون منفذين - وصفر عقود أشغال مُرساة حتى تاريخ التوقف.",
    },
    {
      kind: "unchanged",
      dimension: "الحكم المحلي",
      y2024:
        "حواسّ الخط الأول وممتصّات الصدمة: الإبلاغ عن الضرر، واستضافة الإيواء، وتأمين الوصول المحلي، وتنظيم المتطوعين - بإيرادات منهارة وبلا تكليف بإعادة الإعمار.",
      y2026:
        "أُعيد وضعها عقداً للاستقبال والتصديق والوصل في سلاسل أطول - ولا تزال بلا موازنات إعادة إعمار ولا سلطة اختيار متعهدين ولا صلاحية رقابة.",
    },
    {
      kind: "built_not_delivering",
      dimension: "المساءلة",
      y2024:
        "رقابة متبقية: ضوابط عامة بلا مال عام يُذكر تُمسك به؛ وتحليل المجتمع المدني وفّر جانباً كبيراً من التدقيق المرصود.",
      y2026:
        "طبقة على محيط المشروع - بوابة شراء منشورة، وعنوان للتظلّم، ونتائج معلنة، ومراقبة طرف ثالث مخطَّطة - بقيت في معظمها غير مُمارَسة حتى تاريخ التوقف، وجهة المراقبة نفسها لا تزال في مرحلة المناقصة.",
    },
    {
      kind: "redirected",
      dimension: "دور المجتمع المحلي",
      y2024:
        "أكبر حضور مرصود في معظم المراحل اللاحقة: استبدال التمويل، ورفع الأنقاض، وإعادة البناء، والإغاثة - بتمويل من المدّخرات والتحويلات والعمل اليدوي.",
      y2026:
        "اتّسع إجمالاً لكنه أُعيد توجيهه: نمت الإغاثة والتنسيق والإيواء، بينما تراجع التمويل ورفع الأنقاض وإعادة البناء.",
    },
  ],
};

const T = {
  en: {
    title: "The institutional shift, 2024 → 2026",
    sub: "Six system dimensions, before and after, side by side. Colour marks the kind of change.",
  },
  ar: {
    title: "التحوّل المؤسسي، 2024 ← 2026",
    sub: "ستة أبعاد للنظام، قبل وبعد، جنباً إلى جنب. اللون يشير إلى نوع التغيّر.",
  },
} as const;

/**
 * Visual 1 - Institutional shift diagram: the structured 2024 → 2026
 * transition across six dimensions.
 */
export default function InstitutionalShiftDiagram({
  locale = "en",
}: { locale?: Locale } = {}) {
  const t = T[locale];
  const kindLabel = KIND_LABEL[locale];
  return (
    <figure className="card p-3.5 sm:p-4">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          {t.title}
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          {t.sub}
        </p>
      </figcaption>

      <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
        {(Object.keys(KIND_COLOR) as ShiftKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: KIND_COLOR[k].color }}
            />
            {kindLabel[k]}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {ROWS[locale].map((row) => {
          const meta = KIND_COLOR[row.kind];
          return (
            <section
              key={row.dimension}
              aria-label={row.dimension}
              className="rounded-md border border-[color:var(--color-border)]"
            >
              <header
                className="flex flex-wrap items-center justify-between gap-2 rounded-t-md px-3 py-2"
                style={{ background: meta.bg }}
              >
                <h4 className="text-sm font-semibold" style={{ color: meta.color }}>
                  {row.dimension}
                </h4>
                <span
                  className="rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: meta.color, borderColor: meta.color }}
                >
                  {kindLabel[row.kind]}
                </span>
              </header>
              <div className="grid gap-0 md:grid-cols-[1fr_auto_1fr]">
                <div className="p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2024)]">
                    2024
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-text)]">
                    {row.y2024}
                  </p>
                </div>
                <div
                  aria-hidden
                  className="hidden items-center px-1 text-xl text-[color:var(--color-text-secondary)] md:flex"
                >
                  <span className="rtl:hidden">→</span>
                  <span className="hidden rtl:inline">←</span>
                </div>
                <div className="p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-y2026)]">
                    2026
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-text)]">
                    {row.y2026}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </figure>
  );
}
