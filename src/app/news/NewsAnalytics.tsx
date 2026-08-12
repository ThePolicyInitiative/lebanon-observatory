"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import EChart from "@/components/charts/EChart";
import type { NewsArticle } from "@/lib/types";

type VolumeResponse = {
  points: { date: string; value: number }[];
  ok: boolean;
  unit: string;
};

/** Media-coverage indicators computed over the currently matched articles.
 * These describe coverage, not reconstruction performance. */
export default function NewsAnalytics({ articles }: { articles: NewsArticle[] }) {
  const [volume, setVolume] = useState<VolumeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news/volume")
      .then((r) => (r.ok ? (r.json() as Promise<VolumeResponse>) : null))
      .then((d) => {
        if (!cancelled && d && d.ok && d.points.length > 0) setVolume(d);
      })
      .catch(() => {
        /* fall back to article-derived counts */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const volumeOption = useMemo<EChartsOption>(() => {
    if (volume) {
      return {
        grid: { left: 50, right: 20, top: 20, bottom: 40 },
        tooltip: {
          trigger: "axis",
          valueFormatter: (v) => `${v}% of monitored coverage`,
        },
        xAxis: {
          type: "category",
          data: volume.points.map((p) => p.date),
          axisLabel: { fontSize: 10, rotate: 30, interval: 6 },
          axisLine: { lineStyle: { color: "#DCE3EA" } },
        },
        yAxis: {
          type: "value",
          axisLabel: { formatter: "{value}%", fontSize: 10 },
          splitLine: { lineStyle: { color: "#EDF0F4" } },
        },
        series: [
          {
            name: "Coverage share",
            type: "line",
            data: volume.points.map((p) => p.value),
            lineStyle: { width: 2, color: "#2E74B5" },
            itemStyle: { color: "#2E74B5" },
            symbol: "none",
            areaStyle: { color: "rgba(46,116,181,0.08)" },
          },
        ],
      };
    }
    const byDay = new Map<string, number>();
    for (const a of articles) {
      const day = a.publishedAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    const days = [...byDay.keys()].sort();
    return {
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: days,
        axisLabel: { fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      series: [
        {
          name: "Articles",
          type: "line",
          data: days.map((d) => byDay.get(d) ?? 0),
          lineStyle: { width: 2, color: "#2E74B5" },
          itemStyle: { color: "#2E74B5" },
          symbolSize: 6,
          areaStyle: { color: "rgba(46,116,181,0.08)" },
        },
      ],
    };
  }, [articles, volume]);

  function countBy(fn: (a: NewsArticle) => string[]): [string, number][] {
    const map = new Map<string, number>();
    for (const a of articles) {
      for (const key of fn(a)) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((x, y) => y[1] - x[1]).slice(0, 8);
  }

  function barOption(pairs: [string, number][]): EChartsOption {
    const rows = [...pairs].reverse();
    return {
      grid: { left: 150, right: 30, top: 10, bottom: 25 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: rows.map(([k]) => k),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 10.5, width: 140, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          data: rows.map(([, v]) => v),
          itemStyle: { color: "#1B8295", borderRadius: 2 },
          barMaxWidth: 14,
          label: { show: true, position: "right", fontSize: 10.5, color: "#263645" },
        },
      ],
    };
  }

  const sourceTypePairs = countBy((a) => [a.sourceType]);
  const languagePairs = countBy((a) => [a.language]);
  const stagePairs = countBy((a) => a.valueChainStages);
  const locationPairs = countBy((a) => a.locations);
  const layerPairs = countBy((a) => a.actorLayers);

  return (
    <section aria-label="News coverage analytics">
      <h2 className="text-lg font-semibold text-[color:var(--color-navy)]">
        Coverage analytics
      </h2>
      <p className="mt-1 max-w-3xl text-xs text-[color:var(--color-text-secondary)]">
        Media-coverage indicators over the currently matched articles (up to
        100 most recent). They measure what gets reported, not reconstruction
        performance.
      </p>
      <div className="mt-4 rounded-md border border-[color:var(--color-border)] bg-white p-4">
        <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
          {volume
            ? "Coverage volume, last 3 months (GDELT: share of globally monitored online news)"
            : "Article volume over time (matched articles)"}
        </h3>
        <EChart
          option={volumeOption}
          height={220}
          ariaLabel={
            volume
              ? "Line chart of the daily share of globally monitored online news matching the Lebanon reconstruction query over the last three months"
              : "Line chart of matched article counts per day"
          }
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[
          ["Coverage by source type", sourceTypePairs],
          ["Coverage by language", languagePairs],
          ["Coverage by value-chain stage", stagePairs],
          ["Coverage by location", locationPairs],
          ["Coverage by actor layer", layerPairs],
        ].map(([title, pairs]) => (
          <div key={title as string} className="rounded-md border border-[color:var(--color-border)] bg-white p-4">
            <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">{title as string}</h3>
            {(pairs as [string, number][]).length === 0 ? (
              <p className="mt-2 text-xs text-[color:var(--color-text-secondary)]">No tagged articles in the current selection.</p>
            ) : (
              <EChart option={barOption(pairs as [string, number][])} height={210} ariaLabel={`Bar chart: ${title}`} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
