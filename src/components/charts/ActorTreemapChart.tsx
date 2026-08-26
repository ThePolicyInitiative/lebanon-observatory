"use client";

import { useMemo, useRef, useState } from "react";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import { actorHref } from "@/app/(en)/actors/actor-anchor";
import ChartFrame from "./ChartFrame";
import { layers, type Locale } from "@/lib/vocab";
import { useRovingRadio } from "@/lib/useRovingRadio";
import type { ActorLayer, Year } from "@/lib/types";
import { YEAR_COLORS } from "@/lib/colors";

const T = {
  en: {
    title: "The traced actor landscape, cell by cell",
    sub: (y: number) =>
      `Every named actor in the ${y} tracking - cell area is its number of traced role mentions, grouped by layer. Switch the year to watch the landscape recompose.`,
    caveat:
      "Cell area measures traced presence in the tracking - not budget, staff or output. Actors traced under generic descriptions appear as traced; colour never carries identity alone (each readable cell is labelled).",
    mentions: (n: number, y: number) => `${n} traced mention${n === 1 ? "" : "s"} in ${y}`,
    legend: (label: string, total: number, actors: number) =>
      `${label}: ${total} mentions · ${actors} actors`,
    yearLabel: "Treemap year",
    chart: (y: number) => `Treemap of traced actors by layer, ${y}`,
  },
  ar: {
    title: "مشهد الجهات المرصودة، خليةً بخلية",
    sub: (y: number) =>
      `كل جهة مسمّاة في تتبّع ${y} - مساحة الخلية هي عدد الإشارات المرصودة إليها، مجمّعة بحسب الطبقة. بدّل السنة لترى المشهد يعيد تشكّله.`,
    caveat:
      "مساحة الخلية تقيس الحضور المرصود في التتبّع - لا الموازنة ولا الملاك ولا الإنجاز. الجهات المرصودة بأوصاف عامة تظهر كما رُصدت؛ واللون وحده لا يحمل الهوية أبداً (كل خلية مقروءة تحمل اسمها).",
    mentions: (n: number, y: number) => `${n} إشارة مرصودة في ${y}`,
    legend: (label: string, total: number, actors: number) =>
      `${label}: ${total} إشارة · ${actors} جهة`,
    yearLabel: "سنة المخطط",
    chart: (y: number) => `مخطط مساحي للجهات المرصودة بحسب الطبقة، ${y}`,
  },
} as const;

/**
 * The interactive half of the treemap. It takes counts already reduced on
 * the server: as a client component reading the register directly it pulled
 * role-records.json into the browser to draw one number per actor.
 */

export type TreemapYear = {
  year: Year;
  /** Per layer, each actor with its number of traced role mentions. */
  layers: { id: ActorLayer; actors: [string, number][] }[];
};

export default function ActorTreemapChart({
  data,
  bases,
  locale = "en",
}: {
  data: TreemapYear[];
  /** Display label back to untranslated base, for the click-through. */
  bases?: Record<string, string>;
  locale?: Locale;
}) {
  const t = T[locale];
  const chartRef = useRef<ECharts | null>(null);
  const [year, setYear] = useState<Year>(2026);
  const yearOptions = [2024, 2026] as const;
  const yearRoving = useRovingRadio({
    count: yearOptions.length,
    activeIndex: yearOptions.findIndex((y) => y === year),
    onActivate: (i) => setYear(yearOptions[i]),
  });

  const { option, layerTotals } = useMemo(() => {
    const forYear = data.find((d) => d.year === year);
    const byLayer = new Map<string, [string, number][]>(
      (forYear?.layers ?? []).map((l) => [l.id, l.actors]),
    );
    const totals = layers(locale).map((l) => {
      const actors = byLayer.get(l.id) ?? [];
      return {
        ...l,
        total: actors.reduce((a, [, n]) => a + n, 0),
        actors: actors.length,
      };
    });
    const opt: EChartsOption = {
      tooltip: {
        formatter: (p) => {
          const item = p as { name?: string; value?: number; treePathInfo?: { name: string }[] };
          const layer = item.treePathInfo?.[1]?.name ?? "";
          return `<strong>${item.name}</strong><br/>${layer}<br/>${t.mentions(Number(item.value ?? 0), year)}`;
        },
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          width: "100%",
          height: "100%",
          top: 0,
          // Cells carry the actor's name only. The count is what sets the
          // cell's size, so printing it inside crowded the small cells with
          // a number the area already gives; it stays in the tooltip, the
          // layer totals below and the screen-reader description.
          label: {
            show: true,
            fontSize: 11,
            color: "#FFFFFF",
            formatter: (p) => {
              const item = p as unknown as { name: string };
              return item.name;
            },
          },
          upperLabel: {
            show: true,
            height: 22,
            fontSize: 11,
            fontWeight: 700,
            color: "#FFFFFF",
          },
          itemStyle: { borderColor: "#FFFFFF", borderWidth: 2, gapWidth: 2 },
          levels: [
            { itemStyle: { borderColor: "#FFFFFF", borderWidth: 0, gapWidth: 4 } },
            { itemStyle: { borderColor: "#FFFFFF", borderWidth: 2, gapWidth: 3 } },
            { itemStyle: { borderWidth: 1, gapWidth: 1 } },
          ],
          data: totals
            .filter((l) => l.total > 0)
            .map((l) => ({
              name: l.label,
              itemStyle: { color: l.color },
              children: (byLayer.get(l.id) ?? []).map(([actor, count]) => ({
                name: actor,
                value: count,
                itemStyle: { color: l.color },
              })),
            })),
        },
      ],
    };
    return { option: opt, layerTotals: totals };
  }, [data, year, locale, t]);

  return (
    <ChartFrame
      id="actor-treemap"
      title={t.title}
      subtitle={t.sub(year)}
      caveat={t.caveat}
      chartRef={chartRef}
      description={`Treemap of traced actors in ${year}: ${layerTotals
        .map((l) => `${l.label} ${l.total} mentions across ${l.actors} actors`)
        .join("; ")}.`}
    >
      <div>
        <div
          className="mb-2 inline-flex overflow-hidden rounded-md border border-border bg-white"
          role="radiogroup"
          aria-label={t.yearLabel}
        >
          {yearOptions.map((y, i) => (
            <button
              key={y}
              type="button"
              role="radio"
              aria-checked={year === y}
              {...yearRoving.itemProps(i)}
              onClick={() => setYear(y)}
              className={`min-h-9 px-4 text-sm ${
                year === y ? "font-semibold text-white" : "text-text-secondary"
              }`}
              style={year === y ? { background: y === 2024 ? YEAR_COLORS.y2024 : YEAR_COLORS.y2026 } : undefined}
            >
              {y}
            </button>
          ))}
        </div>
        <EChart
          option={option}
          height={420}
          ariaLabel={t.chart(year)}
          onInit={(c) => {
            chartRef.current = c;
          }}
          onEvents={{
            // A cell opens that actor in the register below. Assigning
            // location rather than routing: the destination is a fragment
            // on this same page, and a router navigation that changes only
            // the fragment never fires hashchange, so the group would
            // stay closed.
            click: (p) => {
              const name = (p as { name?: string }).name;
              const base = name ? bases?.[name] : undefined;
              if (base) window.location.href = actorHref(base, locale);
            },
          }}
        />
        <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
          {layerTotals.map((l) => (
            <li key={l.id} className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
              {t.legend(l.label, l.total, l.actors)}
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
}
