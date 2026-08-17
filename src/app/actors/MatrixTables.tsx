"use client";

import { Fragment, useState } from "react";
import { LAYER_META } from "@/lib/colors";
import { STAGES, STAGE_SHORT } from "@/lib/data-client";
import type { ActorLayer, Year } from "@/lib/types";

/**
 * The interactive half of the actor-by-action matrices. It receives the
 * counts already reduced on the server and never imports the register
 * itself: a client component that touched role-records.json pulled the
 * whole 663kb file into the browser bundle to render numbers that come to
 * 24kb.
 */

export type MatrixRow = {
  base: string;
  layer: ActorLayer;
  cells: number[];
  total: number;
};

export type YearMatrixData = { year: Year; rows: MatrixRow[] };

function YearMatrix({ year, rows, query }: { year: Year; rows: MatrixRow[]; query: string }) {
  const q = query.trim().toLowerCase();
  const yearColor = year === 2024 ? "#58779B" : "#2F8F6B";
  const groups = LAYER_META.map((meta) => ({
    meta,
    rows: rows
      .filter((r) => r.layer === meta.id && (!q || r.base.toLowerCase().includes(q)))
      .sort((a, b) => b.total - a.total),
  })).filter((g) => g.rows.length > 0);
  const shown = groups.reduce((a, g) => a + g.rows.length, 0);
  const maxCell = Math.max(1, ...rows.flatMap((r) => r.cells));

  return (
    <figure className="card p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          <span
            aria-hidden
            className="mr-2 inline-block h-3 w-3 rounded-sm align-baseline"
            style={{ background: yearColor }}
          />
          {year}: {shown} actors × 12 actions
        </h3>
        <span className="text-[11px] text-[color:var(--color-text-secondary)]">
          cell = entries placing the actor in that action; darker = more
        </span>
      </figcaption>
      <div className="mt-3 max-h-[70vh] overflow-auto rounded-md border border-[color:var(--color-border)]">
        <table className="min-w-[860px] border-collapse text-[12px]">
          <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_var(--color-border)]">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 bg-white px-2 py-2 text-left font-semibold text-[color:var(--color-navy)]"
              >
                Actor
              </th>
              {STAGE_SHORT.map((s, i) => (
                <th
                  key={s}
                  scope="col"
                  className="min-w-[58px] px-1 py-2 text-center align-bottom font-semibold leading-tight text-[color:var(--color-text-secondary)]"
                >
                  <abbr title={`${i + 1}. ${STAGES[i]}`} className="no-underline">
                    <span className="block tabular-nums text-[color:var(--color-navy)]">{i + 1}</span>
                    <span className="block text-[9.5px] font-medium">{s}</span>
                  </abbr>
                </th>
              ))}
              <th
                scope="col"
                className="px-2 py-2 text-right font-semibold text-[color:var(--color-navy)]"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.meta.id}>
                <tr>
                  <th
                    colSpan={14}
                    scope="colgroup"
                    className="sticky left-0 bg-[#F3F5F8] px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide"
                    style={{ color: g.meta.color }}
                  >
                    {g.meta.label} · {g.rows.length} actors
                  </th>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.base} className="border-t border-[#EDF0F4] hover:bg-[#F8FAFC]">
                    <th
                      scope="row"
                      className="sticky left-0 max-w-[280px] truncate bg-white px-2 py-1 text-left font-medium text-[color:var(--color-text)]"
                      title={r.base}
                    >
                      {r.base}
                    </th>
                    {r.cells.map((c, i) =>
                      c > 0 ? (
                        <td key={i} className="px-1 py-1 text-center">
                          <span
                            className="inline-flex h-5 w-9 items-center justify-center rounded-[3px] text-[10.5px] font-bold tabular-nums text-white"
                            style={{
                              background: g.meta.color,
                              opacity: 0.35 + (c / maxCell) * 0.65,
                            }}
                            title={`${r.base} - ${STAGES[i]}: ${c} entry${c === 1 ? "" : "s"}`}
                          >
                            {c}
                          </span>
                        </td>
                      ) : (
                        // Empty cells outnumber filled ones roughly three to
                        // one, so the blank swatch is drawn by the cell
                        // itself rather than by a span inside it.
                        <td key={i} className="cell-empty" />
                      ),
                    )}
                    <td className="px-2 py-1 text-right font-semibold tabular-nums text-[color:var(--color-navy)]">
                      {r.total}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

export default function MatrixTables({ matrices }: { matrices: YearMatrixData[] }) {
  const [query, setQuery] = useState("");
  return (
    <>
      <div className="mt-3 max-w-xs">
        <label
          htmlFor="matrix-search"
          className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]"
        >
          Filter actors
        </label>
        <input
          id="matrix-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. municipality, UNDP, CDR"
          className="mt-1 min-h-11 w-full rounded-md border border-[color:var(--color-border)] bg-white px-2.5 text-sm"
        />
      </div>
      <div className="mt-4 space-y-6">
        {matrices.map((m) => (
          <YearMatrix key={m.year} year={m.year} rows={m.rows} query={query} />
        ))}
      </div>
    </>
  );
}
