"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { LAYER_META, STATUS_LABELS } from "@/lib/colors";
import { STAGE_SHORT, STAGES, changeFor, countsFor, CAUTION_COUNTS } from "@/lib/data-client";
import { recordsForCell } from "@/lib/data";
import type { ActorLayer } from "@/lib/types";
import { signed } from "@/lib/format";

/**
 * Visual 2 - Direct-change heatmap. Rows: four actor layers.
 * Columns: twelve stages. Value: 2026 count minus 2024 count.
 * Clicking a cell opens the underlying actors, actions, locations and citations.
 *
 * `showCaveat` lets a page that already prints the standing counts caution
 * under an earlier figure suppress the repeat here. It defaults to on, so a
 * figure standing alone still carries it.
 */
export default function ChangeHeatmap({ showCaveat = true }: { showCaveat?: boolean } = {}) {
  const [cell, setCell] = useState<{ layer: ActorLayer; stageNo: number } | null>(null);
  const chartRef = useRef<ECharts | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cell) closeRef.current?.focus();
  }, [cell]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCell(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data, maxAbs } = useMemo(() => {
    const cells: [number, number, number][] = [];
    for (let li = 0; li < LAYER_META.length; li++) {
      const change = changeFor(LAYER_META[li].id);
      for (let si = 0; si < 12; si++) {
        cells.push([si, li, change[si]]);
      }
    }
    return {
      data: cells,
      maxAbs: Math.max(...cells.map(([, , v]) => Math.abs(v))),
    };
  }, []);

  const option = useMemo<EChartsOption>(
    () => ({
      grid: { left: 210, right: 20, top: 10, bottom: 90 },
      tooltip: {
        formatter: (p) => {
          const { value } = p as unknown as { value: [number, number, number] };
          const [si, li, v] = value;
          const layer = LAYER_META[li];
          const y24 = countsFor(2024, layer.id)[si];
          const y26 = countsFor(2026, layer.id)[si];
          return `<strong>${STAGES[si]}</strong><br/>${layer.label}<br/>2024: ${y24} · 2026: ${y26} · Change: <strong>${signed(v)}</strong><br/><em>Click for underlying data</em>`;
        },
      },
      xAxis: {
        type: "category",
        data: STAGE_SHORT,
        position: "bottom",
        axisLabel: { rotate: 38, fontSize: 10.5 },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
      },
      yAxis: {
        type: "category",
        data: LAYER_META.map((l) => l.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11.5 },
      },
      visualMap: {
        show: true,
        type: "continuous",
        min: -maxAbs,
        max: maxAbs,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 62,
        itemWidth: 10,
        itemHeight: 90,
        text: ["gain (teal)", "contraction (rust)"],
        textStyle: { fontSize: 10 },
        inRange: {
          color: ["#BD5A46", "#E4B3A7", "#FFFFFF", "#9CC7CE", "#1B8295"],
        },
      },
      series: [
        {
          type: "heatmap",
          data,
          // Cells are unlabelled. The change is in the tooltip, in the
          // figure's description and in the drawer a click opens.
          label: { show: false },
          itemStyle: { borderColor: "#FAFAF7", borderWidth: 2 },
          emphasis: {
            itemStyle: { borderColor: "#173B63", borderWidth: 2 },
          },
        },
      ],
    }),
    [maxAbs, data],
  );

  const records = cell
    ? recordsForCell(cell.layer, cell.stageNo).sort((a, b) => a.year - b.year)
    : [];

  const tableRows = LAYER_META.flatMap((layer) =>
    STAGES.map((stage, i) => [
      layer.label,
      stage,
      countsFor(2024, layer.id)[i],
      countsFor(2026, layer.id)[i],
      signed(changeFor(layer.id)[i]),
    ]),
  );

  return (
    <div className="relative">
      <ChartFrame
        id="change-heatmap"
        title="Direct change in traced presence, 2026 minus 2024"
        subtitle="Teal marks gains in traced actor-stage presence; rust marks contraction; white marks no change. Hover a cell for its value, or click it for the entries behind that change."
        caveat={showCaveat ? CAUTION_COUNTS : undefined}
        sourceIds={["S-TRACKING"]}
        chartRef={chartRef}
        description="Heatmap of change in traced actor presence between 2024 and 2026 across four actor layers and twelve value-chain stages. The largest gains are community relief (+35) and community coordination (+25); the deepest contractions are community finance (−11) and community rubble clearance (−9)."
        table={{
          caption: "Change in traced actor-stage presence, 2026 minus 2024.",
          headers: ["Actor layer", "Stage", "2024", "2026", "Change"],
          rows: tableRows,
        }}
      >
        <EChart
          option={option}
          height={330}
          ariaLabel="Heatmap of change in traced actor presence by layer and stage"
          onInit={(c) => {
            chartRef.current = c;
          }}
          onEvents={{
            click: (p) => {
              const params = p as { value?: [number, number, number] };
              if (!params.value) return;
              const [si, li] = params.value;
              setCell({ layer: LAYER_META[li].id, stageNo: si + 1 });
            },
          }}
        />
      </ChartFrame>

      {cell ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Data for ${LAYER_META.find((l) => l.id === cell.layer)?.label} in ${STAGES[cell.stageNo - 1]}`}
          className="fixed inset-0 z-[60] flex justify-end bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCell(null);
          }}
        >
          <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--color-border)] p-4">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                  {LAYER_META.find((l) => l.id === cell.layer)?.label} ·{" "}
                  {STAGES[cell.stageNo - 1]}
                </h3>
                <p className="mt-0.5 text-xs text-[color:var(--color-text-secondary)]">
                  {countsFor(2024, cell.layer)[cell.stageNo - 1]} traced in
                  2024 · {countsFor(2026, cell.layer)[cell.stageNo - 1]} in 2026
                  (analysis) · {records.length} traced entries
                  shown below
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setCell(null)}
                className="min-h-11 min-w-11 rounded border border-[color:var(--color-border)] text-sm"
              >
                <span className="sr-only">Close</span>
                <span aria-hidden>✕</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {records.length === 0 ? (
                <p className="text-sm text-[color:var(--color-text-secondary)]">
                  No traced entries map to this cell at function-column
                  grain. The analytical count above is recomputed at entry
                  level from the underlying tracking, which is finer
                  grained than the chart figures by construction.
                </p>
              ) : (
                <ul className="space-y-4">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className="rounded border border-[color:var(--color-border)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[color:var(--color-navy)]">
                          {r.actorName}
                        </p>
                        <span
                          className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white"
                          style={{
                            background:
                              r.year === 2024
                                ? "var(--color-y2024)"
                                : "var(--color-y2026)",
                          }}
                        >
                          {r.year}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
                        {r.functionColumn} ·{" "}
                        {STATUS_LABELS[r.implementationStatus]}
                        {r.locationNames.length > 0
                          ? ` · ${r.locationNames.slice(0, 3).join("; ")}`
                          : ""}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-text)]">
                        {r.summary}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
