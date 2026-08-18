import humanToll from "@/data/human-toll.json";
import type { Locale } from "@/lib/vocab";
import { fmtDate } from "@/lib/format";

/**
 * The human toll of the two wars, kept in separate panels: different
 * crises, different reporting systems, never compared or summed.
 */
function Panel({
  asOfLabel,
  title,
  asOf,
  accent,
  items,
}: {
  asOfLabel: string;
  title: string;
  asOf: string;
  accent: string;
  items: { label: string; value: string; detail: string; reporter: string }[];
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 pb-2" style={{ borderColor: accent }}>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">{title}</h3>
        <span className="text-[11px] font-medium text-[color:var(--color-text-secondary)]">
          {asOfLabel} {fmtDate(asOf)}
        </span>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((i) => (
          <li key={i.label} className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-3">
            <p
              className="text-xl font-bold tabular-nums tracking-tight sm:w-40 sm:text-right"
              style={{ color: accent }}
            >
              {i.value}
            </p>
            <div>
              <p className="text-[13px] font-semibold text-[color:var(--color-text)]">
                {i.label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
                {i.detail}
              </p>
              <p className="mt-0.5 text-[10.5px] font-medium text-[color:var(--color-text-secondary)]">
                {i.reporter}
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
  },
  ar: {
    heading: "الكلفة البشرية خلف التقييمات",
    lede: "المباني تُعدّ لأنها تُعدّ من الفضاء. وهذه هي الأرقام التي أنتجتها الفترة نفسها عن البشر - أزمتان منفصلتان، ونظاما إبلاغ منفصلان، يُعرضان جنباً إلى جنب ولا يُجمعان أبداً.",
    war2026: "حرب 2026: الضحايا والنزوح والعودة",
    shelter2024: "حرب 2024: استجابة الإيواء",
    asOf: "حتى",
  },
} as const;

export default function HumanToll({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  return (
    <section aria-labelledby="human-toll">
      <h2 id="human-toll" className="text-xl font-semibold text-[color:var(--color-navy)]">
        {tr.heading}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        {tr.lede}
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          asOfLabel={tr.asOf}
          title={tr.war2026}
          asOf={humanToll.war2026.asOf}
          accent="#BD5A46"
          items={humanToll.war2026.items}
        />
        <Panel
          asOfLabel={tr.asOf}
          title={tr.shelter2024}
          asOf={humanToll.shelter2024.asOf}
          accent="#58779B"
          items={humanToll.shelter2024.items}
        />
      </div>
      <p className="mt-3 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        &ldquo;Returns&rdquo; measure movement, not durable return: people
        counted as returned may have gone back to a damaged building, to
        relatives, or to a rental while awaiting repairs or compensation that,
        at the cut-off, no financed instrument had delivered.
      </p>
    </section>
  );
}
