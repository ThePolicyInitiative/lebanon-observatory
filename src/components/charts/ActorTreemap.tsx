"use client";

import { useMemo, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { LAYER_META } from "@/lib/colors";
import { roleRecords } from "@/lib/data";
import type { Year } from "@/lib/types";

/**
 * Treemap of the traced actor landscape: one cell per named actor,
 * area = traced role mentions, grouped and coloured by layer. The
 * spec palette's teal/plum pair is CVD-tight, so identity never rides on
 * colour alone: cells are grouped by layer region, separated by white
 * gaps and direct-labelled wherever they are large enough to read.
 */
export default function ActorTreemap() {
  const chartRef = useRef<ECharts | null>(null);
  const [year, setYear] = useState<Year>(2026);

  const { option, layerTotals } = useMemo(() => {
    const byLayer = new Map<string, Map<string, number>>();
    for (const r of roleRecords) {
      if (r.year !== year) continue;
      const actor = r.actorName.split(":")[0].trim();
      if (!byLayer.has(r.actorLayer)) byLayer.set(r.actorLayer, new Map());
      const m = byLayer.get(r.actorLayer)!;
      m.set(actor, (m.get(actor) ?? 0) + 1);
    }
    const totals = LAYER_META.map((l) => ({
      ...l,
      total: [...(byLayer.get(l.id)?.values() ?? [])].reduce((a, b) => a + b, 0),
      actors: byLayer.get(l.id)?.size ?? 0,
    }));
    const opt: EChartsOption = {
      tooltip: {
        formatter: (p) => {
          const item = p as { name?: string; value?: number; treePathInfo?: { name: string }[] };
          const layer = item.treePathInfo?.[1]?.name ?? "";
          return `<strong>${item.name}</strong><br/>${layer}<br/>${item.value} traced mention${item.value === 1 ? "" : "s"} in ${year}`;
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          width: "100%",
          height: "100%",
          top: 0,
          label: {
            show: true,
            fontSize: 11,
            color: "#FFFFFF",
            formatter: (p) => {
              const item = p as unknown as { name: string; value: number };
              return `${item.name}\n${item.value}`;
            },
          },
          upperLabel: {
            show: true,
            height: 22,
            fontSize: 11,
            fontWeight: 700,
            color: "#FFFFFF",
          },
          itemStyle: { borderColor: "#FFFFFF", borderWidth: 2, gapWidth: 2 },
          levels: [
            { itemStyle: { borderColor: "#FFFFFF", borderWidth: 0, gapWidth: 4 } },
            { itemStyle: { borderColor: "#FFFFFF", borderWidth: 2, gapWidth: 3 } },
            { itemStyle: { borderWidth: 1, gapWidth: 1 } },
          ],
          data: totals
            .filter((l) => l.total > 0)
            .map((l) => ({
              name: l.label,
              itemStyle: { color: l.color },
              children: [...(byLayer.get(l.id)?.entries() ?? [])]
                .sort((a, b) => b[1] - a[1])
                .map(([actor, count]) => ({
                  name: actor,
                  value: count,
                  itemStyle: { color: l.color },
                })),
            })),
        },
      ],
    };
    return { option: opt, layerTotals: totals };
  }, [year]);

  return (
    <ChartFrame
      id="actor-treemap"
      title="The traced actor landscape, cell by cell"
      subtitle={`Every named actor in the ${year} tracking - cell area is its number of traced role mentions, grouped by layer. Switch the year to watch the landscape recompose.`}
      caveat="Cell area measures traced presence in the tracking - not budget, staff or output. Actors traced under generic descriptions appear as traced; colour never carries identity alone (each readable cell is labelled)."
      chartRef={chartRef}
      description={`Treemap of traced actors in ${year}: ${layerTotals
        .map((l) => `${l.label} ${l.total} mentions across ${l.actors} actors`)
        .join("; ")}.`}
    >
      <div>
        <div className="mb-2 inline-flex overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white" role="radiogroup" aria-label="Treemap year">
          {([2024, 2026] as const).map((y) => (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={year === y}
              onClick={() => setYear(y)}
              className={`min-h-9 px-4 text-sm ${
                year === y ? "font-semibold text-white" : "text-[color:var(--color-text-secondary)]"
              }`}
              style={year === y ? { background: y === 2024 ? "#58779B" : "#2F8F6B" } : undefined}
            >
              {y}
            </button>
          ))}
        </div>
        <EChart
          option={option}
          height={420}
          ariaLabel={`Treemap of traced actors by layer, ${year}`}
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
        <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[color:var(--color-text-secondary)]">
          {layerTotals.map((l) => (
            <li key={l.id} className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}: {l.total} mentions · {l.actors} actors
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
}
