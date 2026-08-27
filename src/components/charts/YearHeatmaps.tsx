"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { CHART, LAYER_META, UI, YEAR_COLORS } from "@/lib/colors";
import { countsFor } from "@/lib/data-client";
import {
  HEATMAP_STAGES,
  cautionCounts,
  layers,
  stageList,
  stageShortList,
  type Locale,
} from "@/lib/vocab";
import type { Year } from "@/lib/types";
import { chartText } from "@/lib/chart-style";

const T = {
  en: {
    title: "Heat maps of traced presence: 2024 and 2026",
    sub: "Each panel shows traced actors per layer and stage for one year, on one shared scale (darker = more traced actors). Strategy and coordination is left out: nearly every actor touches it, so the column says more about who convenes than about where work sits along the chain. Hover a cell for its value; the counts behind the whole figure are in its description.",
    tracedActors: "traced actors",
    alt: "Heat maps of traced actor-stage presence for 2024 and 2026",
  },
  ar: {
    title: "خرائط حرارية للحضور المرصود: 2024 و2026",
    sub: "كل لوحة تُظهر الجهات المرصودة بحسب الطبقة والمرحلة في سنة واحدة، على مقياس واحد مشترك (كلما دكن اللون زاد عدد الجهات المرصودة). ومرحلة الاستراتيجية والتنسيق خارج الشكل: تكاد كل جهة تمسّها، فعمودها يقول عمّن ينسّق أكثر ممّا يقول أين يقع العمل على السلسلة. مرِّر فوق خانة لترى قيمتها؛ والأعداد خلف الشكل كله واردة في وصفه.",
    tracedActors: "جهة مرصودة",
    alt: "خرائط حرارية للحضور المرصود للجهات في المراحل، 2024 و2026",
  },
} as const;


/**
 * Matrix heat maps of traced actor-stage presence for 2024 and 2026:
 * four actor layers by eleven value-chain stages per year, on one shared
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
        // x is the position in the drawn axis, not the stage number.
        HEATMAP_STAGES.forEach((stageIdx, x) => cells.push([x, li, counts[stageIdx]]));
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
        data: HEATMAP_STAGES.map((i) => stageShortList(locale)[i]),
        inverse: ar,
        axisLabel: showXLabels
          ? { rotate: 30, fontSize: 11, color: "#3D4C5E", margin: 10 }
          : { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
      },
      y: {
        gridIndex,
        type: "category" as const,
        data: layerLabels,
        position: ar ? ("right" as const) : ("left" as const),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick, color: "#3D4C5E" },
      },
    });
    const ax1 = mkAxis(0, false);
    const ax2 = mkAxis(1, true);
    return {
      title: ar
        ? [
            { text: "2024", right: 130, top: 6, textStyle: { fontSize: 13, fontWeight: 700, color: "#58779B" } },
            { text: "2026", right: 130, top: 246, textStyle: { fontSize: 13, fontWeight: 700, color: YEAR_COLORS.y2026 } },
          ]
        : [
            { text: "2024", left: 130, top: 6, textStyle: { fontSize: 13, fontWeight: 700, color: "#58779B" } },
            { text: "2026", left: 130, top: 246, textStyle: { fontSize: 13, fontWeight: 700, color: YEAR_COLORS.y2026 } },
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
          const [x, li, v] = params.value;
          // x is the axis position; map it back to the stage it stands for.
          const stage = stageList(locale)[HEATMAP_STAGES[x]];
          return `<strong>${stage}</strong><br/>${layers(locale)[li].label}<br/>${params.seriesName}: <strong>${v}</strong> ${tr.tracedActors}`;
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
          itemStyle: { borderColor: UI.surface, borderWidth: 2 },
        },
        {
          name: "2026",
          type: "heatmap",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: data2026,
          label: { show: false },
          itemStyle: { borderColor: UI.surface, borderWidth: 2 },
        },
      ],
    };
  }, [data2024, data2026, maxVal, locale, ar, tr]);

  // The same stages the panels draw, so the description a reader without
  // the colours gets is the figure and not a different one.
  const tableRows = layers(locale).flatMap((layer) =>
    HEATMAP_STAGES.map((i) => [
      layer.label,
      stageList(locale)[i],
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
      description={tableRows
        .filter((r) => Number(r[2]) > 0 || Number(r[3]) > 0)
        .map((r) => `${r[0]} · ${r[1]}: 2024 ${r[2]}, 2026 ${r[3]}`)
        .join("; ")}
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
