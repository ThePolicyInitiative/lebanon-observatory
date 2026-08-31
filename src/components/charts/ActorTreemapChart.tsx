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
    title: "Who is inside each actor group",
    sub: (y: number) =>
      `Every named actor in the ${y} tracking - one cell per actor, grouped and coloured by its actor group. A bigger cell means a bigger share of the traced activity. Switch the year to watch the landscape recompose.`,
    caveat:
      "Cell size measures a share of the traced activity in the tracking - not budget, staff or output. Actors traced under generic descriptions appear as traced; colour never carries identity alone (each readable cell is labelled).",
    yearLabel: "Treemap year",
    chart: (y: number) => `Treemap of traced actors by group, ${y}`,
    description: (y: number, names: string) =>
      `Treemap of the traced actors in ${y}, one cell per actor, grouped by actor group. Groups from the widest to the narrowest share of traced activity: ${names}.`,
  },
  ar: {
    title: "من داخل كل مجموعة من الجهات",
    sub: (y: number) =>
      `كل جهة مسمّاة في تتبّع ${y} - خلية لكل جهة، مجمّعة وملوّنة بحسب مجموعتها. وكلما كبرت الخلية كبرت حصتها من النشاط المرصود. بدّل السنة لترى المشهد يعيد تشكّله.`,
    caveat:
      "حجم الخلية يقيس حصة من النشاط المرصود في التتبّع - لا الموازنة ولا الملاك ولا الإنجاز. الجهات المرصودة بأوصاف عامة تظهر كما رُصدت؛ واللون وحده لا يحمل الهوية أبداً (كل خلية مقروءة تحمل اسمها).",
    yearLabel: "سنة المخطط",
    chart: (y: number) => `مخطط مساحي للجهات المرصودة بحسب المجموعة، ${y}`,
    description: (y: number, names: string) =>
      `مخطط مساحي للجهات المرصودة في ${y}، خلية لكل جهة، مجمّعة بحسب مجموعتها. المجموعات من الأوسع حصة في النشاط المرصود إلى الأضيق: ${names}.`,
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
      // Name and group only. The count that sizes the cell never prints:
      // groups sit side by side here, and the rule is that group
      // comparisons carry no numbers anywhere - shape does the work.
      tooltip: {
        formatter: (p) => {
          const item = p as { name?: string; treePathInfo?: { name: string }[] };
          const layer = item.treePathInfo?.[1]?.name ?? "";
          return `<strong>${item.name}</strong><br/>${layer}`;
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
          // cell's size and is never printed anywhere on this figure -
          // the area is the whole statement.
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
  }, [data, year, locale]);

  return (
    <ChartFrame
      id="actor-treemap"
      title={t.title}
      subtitle={t.sub(year)}
      caveat={t.caveat}
      description={t.description(
        year,
        [...layerTotals]
          .filter((l) => l.total > 0)
          .sort((a, b) => b.total - a.total)
          .map((l) => l.label)
          .join(locale === "ar" ? "، " : ", "),
      )}
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
              className={`min-h-9 px-4 text-body ${
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
        {/* Group names only, ordered by share: the sizes on the canvas
            already say how the groups compare, and no number repeats it. */}
        <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-text-secondary">
          {[...layerTotals]
            .sort((a, b) => b.total - a.total)
            .map((l) => (
              <li key={l.id} className="flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </li>
            ))}
        </ul>
      </div>
    </ChartFrame>
  );
}
