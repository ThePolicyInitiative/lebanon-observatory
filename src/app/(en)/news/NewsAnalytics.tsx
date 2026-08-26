"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import EChart from "@/components/charts/EChart";
import type { NewsArticle } from "@/lib/types";
import type { Locale } from "@/lib/vocab";
import { CHART } from "@/lib/colors";
import { chartText } from "@/lib/chart-style";

type VolumeResponse = {
  points: { date: string; value: number }[];
  ok: boolean;
  unit: string;
};

/** Every reader-facing string on this module, in both languages. */
const T = {
  en: {
    sectionAria: "News coverage analytics",
    title: "Coverage analytics",
    sub: "Media-coverage indicators over the currently matched articles (up to 100 most recent). They measure what gets reported, not reconstruction performance.",
    volumeTitleGdelt:
      "Coverage volume, last 3 months (GDELT: share of globally monitored online news)",
    volumeTitleLocal: "Article volume over time (matched articles)",
    volumeAriaGdelt:
      "Line chart of the daily share of globally monitored online news matching the Lebanon reconstruction query over the last three months",
    volumeAriaLocal: "Line chart of matched article counts per day",
    tooltipShare: (v: unknown) => `${v}% of monitored coverage`,
    seriesShare: "Coverage share",
    seriesArticles: "Articles",
  },
  ar: {
    sectionAria: "تحليلات التغطية الإخبارية",
    title: "تحليلات التغطية",
    sub: "مؤشرات تغطية إعلامية محسوبة على المقالات المطابقة حالياً (حتى أحدث 100 مقال). وهي تقيس ما يُنشَر عنه، لا أداء إعادة الإعمار.",
    volumeTitleGdelt:
      "حجم التغطية في الأشهر الثلاثة الأخيرة (GDELT: حصة من الأخبار الإلكترونية المرصودة عالمياً)",
    volumeTitleLocal: "حجم المقالات عبر الزمن (المقالات المطابقة)",
    volumeAriaGdelt:
      "رسم خطي للحصة اليومية من الأخبار الإلكترونية المرصودة عالمياً المطابقة لاستعلام إعادة إعمار لبنان خلال الأشهر الثلاثة الأخيرة",
    volumeAriaLocal: "رسم خطي لعدد المقالات المطابقة في اليوم",
    tooltipShare: (v: unknown) => `${v}% من التغطية المرصودة`,
    seriesShare: "حصة التغطية",
    seriesArticles: "مقالات",
  },
} as const;

/** Media-coverage indicators computed over the currently matched articles.
 * These describe coverage, not reconstruction performance. */
export default function NewsAnalytics({
  articles,
  locale = "en",
}: {
  articles: NewsArticle[];
  locale?: Locale;
}) {
  const t = T[locale];
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
          valueFormatter: (v) => t.tooltipShare(v),
        },
        xAxis: {
          type: "category",
          data: volume.points.map((p) => p.date),
          axisLabel: { fontSize: chartText(locale).tick, rotate: 30, interval: 6 },
          axisLine: { lineStyle: { color: CHART.axis } },
        },
        yAxis: {
          type: "value",
          axisLabel: { formatter: "{value}%", fontSize: 10 },
          splitLine: { lineStyle: { color: "#EDF0F4" } },
        },
        series: [
          {
            name: t.seriesShare,
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
        axisLabel: { fontSize: chartText(locale).tick, rotate: 30 },
        axisLine: { lineStyle: { color: CHART.axis } },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      series: [
        {
          name: t.seriesArticles,
          type: "line",
          data: days.map((d) => byDay.get(d) ?? 0),
          lineStyle: { width: 2, color: "#2E74B5" },
          itemStyle: { color: "#2E74B5" },
          symbolSize: 6,
          areaStyle: { color: "rgba(46,116,181,0.08)" },
        },
      ],
    };
  }, [articles, locale, t, volume]);

  return (
    <section aria-label={t.sectionAria}>
      <h2 className="text-lg font-semibold text-navy">
        {t.title}
      </h2>
      <p className="mt-1 max-w-3xl text-xs text-text-secondary">
        {t.sub}
      </p>
      <div className="mt-4 card">
        <h3 className="text-sm font-semibold text-navy">
          {volume ? t.volumeTitleGdelt : t.volumeTitleLocal}
        </h3>
        <EChart
          option={volumeOption}
          height={220}
          ariaLabel={volume ? t.volumeAriaGdelt : t.volumeAriaLocal}
        />
      </div>
    </section>
  );
}
