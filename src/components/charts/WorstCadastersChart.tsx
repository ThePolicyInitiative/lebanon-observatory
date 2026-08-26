"use client";

import { useMemo, useRef } from "react";
import type { Locale } from "@/lib/vocab";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import destruction from "@/data/destruction.json";
import { CHART, UI } from "@/lib/colors";
import { chartText } from "@/lib/chart-style";

/** The four worst cadasters of the 2026 South-of-the-Litani assessment. */
const T = {
  en: {
    title: "The worst-hit cadasters, 2026 assessment",
    sub: "Buildings completely destroyed in the four worst cadasters of the South-of-the-Litani assessment (29 April 2026 imagery) - the same border communities levelled in 2024, partially reassessed after rebuilding attempts.",
    caveat:
      "Desk-checked GeoAI review of 29 April 2026 imagery, south of the Litani only. A snapshot, not cumulative with any 2024 result.",
    unit: "buildings completely destroyed",
    desc: "Bar chart",
    chart: "Bar chart of buildings completely destroyed in the four worst cadasters",
    tableCaption:
      "Buildings completely destroyed per cadaster, South-of-the-Litani assessment, published 22 June 2026.",
    headers: ["Cadaster", "Buildings completely destroyed"],
  },
  ar: {
    title: "البلدات الأشد تضرراً، تقييم 2026",
    sub: "المباني المدمَّرة كلياً في البلدات الأربع الأشد تضرراً ضمن تقييم جنوب الليطاني (صور 29 نيسان 2026) - القرى الحدودية نفسها التي سُوّيت في 2024، وأُعيد تقييمها جزئياً بعد محاولات إعادة البناء.",
    caveat:
      "مراجعة GeoAI مكتبية لصور 29 نيسان 2026، جنوب الليطاني وحده. لقطة زمنية لا تُجمع مع أي نتيجة من 2024.",
    unit: "مبنى مدمّر كلياً",
    desc: "رسم بياني",
    chart: "رسم بياني للمباني المدمّرة كلياً في البلدات الأربع الأشد تضرراً",
    tableCaption:
      "مبانٍ مدمّرة كلياً في كل بلدة، تقييم جنوب الليطاني، نُشر في 22 حزيران 2026.",
    headers: ["البلدة", "مبانٍ مدمّرة كلياً"],
  },
} as const;

export default function WorstCadastersChart({ locale = "en" }: { locale?: Locale } = {}) {
  const chartRef = useRef<ECharts | null>(null);
  const zone = destruction.zones2026.find((z) => z.id === "south-litani")!;
  const rows = zone.worstCadasters;
  const cadasterName = (c: { name: string; nameAr?: string }) =>
    locale === "ar" ? c.nameAr ?? c.name : c.name;

  const option = useMemo<EChartsOption>(() => {
    const cats = [...rows].reverse();
    return {
      grid: { left: 110, right: 80, top: 12, bottom: 40 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v) => `${Number(v).toLocaleString("en-US")} ${T[locale].unit}`,
      },
      xAxis: {
        type: "value",
        name: T[locale].unit,
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: chartText(locale).axisTitle },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: cats.map((c) =>
          locale === "ar" ? c.nameAr ?? c.name : c.name,
        ),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick },
      },
      series: [
        {
          type: "bar",
          data: cats.map((c) => c.destroyed),
          itemStyle: { color: UI.rust, borderRadius: 2 },
          barMaxWidth: 22,
          label: {
            show: true,
            position: "right",
            fontSize: 11,
            fontWeight: 600,
            color: CHART.text,
            formatter: (p) =>
              Number((p as { value: number }).value).toLocaleString("en-US"),
          },
        },
      ],
    };
  }, [rows, locale]);

  // The method is stated in full on the zone card above this figure;
  // repeating that paragraph in the caveat printed it twice on one page,
  // so the caveat carries the short version.
  return (
    <ChartFrame
      id="worst-cadasters"
      title={T[locale].title}
      subtitle={T[locale].sub}
      caveat={T[locale].caveat}
      chartRef={chartRef}
      description={`${T[locale].desc}: ${rows
        .map((r) => `${cadasterName(r)} ${r.destroyed.toLocaleString("en-US")}`)
        .join("; ")} ${T[locale].unit}.`}
      table={{
        caption: T[locale].tableCaption,
        headers: [...T[locale].headers],
        rows: rows.map((r) => [cadasterName(r), r.destroyed.toLocaleString("en-US")]),
      }}
    >
      <EChart
        option={option}
        height={240}
        ariaLabel={T[locale].chart}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
