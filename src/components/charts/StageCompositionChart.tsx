"use client";

import { useMemo, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";
import YearControl, { type YearMode } from "@/components/YearControl";
import { LAYER_META, YEAR_COLORS } from "@/lib/colors";
import { STAGE_SHORT, STAGES, countsFor } from "@/lib/data-client";
import { changeFor, CAUTION_COUNTS } from "@/lib/data-client";
import type { ActorLayer, Year } from "@/lib/types";
import { signed } from "@/lib/format";

/**
 * Visual 3 - Paired stage-composition chart. Who occupied each of the
 * twelve value-chain stages, and how the composition changed.
 */
export default function StageCompositionChart() {
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
        grid: { left: 160, right: 40, top: 30, bottom: 30 },
        legend: { top: 0, textStyle: { fontSize: 11 } },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          valueFormatter: (v) => signed(Number(v)),
        },
        xAxis: {
          type: "value",
          name: "Change in traced actors (2026 − 2024)",
          nameLocation: "middle",
          nameGap: 24,
          nameTextStyle: { fontSize: 11 },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: "#EDF0F4" } },
        },
        yAxis: {
          type: "category",
          data: stages,
          axisLine: { lineStyle: { color: "#DCE3EA" } },
          axisTick: { show: false },
          axisLabel: { fontSize: 11 },
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
      grid: { left: 160, right: 80, top: 30, bottom: 30 },
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
              ? `${params.value.toFixed(1)}% (${params.data.raw} traced actors)`
              : `${params.data.raw} traced actors`
          }`;
        },
      },
      xAxis: {
        type: "value",
        max: percent ? 100 : undefined,
        name: percent
          ? "Share of traced actors in stage (%)"
          : "Traced actors in stage",
        nameLocation: "middle",
        nameGap: 24,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: stages,
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisTick: { show: false },
        axisLabel: { fontSize: 11 },
      },
      series,
    };
  }, [mode, percent]);

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
        <YearControl mode={mode} onChange={setMode} idPrefix="composition" />
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={percent}
            onChange={(e) => setPercent(e.target.checked)}
            disabled={mode === "change"}
            className="h-4 w-4 accent-[color:var(--color-navy)]"
          />
          Percentage composition
        </label>
      </div>
      <ChartFrame
        id="stage-composition"
        title="Who occupied each stage of the reconstruction value chain"
        subtitle={
          mode === "side"
            ? "Paired bars per stage: upper bar 2024, lower bar 2026 (labelled in tooltips). Segments are the four actor layers."
            : mode === "change"
              ? "Change in traced actor presence per stage, 2026 minus 2024, by actor layer."
              : `Traced actor composition per stage, ${mode}.`
        }
        caveat={CAUTION_COUNTS}
        sourceIds={["S-TRACKING"]}
        chartRef={chartRef}
        description="Stacked horizontal bars showing, for each of the twelve reconstruction value-chain stages, how traced actor presence is distributed across official institutions, NGOs and international agencies, municipalities, and community initiatives, comparable between 2024 and 2026."
        table={{
          caption:
            "Traced actor-stage presence by stage, actor layer and year.",
          headers: ["Stage", "Actor layer", "2024", "2026", "Change"],
          rows: tableRows,
        }}
      >
        <EChart
          option={option}
          height={mode === "side" ? 620 : 480}
          ariaLabel="Stage composition chart"
          onInit={(c) => {
            chartRef.current = c;
          }}
        />
        {mode === "side" ? (
          <p className="mt-1 text-[11px] text-[color:var(--color-text-secondary)]">
            In each stage pair, the upper bar is{" "}
            <span
              className="rounded-sm px-1 font-semibold text-white"
              style={{ background: YEAR_COLORS.y2024 }}
            >
              2024
            </span>{" "}
            and the lower bar is{" "}
            <span
              className="rounded-sm px-1 font-semibold text-white"
              style={{ background: YEAR_COLORS.y2026 }}
            >
              2026
            </span>
            .
          </p>
        ) : null}
      </ChartFrame>
    </div>
  );
}

export type { ActorLayer };
