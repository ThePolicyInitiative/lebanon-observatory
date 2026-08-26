"use client";

import { Fragment, useState } from "react";
import { layers, stageList, stageShortList, type Locale } from "@/lib/vocab";
import type { ActorLayer, Year } from "@/lib/types";
import { YEAR_COLORS } from "@/lib/colors";

const T = {
  en: {
    heading: "Actor-by-action matrices",
    lede: "Every traced actor against the twelve value-chain actions, one matrix per year. Rows are grouped by layer and sorted by traced presence; a filled cell counts entries, not results.",
    filter: "Filter actors",
    placeholder: "e.g. municipality, UNDP, CDR",
    panel: (y: number, n: number) => `${y}: ${n} actors × 12 actions`,
    legend: "cell = entries placing the actor in that action; darker = more",
    actor: "Actor",
    total: "Total",
    actors: (n: number) => `${n} actors`,
    cell: (a: string, s: string, n: number) => `${a} - ${s}: ${n} entr${n === 1 ? "y" : "ies"}`,
  },
  ar: {
    heading: "مصفوفات الجهات مقابل الأفعال",
    lede: "كل جهة مرصودة مقابل أفعال سلسلة القيمة الاثني عشر، مصفوفة لكل سنة. الصفوف مجمّعة بحسب الطبقة ومرتّبة بحسب الحضور المرصود؛ والخلية المملوءة تعدّ مدخلات، لا نتائج.",
    filter: "ترشيح الجهات",
    placeholder: "مثلاً: بلدية، UNDP، مجلس الإنماء",
    panel: (y: number, n: number) => `${y}: ${n} جهة × 12 فعلاً`,
    legend: "الخلية = مدخلات تضع الجهة في ذلك الفعل؛ الأغمق أكثر",
    actor: "الجهة",
    total: "المجموع",
    // Arabic counts agree with the noun: one, two, the 3-10 plural, then
    // the singular again from 11 up.
    actors: (n: number) =>
      n === 1 ? "جهة واحدة" : n === 2 ? "جهتان" : n <= 10 ? `${n} جهات` : `${n} جهة`,
    cell: (a: string, s: string, n: number) =>
      `${a} - ${s}: ${
        n === 1 ? "مدخل واحد" : n === 2 ? "مدخلان" : n <= 10 ? `${n} مدخلات` : `${n} مدخلاً`
      }`,
  },
} as const;

/**
 * The interactive half of the actor-by-action matrices. It receives the
 * counts already reduced on the server and never imports the register
 * itself: a client component that touched role-records.json pulled the
 * whole 663kb file into the browser bundle to render numbers that come to
 * 24kb.
 */

export type MatrixRow = {
  base: string;
  /** The register anchor for this actor; the same in both languages. */
  anchor: string;
  layer: ActorLayer;
  cells: number[];
  total: number;
};

export type YearMatrixData = { year: Year; rows: MatrixRow[] };

function YearMatrix({ year, rows, query, locale }: { year: Year; rows: MatrixRow[]; query: string; locale: Locale }) {
  const t = T[locale];
  const STAGES = stageList(locale);
  const STAGE_SHORT = stageShortList(locale);
  const q = query.trim().toLowerCase();
  const yearColor = year === 2024 ? YEAR_COLORS.y2024 : YEAR_COLORS.y2026;
  const groups = layers(locale).map((meta) => ({
    meta,
    rows: rows
      .filter((r) => r.layer === meta.id && (!q || r.base.toLowerCase().includes(q)))
      .sort((a, b) => b.total - a.total),
  })).filter((g) => g.rows.length > 0);
  const shown = groups.reduce((a, g) => a + g.rows.length, 0);
  const maxCell = Math.max(1, ...rows.flatMap((r) => r.cells));

  return (
    <figure className="card">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-navy">
          <span
            aria-hidden
            className="me-2 inline-block h-3 w-3 rounded-sm align-baseline"
            style={{ background: yearColor }}
          />
          {t.panel(year, shown)}
        </h3>
        <span className="text-[11px] text-text-secondary">
          {t.legend}
        </span>
      </figcaption>
      <div className="mt-3 max-h-[70vh] overflow-auto rounded-md border border-border">
        <table className="min-w-[860px] border-collapse text-[12px]">
          {/* The heading above the table is in a figcaption, which does not
              name the table itself for a screen reader. */}
          <caption className="sr-only">{t.panel(year, shown)}</caption>
          <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_var(--color-border)]">
            <tr>
              <th
                scope="col"
                className="sticky start-0 z-20 bg-white px-2 py-2 text-start font-semibold text-navy"
              >
                {t.actor}
              </th>
              {STAGE_SHORT.map((s, i) => (
                <th
                  key={s}
                  scope="col"
                  className="min-w-[58px] px-1 py-2 text-center align-bottom font-semibold leading-tight text-text-secondary"
                >
                  <abbr title={`${i + 1}. ${STAGES[i]}`} className="no-underline">
                    <span className="block tabular-nums text-navy">{i + 1}</span>
                    <span className="block text-[9.5px] font-medium">{s}</span>
                  </abbr>
                </th>
              ))}
              <th
                scope="col"
                className="px-2 py-2 text-end font-semibold text-navy"
              >
                {t.total}
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
                    className={`sticky start-0 bg-[#F3F5F8] px-2 py-1.5 text-start text-[11px] font-bold ${
                      locale === "ar" ? "" : "uppercase tracking-wide"
                    }`}
                    style={{ color: g.meta.color }}
                  >
                    {g.meta.label} · {t.actors(g.rows.length)}
                  </th>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.base} className="border-t border-[#EDF0F4] hover:bg-[#F8FAFC]">
                    <th
                      scope="row"
                      className="sticky start-0 max-w-[280px] truncate bg-white px-2 py-1 text-start font-medium text-text"
                      title={r.base}
                    >
                      {/* The row name is the way into that actor's entries
                          in the register below, on either language's page.
                          A plain anchor, not a Link: the register listens for
                          hashchange, and a router navigation whose only
                          difference is the fragment never fires one. */}
                      <a
                        href={`${locale === "ar" ? "/ar" : ""}/actors#${r.anchor}`}
                        className="text-inherit underline-offset-2 hover:underline"
                      >
                        {r.base}
                      </a>
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
                            title={t.cell(r.base, STAGES[i], c)}
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
                    <td className="px-2 py-1 text-end font-semibold tabular-nums text-navy">
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

export default function MatrixTables({ matrices, locale = "en" }: { matrices: YearMatrixData[]; locale?: Locale }) {
  const t = T[locale];
  const [query, setQuery] = useState("");
  return (
    <>
      <div className="mt-3 max-w-xs">
        <label
          htmlFor="matrix-search"
          className="block text-[11px] font-semibold text-text-secondary"
        >
          {t.filter}
        </label>
        <input
          id="matrix-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="mt-1 min-h-11 w-full rounded-md border border-border bg-white px-2.5 text-sm"
        />
      </div>
      <div className="mt-4 space-y-6">
        {matrices.map((m) => (
          <YearMatrix key={m.year} year={m.year} rows={m.rows} query={query} locale={locale} />
        ))}
      </div>
    </>
  );
}
