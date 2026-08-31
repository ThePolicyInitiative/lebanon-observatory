import humanToll from "@/data/human-toll.json";
import type { Locale } from "@/lib/vocab";
import { fmtDate } from "@/lib/format";
import { UI } from "@/lib/colors";

/**
 * The human toll of the two wars, kept in separate panels: different
 * crises, different reporting systems, never compared or summed.
 */
type TollItem = {
  label: string;
  labelAr: string;
  value: string;
  valueAr?: string;
  detail: string;
  detailAr: string;
  reporter: string;
  reporterAr: string;
};

function Panel({
  asOfLabel,
  title,
  asOf,
  accent,
  items,
  locale,
}: {
  asOfLabel: string;
  title: string;
  asOf: string;
  accent: string;
  items: readonly TollItem[];
  locale: Locale;
}) {
  const ar = locale === "ar";
  return (
    <div className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 pb-2" style={{ borderColor: accent }}>
        <h3 className="text-lead font-semibold text-navy">{title}</h3>
        <span className="text-micro font-medium text-text-secondary">
          {asOfLabel} {fmtDate(asOf, locale)}
        </span>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((i) => (
          <li key={i.label} className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-3">
            <p
              className="text-h2 font-bold tabular-nums tracking-tight sm:w-40 sm:text-end"
              style={{ color: accent }}
            >
              {ar ? (i.valueAr ?? i.value) : i.value}
            </p>
            <div>
              <p className="text-meta font-semibold text-text">
                {ar ? i.labelAr : i.label}
              </p>
              <p className="mt-0.5 text-meta leading-relaxed text-text-secondary">
                {ar ? i.detailAr : i.detail}
              </p>
              <p className="mt-0.5 text-micro font-medium text-text-secondary">
                {ar ? i.reporterAr : i.reporter}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const T = {
  en: {
    heading: "The human toll behind the assessments",
    lede: "Buildings are counted because they can be counted from orbit. These are the figures the same period produced about people - two separate crises, two separate reporting systems, shown side by side and never summed.",
    war2026: "2026 war: casualties, displacement and return",
    shelter2024: "2024 conflict: the shelter response",
    asOf: "as of",
    caution:
      "“Returns” measure movement, not durable return: people counted as returned may have gone back to a damaged building, to relatives, or to a rental while awaiting repairs or compensation that, at 31 August 2026, no financed instrument had delivered.",
  },
  ar: {
    heading: "الكلفة البشرية خلف التقييمات",
    lede: "المباني تُعدّ لأنها تُعدّ من الفضاء. وهذه هي الأرقام التي أنتجتها الفترة نفسها عن البشر - أزمتان منفصلتان، ونظاما إبلاغ منفصلان، يُعرضان جنباً إلى جنب ولا يُجمعان أبداً.",
    war2026: "حرب 2026: الضحايا والنزوح والعودة",
    shelter2024: "حرب 2024: استجابة الإيواء",
    asOf: "حتى",
    caution:
      "«العودات» تقيس الحركة لا العودة الدائمة: من يُحصى عائداً قد يكون رجع إلى بناء متضرّر، أو إلى أقارب، أو إلى مسكن مستأجَر في انتظار ترميم أو تعويض لم تكن أي أداة تمويل قد أوصلته حتى 31 آب 2026.",
  },
} as const;

export default function HumanToll({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  return (
    <section aria-labelledby="human-toll">
      <h2 id="human-toll" className="text-h2 font-semibold text-navy">
        {tr.heading}
      </h2>
      <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
        {tr.lede}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          asOfLabel={tr.asOf}
          title={tr.war2026}
          asOf={humanToll.war2026.asOf}
          accent={UI.rust}
          items={humanToll.war2026.items}
          locale={locale}
        />
        <Panel
          asOfLabel={tr.asOf}
          title={tr.shelter2024}
          asOf={humanToll.shelter2024.asOf}
          accent="#58779B"
          items={humanToll.shelter2024.items}
          locale={locale}
        />
      </div>
      <p className="mt-3 note-caution text-meta leading-relaxed text-text-secondary">
        {tr.caution}
      </p>
    </section>
  );
}
