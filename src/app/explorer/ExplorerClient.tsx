"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LAYER_META, STATUS_LABELS, COMPARABILITY_LABELS } from "@/lib/colors";
import { roleRecords, actors, STAGES, locations } from "@/lib/data";
import { useUrlState } from "@/lib/useUrlState";
import type { RoleRecord } from "@/lib/types";

const FUNCTION_COLUMNS = [...new Set(roleRecords.map((r) => r.functionColumn))].sort();

export default function ExplorerClient() {
  const { get, set, reset } = useUrlState({
    year: "all",
    layer: "all",
    stage: "all",
    fn: "all",
    status: "all",
    region: "all",
    q: "",
  });
  const [selected, setSelected] = useState<RoleRecord | null>(null);
  const [visible, setVisible] = useState(50);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selected) closeRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const q = get("q").toLowerCase();
    return roleRecords.filter((r) => {
      if (get("year") !== "all" && String(r.year) !== get("year")) return false;
      if (get("layer") !== "all" && r.actorLayer !== get("layer")) return false;
      if (get("stage") !== "all" && String(r.stageNo) !== get("stage")) return false;
      if (get("fn") !== "all" && r.functionColumn !== get("fn")) return false;
      if (get("status") !== "all" && r.implementationStatus !== get("status")) return false;
      if (get("region") !== "all" && !r.regions.includes(get("region"))) return false;
      if (
        q &&
        !r.actorName.toLowerCase().includes(q) &&
        !r.summary.toLowerCase().includes(q) &&
        !r.locationNames.some((l) => l.toLowerCase().includes(q))
      )
        return false;
      return true;
    });
  }, [get]);

  const actorEntry = selected
    ? actors.find((a) => a.id === selected.actorId)
    : null;
  const relatedRecords = selected
    ? roleRecords.filter((r) => r.actorId === selected.actorId && r.id !== selected.id)
    : [];
  const relatedActors = selected
    ? [
        ...new Set(
          roleRecords
            .filter(
              (r) =>
                r.stageNo === selected.stageNo &&
                r.year === selected.year &&
                r.actorId !== selected.actorId,
            )
            .map((r) => r.actorName.split(":")[0]),
        ),
      ].slice(0, 8)
    : [];

  const selectCls =
    "min-h-11 w-full rounded-md border border-[color:var(--color-border)] bg-white px-2.5 text-sm";

  return (
    <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
      {/* Filter sidebar / sheet */}
      <aside aria-label="Data filters" className="lg:sticky lg:top-[68px] lg:self-start">
        <details className="rounded-md border border-[color:var(--color-border)] bg-white lg:open:pb-4" open>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[color:var(--color-navy)]">
            Filters ({filtered.length} of {roleRecords.length} entries)
          </summary>
          <div className="space-y-3 px-4 pb-4">
            <div>
              <label htmlFor="ex-q" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Search</label>
              <input
                id="ex-q"
                type="search"
                defaultValue={get("q")}
                onKeyDown={(e) => { if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value); }}
                onBlur={(e) => set("q", e.target.value)}
                placeholder="Actor, place, keyword…"
                className={selectCls}
              />
            </div>
            <div>
              <label htmlFor="ex-year" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Year</label>
              <select id="ex-year" className={selectCls} value={get("year")} onChange={(e) => set("year", e.target.value)}>
                <option value="all">Both years</option>
                <option value="2024">2024</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div>
              <label htmlFor="ex-layer" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Actor layer</label>
              <select id="ex-layer" className={selectCls} value={get("layer")} onChange={(e) => set("layer", e.target.value)}>
                <option value="all">All layers</option>
                {LAYER_META.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-stage" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Value-chain stage</label>
              <select id="ex-stage" className={selectCls} value={get("stage")} onChange={(e) => set("stage", e.target.value)}>
                <option value="all">All stages</option>
                {STAGES.map((s, i) => (
                  <option key={s} value={String(i + 1)}>{i + 1}. {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-fn" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Function (source workbook column)</label>
              <select id="ex-fn" className={selectCls} value={get("fn")} onChange={(e) => set("fn", e.target.value)}>
                <option value="all">All functions</option>
                {FUNCTION_COLUMNS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-status" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Implementation status</label>
              <select id="ex-status" className={selectCls} value={get("status")} onChange={(e) => set("status", e.target.value)}>
                <option value="all">All statuses</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ex-region" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Region</label>
              <select id="ex-region" className={selectCls} value={get("region")} onChange={(e) => set("region", e.target.value)}>
                <option value="all">All regions</option>
                {locations.regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="pt-1">
              <button type="button" onClick={reset} className="min-h-11 w-full rounded-md border border-[color:var(--color-border)] bg-white text-sm text-[color:var(--color-text-secondary)]">
                Reset all filters
              </button>
            </div>
          </div>
        </details>
      </aside>

      {/* Results */}
      <div className="mt-4 lg:mt-0">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto rounded-md border border-[color:var(--color-border)] bg-white md:block">
          <table className="min-w-full border-collapse text-[13px]">
            <caption className="sr-only">
              traced entries matching the current filters. Each row is
              one traced actor-function entry; select a row for detail.
            </caption>
            <thead>
              <tr>
                {["Year", "Actor", "Layer", "Stage", "Location", "Activity", "Status"].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap border-b-2 border-[color:var(--color-border)] px-2.5 py-2 text-left font-semibold text-[color:var(--color-navy)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visible).map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer odd:bg-[color:var(--color-bg)] hover:bg-[#EEF2F7]"
                  onClick={() => setSelected(r)}
                >
                  <td className="border-b border-[color:var(--color-border)] px-2.5 py-2 tabular-nums">
                    <span
                      className="rounded-sm px-1.5 py-0.5 text-[10.5px] font-semibold text-white"
                      style={{ background: r.year === 2024 ? "var(--color-y2024)" : "var(--color-y2026)" }}
                    >
                      {r.year}
                    </span>
                  </td>
                  <td className="max-w-[220px] border-b border-[color:var(--color-border)] px-2.5 py-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                      className="text-left font-medium text-[color:var(--color-navy)] underline-offset-2 hover:underline"
                    >
                      {r.actorName.split(":")[0]}
                    </button>
                  </td>
                  <td className="border-b border-[color:var(--color-border)] px-2.5 py-2">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: LAYER_META.find((l) => l.id === r.actorLayer)?.color }} />
                      {LAYER_META.find((l) => l.id === r.actorLayer)?.short}
                    </span>
                  </td>
                  <td className="border-b border-[color:var(--color-border)] px-2.5 py-2">{r.stage}</td>
                  <td className="max-w-[160px] border-b border-[color:var(--color-border)] px-2.5 py-2 text-[color:var(--color-text-secondary)]">
                    {r.locationNames.slice(0, 2).join("; ") || "-"}
                  </td>
                  <td className="border-b border-[color:var(--color-border)] px-2.5 py-2">{r.functionColumn}</td>
                  <td className="whitespace-nowrap border-b border-[color:var(--color-border)] px-2.5 py-2">{STATUS_LABELS[r.implementationStatus]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="space-y-3 md:hidden">
          {filtered.slice(0, visible).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelected(r)}
                className="w-full card p-3.5 text-left"
              >
                <p className="flex items-center justify-between gap-2 text-[11px] text-[color:var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: LAYER_META.find((l) => l.id === r.actorLayer)?.color }} />
                    {LAYER_META.find((l) => l.id === r.actorLayer)?.short}
                  </span>
                  <span
                    className="rounded-sm px-1.5 py-0.5 text-[10.5px] font-semibold text-white"
                    style={{ background: r.year === 2024 ? "var(--color-y2024)" : "var(--color-y2026)" }}
                  >
                    {r.year}
                  </span>
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--color-navy)]">{r.actorName.split(":")[0]}</p>
                <p className="mt-0.5 text-xs text-[color:var(--color-text-secondary)]">
                  {r.stage} · {r.functionColumn} · {STATUS_LABELS[r.implementationStatus]}
                </p>
              </button>
            </li>
          ))}
        </ul>

        {filtered.length === 0 ? (
          <p className="card p-5 text-sm text-[color:var(--color-text-secondary)]">
            No entries match the current filters. Reset the filters to see all{" "}
            {roleRecords.length} entries.
          </p>
        ) : null}

        {filtered.length > visible ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setVisible((v) => v + 100)}
              className="min-h-11 rounded-md border border-[color:var(--color-border)] bg-white px-5 text-sm text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-navy)] hover:text-[color:var(--color-navy)]"
            >
              Show more ({filtered.length - visible} remaining)
            </button>
          </div>
        ) : null}
      </div>

      {/* Detail drawer */}
      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`entry detail for ${selected.actorName}`}
          className="fixed inset-0 z-[60] flex justify-end bg-black/30"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--color-border)] p-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                  {LAYER_META.find((l) => l.id === selected.actorLayer)?.label} · {selected.year} · {selected.stage}
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-[color:var(--color-navy)]">
                  {selected.actorName}
                </h3>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setSelected(null)}
                className="min-h-11 min-w-11 rounded border border-[color:var(--color-border)] text-sm"
              >
                <span className="sr-only">Close</span>
                <span aria-hidden>✕</span>
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              {/* No "Data summary" block: it is the mandate and the action
                  concatenated, so printing it here showed the same two
                  passages twice. It stays in the data, where the search
                  filter still reads it. */}
              {selected.formalMandate ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">Formal mandate</h4>
                  <p className="mt-1 leading-relaxed">{selected.formalMandate}</p>
                </section>
              ) : null}
              {selected.tracedAction ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">Traced action</h4>
                  <p className="mt-1 leading-relaxed">{selected.tracedAction}</p>
                </section>
              ) : null}
              <dl className="grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <dt className="font-semibold text-[color:var(--color-text-secondary)]">Implementation status</dt>
                  <dd>{STATUS_LABELS[selected.implementationStatus]}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[color:var(--color-text-secondary)]">Comparability</dt>
                  <dd>{COMPARABILITY_LABELS[selected.comparability]}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[color:var(--color-text-secondary)]">Function / sector column</dt>
                  <dd>{selected.functionColumn}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[color:var(--color-text-secondary)]">Locations</dt>
                  <dd>{selected.locationNames.join("; ") || "Not specified"}</dd>
                </div>
                {selected.financingRole ? (
                  <div>
                    <dt className="font-semibold text-[color:var(--color-text-secondary)]">Finance role</dt>
                    <dd>{selected.financingRole}</dd>
                  </div>
                ) : null}
                {selected.procurementRole ? (
                  <div>
                    <dt className="font-semibold text-[color:var(--color-text-secondary)]">Procurement role</dt>
                    <dd>{selected.procurementRole}</dd>
                  </div>
                ) : null}
              </dl>
              {actorEntry?.deJureDeFacto ? (
                <section className="rounded-md bg-[color:var(--color-bg)] p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">De jure vs de facto</h4>
                  <p className="mt-1 text-[13px] leading-relaxed">{actorEntry.deJureDeFacto}</p>
                </section>
              ) : null}
              <section>
                <p className="text-xs text-[color:var(--color-text-secondary)]">
                  Verification note: this entry marks traced presence.
                  It is not proof of expenditure,
                  effectiveness or completed output; statuses above
                  &ldquo;traced activity&rdquo; are assigned only where the
                  underlying text supports them.
                </p>
              </section>
              {relatedRecords.length > 0 ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                    Same actor, other stages ({relatedRecords.length})
                  </h4>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {relatedRecords.slice(0, 8).map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(r)}
                          className="rounded-sm bg-[color:var(--color-bg)] px-2 py-1 text-xs hover:bg-[#EEF2F7]"
                        >
                          {r.stage}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {relatedActors.length > 0 ? (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                    Related actors in this stage and year
                  </h4>
                  <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]">
                    {relatedActors.join("; ")}
                  </p>
                </section>
              ) : null}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">Related news</h4>
                <p className="mt-1 text-[13px]">
                  <Link
                    href={`/news?stage=${encodeURIComponent(selected.stage)}`}
                    className="text-[color:var(--color-blue)] underline underline-offset-2"
                  >
                    Open live coverage tagged &ldquo;{selected.stage}&rdquo; →
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
