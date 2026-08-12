"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "@/components/charts/EChart";
import ChartFrame from "@/components/charts/ChartFrame";
import { LAYER_META } from "@/lib/colors";
import { locations, CAUTION_MAP } from "@/lib/data-client";
import type { ActorLayer, Year } from "@/lib/types";

/** Paired regional actor-composition chart shown with the map (Visual 8 companion). */
export default function RegionalComposition() {
  const chartRef = useRef<ECharts | null>(null);

  const regions = locations.regions;
  const option = useMemo<EChartsOption>(() => {
    const cats = [...regions].reverse();
    const series = ([2024, 2026] as Year[]).flatMap((year) =>
      LAYER_META.map((layer) => ({
        name: layer.label,
        stack: String(year),
        type: "bar" as const,
        data: cats.map((r) => {
          const y = locations.mentions[String(year) as "2024" | "2026"];
          const m = y[r.id as keyof typeof y] as Record<ActorLayer, number>;
          return m ? m[layer.id] : 0;
        }),
        itemStyle: { color: layer.color, borderColor: "#FFF", borderWidth: 1 },
        barMaxWidth: 12,
      })),
    );
    return {
      grid: { left: 190, right: 40, top: 34, bottom: 40 },
      legend: { top: 0, textStyle: { fontSize: 11 }, data: LAYER_META.map((l) => l.label) },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as unknown as {
            seriesName: string;
            name: string;
            value: number;
            seriesIndex: number;
          };
          const year = params.seriesIndex < LAYER_META.length ? 2024 : 2026;
          return `<strong>${params.name}</strong> · ${year}<br/>${params.seriesName}: ${params.value} mentions`;
        },
      },
      xAxis: {
        type: "value",
        name: "Location mentions in the dataset",
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: cats.map((r) => r.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11, width: 175, overflow: "break" },
      },
      series,
    };
  }, [regions]);

  const tableRows = regions.flatMap((r) =>
    ([2024, 2026] as Year[]).map((year) => {
      const y = locations.mentions[String(year) as "2024" | "2026"];
      const m = y[r.id as keyof typeof y] as Record<ActorLayer, number>;
      return [
        r.label,
        year,
        m?.official ?? 0,
        m?.municipal ?? 0,
        m?.ngo_international ?? 0,
        m?.community ?? 0,
      ];
    }),
  );

  return (
    <ChartFrame
      id="regional-composition"
      title="Regional actor composition, 2024 vs 2026"
      subtitle="For each regional grouping the upper stacked bar is 2024 and the lower is 2026; segments are the four actor layers."
      caveat={CAUTION_MAP}
      sourceIds={["S-EVIDENCE-BASE"]}
      chartRef={chartRef}
      description="Paired stacked bars per regional grouping showing the actor-layer composition of traced location mentions in 2024 and 2026. South and Nabatieh and national/multi-region groupings dominate; community mentions dominate named affected localities."
      table={{
        caption: "Location mentions by region, year and actor layer.",
        headers: ["Region", "Year", "Official", "Municipal", "NGO/International", "Community"],
        rows: tableRows,
      }}
    >
      <EChart
        option={option}
        height={520}
        ariaLabel="Paired stacked bars of regional actor composition for 2024 and 2026"
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
