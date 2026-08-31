"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "@/components/charts/EChart";
import ChartFrame from "@/components/charts/ChartFrame";
import { locations } from "@/lib/data-client";
import { cautionMap, layers, regionLabel, type Locale } from "@/lib/vocab";
import type { ActorLayer, Year } from "@/lib/types";
import { CHART } from "@/lib/colors";
import { chartText } from "@/lib/chart-style";

const T = {
  en: {
    title: "Which groups were traced where, 2024 vs 2026",
    subtitle:
      "For each regional grouping the upper stacked bar is 2024 and the lower is 2026. Segments are the four actor groups, and a longer segment means more traced activity there - no counts are printed here by design.",
    description:
      "Paired stacked bars per regional grouping showing the actor-group composition of traced activity in 2024 and 2026. South and Nabatieh and national/multi-region groupings dominate; community activity dominates the named affected localities.",
    xAxis: "Traced activity located in each region",
    tableCaption: "Traced activity by region, year and actor group.",
    headers: ["Region", "Year", "Official", "Municipal", "NGO/International", "Community"],
    chartAria: "Paired stacked bars of regional actor-group composition for 2024 and 2026",
  },
  ar: {
    title: "أي المجموعات رُصدت وأين، 2024 مقابل 2026",
    subtitle:
      "لكل تجمّع إقليمي، الشريط المكدَّس الأعلى هو 2024 والأدنى هو 2026. والمقاطع هي مجموعات الجهات الأربع، وكلما طال المقطع زاد النشاط المرصود هناك - ولا تُطبع أي أعداد هنا عن قصد.",
    description:
      "أشرطة مكدَّسة مزدوجة لكل تجمّع إقليمي تُظهر تركيبة مجموعات الجهات في النشاط المرصود لعامي 2024 و2026. يغلب الجنوب والنبطية والتجمّع الوطني/متعدد المناطق؛ ويغلب نشاط المجتمع المحلي في البلدات المتضررة المسمّاة.",
    xAxis: "النشاط المرصود المحدَّد الموقع في كل منطقة",
    tableCaption: "النشاط المرصود بحسب المنطقة والسنة ومجموعة الجهات.",
    headers: ["المنطقة", "السنة", "رسمية", "بلدية", "دولية / غير حكومية", "أهلية"],
    chartAria: "أشرطة مكدَّسة مزدوجة لتركيبة مجموعات الجهات إقليمياً لعامي 2024 و2026",
  },
} as const;

/** Paired regional actor-composition chart shown with the map (Visual 8 companion). */
export default function RegionalComposition({
  showCaveat = true,
  locale = "en",
}: { showCaveat?: boolean; locale?: Locale } = {}) {
  const chartRef = useRef<ECharts | null>(null);
  const t = T[locale];

  const regions = locations.regions;
  const layerMeta = useMemo(() => layers(locale), [locale]);
  const option = useMemo<EChartsOption>(() => {
    const cats = [...regions].reverse();
    const series = ([2024, 2026] as Year[]).flatMap((year) =>
      layerMeta.map((layer) => ({
        name: layer.label,
        stack: String(year),
        type: "bar" as const,
        data: cats.map((r) => {
          const y = locations.mentions[String(year) as "2024" | "2026"];
          const m = y[r.id as keyof typeof y] as Record<ActorLayer, number>;
          return m ? m[layer.id] : 0;
        }),
        itemStyle: { color: layer.color, borderColor: "#FFF", borderWidth: 1 },
        barMaxWidth: 12,
      })),
    );
    return {
      grid: { left: 190, right: 40, top: 34, bottom: 40 },
      legend: { top: 0, textStyle: { fontSize: 11 }, data: layerMeta.map((l) => l.label) },
      // Region, year and group only: the groups compare here, so the
      // tooltip never carries a figure - the segment's length is the whole
      // statement.
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as unknown as {
            seriesName: string;
            name: string;
            seriesIndex: number;
          };
          const year = params.seriesIndex < layerMeta.length ? 2024 : 2026;
          return `<strong>${params.name}</strong> · ${year}<br/>${params.seriesName}`;
        },
      },
      xAxis: {
        type: "value",
        name: t.xAxis,
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: chartText(locale).axisTitle },
        axisLine: { show: false },
        // No tick numbers: the axis title says what length means, and
        // group comparisons print no counts anywhere on this site.
        axisLabel: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: cats.map((r) => regionLabel(r.id, locale)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick, width: 175, overflow: "break" },
      },
      series,
    };
  }, [regions, layerMeta, locale, t]);

  return (
    <ChartFrame
      id="regional-composition"
      title={t.title}
      subtitle={t.subtitle}
      caveat={showCaveat ? cautionMap(locale) : undefined}
      description={t.description}
    >
      <EChart
        option={option}
        height={520}
        ariaLabel={t.chartAria}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
