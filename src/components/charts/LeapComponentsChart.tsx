"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { finance } from "@/lib/data-client";

type Component = {
  label: string;
  initialUsd: number;
  appraisedUsd: number;
  note?: string;
};

/** LEAP's component allocations: initial US$250M loan versus the appraised
 * US$1B framework. */
export default function LeapComponentsChart() {
  const chartRef = useRef<ECharts | null>(null);
  const components = finance.leapComponents as Component[];

  const option = useMemo<EChartsOption>(() => {
    const cats = [...components].reverse();
    const short = (l: string) => l.split("(")[0].trim();
    return {
      grid: { left: 165, right: 76, top: 34, bottom: 40 },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v) => `US$${Number(v ?? 0) / 1e6} million`,
      },
      xAxis: {
        type: "value",
        name: "US$ million",
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
        axisLabel: { formatter: (v: number) => `${v / 1e6}` },
      },
      yAxis: {
        type: "category",
        data: cats.map((c) => short(c.label)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11, width: 150, overflow: "break" },
      },
      series: [
        {
          name: "Initial US$250M loan",
          type: "bar",
          data: cats.map((c) => c.initialUsd),
          itemStyle: { color: "#58779B", borderRadius: 2 },
          barMaxWidth: 13,
          label: {
            show: true,
            position: "right",
            fontSize: 10,
            color: "#263645",
            formatter: (p) => `$${(Number((p as { value: number }).value) / 1e6).toFixed(0)}M`,
          },
        },
        {
          name: "Appraised US$1B framework",
          type: "bar",
          data: cats.map((c) => c.appraisedUsd),
          itemStyle: { color: "#173B63", borderRadius: 2 },
          barMaxWidth: 13,
          label: {
            show: true,
            position: "right",
            fontSize: 10,
            color: "#263645",
            formatter: (p) => `$${(Number((p as { value: number }).value) / 1e6).toFixed(0)}M`,
          },
        },
      ],
    };
  }, [components]);

  return (
    <ChartFrame
      id="leap-components"
      title="Where LEAP's money is meant to go"
      subtitle="Component allocations of the initial US$250 million loan (light blue) against the appraised US$1 billion framework (navy)."
      caveat="Reconstruction works deliberately received no initial allocation - works need preparation first - so the framework's largest component is entirely unfunded until additional financing arrives. Allocation is not disbursement: by 29 June 2026, 1.65% of the loan had been disbursed."
      chartRef={chartRef}
      description={`Grouped horizontal bars of LEAP component allocations: ${components.map((c) => `${c.label.split("(")[0].trim()} US$${c.initialUsd / 1e6}M initial versus US$${c.appraisedUsd / 1e6}M appraised`).join("; ")}.`}
      table={{
        caption: "LEAP component allocations in US$ million.",
        headers: ["Component", "Initial US$250M loan", "Appraised US$1B framework", "Note"],
        rows: components.map((c) => [
          c.label,
          c.initialUsd / 1e6,
          c.appraisedUsd / 1e6,
          c.note ?? "",
        ]),
      }}
    >
      <EChart
        option={option}
        height={330}
        ariaLabel="Grouped bar chart of LEAP component allocations, initial loan versus appraised framework"
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
