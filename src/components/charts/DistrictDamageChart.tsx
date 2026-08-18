"use client";

import { useMemo, useRef } from "react";
import type { Locale } from "@/lib/vocab";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import districtDamage from "@/data/district-damage.json";

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
  },
  ar: {
    title: "أين أُبلغ عن أضرار 2024، قضاءً بقضاء",
    sub: (top: number) =>
      `وحدات سكنية متضررة بحسب إفادات البلديات، من مسح 135 منطقة متضررة بين 5 و15 كانون الأول 2024. قضاء بعبدا وحده - حزام الضاحية - أبلغ عن ${top.toLocaleString("en-US")} وحدة، نحو ثلثيها متضرر كلياً.`,
    caveat:
      "مسح بلدي جُمع في عشرة أيام على المعرفة المحلية، لا مسحاً هندسياً. الأقضية المسمّاة لا تغطي كل الوحدات المتضررة المُبلَّغ عنها وطنياً.",
  },
} as const;

export default function DistrictDamageChart({ locale = "en" }: { locale?: Locale } = {}) {
  const chartRef = useRef<ECharts | null>(null);
  const rows = districtDamage.districts;
  const t = districtDamage.totals;

  const option = useMemo<EChartsOption>(() => {
    const cats = [...rows].sort((a, b) => a.units - b.units);
    return {
      grid: { left: 108, right: 78, top: 12, bottom: 42 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v) =>
          `${Number(v).toLocaleString("en-US")} municipality-reported housing units`,
      },
      xAxis: {
        type: "value",
        name: "housing units reported damaged",
        nameLocation: "middle",
        nameGap: 28,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
        axisLabel: { formatter: (v: number) => v.toLocaleString("en-US") },
      },
      yAxis: {
        type: "category",
        data: cats.map((d) => d.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 11.5 },
      },
      series: [
        {
          type: "bar",
          data: cats.map((d) => ({
            value: d.units,
            itemStyle: { color: d.completeShare ? "#8F3F2F" : "#BD5A46", borderRadius: 2 },
          })),
          barMaxWidth: 20,
          label: {
            show: true,
            position: "right",
            fontSize: 11,
            fontWeight: 600,
            color: "#263645",
            formatter: (p) =>
              Number((p as { value: number }).value).toLocaleString("en-US"),
          },
        },
      ],
    };
  }, [rows]);

  return (
    <ChartFrame
      id="district-damage-2024"
      title={TR[locale].title}
      subtitle={TR[locale].sub(rows[0].units)}
      caveat={locale === "ar" ? TR.ar.caveat : districtDamage.caveats.join(" ")}
      chartRef={chartRef}
      description={`Bar chart of municipality-reported damaged housing units: ${rows
        .map((d) => `${d.name} ${d.units.toLocaleString("en-US")}`)
        .join("; ")}.`}
    >
      <div>
        <EChart
          option={option}
          height={280}
          ariaLabel="Bar chart of municipality-reported damaged housing units by district, December 2024"
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {[
            { label: "Housing units", v: t.housingUnits, note: `${t.completelyDamagedShare}% completely damaged` },
            { label: "Business establishments", v: t.businessEstablishments },
            { label: "Agricultural assets", v: t.agriculturalAssets },
            { label: "Infrastructure & service assets", v: t.infrastructureAssets },
          ].map((x) => (
            <div
              key={x.label}
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3"
            >
              <p className="text-lg font-bold tabular-nums tracking-tight text-[color:var(--color-navy)]">
                {x.v.toLocaleString("en-US")}
              </p>
              <p className="text-[11px] font-semibold text-[color:var(--color-text)]">
                {x.label}
              </p>
              {x.note ? (
                <p className="mt-0.5 text-[10.5px] text-[color:var(--color-text-secondary)]">
                  {x.note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--color-text-secondary)]">
          {t.reportedAssets.toLocaleString("en-US")} reported assets in total,
          gathered in ten days entirely on municipal local knowledge.
        </p>
      </div>
    </ChartFrame>
  );
}
