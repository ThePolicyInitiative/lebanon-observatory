"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import sectorsJson from "@/data/sectors.json";

/** Sector damage, losses and needs - three distinct economic categories,
 * shown side by side and never summed. Nulls are "not stated", not zero. */
export default function SectorDamageChart() {
  const chartRef = useRef<ECharts | null>(null);
  const rows = sectorsJson.sectors.filter(
    (s) => s.damage !== null || s.losses !== null || s.needs !== null,
  );

  const option = useMemo<EChartsOption>(() => {
    const cats = [...rows].reverse();
    const mk = (
      name: string,
      key: "damage" | "losses" | "needs",
      color: string,
    ) => ({
      name,
      type: "bar" as const,
      data: cats.map((s) => s[key]),
      itemStyle: { color, borderRadius: 2 },
      barMaxWidth: 11,
      label: {
        show: true,
        position: "right" as const,
        fontSize: 10,
        color: "#263645",
        formatter: (p: unknown) => {
          const value = (p as { value?: number | null }).value;
          return value === null || value === undefined ? "" : `$${value}M`;
        },
      },
    });
    return {
      grid: { left: 170, right: 70, top: 34, bottom: 40 },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v) =>
          v === null || v === undefined ? "not stated in source" : `US$${v} million`,
      },
      xAxis: {
        type: "value",
        name: "US$ million",
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: cats.map((s) => s.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11, width: 155, overflow: "break" },
      },
      series: [
        mk("Damage", "damage", "#2E74B5"),
        mk("Losses", "losses", "#8FB4D9"),
        mk("Assessed needs", "needs", "#BD5A46"),
      ],
    };
  }, [rows]);

  return (
    <ChartFrame
      id="sector-estimates"
      title="Selected sector estimates, 2023–24 conflict"
      subtitle="Damage (blue), losses (light blue) and assessed needs (rust) are distinct categories, never summed. A missing bar means the source states no figure - not zero."
      caveat="Sector estimates carry different cut-offs and methods within one assessment framework, and the largest loss figures are macro-estimates rather than enterprise censuses. Losses towering over damage in the productive sectors explains why livelihood destruction became the least institutionalised loss of the war: a damaged transformer has an owner and a repair chain; a lost agricultural season has neither."
      sourceIds={["S4", "S29"]}
      chartRef={chartRef}
      description="Grouped horizontal bars of sector-level damage, losses and needs from the 2023–24 conflict assessment: housing US$4.6 billion damage; commerce, industry and tourism US$3.4 billion losses; environment and debris 512, 790 and 444 million; health 208 and 700 million; agriculture 118, 586 and 263 million; transport 198; electricity 98; municipal services 41 million."
      table={{
        caption: "Sector estimates in US$ million (- means not stated in the cited source).",
        headers: ["Sector", "Damage", "Losses", "Assessed needs", "Note"],
        rows: sectorsJson.sectors.map((s) => [
          s.label,
          s.damage ?? "-",
          s.losses ?? "-",
          s.needs ?? "-",
          s.detail,
        ]),
      }}
    >
      <EChart
        option={option}
        height={430}
        ariaLabel="Grouped bar chart of sector damage, losses and needs"
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
