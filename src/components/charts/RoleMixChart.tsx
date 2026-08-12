"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { LAYER_META, YEAR_COLORS } from "@/lib/colors";
import { ROLE_MIX_GROUPS, roleMixFor, CAUTION_COUNTS } from "@/lib/data-client";

const GROUP_SHORT = ["Governance & assessment", "Works delivery", "Return & recovery", "Oversight"];

/**
 * Visual 4 - Actor role-mix comparison. For each layer, the share of its
 * traced presence in governance/data (stages 1–4), works delivery
 * (5–8), return & recovery (9–11) and oversight (12), 2024 vs 2026.
 */
export default function RoleMixChart() {
  const chartRef = useRef<ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    const grids = LAYER_META.map((_, i) => ({
      left: i % 2 === 0 ? "7%" : "56%",
      right: i % 2 === 0 ? "50%" : "3%",
      top: i < 2 ? 60 : 300,
      height: 170,
    }));
    const titles = LAYER_META.map((l, i) => ({
      text: l.label,
      textStyle: { fontSize: 12.5, fontWeight: 600 as const, color: l.color },
      left: i % 2 === 0 ? "7%" : "56%",
      top: i < 2 ? 28 : 268,
    }));
    const xAxes = LAYER_META.map((_, i) => ({
      gridIndex: i,
      type: "category" as const,
      data: GROUP_SHORT,
      axisLabel: { fontSize: 9.5, interval: 0, rotate: 18 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#DCE3EA" } },
    }));
    const yAxes = LAYER_META.map((_, i) => ({
      gridIndex: i,
      type: "value" as const,
      max: 100,
      axisLabel: { formatter: "{value}%", fontSize: 10 },
      splitLine: { lineStyle: { color: "#EDF0F4" } },
    }));
    const series = LAYER_META.flatMap((layer, i) => {
      const mix24 = roleMixFor(2024, layer.id);
      const mix26 = roleMixFor(2026, layer.id);
      return [
        {
          name: "2024",
          type: "bar" as const,
          xAxisIndex: i,
          yAxisIndex: i,
          data: mix24.map((m) => Number(m.pct.toFixed(1))),
          itemStyle: { color: YEAR_COLORS.y2024, borderRadius: 2 },
          barMaxWidth: 14,
        },
        {
          name: "2026",
          type: "bar" as const,
          xAxisIndex: i,
          yAxisIndex: i,
          data: mix26.map((m) => Number(m.pct.toFixed(1))),
          itemStyle: { color: YEAR_COLORS.y2026, borderRadius: 2 },
          barMaxWidth: 14,
        },
      ];
    });
    return {
      title: titles,
      legend: {
        top: 0,
        data: ["2024", "2026"],
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v) => `${v}%`,
      },
      grid: grids,
      xAxis: xAxes,
      yAxis: yAxes,
      series,
    };
  }, []);

  const tableRows = LAYER_META.flatMap((layer) => {
    const mix24 = roleMixFor(2024, layer.id);
    const mix26 = roleMixFor(2026, layer.id);
    return ROLE_MIX_GROUPS.map((g, i) => [
      layer.label,
      g.label,
      `${mix24[i].pct.toFixed(1)}% (${mix24[i].value})`,
      `${mix26[i].pct.toFixed(1)}% (${mix26[i].value})`,
    ]);
  });

  return (
    <ChartFrame
      id="role-mix"
      title="Where each actor layer's traced presence sat in the chain"
      subtitle="Share of each layer's traced presence by chain segment, 2024 vs 2026. Percentages are within-layer compositions; layer sizes differ."
      caveat={CAUTION_COUNTS}
      sourceIds={["S-EVIDENCE-BASE"]}
      chartRef={chartRef}
      description="Four small-multiple bar panels, one per actor layer, comparing the share of traced presence in governance and data, works delivery, return and recovery, and oversight between 2024 and 2026."
      table={{
        caption:
          "Role mix by actor layer, chain segment and year - percentage of layer presence (traced count).",
        headers: ["Actor layer", "Segment", "2024", "2026"],
        rows: tableRows,
      }}
    >
      <EChart
        option={option}
        height={520}
        ariaLabel="Role-mix comparison across actor layers"
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
