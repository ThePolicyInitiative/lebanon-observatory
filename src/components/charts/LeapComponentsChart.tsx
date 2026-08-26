"use client";

import { useMemo, useRef } from "react";
import type { Locale } from "@/lib/vocab";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { finance } from "@/lib/data-client";
import { CHART } from "@/lib/colors";
import { chartText } from "@/lib/chart-style";

type Component = {
  label: string;
  labelAr: string;
  shortAr: string;
  initialUsd: number;
  appraisedUsd: number;
  note?: string;
};

/** LEAP's component allocations: initial US$250M loan versus the appraised
 * US$1B framework. */
const T = {
  en: {
    title: "Where LEAP's money is meant to go",
    sub: "Component allocations of the initial US$250 million loan (light blue) against the appraised US$1 billion framework (navy).",
    caveat:
      "Reconstruction works deliberately received no initial allocation - works need preparation first - so the framework's largest component is entirely unfunded until additional financing arrives. Allocation is not disbursement: by 29 June 2026, 1.65% of the loan had been disbursed.",
    axis: "US$ million",
    initial: "Initial US$250M loan",
    appraised: "Appraised US$1B framework",
    unit: (v: number) => `US$${v} million`,
    alt: "Grouped bar chart of LEAP component allocations, initial loan versus appraised framework",
  },
  ar: {
    title: "إلى أين يُفترض أن يذهب مال LEAP",
    sub: "توزيع مكوّنات القرض الأولي البالغ 250 مليون دولار (أزرق فاتح) مقابل الإطار المقدَّر بمليار دولار (كحلي).",
    caveat:
      "أشغال إعادة الإعمار لم تُخصَّص لها مبالغ أولية عن قصد - فالأشغال تحتاج تحضيراً أولاً - ولذلك يبقى أكبر مكوّنات الإطار بلا تمويل إلى أن يصل تمويل إضافي. والتخصيص ليس دفعاً: حتى 29 حزيران 2026 كان قد دُفع 1.65% من القرض.",
    axis: "مليون دولار",
    initial: "القرض الأولي 250 مليون دولار",
    appraised: "الإطار المقدَّر بمليار دولار",
    unit: (v: number) => `${v} مليون دولار`,
    alt: "رسم أعمدة مجمّعة لتوزيع مكوّنات LEAP، القرض الأولي مقابل الإطار المقدَّر",
  },
} as const;

export default function LeapComponentsChart({ locale = "en" }: { locale?: Locale } = {}) {  const tr = T[locale];
  const chartRef = useRef<ECharts | null>(null);
  const components = finance.leapComponents as Component[];

  const option = useMemo<EChartsOption>(() => {
    const cats = [...components].reverse();
    const short = (c: Component) =>
      locale === "ar" ? c.shortAr : c.label.split("(")[0].trim();
    return {
      grid: locale === "ar"
        ? { left: 76, right: 165, top: 34, bottom: 40 }
        : { left: 165, right: 76, top: 34, bottom: 40 },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v) => tr.unit(Number(v ?? 0) / 1e6),
      },
      xAxis: {
        type: "value",
        inverse: locale === "ar",
        name: tr.axis,
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: chartText(locale).axisTitle },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
        axisLabel: { formatter: (v: number) => `${v / 1e6}` },
      },
      yAxis: {
        type: "category",
        position: locale === "ar" ? "right" : "left",
        data: cats.map(short),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick, width: 150, overflow: "break" },
      },
      series: [
        {
          name: tr.initial,
          type: "bar",
          data: cats.map((c) => c.initialUsd),
          itemStyle: { color: "#58779B", borderRadius: 2 },
          barMaxWidth: 13,
          label: {
            show: true,
            position: locale === "ar" ? "left" : "right",
            fontSize: 10,
            color: CHART.text,
            formatter: (p) => `$${(Number((p as { value: number }).value) / 1e6).toFixed(0)}M`,
          },
        },
        {
          name: tr.appraised,
          type: "bar",
          data: cats.map((c) => c.appraisedUsd),
          itemStyle: { color: "#173B63", borderRadius: 2 },
          barMaxWidth: 13,
          label: {
            show: true,
            position: locale === "ar" ? "left" : "right",
            fontSize: 10,
            color: CHART.text,
            formatter: (p) => `$${(Number((p as { value: number }).value) / 1e6).toFixed(0)}M`,
          },
        },
      ],
    };
  }, [components, locale, tr]);

  return (
    <ChartFrame
      id="leap-components"
      title={tr.title}
      subtitle={tr.sub}
      caveat={tr.caveat}
      chartRef={chartRef}
      description={components
        .map(
          (c) =>
            `${locale === "ar" ? c.shortAr : c.label.split("(")[0].trim()}: ${tr.unit(c.initialUsd / 1e6)} / ${tr.unit(c.appraisedUsd / 1e6)}`,
        )
        .join("; ")}
      table={{
        caption: tr.axis,
        headers: ["Component", tr.initial, tr.appraised, "Note"],
        rows: components.map((c) => [
          locale === "ar" ? c.labelAr : c.label,
          c.initialUsd / 1e6,
          c.appraisedUsd / 1e6,
          c.note ?? "",
        ]),
      }}
    >
      <EChart
        option={option}
        height={330}
        ariaLabel={tr.alt}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
