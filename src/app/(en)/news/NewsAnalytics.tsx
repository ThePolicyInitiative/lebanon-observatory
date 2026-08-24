"use client";

import { useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import EChart from "@/components/charts/EChart";
import { newsTagLabel } from "@/components/NewsCoverageProfile";
import type { NewsArticle } from "@/lib/types";
import type { Locale } from "@/lib/vocab";

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
    panelPublishers: "Which publishers carry it",
    panelSourceType: "Coverage by publisher type",
    panelLanguage: "Coverage by language",
    panelStage: "Coverage by value-chain stage",
    panelLocation: "Coverage by location",
    panelLayer: "Coverage by actor layer",
    noTagged: "No tagged articles in the current selection.",
    barAria: (title: string) => `Bar chart: ${title}`,
    relevanceTitle: "Relevance of the matched set",
    relevanceBody:
      "The keyword scorer's own output, bucketed. A large set can still be a thin one, and this is the difference: it says how well the matched articles scored, not whether they are any good.",
    noArticles: "No articles in the current selection.",
    relevanceAria: "Bar chart of matched articles by relevance-score band",
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
    panelPublishers: "أي وسائل تحمل التغطية",
    panelSourceType: "التغطية بحسب نوع الناشر",
    panelLanguage: "التغطية بحسب اللغة",
    panelStage: "التغطية بحسب مرحلة سلسلة القيمة",
    panelLocation: "التغطية بحسب المكان",
    panelLayer: "التغطية بحسب طبقة الجهات",
    noTagged: "لا مقالات موسومة في الاختيار الحالي.",
    barAria: (title: string) => `رسم أعمدة: ${title}`,
    relevanceTitle: "صلة المجموعة المطابقة",
    relevanceBody:
      "ناتج مقياس الكلمات المفتاحية نفسه موزّعاً على نطاقات. قد تكون المجموعة كبيرة ورقيقة الصلة معاً، وهذا هو الفرق الذي يظهر هنا: كم أحرزت المقالات المطابقة من درجات، لا ما إذا كانت جيدة.",
    noArticles: "لا مقالات في الاختيار الحالي.",
    relevanceAria: "رسم أعمدة للمقالات المطابقة بحسب نطاق درجة الصلة",
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
  }, [articles, t, volume]);

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

  /** Chart rows in the page's language; the counting keys never change. */
  const labelled = (pairs: [string, number][]): [string, number][] =>
    pairs.map(([k, v]) => [newsTagLabel(k, locale), v] as [string, number]);

  const publisherPairs = countBy((a) => [a.sourceName]);
  const sourceTypePairs = labelled(countBy((a) => [a.sourceType]));
  const languagePairs = labelled(countBy((a) => [a.language]));
  const stagePairs = labelled(countBy((a) => a.valueChainStages));
  const locationPairs = labelled(countBy((a) => a.locations));
  const layerPairs = labelled(countBy((a) => a.actorLayers));

  /**
   * How well the matched articles actually score. The gate admits
   * anything above its floor, so a set can be large and thin; this shows
   * which it is, in the scorer's own units.
   */
  const relevanceBuckets: [string, number][] = (() => {
    const edges = [0, 20, 40, 60, 80];
    const labels = ["0-19", "20-39", "40-59", "60-79", "80-100"];
    const counts = new Array(edges.length).fill(0);
    for (const a of articles) {
      const s = Math.max(0, Math.min(100, a.relevanceScore ?? 0));
      let i = edges.length - 1;
      while (i > 0 && s < edges[i]) i--;
      counts[i]++;
    }
    return labels.map((l, i) => [l, counts[i]] as [string, number]).filter(([, v]) => v > 0);
  })();

  /** Buckets are an ordered scale, so they keep their order, not rank. */
  function scaleBarOption(pairs: [string, number][]): EChartsOption {
    return {
      grid: { left: 55, right: 30, top: 10, bottom: 25 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      xAxis: {
        type: "value",
        minInterval: 1,
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        data: [...pairs].reverse().map(([k]) => k),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 10.5 },
      },
      series: [
        {
          type: "bar",
          data: [...pairs].reverse().map(([, v]) => v),
          itemStyle: { color: "#58779B", borderRadius: 2 },
          barMaxWidth: 14,
          label: { show: true, position: "right", fontSize: 10.5, color: "#263645" },
        },
      ],
    };
  }

  return (
    <section aria-label={t.sectionAria}>
      <h2 className="text-lg font-semibold text-[color:var(--color-navy)]">
        {t.title}
      </h2>
      <p className="mt-1 max-w-3xl text-xs text-[color:var(--color-text-secondary)]">
        {t.sub}
      </p>
      <div className="mt-4 card p-3.5">
        <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
          {volume ? t.volumeTitleGdelt : t.volumeTitleLocal}
        </h3>
        <EChart
          option={volumeOption}
          height={220}
          ariaLabel={volume ? t.volumeAriaGdelt : t.volumeAriaLocal}
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[
          [t.panelPublishers, publisherPairs],
          [t.panelSourceType, sourceTypePairs],
          [t.panelLanguage, languagePairs],
          [t.panelStage, stagePairs],
          [t.panelLocation, locationPairs],
          [t.panelLayer, layerPairs],
        ].map(([title, pairs]) => (
          <div key={title as string} className="card p-3.5">
            <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">{title as string}</h3>
            {(pairs as [string, number][]).length === 0 ? (
              <p className="mt-2 text-xs text-[color:var(--color-text-secondary)]">{t.noTagged}</p>
            ) : (
              <EChart option={barOption(pairs as [string, number][])} height={210} ariaLabel={t.barAria(title as string)} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 card p-3.5">
        <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
          {t.relevanceTitle}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
          {t.relevanceBody}
        </p>
        {relevanceBuckets.length === 0 ? (
          <p className="mt-2 text-xs text-[color:var(--color-text-secondary)]">
            {t.noArticles}
          </p>
        ) : (
          <EChart
            option={scaleBarOption(relevanceBuckets)}
            height={170}
            ariaLabel={t.relevanceAria}
          />
        )}
      </div>
    </section>
  );
}
