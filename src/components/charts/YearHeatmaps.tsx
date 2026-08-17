"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { LAYER_META } from "@/lib/colors";
import { STAGE_SHORT, STAGES, countsFor } from "@/lib/data-client";
import { CAUTION_COUNTS } from "@/lib/data-client";
import type { Year } from "@/lib/types";

/**
 * Matrix heat maps of traced actor-stage presence for 2024 and 2026:
 * four actor layers by twelve value-chain stages per year, on one shared
 * scale. Cells are unlabelled: the value is in the tooltip and in the
 * figure's description, which is what a reader without the colours gets.
 */
export default function YearHeatmaps() {
  const chartRef = useRef<ECharts | null>(null);

  const { data2024, data2026, maxVal } = useMemo(() => {
    const build = (year: Year) => {
      const cells: [number, number, number][] = [];
      for (let li = 0; li < LAYER_META.length; li++) {
        const counts = countsFor(year, LAYER_META[li].id);
        for (let si = 0; si < 12; si++) cells.push([si, li, counts[si]]);
      }
      return cells;
    };
    const a = build(2024);
    const b = build(2026);
    return {
      data2024: a,
      data2026: b,
      maxVal: Math.max(...[...a, ...b].map(([, , v]) => v)),
    };
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const layerLabels = LAYER_META.map((l) => l.short);
    const mkAxis = (gridIndex: number, showXLabels: boolean) => ({
      x: {
        gridIndex,
        type: "category" as const,
        data: STAGE_SHORT,
        axisLabel: showXLabels
          ? { rotate: 38, fontSize: 10 }
          : { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
      },
      y: {
        gridIndex,
        type: "category" as const,
        data: layerLabels,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 10.5 },
      },
    });
    const ax1 = mkAxis(0, false);
    const ax2 = mkAxis(1, true);
    return {
      title: [
        { text: "2024", left: 130, top: 6, textStyle: { fontSize: 13, fontWeight: 700, color: "#58779B" } },
        { text: "2026", left: 130, top: 246, textStyle: { fontSize: 13, fontWeight: 700, color: "#2F8F6B" } },
      ],
      grid: [
        { left: 130, right: 90, top: 30, height: 175 },
        { left: 130, right: 90, top: 270, height: 175 },
      ],
      tooltip: {
        formatter: (p) => {
          const params = p as unknown as {
            value: [number, number, number];
            seriesName: string;
          };
          const [si, li, v] = params.value;
          return `<strong>${STAGES[si]}</strong><br/>${LAYER_META[li].label}<br/>${params.seriesName}: <strong>${v}</strong> traced actors`;
        },
      },
      visualMap: [
        {
          type: "continuous",
          seriesIndex: 0,
          min: 0,
          max: maxVal,
          calculable: false,
          orient: "vertical",
          right: 10,
          top: 40,
          itemHeight: 130,
          itemWidth: 12,
          text: [String(maxVal), "0"],
          textStyle: { fontSize: 10 },
          inRange: { color: ["#F2F5F8", "#58779B", "#20344D"] },
        },
        {
          type: "continuous",
          seriesIndex: 1,
          min: 0,
          max: maxVal,
          calculable: false,
          orient: "vertical",
          right: 10,
          top: 280,
          itemHeight: 130,
          itemWidth: 12,
          text: [String(maxVal), "0"],
          textStyle: { fontSize: 10 },
          inRange: { color: ["#F1F6F3", "#2F8F6B", "#1B4A38"] },
        },
      ],
      xAxis: [ax1.x, ax2.x],
      yAxis: [ax1.y, ax2.y],
      series: [
        {
          name: "2024",
          type: "heatmap",
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: data2024,
          label: { show: false },
          itemStyle: { borderColor: "#FAFAF7", borderWidth: 2 },
        },
        {
          name: "2026",
          type: "heatmap",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: data2026,
          label: { show: false },
          itemStyle: { borderColor: "#FAFAF7", borderWidth: 2 },
        },
      ],
    };
  }, [data2024, data2026, maxVal]);

  const tableRows = LAYER_META.flatMap((layer) =>
    STAGES.map((stage, i) => [
      layer.label,
      stage,
      countsFor(2024, layer.id)[i],
      countsFor(2026, layer.id)[i],
    ]),
  );

  return (
    <ChartFrame
      id="year-heatmaps"
      title="Heat maps of traced presence: 2024 and 2026"
      subtitle="Each panel shows traced actors per layer and stage for one year, on one shared scale (darker = more traced actors). Hover a cell for its value; the counts behind the whole figure are in its description."
      caveat={CAUTION_COUNTS}
      chartRef={chartRef}
      description="Two heat-map panels of traced actor counts across four actor layers and twelve value-chain stages: the 2024 panel shows community presence dominating downstream stages and the state concentrated in coordination; the 2026 panel shows community relief surging to 55, official reconstruction presence rising to 13, and municipal cells near zero throughout."
      table={{
        caption: "Traced actor-stage presence by layer, stage and year.",
        headers: ["Actor layer", "Stage", "2024", "2026"],
        rows: tableRows,
      }}
    >
      <EChart
        option={option}
        height={530}
        ariaLabel="Heat maps of traced actor-stage presence for 2024 and 2026"
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
