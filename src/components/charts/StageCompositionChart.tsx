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
import { chartText } from "@/lib/chart-style";

/**
 * Visual 3 - Paired stage-composition chart. Who occupied each stage of
 * the response, and how the composition changed. Groups compare here, so
 * no count appears anywhere on the figure: no printed marks, no axis
 * numbers, no tooltip figures. Length and share carry the comparison.
 */
const T = {
  en: {
    title: "Who occupied each stage of the response",
    side: "Paired bars per stage: the upper bar is 2024, the lower is 2026. Segments are the four actor groups, and a longer segment means more traced activity. No counts are printed here by design.",
    change: "For each stage, bars point toward more traced activity in 2026 or toward less, group by group - direction and length only, no counts.",
    one: (y: string) => `Which groups were traced in each stage, ${y}. Longer segments mean more traced activity.`,
    percentToggle: "Equal-width bars (compare shares within each stage)",
    axisChange: "Change in traced activity, 2026 vs 2024",
    axisShare: "Share of the stage's traced activity",
    axisCount: "Traced activity in the stage",
    shareMost: "most of this stage's traced activity",
    shareWide: "a wide share of this stage's traced activity",
    shareNarrow: "a narrower share of this stage's traced activity",
    shareSmall: "a small share of this stage's traced activity",
    moreTraced: "more traced activity in 2026",
    fewerTraced: "less traced activity in 2026",
    sameTraced: "about the same in both years",
    alt: "Stage composition chart",
    description:
      "Paired stacked bars per stage of the response, showing which actor groups were traced in each stage in 2024 and 2026. Read qualitatively: community activity widens most in relief and in shelter and return by 2026 while narrowing in rubble clearance and finance, and municipal activity narrows across most stages.",
    upper: "In each stage pair, the upper bar is ",
    lower: " and the lower bar is ",
    stop: ".",
  },
  ar: {
    title: "من شغل كل مرحلة من مراحل الاستجابة",
    side: "شريطان لكل مرحلة: الأعلى 2024 والأدنى 2026. والقطع هي مجموعات الجهات الأربع، وكلما طال المقطع زاد النشاط المرصود. لا تُطبع أي أعداد هنا عن قصد.",
    change: "لكل مرحلة، تتجه الأشرطة نحو نشاط مرصود أكبر في 2026 أو أقل، مجموعةً مجموعة - الاتجاه والطول فقط، من دون أعداد.",
    one: (y: string) => `أي المجموعات رُصدت في كل مرحلة، ${y}. وكلما طال المقطع زاد النشاط المرصود.`,
    percentToggle: "أشرطة متساوية العرض (لمقارنة الحصص داخل كل مرحلة)",
    axisChange: "التغيّر في النشاط المرصود، 2026 مقابل 2024",
    axisShare: "الحصة من النشاط المرصود في المرحلة",
    axisCount: "النشاط المرصود في المرحلة",
    shareMost: "معظم النشاط المرصود في هذه المرحلة",
    shareWide: "حصة واسعة من النشاط المرصود في هذه المرحلة",
    shareNarrow: "حصة أضيق من النشاط المرصود في هذه المرحلة",
    shareSmall: "حصة صغيرة من النشاط المرصود في هذه المرحلة",
    moreTraced: "نشاط مرصود أكبر في 2026",
    fewerTraced: "نشاط مرصود أقل في 2026",
    sameTraced: "على حاله تقريباً في السنتين",
    alt: "رسم تركيبة المراحل",
    description:
      "أشرطة مكدَّسة مزدوجة لكل مرحلة من الاستجابة تُظهر أي مجموعات الجهات رُصدت في كل مرحلة في 2024 و2026. قراءة نوعية: نشاط المجتمع المحلي يتسع أكثر ما يتسع في الإغاثة وفي الإيواء والعودة بحلول 2026 بينما يضيق في رفع الأنقاض والتمويل، ونشاط البلديات يضيق في معظم المراحل.",
    upper: "في كل زوج، الشريط الأعلى هو ",
    lower: " والأدنى هو ",
    stop: ".",
  },
} as const;

export default function StageCompositionChart({
  showCaveat = true,
  locale = "en",
}: { showCaveat?: boolean; locale?: Locale } = {}) {
  const tr = T[locale];
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
        // Words, not numbers: this mode reads groups against each other,
        // so the tooltip says which way a group moved and nothing more.
        tooltip: {
          trigger: "item",
          formatter: (p) => {
            const params = p as unknown as { seriesName: string; name: string; value: number };
            const word =
              params.value > 0 ? tr.moreTraced : params.value < 0 ? tr.fewerTraced : tr.sameTraced;
            return `<strong>${params.name}</strong><br/>${params.seriesName}: ${word}`;
          },
        },
        xAxis: {
          type: "value",
          inverse: ar,
          name: tr.axisChange,
          nameLocation: "middle",
          nameGap: 24,
          nameTextStyle: { fontSize: chartText(locale).axisTitle },
          axisLine: { show: false },
          // The ticks would print the counts the rule keeps off group
          // comparisons; the zero line still splits gain from loss.
          axisLabel: { show: false },
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
        // The share within the stage rides along so the tooltip can put
        // the segment into words without ever printing a figure.
        const shares = counts.map((v, i) => (totals[i] === 0 ? 0 : v / totals[i]));
        return {
          name: layer.label,
          stack: String(year),
          type: "bar" as const,
          data: [...values].reverse().map((v, ri) => ({
            value: v,
            share: [...shares].reverse()[ri],
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
      // Group, stage, year and a share put into words - never a count or
      // a percentage. The wording buckets are deliberately coarse.
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as unknown as {
            seriesName: string;
            name: string;
            data: { share: number };
            seriesIndex: number;
          };
          const year = params.seriesIndex < 4 && mode !== "2026" ? years[0] : years[years.length - 1];
          const s = params.data.share;
          const word =
            s >= 0.5 ? tr.shareMost : s >= 0.25 ? tr.shareWide : s >= 0.1 ? tr.shareNarrow : tr.shareSmall;
          return `<strong>${params.name}</strong> · ${year}<br/>${params.seriesName}: ${word}`;
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
        // No tick numbers: the bars are read against each other, not
        // against a scale, and the axis title says what length means.
        axisLabel: { show: false },
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

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <YearControl mode={mode} onChange={setMode} idPrefix="composition" locale={locale} />
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-body">
          <input
            type="checkbox"
            checked={percent}
            onChange={(e) => setPercent(e.target.checked)}
            disabled={mode === "change"}
            className="h-4 w-4 accent-navy"
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
        description={tr.description}
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
          <p className="mt-1 text-micro text-text-secondary">
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
