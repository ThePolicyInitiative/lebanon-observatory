"use client";

import { useMemo, useRef } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import { MUNICIPAL_POWER_GAP } from "@/lib/data-client";
import { CHART, YEAR_COLORS } from "@/lib/colors";
import { cautionCounts, type Locale } from "@/lib/vocab";
import { chartText } from "@/lib/chart-style";

const T = {
  en: {
    title: "The municipal power gap, 2024 → 2026",
    subtitle:
      "Circles mark 2024, diamonds mark 2026 - the shape difference carries year identity alongside colour. Values are grouped functional counts from the analysis.",
    axisName: "Traced functional presence (grouped counts)",
    description:
      "Dumbbell chart comparing municipal functional presence between 2024 and 2026: coordination and reporting fell from 6 to 3, damage assessment from 4 to 2, local clearance from 6 to 3, shelter and relief interface rose from 3 to 4, and finance, reconstruction and oversight power was zero in both years.",
    ariaLabel: "Dumbbell chart of municipal functional presence in 2024 and 2026",
    tableCaption: "Municipal functional presence by grouped function and year.",
    tableHeaders: ["Function", "2024", "2026"],
    note:
      "In both years: no traced municipal finance role, no reconstruction authority and no oversight role.",
  },
  ar: {
    title: "فجوة السلطة البلدية، 2024 ← 2026",
    subtitle:
      "الدوائر تشير إلى 2024 والمعيّنات إلى 2026 - فاختلاف الشكل يحمل هوية السنة إلى جانب اللون. والقيم أعداد وظيفية مجمَّعة من التحليل.",
    axisName: "الحضور الوظيفي المرصود (أعداد مجمَّعة)",
    description:
      "شكل نقاط مزدوجة يقارن الحضور الوظيفي البلدي بين 2024 و2026: التنسيق والإبلاغ هبط من 6 إلى 3، وتقييم الأضرار من 4 إلى 2، والإزالة المحلية من 6 إلى 3، وواجهة الإيواء والإغاثة صعدت من 3 إلى 4، وسلطة التمويل وإعادة الإعمار والرقابة كانت صفراً في السنتين.",
    ariaLabel: "شكل نقاط مزدوجة للحضور الوظيفي البلدي في 2024 و2026",
    tableCaption: "الحضور الوظيفي البلدي بحسب الوظيفة المجمَّعة والسنة.",
    tableHeaders: ["الوظيفة", "2024", "2026"],
    note: "في السنتين: لا دور تمويلي بلدي مرصود، ولا سلطة إعادة إعمار، ولا دور رقابي.",
  },
} as const;

/** Arabic renderings of the grouped municipal functions the data carries. */
const FN_AR: Record<string, string> = {
  "Coordination and reporting": "التنسيق والإبلاغ",
  "Damage assessment": "تقييم الأضرار",
  "Local clearance and enabling": "الإزالة المحلية والتمكين",
  "Shelter and relief interface": "واجهة الإيواء والإغاثة",
  "Finance, reconstruction and oversight power": "سلطة التمويل وإعادة الإعمار والرقابة",
};

/**
 * Visual 5 - Municipal power gap. Dumbbell chart comparing grouped
 * municipal functional presence in 2024 and 2026.
 */
export default function MunicipalDumbbell({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const ar = locale === "ar";
  const chartRef = useRef<ECharts | null>(null);
  const rows = [...MUNICIPAL_POWER_GAP].reverse();
  const fnLabel = useMemo(
    () => (fn: string) => (ar ? (FN_AR[fn] ?? fn) : fn),
    [ar],
  );

  const option = useMemo<EChartsOption>(() => {
    const categories = rows.map((r) => fnLabel(r.fn));
    return {
      grid: ar
        ? { left: 60, right: 230, top: 34, bottom: 40 }
        : { left: 230, right: 60, top: 34, bottom: 40 },
      legend: {
        top: 0,
        data: [
          { name: "2024", itemStyle: { color: YEAR_COLORS.y2024 } },
          { name: "2026", itemStyle: { color: YEAR_COLORS.y2026 } },
        ],
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      xAxis: {
        type: "value",
        max: 7,
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
        data: categories,
        position: ar ? "right" : "left",
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick, color: "#3D4C5E", width: 210, overflow: "break" },
      },
      series: [
        // Connector segments drawn as a custom series
        {
          type: "custom",
          name: "change",
          silent: true,
          renderItem: (params, api) => {
            const y = api.coord([0, params.dataIndex])[1];
            const x1 = api.coord([api.value(0), 0])[0];
            const x2 = api.coord([api.value(1), 0])[0];
            return {
              type: "line",
              shape: { x1, y1: y, x2, y2: y },
              style: {
                stroke: api.value(0) === api.value(1) ? "#B9C2CE" : "#8FA1B5",
                lineWidth: 2,
              },
            };
          },
          data: rows.map((r) => [r.y2024, r.y2026]),
          z: 1,
        },
        {
          name: "2024",
          type: "scatter",
          symbolSize: 13,
          itemStyle: { color: YEAR_COLORS.y2024 },
          data: rows.map((r) => r.y2024),
          label: {
            show: true,
            position: "top",
            distance: 4,
            formatter: (p) => String(p.value),
            fontSize: 10.5,
            color: CHART.text,
          },
          z: 2,
        },
        {
          name: "2026",
          type: "scatter",
          symbolSize: 13,
          symbol: "diamond",
          itemStyle: { color: YEAR_COLORS.y2026 },
          data: rows.map((r) => r.y2026),
          label: {
            show: true,
            position: "bottom",
            distance: 4,
            formatter: (p) => String(p.value),
            fontSize: 10.5,
            color: CHART.text,
          },
          z: 3,
        },
      ],
    };
  }, [rows, ar, locale, t, fnLabel]);

  return (
    <div>
      <ChartFrame
        id="municipal-power-gap"
        title={t.title}
        subtitle={t.subtitle}
        caveat={cautionCounts(locale)}
        sourceIds={["S-TRACKING"]}
        chartRef={chartRef}
        description={t.description}
        table={{
          caption: t.tableCaption,
          headers: [...t.tableHeaders],
          rows: MUNICIPAL_POWER_GAP.map((r) => [fnLabel(r.fn), r.y2024, r.y2026]),
        }}
      >
        <EChart
          option={option}
          height={340}
          ariaLabel={t.ariaLabel}
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
      </ChartFrame>
      <p className="mt-3 rounded-md border-s-4 border-rust bg-white p-4 text-sm font-medium leading-relaxed text-text">
        {t.note}
      </p>
    </div>
  );
}
