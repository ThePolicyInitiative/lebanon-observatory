"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { LAYER_META } from "@/lib/colors";
import { countsFor } from "@/lib/data-client";
import {
  cautionCounts,
  layers,
  stageList,
  stageShortList,
  type Locale,
} from "@/lib/vocab";
import type { Year } from "@/lib/types";

const T = {
  en: {
    title: "Heat maps of traced presence: 2024 and 2026",
    sub: "Each panel shows traced actors per layer and stage for one year, on one shared scale (darker = more traced actors). Hover a cell for its value; the counts behind the whole figure are in its description.",
    tracedActors: "traced actors",
    alt: "Heat maps of traced actor-stage presence for 2024 and 2026",
  },
  ar: {
    title: "خرائط حرارية للحضور المرصود: 2024 و2026",
    sub: "كل لوحة تُظهر الجهات المرصودة بحسب الطبقة والمرحلة في سنة واحدة، على مقياس واحد مشترك (كلما دكن اللون زاد عدد الجهات المرصودة). مرِّر فوق خانة لترى قيمتها؛ والأعداد خلف الشكل كله واردة في وصفه.",
    tracedActors: "جهة مرصودة",
    alt: "خرائط حرارية للحضور المرصود للجهات في المراحل، 2024 و2026",
  },
} as const;

/**
 * Matrix heat maps of traced actor-stage presence for 2024 and 2026:
 * four actor layers by twelve value-chain stages per year, on one shared
 * scale. Cells are unlabelled: the value is in the tooltip and in the
 * figure's description, which is what a reader without the colours gets.
 */
export default function YearHeatmaps({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  const ar = locale === "ar";
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
    const layerLabels = layers(locale).map((l) => l.short);
    const mkAxis = (gridIndex: number, showXLabels: boolean) => ({
      x: {
        gridIndex,
        type: "category" as const,
        data: stageShortList(locale),
        inverse: ar,
        axisLabel: showXLabels
          ? { rotate: 30, fontSize: 11, color: "#3D4C5E", margin: 10 }
          : { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
      },
      y: {
        gridIndex,
        type: "category" as const,
        data: layerLabels,
        position: ar ? ("right" as const) : ("left" as const),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11, color: "#3D4C5E" },
      },
    });
    const ax1 = mkAxis(0, false);
    const ax2 = mkAxis(1, true);
    return {
      title: ar
        ? [
            { text: "2024", right: 130, top: 6, textStyle: { fontSize: 13, fontWeight: 700, color: "#58779B" } },
            { text: "2026", right: 130, top: 246, textStyle: { fontSize: 13, fontWeight: 700, color: "#2F8F6B" } },
          ]
        : [
            { text: "2024", left: 130, top: 6, textStyle: { fontSize: 13, fontWeight: 700, color: "#58779B" } },
            { text: "2026", left: 130, top: 246, textStyle: { fontSize: 13, fontWeight: 700, color: "#2F8F6B" } },
          ],
      grid: ar
        ? [
            { left: 120, right: 130, top: 30, height: 175 },
            { left: 120, right: 130, top: 270, height: 175 },
          ]
        : [
            { left: 130, right: 120, top: 30, height: 175 },
            { left: 130, right: 120, top: 270, height: 175 },
          ],
      tooltip: {
        formatter: (p) => {
          const params = p as unknown as {
            value: [number, number, number];
            seriesName: string;
          };
          const [si, li, v] = params.value;
          return `<strong>${stageList(locale)[si]}</strong><br/>${layers(locale)[li].label}<br/>${params.seriesName}: <strong>${v}</strong> ${tr.tracedActors}`;
        },
      },
      // One legend, one ramp, both panels: the whole point of stacking the
      // two years is that the same colour means the same count in both, so
      // the panels can be compared cell against cell.
      visualMap: {
        type: "continuous",
        seriesIndex: [0, 1],
        min: 0,
        max: maxVal,
        calculable: false,
        orient: "vertical",
        ...(ar ? { left: 6 } : { right: 6 }),
        top: "middle",
        itemHeight: 170,
        itemWidth: 14,
        text: [`${maxVal} ${tr.tracedActors}`, "0"],
        textStyle: { fontSize: 10.5 },
        inRange: { color: ["#F2F5F8", "#7A93B0", "#173B63"] },
      },
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
  }, [data2024, data2026, maxVal, locale, ar, tr]);

  const tableRows = layers(locale).flatMap((layer) =>
    stageList(locale).map((stage, i) => [
      layer.label,
      stage,
      countsFor(2024, layer.id)[i],
      countsFor(2026, layer.id)[i],
    ]),
  );

  return (
    <ChartFrame
      id="year-heatmaps"
      title={tr.title}
      subtitle={tr.sub}
      caveat={cautionCounts(locale)}
      chartRef={chartRef}
      description={tableRows
        .filter((r) => Number(r[2]) > 0 || Number(r[3]) > 0)
        .map((r) => `${r[0]} · ${r[1]}: 2024 ${r[2]}, 2026 ${r[3]}`)
        .join("; ")}
      table={{
        caption: tr.alt,
        headers: ["Actor layer", "Stage", "2024", "2026"],
        rows: tableRows,
      }}
    >
      <EChart
        option={option}
        height={530}
        ariaLabel={tr.alt}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
