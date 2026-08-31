import { roleRecords } from "@/lib/data";
import MatrixTables, { type MatrixRow, type YearMatrixData } from "./MatrixTables";
import type { Year } from "@/lib/types";
import type { Locale } from "@/lib/vocab";
import { actorBase, actorLabel } from "@/lib/actor-names";
import { actorAnchor } from "./actor-anchor";

const HEAD = {
  en: {
    title: "Actor-by-stage matrices",
    lede: "Every traced actor against the twelve stages of the response, one matrix per year. Rows are gathered by actor group and sorted by traced activity; a filled cell counts entries, not results.",
  },
  ar: {
    title: "مصفوفات الجهات مقابل المراحل",
    lede: "كل جهة مرصودة مقابل مراحل الاستجابة الاثنتي عشرة، مصفوفة لكل سنة. الصفوف مجمّعة بحسب مجموعة الجهات ومرتّبة بحسب النشاط المرصود؛ والخلية المملوءة تعدّ مدخلات، لا نتائج.",
  },
} as const;

/**
 * Actor-by-stage matrices, one per year: every traced actor as a row,
 * the twelve stages of the response as columns, cell = number of entries
 * placing that actor in that stage. Activity, never performance - and
 * always a single actor's own counts, which the no-numbers rule for
 * group comparisons permits.
 *
 * The reduction runs on the server. It used to run in the browser, which
 * meant shipping the whole register - 663kb of action text the matrix
 * never shows - to produce 24kb of counts.
 */

function buildYear(year: Year, locale: Locale): MatrixRow[] {
  const byBase = new Map<string, MatrixRow>();
  for (const r of roleRecords) {
    if (r.year !== year) continue;
    const raw = actorBase(r.actorName);
    const base = actorLabel(raw, locale);
    if (!byBase.has(base)) {
      byBase.set(base, {
        base,
        // The row name links into the register's group for that actor.
        anchor: actorAnchor(raw),
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
        className="text-h2 font-semibold text-navy"
      >
        {h.title}
      </h2>
      <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
        {h.lede}
      </p>
      <MatrixTables matrices={MATRICES[locale]} locale={locale} />
    </section>
  );
}
