import type { Locale } from "@/lib/vocab";

/**
 * The ranked places behind whichever map view is open.
 *
 * Three of the four views were a shaded shape and nothing else: the
 * reader could see that somewhere was darker without being able to say
 * which place, or by how much. This puts the same quantity in order,
 * beside the map, in the language of that view - entries, change,
 * damaged housing units, buildings destroyed.
 *
 * It is the map's own numbers, not a second source, so the two cannot
 * disagree.
 */

export type RankRow = {
  key: string;
  label: string;
  value: number;
  /** Printed instead of the raw value where the view has its own unit. */
  display?: string;
  /** Diverging views colour by sign; the rest use one colour. */
  signed?: boolean;
  note?: string;
};

const T = {
  en: {
    entries: "Most traced entries",
    entriesSub: "Places by how many entries name them in this year.",
    change: "Biggest change, 2026 minus 2024",
    changeSub: "Districts by the size of the shift in traced entries.",
    survey: "Most damaged housing units",
    surveySub: "Districts named in the December 2024 municipal survey.",
    damage: "Worst cadasters, 2026 assessment",
    damageSub: "Buildings assessed as completely destroyed.",
    empty: "Nothing to rank under the current filters.",
    units: "units",
  },
  ar: {
    entries: "الأكثر مدخلات مرصودة",
    entriesSub: "الأماكن بحسب عدد المدخلات التي تسمّيها في هذه السنة.",
    change: "أكبر فارق، 2026 ناقص 2024",
    changeSub: "الأقضية بحسب حجم التبدّل في المدخلات المرصودة.",
    survey: "الأكثر وحدات سكنية متضرّرة",
    surveySub: "الأقضية الواردة في المسح البلدي في كانون الأول 2024.",
    damage: "أسوأ العقارات، تقييم 2026",
    damageSub: "أبنية قُيّمت على أنها مدمَّرة كلياً.",
    empty: "لا شيء للترتيب ضمن الترشيح الحالي.",
    units: "وحدة",
  },
} as const;

export default function ViewRanking({
  view,
  rows,
  locale = "en",
  limit = 8,
}: {
  view: "entries" | "change" | "survey" | "damage";
  rows: RankRow[];
  locale?: Locale;
  limit?: number;
}) {
  const t = T[locale];
  const head = { entries: t.entries, change: t.change, survey: t.survey, damage: t.damage }[view];
  const sub = {
    entries: t.entriesSub,
    change: t.changeSub,
    survey: t.surveySub,
    damage: t.damageSub,
  }[view];

  const top = [...rows]
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, limit);
  const max = Math.max(1, ...top.map((r) => Math.abs(r.value)));

  return (
    <figure className="card p-4">
      <figcaption>
        <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">{head}</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {sub}
        </p>
      </figcaption>
      {top.length === 0 ? (
        <p className="mt-3 text-[12px] text-[color:var(--color-text-secondary)]">{t.empty}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {top.map((r) => {
            const positive = r.value >= 0;
            const color = r.signed
              ? positive
                ? "#2F8F6B"
                : "#BD5A46"
              : "var(--color-navy)";
            return (
              <li key={r.key}>
                <p className="flex items-baseline justify-between gap-2 text-[12px]">
                  <span className="min-w-0 truncate text-[color:var(--color-text)]" title={r.label}>
                    {r.label}
                  </span>
                  <span
                    className="shrink-0 tabular-nums font-semibold"
                    style={{ color }}
                  >
                    {r.display ??
                      (r.signed && positive ? `+${r.value}` : r.value.toLocaleString("en-US"))}
                  </span>
                </p>
                <span
                  aria-hidden
                  className="mt-0.5 block h-1.5 rounded-sm"
                  style={{
                    width: `${(Math.abs(r.value) / max) * 100}%`,
                    minWidth: 3,
                    background: color,
                    opacity: 0.85,
                  }}
                />
                {r.note ? (
                  <p className="mt-0.5 text-[10.5px] leading-snug text-[color:var(--color-text-secondary)]">
                    {r.note}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </figure>
  );
}
