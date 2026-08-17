import { roleRecords } from "@/lib/data";
import MatrixTables, { type MatrixRow, type YearMatrixData } from "./MatrixTables";
import type { Year } from "@/lib/types";

/**
 * Actor-by-action matrices, one per year: every traced actor as a row,
 * the twelve value-chain actions as columns, cell = number of entries
 * placing that actor in that action. Presence, never performance.
 *
 * The reduction runs on the server. It used to run in the browser, which
 * meant shipping the whole register - 663kb of action text the matrix
 * never shows - to produce 24kb of counts.
 */

function buildYear(year: Year): MatrixRow[] {
  const byBase = new Map<string, MatrixRow>();
  for (const r of roleRecords) {
    if (r.year !== year) continue;
    const base = r.actorName.split(":")[0].trim();
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

const MATRICES: YearMatrixData[] = [
  { year: 2024, rows: buildYear(2024) },
  { year: 2026, rows: buildYear(2026) },
];

export default function ActorStageMatrix() {
  return (
    <section aria-labelledby="actor-matrix">
      <h2
        id="actor-matrix"
        className="text-xl font-semibold text-[color:var(--color-navy)]"
      >
        Actor-by-action matrices
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        Every traced actor against the twelve value-chain actions, one
        matrix per year. Rows are grouped by layer and sorted by traced
        presence; a filled cell counts entries, not results.
      </p>
      <MatrixTables matrices={MATRICES} />
    </section>
  );
}
