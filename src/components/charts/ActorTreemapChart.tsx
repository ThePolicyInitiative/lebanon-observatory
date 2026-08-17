"use client";

import { useMemo, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { LAYER_META } from "@/lib/colors";
import type { ActorLayer, Year } from "@/lib/types";

/**
 * The interactive half of the treemap. It takes counts already reduced on
 * the server: as a client component reading the register directly it pulled
 * role-records.json into the browser to draw one number per actor.
 */

export type TreemapYear = {
  year: Year;
  /** Per layer, each actor with its number of traced role mentions. */
  layers: { id: ActorLayer; actors: [string, number][] }[];
};

export default function ActorTreemapChart({ data }: { data: TreemapYear[] }) {
  const chartRef = useRef<ECharts | null>(null);
  const [year, setYear] = useState<Year>(2026);

  const { option, layerTotals } = useMemo(() => {
    const forYear = data.find((d) => d.year === year);
    const byLayer = new Map<string, [string, number][]>(
      (forYear?.layers ?? []).map((l) => [l.id, l.actors]),
    );
    const totals = LAYER_META.map((l) => {
      const actors = byLayer.get(l.id) ?? [];
      return {
        ...l,
        total: actors.reduce((a, [, n]) => a + n, 0),
        actors: actors.length,
      };
    });
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
          // Cells carry the actor's name only. The count is what sets the
          // cell's size, so printing it inside crowded the small cells with
          // a number the area already gives; it stays in the tooltip, the
          // layer totals below and the screen-reader description.
          label: {
            show: true,
            fontSize: 11,
            color: "#FFFFFF",
            formatter: (p) => {
              const item = p as unknown as { name: string };
              return item.name;
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
              children: (byLayer.get(l.id) ?? []).map(([actor, count]) => ({
                name: actor,
                value: count,
                itemStyle: { color: l.color },
              })),
            })),
        },
      ],
    };
    return { option: opt, layerTotals: totals };
  }, [data, year]);

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
        <div
          className="mb-2 inline-flex overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white"
          role="radiogroup"
          aria-label="Treemap year"
        >
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
