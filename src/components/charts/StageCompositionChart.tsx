"use client";

import { useMemo, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import YearControl, { type YearMode } from "@/components/YearControl";
import { CHART, YEAR_COLORS } from "@/lib/colors";
import { countsFor, changeFor } from "@/lib/data-client";
import {
  cautionCounts,
  layers,
  stageList,
  stageShortList,
  type Locale,
} from "@/lib/vocab";
import type { ActorLayer, Year } from "@/lib/types";
import { signed } from "@/lib/format";
import { chartText } from "@/lib/chart-style";

/**
 * Visual 3 - Paired stage-composition chart. Who occupied each of the
 * twelve value-chain stages, and how the composition changed.
 */
const T = {
  en: {
    title: "Who occupied each stage of the reconstruction value chain",
    side: "Paired bars per stage: upper bar 2024, lower bar 2026 (labelled in tooltips). Segments are the four actor layers.",
    change: "Change in traced actor presence per stage, 2026 minus 2024, by actor layer.",
    one: (y: string) => `Traced actor composition per stage, ${y}.`,
    percentToggle: "Percentage composition",
    axisChange: "Change in traced actors (2026 - 2024)",
    axisShare: "Share of traced actors in stage (%)",
    axisCount: "Traced actors in stage",
    tracedActors: "traced actors",
    alt: "Stage composition chart",
    upper: "In each stage pair, the upper bar is ",
    lower: " and the lower bar is ",
    stop: ".",
  },
  ar: {
    title: "من شغل كل مرحلة من سلسلة قيمة إعادة الإعمار",
    side: "شريطان لكل مرحلة: الأعلى 2024 والأدنى 2026 (مُسمّيان في التلميحات). والقطع هي طبقات الجهات الأربع.",
    change: "الفارق في حضور الجهات المرصود لكل مرحلة، 2026 ناقص 2024، بحسب طبقة الجهات.",
    one: (y: string) => `تركيبة الجهات المرصودة لكل مرحلة، ${y}.`,
    percentToggle: "تركيبة بالنسب المئوية",
    axisChange: "الفارق في الجهات المرصودة (2026 - 2024)",
    axisShare: "حصة الجهات المرصودة في المرحلة (%)",
    axisCount: "الجهات المرصودة في المرحلة",
    tracedActors: "جهة مرصودة",
    alt: "رسم تركيبة المراحل",
    upper: "في كل زوج، الشريط الأعلى هو ",
    lower: " والأدنى هو ",
    stop: ".",
  },
} as const;

export default function StageCompositionChart({
  showCaveat = true,
  locale = "en",
}: { showCaveat?: boolean; locale?: Locale } = {}) {  const tr = T[locale];
  const ar = locale === "ar";
  const LAYER_META = layers(locale);
  const STAGES = stageList(locale);
  const STAGE_SHORT = stageShortList(locale);
  const [mode, setMode] = useState<YearMode>("side");
  const [percent, setPercent] = useState(true);
  const chartRef = useRef<ECharts | null>(null);

  const option = useMemo<EChartsOption>(() => {
    const stages = [...STAGE_SHORT].reverse();

    if (mode === "change") {
      const series = LAYER_META.map((layer) => ({
        name: layer.label,
        type: "bar" as const,
        data: [...changeFor(layer.id)].reverse(),
        itemStyle: { color: layer.color, borderRadius: 2 },
        barMaxWidth: 9,
        label: { show: false },
      }));
      return {
        grid: ar
          ? { left: 40, right: 160, top: 30, bottom: 30 }
          : { left: 160, right: 40, top: 30, bottom: 30 },
        legend: { top: 0, textStyle: { fontSize: 11 } },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          valueFormatter: (v) => signed(Number(v)),
        },
        xAxis: {
          type: "value",
          inverse: ar,
          name: tr.axisChange,
          nameLocation: "middle",
          nameGap: 24,
          nameTextStyle: { fontSize: chartText(locale).axisTitle },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "#EDF0F4" } },
        },
        yAxis: {
          type: "category",
          data: stages,
          position: ar ? ("right" as const) : ("left" as const),
          axisLine: { lineStyle: { color: CHART.axis } },
          axisTick: { show: false },
          axisLabel: { fontSize: chartText(locale).tick },
        },
        series,
      };
    }

    const years: Year[] = mode === "side" ? [2024, 2026] : [mode === "2024" ? 2024 : 2026];
    const series = years.flatMap((year) =>
      LAYER_META.map((layer) => {
        const counts = countsFor(year, layer.id);
        const totals = STAGES.map((_, i) =>
          LAYER_META.reduce((s, l) => s + countsFor(year, l.id)[i], 0),
        );
        const values = counts.map((v, i) =>
          percent ? (totals[i] === 0 ? 0 : (v / totals[i]) * 100) : v,
        );
        return {
          name: layer.label,
          stack: String(year),
          type: "bar" as const,
          data: [...values].reverse().map((v, ri) => ({
            value: v,
            raw: [...counts].reverse()[ri],
          })),
          itemStyle: {
            color: layer.color,
            borderColor: "#FFFFFF",
            borderWidth: 1,
          },
          barMaxWidth: 14,
          emphasis: { focus: "series" as const },
        };
      }),
    );
    return {
      grid: ar
        ? { left: 80, right: 160, top: 30, bottom: 30 }
        : { left: 160, right: 80, top: 30, bottom: 30 },
      legend: {
        top: 0,
        textStyle: { fontSize: 11 },
        data: LAYER_META.map((l) => l.label),
      },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as unknown as {
            seriesName: string;
            name: string;
            value: number;
            data: { raw: number };
            seriesIndex: number;
          };
          const year = params.seriesIndex < 4 && mode !== "2026" ? years[0] : years[years.length - 1];
          return `<strong>${params.name}</strong> · ${year}<br/>${params.seriesName}: ${
            percent
              ? `${params.value.toFixed(1)}% (${params.data.raw} ${tr.tracedActors})`
              : `${params.data.raw} ${tr.tracedActors}`
          }`;
        },
      },
      xAxis: {
        type: "value",
        max: percent ? 100 : undefined,
        inverse: ar,
        name: percent ? tr.axisShare : tr.axisCount,
        nameLocation: "middle",
        nameGap: 24,
        nameTextStyle: { fontSize: chartText(locale).axisTitle },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: stages,
        position: ar ? ("right" as const) : ("left" as const),
        axisLine: { lineStyle: { color: CHART.axis } },
        axisTick: { show: false },
        axisLabel: { fontSize: chartText(locale).tick },
      },
      series,
    };
  }, [mode, percent, ar, locale, tr, LAYER_META, STAGES, STAGE_SHORT]);

  const tableRows = STAGES.flatMap((stage, i) =>
    LAYER_META.map((layer) => [
      stage,
      layer.label,
      countsFor(2024, layer.id)[i],
      countsFor(2026, layer.id)[i],
      signed(changeFor(layer.id)[i]),
    ]),
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <YearControl mode={mode} onChange={setMode} idPrefix="composition" locale={locale} />
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={percent}
            onChange={(e) => setPercent(e.target.checked)}
            disabled={mode === "change"}
            className="h-4 w-4 accent-[color:var(--color-navy)]"
          />
          {tr.percentToggle}
        </label>
      </div>
      <ChartFrame
        id="stage-composition"
        title={tr.title}
        subtitle={
          mode === "side" ? tr.side : mode === "change" ? tr.change : tr.one(mode)
        }
        caveat={showCaveat ? cautionCounts(locale) : undefined}
        sourceIds={["S-TRACKING"]}
        chartRef={chartRef}
        description={tableRows
          .filter((r) => Number(r[2]) > 0 || Number(r[3]) > 0)
          .map((r) => `${r[0]} - ${r[1]}: 2024 ${r[2]}, 2026 ${r[3]}`)
          .join("; ")}
        table={{
          caption: tr.alt,
          headers: ["Stage", "Actor layer", "2024", "2026", "Change"],
          rows: tableRows,
        }}
      >
        <EChart
          option={option}
          height={mode === "side" ? 620 : 480}
          ariaLabel={tr.alt}
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
        {mode === "side" ? (
          <p className="mt-1 text-[11px] text-[color:var(--color-text-secondary)]">
            {tr.upper}
            <span
              className="rounded-sm px-1 font-semibold text-white"
              style={{ background: YEAR_COLORS.y2024 }}
            >
              2024
            </span>
            {tr.lower}
            <span
              className="rounded-sm px-1 font-semibold text-white"
              style={{ background: YEAR_COLORS.y2026 }}
            >
              2026
            </span>
            {tr.stop}
          </p>
        ) : null}
      </ChartFrame>
    </div>
  );
}

export type { ActorLayer };
