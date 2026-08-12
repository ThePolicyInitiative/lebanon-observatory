"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { MUNICIPAL_POWER_GAP, CAUTION_COUNTS } from "@/lib/data-client";
import { YEAR_COLORS } from "@/lib/colors";

/**
 * Visual 5 - Municipal power gap. Dumbbell chart comparing grouped
 * municipal functional presence in 2024 and 2026.
 */
export default function MunicipalDumbbell() {
  const chartRef = useRef<ECharts | null>(null);
  const rows = [...MUNICIPAL_POWER_GAP].reverse();

  const option = useMemo<EChartsOption>(() => {
    const categories = rows.map((r) => r.fn);
    return {
      grid: { left: 230, right: 60, top: 34, bottom: 40 },
      legend: {
        top: 0,
        data: [
          { name: "2024", itemStyle: { color: YEAR_COLORS.y2024 } },
          { name: "2026", itemStyle: { color: YEAR_COLORS.y2026 } },
        ],
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      xAxis: {
        type: "value",
        max: 7,
        name: "Traced functional presence (grouped counts)",
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11.5, width: 210, overflow: "break" },
      },
      series: [
        // Connector segments drawn as a custom series
        {
          type: "custom",
          name: "change",
          silent: true,
          renderItem: (params, api) => {
            const y = api.coord([0, params.dataIndex])[1];
            const x1 = api.coord([api.value(0), 0])[0];
            const x2 = api.coord([api.value(1), 0])[0];
            return {
              type: "line",
              shape: { x1, y1: y, x2, y2: y },
              style: {
                stroke: api.value(0) === api.value(1) ? "#B9C2CE" : "#8FA1B5",
                lineWidth: 2,
              },
            };
          },
          data: rows.map((r) => [r.y2024, r.y2026]),
          z: 1,
        },
        {
          name: "2024",
          type: "scatter",
          symbolSize: 13,
          itemStyle: { color: YEAR_COLORS.y2024 },
          data: rows.map((r) => r.y2024),
          label: {
            show: true,
            position: "top",
            distance: 4,
            formatter: (p) => String(p.value),
            fontSize: 10.5,
            color: "#263645",
          },
          z: 2,
        },
        {
          name: "2026",
          type: "scatter",
          symbolSize: 13,
          symbol: "diamond",
          itemStyle: { color: YEAR_COLORS.y2026 },
          data: rows.map((r) => r.y2026),
          label: {
            show: true,
            position: "bottom",
            distance: 4,
            formatter: (p) => String(p.value),
            fontSize: 10.5,
            color: "#263645",
          },
          z: 3,
        },
      ],
    };
  }, [rows]);

  return (
    <div>
      <ChartFrame
        id="municipal-power-gap"
        title="The municipal power gap, 2024 → 2026"
        subtitle="Circles mark 2024, diamonds mark 2026 - the shape difference carries year identity alongside colour. Values are grouped functional counts from the analysis."
        caveat={CAUTION_COUNTS}
        sourceIds={["S-TRACKING"]}
        chartRef={chartRef}
        description="Dumbbell chart comparing municipal functional presence between 2024 and 2026: coordination and reporting fell from 6 to 3, damage assessment from 4 to 2, local clearance from 6 to 3, shelter and relief interface rose from 3 to 4, and finance, reconstruction and oversight power was zero in both years."
        table={{
          caption: "Municipal functional presence by grouped function and year.",
          headers: ["Function", "2024", "2026"],
          rows: MUNICIPAL_POWER_GAP.map((r) => [r.fn, r.y2024, r.y2026]),
        }}
      >
        <EChart
          option={option}
          height={340}
          ariaLabel="Dumbbell chart of municipal functional presence in 2024 and 2026"
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
      </ChartFrame>
      <p className="mt-3 rounded-md border-l-4 border-[color:var(--color-rust)] bg-white p-4 text-sm font-medium leading-relaxed text-[color:var(--color-text)]">
        In both years: no traced municipal finance role, no reconstruction
        authority and no oversight role.
      </p>
    </div>
  );
}
