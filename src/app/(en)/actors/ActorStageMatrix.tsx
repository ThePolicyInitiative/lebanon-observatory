import { roleRecords } from "@/lib/data";
import MatrixTables, { type MatrixRow, type YearMatrixData } from "./MatrixTables";
import type { Year } from "@/lib/types";
import type { Locale } from "@/lib/vocab";
import { actorBase, actorLabel } from "@/lib/actor-names";

const HEAD = {
  en: {
    title: "Actor-by-action matrices",
    lede: "Every traced actor against the twelve value-chain actions, one matrix per year. Rows are grouped by layer and sorted by traced presence; a filled cell counts entries, not results.",
  },
  ar: {
    title: "مصفوفات الجهات مقابل الأفعال",
    lede: "كل جهة مرصودة مقابل أفعال سلسلة القيمة الاثني عشر، مصفوفة لكل سنة. الصفوف مجمّعة بحسب الطبقة ومرتّبة بحسب الحضور المرصود؛ والخلية المملوءة تعدّ مدخلات، لا نتائج.",
  },
} as const;

/**
 * Actor-by-action matrices, one per year: every traced actor as a row,
 * the twelve value-chain actions as columns, cell = number of entries
 * placing that actor in that action. Presence, never performance.
 *
 * The reduction runs on the server. It used to run in the browser, which
 * meant shipping the whole register - 663kb of action text the matrix
 * never shows - to produce 24kb of counts.
 */

function buildYear(year: Year, locale: Locale): MatrixRow[] {
  const byBase = new Map<string, MatrixRow>();
  for (const r of roleRecords) {
    if (r.year !== year) continue;
    const base = actorLabel(actorBase(r.actorName), locale);
    if (!byBase.has(base)) {
      byBase.set(base, {
        base,
        layer: r.actorLayer,
        cells: Array.from({ length: 12 }, () => 0),
        total: 0,
      });
    }
    const row = byBase.get(base)!;
    row.cells[r.stageNo - 1] += 1;
    row.total += 1;
  }
  return [...byBase.values()];
}

/** Built once per language, at module scope, not per render. */
const MATRICES: Record<Locale, YearMatrixData[]> = {
  en: [
    { year: 2024, rows: buildYear(2024, "en") },
    { year: 2026, rows: buildYear(2026, "en") },
  ],
  ar: [
    { year: 2024, rows: buildYear(2024, "ar") },
    { year: 2026, rows: buildYear(2026, "ar") },
  ],
};

export default function ActorStageMatrix({ locale = "en" }: { locale?: Locale } = {}) {
  const h = HEAD[locale];
  return (
    <section aria-labelledby="actor-matrix">
      <h2
        id="actor-matrix"
        className="text-xl font-semibold text-[color:var(--color-navy)]"
      >
        {h.title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        {h.lede}
      </p>
      <MatrixTables matrices={MATRICES[locale]} locale={locale} />
    </section>
  );
}
