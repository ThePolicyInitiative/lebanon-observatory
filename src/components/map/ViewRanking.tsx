import { VALENCE } from "@/lib/colors";
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
    <figure className="card">
      <figcaption>
        <h3 className="text-body font-semibold text-navy">{head}</h3>
        <p className="mt-0.5 text-micro leading-relaxed text-text-secondary">
          {sub}
        </p>
      </figcaption>
      {top.length === 0 ? (
        <p className="mt-3 text-meta text-text-secondary">{t.empty}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {top.map((r) => {
            const positive = r.value >= 0;
            /*
             * One value for the bar and the figure beside it. It took two
             * for a while, because the old greens and rusts measured 3.99:1
             * and 4.45:1 as 12px text on the white card and could not be
             * asked to do both jobs. The darkened growth green clears
             * 7.96:1 and the rust 5.41:1, so the split is no longer earned.
             */
            const color = r.signed
              ? positive
                ? VALENCE.good
                : VALENCE.bad
              : "var(--color-navy)";
            return (
              <li key={r.key}>
                <p className="flex items-baseline justify-between gap-2 text-meta">
                  <span className="min-w-0 truncate text-text" title={r.label}>
                    {r.label}
                  </span>
                  {/*
                   * dir="ltr" so a leading + or - stays on the left of the
                   * digits. A bare sign carries no direction of its own, so
                   * in the Arabic document it took the paragraph's and
                   * rendered to the right of the number - "35+" where the
                   * value is +35, and worse for a negative, which a reader
                   * can take for a different number rather than a mirrored
                   * one.
                   */}
                  <span
                    dir="ltr"
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
                  <p className="mt-0.5 text-micro leading-snug text-text-secondary">
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
