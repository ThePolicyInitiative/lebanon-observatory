"use client";

import { useMemo, useRef } from "react";
import type { Locale } from "@/lib/vocab";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import sectorsJson from "@/data/sectors.json";
import { CHART, UI } from "@/lib/colors";

/** Sector damage, losses and needs - three distinct economic categories,
 * shown side by side and never summed. Nulls are "not stated", not zero. */
const T = {
  en: {
    title: "Selected sector estimates, 2023–24 conflict",
    sub: "Damage (blue), losses (light blue) and assessed needs (rust) are distinct categories, never summed. A missing bar means the assessment states no figure - not zero.",
    caveat:
      "Sector estimates carry different cut-offs and methods within one assessment framework, and the largest loss figures are macro-estimates rather than enterprise censuses. Losses towering over damage in the productive sectors explains why livelihood destruction became the least institutionalised loss of the war: a damaged transformer has an owner and a repair chain; a lost agricultural season has neither.",
    damage: "Damage",
    losses: "Losses",
    needs: "Needs",
    axis: "US$ million",
    desc: "Grouped horizontal bars of sector-level damage, losses and needs from the 2023–24 conflict assessment",
    chart: "Grouped bar chart of sector damage, losses and needs",
    tableCaption: "Sector estimates in US$ million (- means not stated in the citation).",
    headers: ["Sector", "Damage", "Losses", "Assessed needs", "Note"],
  },
  ar: {
    title: "تقديرات قطاعية مختارة، حرب 2023-24",
    sub: "الأضرار (أزرق) والخسائر (أزرق فاتح) والاحتياجات المقدَّرة (خمري) فئات متمايزة لا تُجمع أبداً. غياب العمود يعني أن التقييم لا يذكر رقماً - لا أن الرقم صفر.",
    caveat:
      "التقديرات القطاعية تحمل تواريخ توقف ومنهجيات مختلفة داخل إطار تقييم واحد، وأكبر أرقام الخسائر تقديرات كلية لا مسوحاً للمنشآت. تفوّق الخسائر على الأضرار في القطاعات الإنتاجية يفسّر لماذا صار تدمير سبل العيش أقل خسائر الحرب تأطيراً مؤسسياً: المحوّل المتضرر له مالك وسلسلة إصلاح، أما الموسم الزراعي الضائع فلا هذا ولا ذاك.",
    damage: "أضرار",
    losses: "خسائر",
    needs: "احتياجات",
    axis: "مليون دولار",
    desc: "أعمدة أفقية مجمّعة للأضرار والخسائر والاحتياجات على مستوى القطاعات من تقييم حرب 2023-24",
    chart: "رسم بياني مجمّع للأضرار والخسائر والاحتياجات القطاعية",
    tableCaption: "تقديرات قطاعية بملايين الدولارات (الشرطة تعني أن الرقم غير وارد في المرجع).",
    headers: ["القطاع", "أضرار", "خسائر", "احتياجات مقدّرة", "ملاحظة"],
  },
} as const;

export default function SectorDamageChart({ locale = "en" }: { locale?: Locale } = {}) {
  const chartRef = useRef<ECharts | null>(null);
  const rows = sectorsJson.sectors.filter(
    (s) => s.damage !== null || s.losses !== null || s.needs !== null,
  );

  const option = useMemo<EChartsOption>(() => {
    const cats = [...rows].reverse();
    const mk = (
      name: string,
      key: "damage" | "losses" | "needs",
      color: string,
    ) => ({
      name,
      type: "bar" as const,
      data: cats.map((s) => s[key]),
      itemStyle: { color, borderRadius: 2 },
      barMaxWidth: 11,
      label: {
        show: true,
        position: "right" as const,
        fontSize: 10,
        color: CHART.text,
        formatter: (p: unknown) => {
          const value = (p as { value?: number | null }).value;
          return value === null || value === undefined ? "" : `$${value}M`;
        },
      },
    });
    return {
      grid: { left: 170, right: 70, top: 34, bottom: 40 },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v) =>
          v === null || v === undefined ? "not stated" : `US$${v} million`,
      },
      xAxis: {
        type: "value",
        name: T[locale].axis,
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: cats.map((s) => (locale === "ar" ? (s.labelAr ?? s.label) : s.label)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: 11, width: 155, overflow: "break" },
      },
      series: [
        mk(T[locale].damage, "damage", "#2E74B5"),
        mk(T[locale].losses, "losses", "#8FB4D9"),
        mk(T[locale].needs, "needs", UI.rust),
      ],
    };
  }, [rows, locale]);

  return (
    <ChartFrame
      id="sector-estimates"
      title={T[locale].title}
      subtitle={T[locale].sub}
      caveat={T[locale].caveat}
      sourceIds={["S4", "S29"]}
      chartRef={chartRef}
      description={`${T[locale].desc}: ${rows
        .map(
          (s) =>
            `${locale === "ar" ? (s.labelAr ?? s.label) : s.label} ${[s.damage, s.losses, s.needs]
              .filter((v) => v !== null)
              .join(", ")}`,
        )
        .join("; ")}.`}
      table={{
        caption: T[locale].tableCaption,
        headers: [...T[locale].headers],
        rows: sectorsJson.sectors.map((s) => [
          locale === "ar" ? (s.labelAr ?? s.label) : s.label,
          s.damage ?? "-",
          s.losses ?? "-",
          s.needs ?? "-",
          locale === "ar" ? (s.detailAr ?? s.detail) : s.detail,
        ]),
      }}
    >
      <EChart
        option={option}
        height={430}
        ariaLabel={T[locale].chart}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
