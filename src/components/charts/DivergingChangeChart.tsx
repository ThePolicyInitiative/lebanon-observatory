"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { CHART, VALENCE } from "@/lib/colors";
import { countsFor, changeFor } from "@/lib/data-client";
import { cautionCounts, stageList, stageShortList, type Locale } from "@/lib/vocab";
import type { ActorLayer } from "@/lib/types";
import { signed } from "@/lib/format";
import { chartText } from "@/lib/chart-style";

const T = {
  en: {
    axisName: "Change in traced actors (2026 − 2024)",
    change: "Change: ",
    tableCaption: (title: string) => `${title} - underlying values.`,
    tableHeaders: ["Stage", "2024", "2026", "Change"],
  },
  ar: {
    axisName: "التغيّر في الجهات المرصودة (2026 − 2024)",
    change: "الفارق: ",
    tableCaption: (title: string) => `${title} - القيم التي خلف الشكل.`,
    tableHeaders: ["المرحلة", "2024", "2026", "الفارق"],
  },
} as const;

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
  locale = "en",
}: {
  id: string;
  layer: ActorLayer;
  title: string;
  subtitle: string;
  description: string;
  locale?: Locale;
}) {
  const t = T[locale];
  const ar = locale === "ar";
  const chartRef = useRef<ECharts | null>(null);
  const change = changeFor(layer);
  const stages = stageList(locale);
  const shorts = stageShortList(locale);

  const sorted = stages
    .map((stage, i) => ({
      stage,
      short: shorts[i],
      value: change[i],
      y24: countsFor(2024, layer)[i],
      y26: countsFor(2026, layer)[i],
    }))
    .sort((a, b) => a.value - b.value);

  const option = useMemo<EChartsOption>(
    () => ({
      grid: ar
        ? { left: 60, right: 170, top: 10, bottom: 40 }
        : { left: 170, right: 60, top: 10, bottom: 40 },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as { dataIndex: number };
          const d = sorted[params.dataIndex];
          return `<strong>${d.stage}</strong><br/>2024: ${d.y24} · 2026: ${d.y26}<br/>${t.change}<strong><bdi dir="ltr">${signed(d.value)}</bdi></strong>`;
        },
      },
      xAxis: {
        type: "value",
        inverse: ar,
        name: t.axisName,
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: chartText(locale).axisTitle, color: "#3D4C5E" },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: sorted.map((d) => d.short),
        position: ar ? "right" : "left",
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick, color: "#3D4C5E" },
      },
      series: [
        {
          type: "bar",
          data: sorted.map((d) => ({
            value: d.value,
            itemStyle: {
              // Valence, not identity: teal here meant "went up" while the
              // same teal on this page means the NGO/international layer.
              color: d.value >= 0 ? VALENCE.good : VALENCE.bad,
              borderRadius: 2,
            },
          })),
          barMaxWidth: 16,
          label: {
            show: true,
            position: "outside",
            formatter: (p) => signed(Number(p.value)),
            fontSize: 11,
            color: CHART.text,
          },
        },
      ],
    }),
    [sorted, ar, locale, t],
  );

  return (
    <ChartFrame
      id={id}
      title={title}
      subtitle={subtitle}
      caveat={cautionCounts(locale)}
      description={description}
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
