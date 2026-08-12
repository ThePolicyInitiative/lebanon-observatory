"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";

/**
 * Speed is an architecture, not a temperament: fast functions have
 * standing assets and rehearsed routines; slow ones stack novel
 * institutions, external rules and serial gates.
 */
const ITEMS: {
  label: string;
  days: number;
  display: string;
  group: "Emergency functions" | "Programme functions";
  note: string;
}[] = [
  { label: "Emergency operations room activation (2 Mar 2026)", days: 0.2, display: "hours", group: "Emergency functions", note: "The same unit, the same director as 2024 - rehearsed institutional memory." },
  { label: "Registration of 667,000 displaced (2026)", days: 8, display: "8 days", group: "Emergency functions", note: "MoSA's single-channel humanitarian routing." },
  { label: "344 schools converted to shelters (2026)", days: 9, display: "9 days", group: "Emergency functions", note: "Assets the state already owned; systems the humanitarian sector already ran." },
  { label: "Municipal damage survey of 135 areas (Dec 2024)", days: 10, display: "10 days", group: "Emergency functions", note: "The response's fastest national damage assessments - run entirely on municipal knowledge." },
  { label: "Assessment request → RDNA publication", days: 80, display: "≈11 weeks", group: "Programme functions", note: "17 Dec 2024 → 7 Mar 2025." },
  { label: "Works contract cycle, design target", days: 84, display: "12 weeks", group: "Programme functions", note: "The reform target the design commits to." },
  { label: "Works contract cycle, baseline", days: 392, display: "56 weeks", group: "Programme functions", note: "The system's honest self-description of notice-to-signature time." },
  { label: "Assessment request → programme effectiveness", days: 437, display: "≈14 months", group: "Programme functions", note: "17 Dec 2024 → 26 Feb 2026, including four months of parliamentary scheduling." },
  { label: "Assessment request → first disbursement", days: 512, display: "≈17 months", group: "Programme functions", note: "17 Dec 2024 → 13 May 2026." },
];

export default function FunctionSpeedChart() {
  const chartRef = useRef<ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    const rows = [...ITEMS].reverse();
    return {
      grid: { left: 250, right: 80, top: 30, bottom: 40 },
      legend: {
        top: 0,
        data: ["Emergency functions", "Programme functions"],
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as unknown as { dataIndex: number; seriesName: string };
          const item = rows[params.dataIndex];
          return `<strong>${item.label}</strong><br/>${item.display}<br/><span style="font-size:11px;max-width:280px;display:inline-block;white-space:normal">${item.note}</span>`;
        },
      },
      xAxis: {
        type: "value",
        name: "Elapsed days (linear scale - the disparity is the finding)",
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: rows.map((i) => i.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 10.5, width: 240, overflow: "break" },
      },
      series: [
        {
          name: "Emergency functions",
          type: "bar",
          stack: "t",
          barMaxWidth: 13,
          data: rows.map((i) => (i.group === "Emergency functions" ? { value: i.days } : { value: null })),
          itemStyle: { color: "#2E74B5", borderRadius: 2 },
          label: {
            show: true,
            position: "right",
            fontSize: 10.5,
            color: "#263645",
            formatter: (p) => rows[p.dataIndex].group === "Emergency functions" ? rows[p.dataIndex].display : "",
          },
        },
        {
          name: "Programme functions",
          type: "bar",
          stack: "t",
          barMaxWidth: 13,
          data: rows.map((i) => (i.group === "Programme functions" ? { value: i.days } : { value: null })),
          itemStyle: { color: "#BD5A46", borderRadius: 2 },
          label: {
            show: true,
            position: "right",
            fontSize: 10.5,
            color: "#263645",
            formatter: (p) => rows[p.dataIndex].group === "Programme functions" ? rows[p.dataIndex].display : "",
          },
        },
      ],
    };
  }, []);

  return (
    <ChartFrame
      id="function-speed"
      title="Relief moves in days; procedure moves in quarters; reconstruction moves in years"
      subtitle="Elapsed time of traced conversions, 2024–2026. Blue: emergency functions running on standing assets and rehearsed routines. Rust: programme functions stacking novel institutions, external rules and serial gates."
      caveat="'Slow' is measured against Lebanese need and the design's own targets, not an international norm. Each interval is individually defensible; their sum is not, and no institution is accountable for the sum - cost concentrated downward, control dispersed upward."
      sourceIds={["S4", "S2", "S20", "S47", "S1", "S45", "S19"]}
      chartRef={chartRef}
      description="Horizontal bars comparing elapsed days: emergency-room activation in hours, displaced registration in 8 days, shelter conversion in 9 days and the municipal survey in 10 days, against 11 weeks to the RDNA, a 56-week baseline works-contract cycle, 14 months to programme effectiveness and 17 months to first disbursement."
      table={{
        caption: "Elapsed time of traced conversions.",
        headers: ["Conversion", "Elapsed", "Category", "Note"],
        rows: ITEMS.map((i) => [i.label, i.display, i.group, i.note]),
      }}
    >
      <EChart
        option={option}
        height={420}
        ariaLabel="Bar chart contrasting the speed of emergency functions with programme functions"
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
