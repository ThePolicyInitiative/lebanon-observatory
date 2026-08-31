import { roleRecords } from "@/lib/data";
import {
  CATEGORY_ORDER,
  actionCategory,
  finding,
  stageCategoryId,
  type ActionCategoryId,
} from "@/lib/framework";
import { AR_COUNT, arabicCount, stageLabel, type Locale } from "@/lib/vocab";
import SeeMore from "@/components/SeeMore";
import type { Year } from "@/lib/types";

/**
 * What kind of work the traced entries describe: the four action
 * categories of the report's frame, counted per year across all four
 * groups together.
 *
 * Category and stage totals summed across the groups are printable -
 * they compare kinds of work, not groups - which is why this module may
 * label its bars while the group figures above it may not. For the same
 * reason the bars are one neutral colour: a group hue here would imply a
 * breakdown this section deliberately does not draw.
 *
 * Server-rendered; the reduction over the full entry log stays here.
 */

const YEARS: readonly Year[] = [2024, 2026] as const;

/** Entries per stage per year, reduced once at module scope. */
const STAGE_YEAR: Record<number, Record<Year, number>> = {};
for (let no = 1; no <= 12; no++) STAGE_YEAR[no] = { 2024: 0, 2026: 0 };
for (const r of roleRecords) STAGE_YEAR[r.stageNo][r.year] += 1;

/** The stageNos each category gathers, in stage order. */
const STAGES_BY_CATEGORY: Record<ActionCategoryId, number[]> = {
  financial: [],
  damage: [],
  relief: [],
  reconstruction: [],
};
for (let no = 1; no <= 12; no++) STAGES_BY_CATEGORY[stageCategoryId(no)].push(no);

function categoryTotal(id: ActionCategoryId, year: Year): number {
  return STAGES_BY_CATEGORY[id].reduce((sum, no) => sum + STAGE_YEAR[no][year], 0);
}

/** One scale for all eight bars, so lengths compare across the section. */
const MAX = Math.max(
  ...CATEGORY_ORDER.flatMap((id) => YEARS.map((y) => categoryTotal(id, y))),
);

function enEntries(n: number): string {
  return n === 1 ? "1 entry" : `${n} entries`;
}

const T = {
  en: {
    heading: "What kind of work was traced",
    intro:
      "Every traced entry sits in one of the four action categories of the frame. Each bar counts entries across all four groups together, one bar per year, all on one scale.",
    entries: (n: number) => enEntries(n),
    seeStages: "the stages of the response this category counts",
    stageYears: (a: number, b: number) =>
      `In 2024: ${enEntries(a)} · in 2026: ${enEntries(b)}`,
  },
  ar: {
    heading: "أي نوع من العمل رُصد",
    intro:
      "كل مدخل مرصود يقع في واحدة من فئات الأفعال الأربع في الإطار. يعدّ كل شريط المدخلات عبر المجموعات الأربع معاً، شريط لكل سنة، وعلى مقياس واحد.",
    entries: (n: number) => arabicCount(n, AR_COUNT.entry),
    seeStages: "مراحل الاستجابة التي تعدّها هذه الفئة",
    stageYears: (a: number, b: number) =>
      `سنة 2024: ${arabicCount(a, AR_COUNT.entry)} · سنة 2026: ${arabicCount(b, AR_COUNT.entry)}`,
  },
} as const;

export default function CategoryMix({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const id = locale === "ar" ? "ar-action-mix" : "action-mix";
  return (
    <section aria-labelledby={id} className="mt-9">
      <h2 id={id} className="text-h2 font-semibold text-navy">
        {t.heading}
      </h2>
      <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
        {t.intro}
      </p>
      <ul className="mt-4 space-y-3">
        {CATEGORY_ORDER.map((cid) => {
          const cat = actionCategory(cid, locale);
          return (
            <li key={cid} className="card">
              <h3 className="text-body font-semibold text-navy">{cat.name}</h3>
              {YEARS.map((year) => {
                const n = categoryTotal(cid, year);
                return (
                  <div key={year} className="mt-2 flex items-center gap-3">
                    <span className="w-11 shrink-0 text-micro font-semibold tabular-nums text-text-secondary">
                      {year}
                    </span>
                    <div
                      aria-hidden="true"
                      className="h-3 min-w-0 flex-1 overflow-hidden rounded-sm bg-surface"
                    >
                      <div
                        className="h-full rounded-sm bg-navy"
                        style={{ width: `${(n / MAX) * 100}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-micro tabular-nums text-text-secondary">
                      {t.entries(n)}
                    </span>
                  </div>
                );
              })}
              <SeeMore label={t.seeStages} locale={locale}>
                <ul className="space-y-1.5 text-meta leading-relaxed">
                  {STAGES_BY_CATEGORY[cid].map((no) => (
                    <li key={no} className="flex flex-wrap items-baseline gap-x-3">
                      <span className="font-medium text-text">
                        {stageLabel(no, locale)}
                      </span>
                      <span className="tabular-nums text-text-secondary">
                        {t.stageYears(STAGE_YEAR[no][2024], STAGE_YEAR[no][2026])}
                      </span>
                    </li>
                  ))}
                </ul>
              </SeeMore>
            </li>
          );
        })}
      </ul>
      {/* The reading, stated once and verbatim from the report's findings
          rather than re-worded here. */}
      <p className="mt-4 max-w-3xl text-meta leading-relaxed text-text-secondary">
        {finding("stages", locale).title}.
      </p>
    </section>
  );
}
