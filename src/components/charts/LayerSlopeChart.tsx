"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { stageCounts } from "@/lib/data-client";
import { layers, type Locale } from "@/lib/vocab";
import { CHART } from "@/lib/colors";
import { chartText } from "@/lib/chart-style";

/** Slopegraph of each actor layer's traced-presence total, 2024 → 2026. */
const T = {
  en: {
    title: "Who gained and who lost ground, 2024 → 2026",
    sub: "Each line is an actor layer's total traced presence across the twelve value-chain stages. Community and NGO layers rose; official and municipal presence fell.",
    caveat:
      "Counts measure traced presence in the tracking, not performance, spending or coverage. The 2026 total carries the report's traced 360-versus-363 count discrepancy.",
    axis: "traced role mentions",
    alt: "Slope chart of actor-layer totals between 2024 and 2026",
  },
  ar: {
    title: "من كسب موقعاً ومن خسره، 2024 ← 2026",
    sub: "كل خط هو مجموع الحضور المرصود لطبقة جهات عبر مراحل سلسلة القيمة الاثنتي عشرة. ارتفع حضور المجتمع المحلي والمنظمات، وتراجع حضور المؤسسات الرسمية والبلديات.",
    caveat:
      "الأعداد تقيس الحضور المرصود في التتبّع، لا الأداء ولا الإنفاق ولا التغطية. ومجموع 2026 يحمل التفاوت المرصود في التقرير بين عدّ 360 وعدّ 363.",
    axis: "إشارات أدوار مرصودة",
    alt: "رسم ميل لمجاميع طبقات الجهات بين 2024 و2026",
  },
} as const;

export default function LayerSlopeChart({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  const chartRef = useRef<ECharts | null>(null);

  const totals = useMemo(
    () =>
      layers(locale).map((l) => ({
        ...l,
        y24: stageCounts["2024"][l.id].reduce((a, b) => a + b, 0),
        y26: stageCounts["2026"][l.id].reduce((a, b) => a + b, 0),
      })),
    [locale],
  );

  const option = useMemo<EChartsOption>(
    () => ({
      grid: locale === "ar"
        ? { left: 190, right: 60, top: 30, bottom: 30 }
        : { left: 60, right: 190, top: 30, bottom: 30 },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const item = p as { seriesName?: string; dataIndex?: number };
          const t = totals.find((x) => x.label === item.seriesName);
          if (!t) return "";
          return `${t.label}<br/>2024: ${t.y24} · 2026: ${t.y26} (${t.y26 - t.y24 >= 0 ? "+" : ""}${t.y26 - t.y24})`;
        },
      },
      xAxis: {
        type: "category",
        data: ["2024", "2026"],
        inverse: locale === "ar",
        boundaryGap: true,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick, fontWeight: 600, color: CHART.text },
      },
      yAxis: {
        type: "value",
        name: tr.axis,
        nameTextStyle: { fontSize: chartText(locale).axisTitle },
        position: locale === "ar" ? "right" : "left",
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      series: totals.map((t) => ({
        name: t.label,
        type: "line" as const,
        data: [t.y24, t.y26],
        lineStyle: { width: 3, color: t.color },
        itemStyle: { color: t.color },
        symbolSize: 9,
        endLabel: {
          show: true,
          formatter: () =>
            `${t.label}  ${t.y24} → ${t.y26} (${t.y26 - t.y24 >= 0 ? "+" : ""}${t.y26 - t.y24})`,
          fontSize: 11,
          color: t.color,
          fontWeight: 600,
          width: 175,
          overflow: "break",
        },
        label: {
          show: true,
          position: "top" as const,
          fontSize: 10,
          color: t.color,
        },
      })),
    }),
    [totals, locale, tr],
  );

  return (
    <ChartFrame
      id="layer-slope"
      title={tr.title}
      subtitle={tr.sub}
      caveat={tr.caveat}
      chartRef={chartRef}
      description={totals
        .map((t) => `${t.label}: ${t.y24} → ${t.y26}`)
        .join("; ")}
      table={{
        caption: tr.axis,
        headers: ["Actor layer", "2024", "2026", "Change"],
        rows: totals.map((t) => [
          t.label,
          t.y24,
          t.y26,
          `${t.y26 - t.y24 >= 0 ? "+" : ""}${t.y26 - t.y24}`,
        ]),
      }}
    >
      <EChart
        option={option}
        height={340}
        ariaLabel={tr.alt}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
