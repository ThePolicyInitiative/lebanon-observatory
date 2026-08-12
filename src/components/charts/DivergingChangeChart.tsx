"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { STAGES, STAGE_SHORT, countsFor } from "@/lib/data-client";
import { changeFor, CAUTION_COUNTS } from "@/lib/data-client";
import type { ActorLayer } from "@/lib/types";
import { signed } from "@/lib/format";

/**
 * Visuals 6 & 7 - Diverging bar chart of change in traced presence
 * for one actor layer across the twelve stages. Gains in teal, contraction
 * in rust, with printed values (colour is never the only encoding).
 */
export default function DivergingChangeChart({
  id,
  layer,
  title,
  subtitle,
  description,
}: {
  id: string;
  layer: ActorLayer;
  title: string;
  subtitle: string;
  description: string;
}) {
  const chartRef = useRef<ECharts | null>(null);
  const change = changeFor(layer);

  const sorted = STAGES.map((stage, i) => ({
    stage,
    short: STAGE_SHORT[i],
    value: change[i],
    y24: countsFor(2024, layer)[i],
    y26: countsFor(2026, layer)[i],
  })).sort((a, b) => a.value - b.value);

  const option = useMemo<EChartsOption>(
    () => ({
      grid: { left: 170, right: 60, top: 10, bottom: 40 },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as { dataIndex: number };
          const d = sorted[params.dataIndex];
          return `<strong>${d.stage}</strong><br/>2024: ${d.y24} · 2026: ${d.y26}<br/>Change: <strong>${signed(d.value)}</strong>`;
        },
      },
      xAxis: {
        type: "value",
        name: "Change in traced actors (2026 − 2024)",
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: sorted.map((d) => d.short),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          data: sorted.map((d) => ({
            value: d.value,
            itemStyle: {
              color: d.value >= 0 ? "#1B8295" : "#BD5A46",
              borderRadius: 2,
            },
          })),
          barMaxWidth: 16,
          label: {
            show: true,
            position: "outside",
            formatter: (p) => signed(Number(p.value)),
            fontSize: 11,
            color: "#263645",
          },
        },
      ],
    }),
    [sorted],
  );

  return (
    <ChartFrame
      id={id}
      title={title}
      subtitle={subtitle}
      caveat={CAUTION_COUNTS}
      sourceIds={["S-TRACKING"]}
      chartRef={chartRef}
      description={description}
      table={{
        caption: `${title} - underlying values.`,
        headers: ["Stage", "2024", "2026", "Change"],
        rows: sorted.map((d) => [d.stage, d.y24, d.y26, signed(d.value)]),
      }}
    >
      <EChart
        option={option}
        height={420}
        ariaLabel={description}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
