"use client";

import { useMemo, useRef } from "react";
import type { Locale } from "@/lib/vocab";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import districtDamage from "@/data/district-damage.json";
import { CHART, UI } from "@/lib/colors";
import { chartText } from "@/lib/chart-style";

/**
 * Municipality-reported damaged housing units by district, from the
 * ten-day survey of 135 affected areas (December 2024) - the fastest
 * national damage assessments the 2024 response produced, and the only
 * district-level breakdown available for that war.
 */
const TR = {
  en: {
    title: "Where the 2024 damage was reported, district by district",
    sub: (top: number) =>
      `Municipality-reported damaged housing units from the survey of 135 affected areas, 5-15 December 2024. Baabda - the Dahieh belt - alone reported ${top.toLocaleString("en-US")} units, roughly two thirds of them completely damaged.`,
    caveat: "",
    unit: "housing units reported damaged",
    tip: "municipality-reported housing units",
    desc: "Bar chart of municipality-reported damaged housing units",
    chart: "Bar chart of municipality-reported damaged housing units by district, December 2024",
    tiles: [
      "Housing units",
      "Business establishments",
      "Agricultural assets",
      "Infrastructure & service assets",
    ],
    completeShare: (n: number) => `${n}% completely damaged`,
    total: (n: string) =>
      `${n} reported assets in total, gathered in ten days entirely on municipal local knowledge.`,
  },
  ar: {
    title: "أين أُبلغ عن أضرار 2024، قضاءً بقضاء",
    sub: (top: number) =>
      `وحدات سكنية متضررة بحسب إفادات البلديات، من مسح 135 منطقة متضررة بين 5 و15 كانون الأول 2024. قضاء بعبدا وحده - حزام الضاحية - أبلغ عن ${top.toLocaleString("en-US")} وحدة، نحو ثلثيها متضرر كلياً.`,
    caveat:
      "مسح بلدي جُمع في عشرة أيام على المعرفة المحلية، لا مسحاً هندسياً. الأقضية المسمّاة لا تغطي كل الوحدات المتضررة المُبلَّغ عنها وطنياً.",
    unit: "وحدات سكنية أُبلغ عن تضرّرها",
    tip: "وحدة سكنية بحسب إفادات البلديات",
    desc: "رسم بياني للوحدات السكنية المتضررة بحسب إفادات البلديات",
    chart:
      "رسم بياني للوحدات السكنية المتضررة بحسب إفادات البلديات، قضاءً بقضاء، كانون الأول 2024",
    tiles: [
      "وحدات سكنية",
      "منشآت تجارية",
      "أصول زراعية",
      "أصول بنى تحتية وخدمات",
    ],
    completeShare: (n: number) => `${n}% متضررة كلياً`,
    total: (n: string) =>
      `${n} أصلاً مُبلَّغاً عنه إجمالاً، جُمعت في عشرة أيام اعتماداً على المعرفة المحلية للبلديات وحدها.`,
  },
} as const;

export default function DistrictDamageChart({ locale = "en" }: { locale?: Locale } = {}) {
  const chartRef = useRef<ECharts | null>(null);
  const rows = districtDamage.districts;
  const t = districtDamage.totals;

  const tr = TR[locale];
  const districtName = (d: { name: string; nameAr?: string }) =>
    locale === "ar" ? d.nameAr ?? d.name : d.name;

  const option = useMemo<EChartsOption>(() => {
    const cats = [...rows].sort((a, b) => a.units - b.units);
    return {
      grid: { left: 108, right: 78, top: 12, bottom: 42 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v) =>
          `${Number(v).toLocaleString("en-US")} ${tr.tip}`,
      },
      xAxis: {
        type: "value",
        name: tr.unit,
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { fontSize: chartText(locale).axisTitle },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
        axisLabel: { formatter: (v: number) => v.toLocaleString("en-US") },
      },
      yAxis: {
        type: "category",
        data: cats.map((d) =>
          locale === "ar" ? d.nameAr ?? d.name : d.name,
        ),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART.axis } },
        axisLabel: { fontSize: chartText(locale).tick },
      },
      series: [
        {
          type: "bar",
          data: cats.map((d) => ({
            value: d.units,
            itemStyle: { color: d.completeShare ? "#8F3F2F" : UI.rust, borderRadius: 2 },
          })),
          barMaxWidth: 20,
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
  }, [rows, tr, locale]);

  return (
    <ChartFrame
      id="district-damage-2024"
      title={tr.title}
      subtitle={tr.sub(rows[0].units)}
      caveat={locale === "ar" ? tr.caveat : districtDamage.caveats.join(" ")}
      chartRef={chartRef}
      description={`${tr.desc}: ${rows
        .map((d) => `${districtName(d)} ${d.units.toLocaleString("en-US")}`)
        .join("; ")}.`}
    >
      <div>
        <EChart
          option={option}
          height={280}
          ariaLabel={tr.chart}
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            {
              label: tr.tiles[0],
              v: t.housingUnits,
              note: tr.completeShare(t.completelyDamagedShare),
            },
            { label: tr.tiles[1], v: t.businessEstablishments },
            { label: tr.tiles[2], v: t.agriculturalAssets },
            { label: tr.tiles[3], v: t.infrastructureAssets },
          ].map((x) => (
            <div
              key={x.label}
              className="rounded-md border border-border bg-bg p-3"
            >
              <p className="text-lg font-bold tabular-nums tracking-tight text-navy">
                {x.v.toLocaleString("en-US")}
              </p>
              <p className="text-[11px] font-semibold text-text">
                {x.label}
              </p>
              {x.note ? (
                <p className="mt-0.5 text-[10.5px] text-text-secondary">
                  {x.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-text-secondary">
          {tr.total(t.reportedAssets.toLocaleString("en-US"))}
        </p>
      </div>
    </ChartFrame>
  );
}
