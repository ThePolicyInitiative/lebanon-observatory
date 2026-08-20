"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { YEAR_COLORS } from "@/lib/colors";
import { roleMixFor } from "@/lib/data-client";
import {
  cautionCounts,
  layers,
  roleMixGroupLabels,
  type Locale,
} from "@/lib/vocab";

/**
 * Visual 4 - Actor role-mix comparison. For each layer, the share of its
 * traced presence in governance/data (stages 1–4), works delivery
 * (5–8), return & recovery (9–11) and oversight (12), 2024 vs 2026.
 */
const T = {
  en: {
    title: "Where each actor layer's traced presence sat in the chain",
    sub: "Share of each layer's traced presence by chain segment, 2024 vs 2026. Percentages are within-layer compositions; layer sizes differ.",
    short: ["Governance & assessment", "Works delivery", "Return & recovery", "Oversight"],
    alt: "Role-mix comparison across actor layers",
  },
  ar: {
    title: "أين وقع الحضور المرصود لكل طبقة جهات داخل السلسلة",
    sub: "حصة الحضور المرصود لكل طبقة بحسب مقطع السلسلة، 2024 مقابل 2026. النسب تركيبة داخل الطبقة نفسها، وأحجام الطبقات متفاوتة.",
    short: ["الحوكمة والتقييم", "تنفيذ الأشغال", "العودة والتعافي", "الرقابة"],
    alt: "مقارنة مزيج الأدوار بين طبقات الجهات",
  },
} as const;

export default function RoleMixChart({
  showCaveat = true,
  locale = "en",
}: { showCaveat?: boolean; locale?: Locale } = {}) {
  const tr = T[locale];
  const ar = locale === "ar";
  const LAYER_META = layers(locale);
  const chartRef = useRef<ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    const GROUP_SHORT = [...tr.short];
    // In Arabic the two columns read right to left, so the first panel of
    // each row sits on the right and the axis labels move with it.
    const near = ar ? "right" : "left";
    const far = ar ? "left" : "right";
    const grids = LAYER_META.map((_, i) => ({
      [near]: i % 2 === 0 ? "7%" : "56%",
      [far]: i % 2 === 0 ? "50%" : "3%",
      top: i < 2 ? 60 : 300,
      height: 170,
    }));
    const titles = LAYER_META.map((l, i) => ({
      text: l.label,
      textStyle: { fontSize: 12.5, fontWeight: 600 as const, color: l.color },
      [near]: i % 2 === 0 ? "7%" : "56%",
      top: i < 2 ? 28 : 268,
    }));
    const xAxes = LAYER_META.map((_, i) => ({
      gridIndex: i,
      type: "category" as const,
      data: GROUP_SHORT,
      inverse: ar,
      axisLabel: { fontSize: 9.5, interval: 0, rotate: 18 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#DCE3EA" } },
    }));
    const yAxes = LAYER_META.map((_, i) => ({
      gridIndex: i,
      type: "value" as const,
      max: 100,
      position: ar ? ("right" as const) : ("left" as const),
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
  }, [ar, tr, LAYER_META]);

  const tableRows = LAYER_META.flatMap((layer) => {
    const mix24 = roleMixFor(2024, layer.id);
    const mix26 = roleMixFor(2026, layer.id);
    return roleMixGroupLabels(locale).map((group, i) => [
      layer.label,
      group,
      `${mix24[i].pct.toFixed(1)}% (${mix24[i].value})`,
      `${mix26[i].pct.toFixed(1)}% (${mix26[i].value})`,
    ]);
  });

  return (
    <ChartFrame
      id="role-mix"
      title={tr.title}
      subtitle={tr.sub}
      caveat={showCaveat ? cautionCounts(locale) : undefined}
      sourceIds={["S-TRACKING"]}
      chartRef={chartRef}
      description={tableRows
        .map((r) => `${r[0]} - ${r[1]}: 2024 ${r[2]}, 2026 ${r[3]}`)
        .join("; ")}
      table={{
        caption: tr.alt,
        headers: ["Actor layer", "Segment", "2024", "2026"],
        rows: tableRows,
      }}
    >
      <EChart
        option={option}
        height={520}
        ariaLabel={tr.alt}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
