"use client";

import type { Locale } from "@/lib/vocab";
import type { NewsArticle } from "@/lib/types";

/**
 * What the fetched coverage is made of.
 *
 * A feed answers "what came in" and nothing else: which publishers, which
 * language, which end of the chain, how well any of it scored. The
 * English page draws that with ECharts; this draws the same six
 * breakdowns in plain bars, which cost nothing to load and lay out
 * right-to-left without a chart library needing to be told how.
 *
 * Every count is of the articles actually on the page, so it describes
 * the coverage in front of the reader - and coverage is what gets
 * reported, never what was built.
 */

/** Tag values the classifier emits, in Arabic. Anything unmapped shows as is. */
const AR_LABEL: Record<string, string> = {
  // publisher kinds
  media: "إعلام",
  official: "جهة رسمية",
  un: "الأمم المتحدة",
  multilateral: "مؤسسة متعددة الأطراف",
  ngo: "منظمة غير حكومية",
  // languages
  ar: "العربية",
  en: "الإنكليزية",
  fr: "الفرنسية",
  other: "لغات أخرى",
  // chain stages
  "Reconstruction and services": "إعادة الإعمار والخدمات",
  "Relief and protection": "الإغاثة والحماية",
  "Shelter and return": "الإيواء والعودة",
  "Finance and compensation": "التمويل والتعويضات",
  "Strategy and coordination": "الاستراتيجيا والتنسيق",
  "Damage and needs assessment": "تقييم الأضرار والاحتياجات",
  "Procurement and contracting": "الشراء والتعاقد",
  "Rubble and debris": "الأنقاض والركام",
  "Livelihoods and recovery": "سبل العيش والتعافي",
  "Oversight and accountability": "الرقابة والمساءلة",
  // locations
  "South and Nabatieh": "الجنوب والنبطية",
  "Beirut and Mount Lebanon": "بيروت وجبل لبنان",
  "Camps and migrant communities": "المخيمات ومجتمعات المهاجرين",
  "Bekaa and Baalbek-Hermel": "البقاع وبعلبك-الهرمل",
  North: "الشمال",
  // actor layers
  "Official institutions": "المؤسسات الرسمية",
  "NGOs & international agencies": "المنظمات الدولية وغير الحكومية",
  "Municipalities & local authorities": "البلديات والسلطات المحلية",
  "Community initiatives": "مبادرات المجتمع المحلي",
};

const T = {
  en: {
    title: "What this coverage is made of",
    sub: "Counted over the articles on this page. Coverage measures what gets reported, never what was built.",
    publishers: "Which publishers carry it",
    sourceType: "By publisher type",
    language: "By language",
    stages: "By chain stage",
    locations: "By place",
    layers: "By actor layer",
    relevance: "By relevance score",
    empty: "Nothing tagged in the current set.",
    articles: (n: number) => `${n} articles`,
  },
  ar: {
    title: "ممّ تتكوّن هذه التغطية",
    sub: "معدودة على المقالات المعروضة في هذه الصفحة. والتغطية تقيس ما يُنشر عنه، لا ما بُني.",
    publishers: "أي وسائل تحمله",
    sourceType: "بحسب نوع الناشر",
    language: "بحسب اللغة",
    stages: "بحسب مرحلة السلسلة",
    locations: "بحسب المكان",
    layers: "بحسب طبقة الجهات",
    relevance: "بحسب درجة الصلة",
    empty: "لا وسم في المجموعة الحالية.",
    articles: (n: number) => `${n} مقالاً`,
  },
} as const;

function Panel({
  title,
  pairs,
  color,
  locale,
  ordered = false,
}: {
  title: string;
  pairs: [string, number][];
  color: string;
  locale: Locale;
  ordered?: boolean;
}) {
  const t = T[locale];
  const max = Math.max(1, ...pairs.map(([, v]) => v));
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
        {title}
      </h3>
      {pairs.length === 0 ? (
        <p className="mt-1.5 text-[11.5px] text-[color:var(--color-text-secondary)]">{t.empty}</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">
          {pairs.map(([key, v]) => {
            const label = ordered ? key : locale === "ar" ? (AR_LABEL[key] ?? key) : key;
            return (
              <li key={key}>
                <p className="flex items-baseline justify-between gap-2 text-[11.5px]">
                  <span className="min-w-0 truncate text-[color:var(--color-text)]" title={label}>
                    {label}
                  </span>
                  <span className="shrink-0 tabular-nums text-[color:var(--color-text-secondary)]">
                    {v}
                  </span>
                </p>
                <span
                  aria-hidden
                  className="mt-0.5 block h-2 rounded-sm"
                  style={{ width: `${(v / max) * 100}%`, minWidth: 3, background: color }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function NewsCoverageProfile({
  articles,
  locale = "en",
}: {
  articles: NewsArticle[];
  locale?: Locale;
}) {
  const t = T[locale];

  const countBy = (fn: (a: NewsArticle) => string[], limit = 6): [string, number][] => {
    const m = new Map<string, number>();
    for (const a of articles) for (const k of fn(a)) if (k) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, limit);
  };

  /** Score bands keep their scale order rather than being ranked. */
  const relevance: [string, number][] = (() => {
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

  return (
    <figure className="card p-3.5 sm:p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-[color:var(--color-navy)]">{t.title}</h2>
        <span className="text-[11px] tabular-nums text-[color:var(--color-text-secondary)]">
          {t.articles(articles.length)}
        </span>
      </figcaption>
      <p className="mt-1 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
        {t.sub}
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Panel title={t.publishers} pairs={countBy((a) => [a.sourceName])} color="var(--color-navy)" locale={locale} ordered />
        <Panel title={t.sourceType} pairs={countBy((a) => [a.sourceType])} color="var(--color-teal)" locale={locale} />
        <Panel title={t.language} pairs={countBy((a) => [a.language])} color="var(--color-blue)" locale={locale} />
        <Panel title={t.stages} pairs={countBy((a) => a.valueChainStages)} color="var(--color-magenta)" locale={locale} />
        <Panel title={t.locations} pairs={countBy((a) => a.locations)} color="var(--color-amber)" locale={locale} />
        <Panel title={t.layers} pairs={countBy((a) => a.actorLayers)} color="var(--color-rust)" locale={locale} />
        <Panel title={t.relevance} pairs={relevance} color="var(--color-y2024)" locale={locale} ordered />
      </div>
    </figure>
  );
}
