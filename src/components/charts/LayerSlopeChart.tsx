"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { LAYER_META } from "@/lib/colors";
import { stageCounts } from "@/lib/data-client";

/** Slopegraph of each actor layer's traced-presence total, 2024 → 2026. */
export default function LayerSlopeChart() {
  const chartRef = useRef<ECharts | null>(null);

  const totals = useMemo(
    () =>
      LAYER_META.map((l) => ({
        ...l,
        y24: stageCounts["2024"][l.id].reduce((a, b) => a + b, 0),
        y26: stageCounts["2026"][l.id].reduce((a, b) => a + b, 0),
      })),
    [],
  );

  const option = useMemo<EChartsOption>(
    () => ({
      grid: { left: 60, right: 190, top: 30, bottom: 30 },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const item = p as { seriesName?: string; dataIndex?: number };
          const t = totals.find((x) => x.label === item.seriesName);
          if (!t) return "";
          return `${t.label}<br/>2024: ${t.y24} · 2026: ${t.y26} (${t.y26 - t.y24 >= 0 ? "+" : ""}${t.y26 - t.y24})`;
        },
      },
      xAxis: {
        type: "category",
        data: ["2024", "2026"],
        boundaryGap: true,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 13, fontWeight: 600, color: "#263645" },
      },
      yAxis: {
        type: "value",
        name: "traced role mentions",
        nameTextStyle: { fontSize: 11 },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      series: totals.map((t) => ({
        name: t.label,
        type: "line" as const,
        data: [t.y24, t.y26],
        lineStyle: { width: 3, color: t.color },
        itemStyle: { color: t.color },
        symbolSize: 9,
        endLabel: {
          show: true,
          formatter: () =>
            `${t.label}  ${t.y24} → ${t.y26} (${t.y26 - t.y24 >= 0 ? "+" : ""}${t.y26 - t.y24})`,
          fontSize: 11,
          color: t.color,
          fontWeight: 600,
          width: 175,
          overflow: "break",
        },
        label: {
          show: true,
          position: "top" as const,
          fontSize: 10,
          color: t.color,
        },
      })),
    }),
    [totals],
  );

  return (
    <ChartFrame
      id="layer-slope"
      title="Who gained and who lost ground, 2024 → 2026"
      subtitle="Each line is an actor layer's total traced presence across the twelve value-chain stages. Community and NGO layers rose; official and municipal presence fell."
      caveat="Counts measure traced presence in the dataset, not performance, spending or coverage. The 2026 total carries the report's traced 360-versus-363 count discrepancy."
      chartRef={chartRef}
      description={`Slope chart: official ${totals[0].y24} to ${totals[0].y26}; NGO and international ${totals.find((t) => t.id === "ngo_international")?.y24} to ${totals.find((t) => t.id === "ngo_international")?.y26}; municipal ${totals.find((t) => t.id === "municipal")?.y24} to ${totals.find((t) => t.id === "municipal")?.y26}; community ${totals.find((t) => t.id === "community")?.y24} to ${totals.find((t) => t.id === "community")?.y26}.`}
      table={{
        caption: "Traced role mentions per actor layer and year.",
        headers: ["Actor layer", "2024", "2026", "Change"],
        rows: totals.map((t) => [
          t.label,
          t.y24,
          t.y26,
          `${t.y26 - t.y24 >= 0 ? "+" : ""}${t.y26 - t.y24}`,
        ]),
      }}
    >
      <EChart
        option={option}
        height={340}
        ariaLabel="Slope chart of actor-layer totals between 2024 and 2026"
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
