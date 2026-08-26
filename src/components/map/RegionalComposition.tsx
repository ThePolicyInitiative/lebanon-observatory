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
    title: "Regional actor composition, 2024 vs 2026",
    subtitle:
      "For each regional grouping the upper stacked bar is 2024 and the lower is 2026; segments are the four actor layers.",
    description:
      "Paired stacked bars per regional grouping showing the actor-layer composition of traced location mentions in 2024 and 2026. South and Nabatieh and national/multi-region groupings dominate; community mentions dominate named affected localities.",
    xAxis: "Location mentions in the tracking",
    tooltipUnit: "mentions",
    tableCaption: "Location mentions by region, year and actor layer.",
    headers: ["Region", "Year", "Official", "Municipal", "NGO/International", "Community"],
    chartAria: "Paired stacked bars of regional actor composition for 2024 and 2026",
  },
  ar: {
    title: "تركيبة الجهات إقليمياً، 2024 مقابل 2026",
    subtitle:
      "لكل تجمّع إقليمي، الشريط المكدَّس الأعلى هو 2024 والأدنى هو 2026؛ والمقاطع هي طبقات الجهات الأربع.",
    description:
      "أشرطة مكدَّسة مزدوجة لكل تجمّع إقليمي تُظهر تركيبة طبقات الجهات في إشارات الأماكن المرصودة لعامي 2024 و2026. يغلب الجنوب والنبطية والتجمّع الوطني/متعدد المناطق؛ وتغلب الإشارات الأهلية في البلدات المتضررة المسمّاة.",
    xAxis: "إشارات الأماكن في التتبّع",
    tooltipUnit: "إشارة",
    tableCaption: "إشارات الأماكن بحسب المنطقة والسنة وطبقة الجهة.",
    headers: ["المنطقة", "السنة", "رسمية", "بلدية", "دولية / غير حكومية", "أهلية"],
    chartAria: "أشرطة مكدَّسة مزدوجة لتركيبة الجهات إقليمياً لعامي 2024 و2026",
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
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as unknown as {
            seriesName: string;
            name: string;
            value: number;
            seriesIndex: number;
          };
          const year = params.seriesIndex < layerMeta.length ? 2024 : 2026;
          return `<strong>${params.name}</strong> · ${year}<br/>${params.seriesName}: ${params.value} ${t.tooltipUnit}`;
        },
      },
      xAxis: {
        type: "value",
        name: t.xAxis,
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: chartText(locale).axisTitle },
        axisLine: { show: false },
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

  const tableRows = regions.flatMap((r) =>
    ([2024, 2026] as Year[]).map((year) => {
      const y = locations.mentions[String(year) as "2024" | "2026"];
      const m = y[r.id as keyof typeof y] as Record<ActorLayer, number>;
      return [
        regionLabel(r.id, locale),
        year,
        m?.official ?? 0,
        m?.municipal ?? 0,
        m?.ngo_international ?? 0,
        m?.community ?? 0,
      ];
    }),
  );

  return (
    <ChartFrame
      id="regional-composition"
      title={t.title}
      subtitle={t.subtitle}
      caveat={showCaveat ? cautionMap(locale) : undefined}
      sourceIds={["S-TRACKING"]}
      chartRef={chartRef}
      description={t.description}
      table={{
        caption: t.tableCaption,
        headers: [...t.headers],
        rows: tableRows,
      }}
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
