"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { newsTagLabel } from "@/lib/news/tag-labels";
import type { NewsArticle, NewsResponse } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { AR_COUNT, arabicCount, type Locale } from "@/lib/vocab";
import { useUrlState } from "@/lib/useUrlState";
import { useRovingRadio } from "@/lib/useRovingRadio";
import NewsAnalytics from "./NewsAnalytics";

const TABS = [
  { id: "latest", en: "Latest updates", ar: "آخر المستجدات" },
  { id: "official", en: "Official updates", ar: "المستجدات الرسمية" },
  { id: "humanitarian", en: "Humanitarian reports", ar: "التقارير الإنسانية" },
  { id: "media", en: "General media", ar: "الإعلام العام" },
] as const;

const OFFICIAL_DIRECTORY: { name: string; url: string; group: string }[] = [
  { group: "Lebanese state", name: "Presidency of the Council of Ministers", url: "http://www.pcm.gov.lb/" },
  { group: "Lebanese state", name: "Council for Development and Reconstruction - procurement portal", url: "https://www.cdr.gov.lb/" },
  { group: "Lebanese state", name: "Ministry of Social Affairs", url: "https://www.socialaffairs.gov.lb/" },
  { group: "Lebanese state", name: "Ministry of Environment", url: "http://www.moe.gov.lb/" },
  { group: "Financing & programme entries", name: "World Bank - LEAP project page (P509428, entries & ISRs)", url: "https://projects.worldbank.org/en/projects-operations/project-detail/P509428" },
  { group: "Financing & programme entries", name: "World Bank Lebanon - news & overview", url: "https://www.worldbank.org/en/country/lebanon" },
  { group: "Financing & programme entries", name: "World Bank - Lebanon RDNA (March 2025)", url: "https://www.worldbank.org/en/news/press-release/2025/03/07/lebanon-s-recovery-and-reconstruction-needs-estimated-at-us-11-billion" },
  { group: "UN system & humanitarian data", name: "OCHA Lebanon", url: "https://www.unocha.org/lebanon" },
  { group: "UN system & humanitarian data", name: "ReliefWeb - Lebanon updates", url: "https://reliefweb.int/country/lbn" },
  { group: "UN system & humanitarian data", name: "UNDP Lebanon - publications & damage assessments", url: "https://www.undp.org/lebanon" },
  { group: "UN system & humanitarian data", name: "UN-Habitat Lebanon", url: "https://unhabitat.org/lebanon" },
  { group: "UN system & humanitarian data", name: "IOM DTM Lebanon - displacement tracking", url: "https://dtm.iom.int/lebanon" },
  { group: "UN system & humanitarian data", name: "UNHCR Lebanon operational data portal", url: "https://data.unhcr.org/en/country/lbn" },
  { group: "UN system & humanitarian data", name: "United Nations Lebanon", url: "https://lebanon.un.org/" },
  { group: "Donors & analysis", name: "EU Delegation to Lebanon", url: "https://www.eeas.europa.eu/lebanon_en" },
  { group: "Donors & analysis", name: "Public Works Studio - rubble & reconstruction analyses", url: "https://publicworksstudio.com/" },
  { group: "Donors & analysis", name: "L'Orient Today - Lebanon reconstruction coverage", url: "https://today.lorientlejour.com/" },
];

/** Directory group headings; publisher names themselves stay as published. */
const GROUP_AR: Record<string, string> = {
  "Lebanese state": "الدولة اللبنانية",
  "Financing & programme entries": "التمويل ومدخلات البرامج",
  "UN system & humanitarian data": "منظومة الأمم المتحدة والمعطيات الإنسانية",
  "Donors & analysis": "المانحون والتحليل",
};

const LANG_BADGE: Record<Locale, Record<string, string>> = {
  en: { en: "EN", ar: "AR", fr: "FR", other: "Other" },
  ar: { en: "إنجليزي", ar: "عربي", fr: "فرنسي", other: "أخرى" },
};

const SOURCE_TYPE_AR: Record<string, string> = {
  official: "رسمي",
  multilateral: "متعدد الأطراف",
  un: "أممي",
  ngo: "منظمة غير حكومية",
  media: "إعلام",
};

/** Filter option values are what the API matches on, so they never change;
 * only their printed labels do. */
const LOCATION_OPTIONS = [
  "South and Nabatieh",
  "Beirut and Mount Lebanon",
  "Bekaa and Baalbek-Hermel",
  "Camps and migrant communities",
];

const SECTOR_OPTIONS = [
  "Housing",
  "Roads and transport",
  "Electricity",
  "Water",
  "Debris and environment",
  "Health",
  "Education",
  "Heritage and culture",
];

const STAGE_OPTIONS = [
  "Strategy and coordination",
  "Finance and compensation",
  "Damage and needs assessment",
  "Safety and access",
  "Procurement and contracting",
  "Rubble clearance",
  "Debris treatment and disposal",
  "Reconstruction and services",
  "Shelter and return",
  "Relief and protection",
  "Livelihoods and community recovery",
  "Oversight and accountability",
];

/** Every reader-facing string on this module, in both languages. */
const T = {
  en: {
    tabsAria: "News categories",
    search: "Search",
    searchPlaceholder: "e.g. compensation, rubble, LEAP…",
    from: "From",
    to: "To",
    language: "Language",
    location: "Location",
    sector: "Sector",
    stage: "Value-chain stage",
    all: "All",
    langNames: { en: "English", ar: "Arabic", fr: "French", other: "Other" } as Record<string, string>,
    onlyRelevant: "Only highly relevant",
    resetFilters: "Reset filters",
    refresh: "Refresh",
    rateLimit: "Rate limit reached - please wait a few minutes and refresh.",
    httpError: "The news service did not answer. Nothing is wrong with your connection to this site.",
    officialHeading: "Monitored official feeds & key trackers",
    officialBody:
      "Official updates are aggregated where public feeds exist; these institutional pages, project entries and data portals are monitored directly and linked here rather than scraped.",
    loadingNews: "Loading news",
    liveUnavailable: "Live updates unavailable",
    unaffected:
      "The analytical data on this site is a separate, confirmed analysis and is unaffected by news-provider outages.",
    tryAgain: "Try again",
    noMatch:
      "No articles match the current filters. Widen the date range, clear the search terms, or switch off “only highly relevant”.",
    showMore: (remaining: number) => `Show more (${remaining} remaining)`,
    listJoin: "; ",
    whyStages: (list: string) => `Mentions value-chain stages: ${list}.`,
    whyLocations: (list: string) => `References tracked locations: ${list}.`,
    whySectors: (list: string) => `Touches tracked sectors: ${list}.`,
    whyLayers: (list: string) => `Involves actor layers: ${list}.`,
    whyScore: (score: number) =>
      `Automated relevance score: ${score}/100 (keyword-based, not a quality judgment).`,
    srDirect: (name: string) => `(opens the article on ${name})`,
    viaGoogle: "via Google News",
    viaGoogleTitle: "This link opens through Google News, which then forwards to the publisher",
    srVia: (name: string) => `(opens via Google News, which forwards to ${name})`,
    alsoReported: (n: number) => `Also reported by ${n} other outlet${n > 1 ? "s" : ""}.`,
    hide: "Hide",
    whyRelevant: "Why is this relevant?",
  },
  ar: {
    tabsAria: "فئات الأخبار",
    search: "بحث",
    searchPlaceholder: "مثلاً: تعويضات، أنقاض، LEAP…",
    from: "من",
    to: "إلى",
    language: "اللغة",
    location: "المكان",
    sector: "القطاع",
    stage: "مرحلة سلسلة القيمة",
    all: "الكل",
    langNames: { en: "الإنجليزية", ar: "العربية", fr: "الفرنسية", other: "لغات أخرى" } as Record<string, string>,
    onlyRelevant: "الأعلى صلة فقط",
    resetFilters: "إعادة ضبط الترشيح",
    refresh: "تحديث",
    rateLimit: "بلغنا حدّ الطلبات - يُرجى الانتظار دقائق قليلة ثم التحديث.",
    httpError: "لم تستجب خدمة الأخبار. ولا خلل في اتصالك بهذا الموقع.",
    officialHeading: "التغذيات الرسمية المرصودة وأبرز أدوات التتبّع",
    officialBody:
      "تُجمَّع المستجدات الرسمية حيث توجد تغذيات عامة؛ أما هذه الصفحات المؤسسية ومدخلات المشاريع وبوابات المعطيات فتُتابَع مباشرة وتُربَط هنا كما هي بدل كشطها.",
    loadingNews: "جارٍ تحميل الأخبار",
    liveUnavailable: "المستجدات المباشرة غير متاحة",
    unaffected:
      "المعطيات التحليلية في هذا الموقع تحليل منفصل ومؤكَّد، ولا تتأثر بانقطاع مزوّدي الأخبار.",
    tryAgain: "حاول مجدداً",
    noMatch:
      "لا مقالات تطابق الترشيح الحالي. وسّع نطاق التاريخ، أو امسح كلمات البحث، أو أوقف خيار «الأعلى صلة فقط».",
    showMore: (remaining: number) => `عرض المزيد (المتبقّي: ${remaining})`,
    listJoin: "؛ ",
    whyStages: (list: string) => `يذكر مراحل من سلسلة القيمة: ${list}.`,
    whyLocations: (list: string) => `يشير إلى أماكن متتبَّعة: ${list}.`,
    whySectors: (list: string) => `يلامس قطاعات متتبَّعة: ${list}.`,
    whyLayers: (list: string) => `يُشرك طبقات من الجهات: ${list}.`,
    whyScore: (score: number) =>
      `درجة الصلة الآلية: ${score}/100 (مبنية على الكلمات المفتاحية، لا حكماً على الجودة).`,
    srDirect: (name: string) => `(يفتح المقال لدى ${name})`,
    viaGoogle: "عبر Google News",
    viaGoogleTitle: "يفتح هذا الرابط عبر Google News الذي يحوّل بدوره إلى الناشر",
    srVia: (name: string) => `(يفتح عبر Google News الذي يحوّل إلى ${name})`,
    alsoReported: (n: number) => `أوردته أيضاً ${arabicCount(n, AR_COUNT.outlet)}.`,
    hide: "إخفاء",
    whyRelevant: "لماذا هذا ذو صلة؟",
  },
} as const;

export default function NewsExplorer({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const { get, set, reset } = useUrlState({
    tab: "latest",
    q: "",
    from: "",
    to: "",
    language: "",
    location: "",
    sector: "",
    stage: "",
    relevant: "0",
  });
  const tab = get("tab") || "latest";
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(25);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("pageSize", "100");
    if (get("q")) p.set("q", get("q"));
    if (get("from")) p.set("from", get("from"));
    if (get("to")) p.set("to", get("to"));
    if (get("language")) p.set("language", get("language"));
    if (get("location")) p.set("location", get("location"));
    if (get("sector")) p.set("sector", get("sector"));
    if (get("stage")) p.set("stage", get("stage"));
    if (get("relevant") === "1") p.set("onlyRelevant", "1");
    if (tab === "official") p.set("sourceType", "official");
    if (tab === "media") p.set("sourceType", "media");
    return p.toString();
  }, [get, tab]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const url = `/api/news?${queryString}`;
    fetch(url)
      .then(async (r) => {
        if (r.status === 429) throw new Error(t.rateLimit);
        if (!r.ok) {
          // The status code belongs in the console, where someone can act
          // on it - not in a sentence aimed at a reader of the site.
          console.warn(`news endpoint returned HTTP ${r.status}`);
          throw new Error(t.httpError);
        }
        return (await r.json()) as NewsResponse;
      })
      .then((d) => {
        setData(d);
        setVisibleCount(25);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [queryString, t]);

  useEffect(() => {
    // Synchronising with an external system (the news endpoint): the
    // effect kicks off a fetch whose status flip marks it in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshTick]);

  const articles = useMemo(() => {
    if (!data) return [];
    if (tab === "humanitarian") {
      return data.articles.filter((a) => a.sourceType === "un" || a.sourceType === "ngo");
    }
    return data.articles;
  }, [data, tab]);

  const inputCls =
    "min-h-11 rounded-md border border-border bg-white px-2.5 text-sm";

  const roving = useRovingRadio({
    count: TABS.length,
    activeIndex: TABS.findIndex((tb) => tb.id === tab),
    onActivate: (i) => set("tab", TABS[i].id),
  });

  return (
    <div>
      {/* Tabs */}
      <div role="tablist" aria-label={t.tabsAria} className="mt-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tb, i) => {
          const active = tb.id === tab;
          return (
            <button
              key={tb.id}
              role="tab"
              aria-selected={active}
              id={`news-tab-${tb.id}`}
              aria-controls="news-tabpanel"
              {...roving.itemProps(i)}
              onClick={() => set("tab", tb.id)}
              className={`min-h-11 rounded-t-md border-b-2 px-3.5 text-sm transition-colors duration-150 ${
                active
                  ? "border-navy font-semibold text-navy"
                  : "border-transparent text-text-secondary hover:text-navy"
              }`}
            >
              {tb[locale]}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="news-q" className="block text-[11px] font-semibold text-text-secondary">
            {t.search}
          </label>
          <input
            id="news-q"
            type="search"
            defaultValue={get("q")}
            onKeyDown={(e) => {
              if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
            }}
            onBlur={(e) => set("q", e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`mt-1 w-full ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="news-from" className="block text-[11px] font-semibold text-text-secondary">{t.from}</label>
          <input id="news-from" type="date" value={get("from")} onChange={(e) => set("from", e.target.value)} className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label htmlFor="news-to" className="block text-[11px] font-semibold text-text-secondary">{t.to}</label>
          <input id="news-to" type="date" value={get("to")} onChange={(e) => set("to", e.target.value)} className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label htmlFor="news-lang" className="block text-[11px] font-semibold text-text-secondary">{t.language}</label>
          <select id="news-lang" value={get("language")} onChange={(e) => set("language", e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="">{t.all}</option>
            {(["en", "ar", "fr", "other"] as const).map((code) => (
              <option key={code} value={code}>{t.langNames[code]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="news-loc" className="block text-[11px] font-semibold text-text-secondary">{t.location}</label>
          <select id="news-loc" value={get("location")} onChange={(e) => set("location", e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="">{t.all}</option>
            {LOCATION_OPTIONS.map((s) => (
              <option key={s} value={s}>{newsTagLabel(s, locale)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="news-sector" className="block text-[11px] font-semibold text-text-secondary">{t.sector}</label>
          <select id="news-sector" value={get("sector")} onChange={(e) => set("sector", e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="">{t.all}</option>
            {SECTOR_OPTIONS.map((s) => (
              <option key={s} value={s}>{newsTagLabel(s, locale)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="news-stage" className="block text-[11px] font-semibold text-text-secondary">{t.stage}</label>
          <select id="news-stage" value={get("stage")} onChange={(e) => set("stage", e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="">{t.all}</option>
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>{newsTagLabel(s, locale)}</option>
            ))}
          </select>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={get("relevant") === "1"}
            onChange={(e) => set("relevant", e.target.checked ? "1" : "0")}
            className="h-4 w-4 accent-navy"
          />
          {t.onlyRelevant}
        </label>
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-md border border-border bg-white px-3 text-sm text-text-secondary"
        >
          {t.resetFilters}
        </button>
        <button
          type="button"
          onClick={() => setRefreshTick((n) => n + 1)}
          className="min-h-11 rounded-md border border-navy bg-white px-3 text-sm font-medium text-navy"
        >
          {t.refresh}
        </button>
      </div>

      {/* Official directory under Official tab */}
      {tab === "official" ? (
        <div className="mt-4 card">
          <h3 className="text-sm font-semibold text-navy">
            {t.officialHeading}
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            {t.officialBody}
          </p>
          {[...new Set(OFFICIAL_DIRECTORY.map((o) => o.group))].map((group) => (
            <div key={group} className="mt-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-teal">
                {locale === "ar" ? (GROUP_AR[group] ?? group) : group}
              </h4>
              <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
                {OFFICIAL_DIRECTORY.filter((o) => o.group === group).map((o) => (
                  <li key={o.url}>
                    <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center text-blue underline-offset-2 hover:underline" dir="ltr">
                      {o.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {/* Results */}
      <div
        className="mt-5"
        aria-live="polite"
        role="tabpanel"
        id="news-tabpanel"
        aria-labelledby={`news-tab-${tab}`}
      >
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2" aria-busy="true" aria-label={t.loadingNews}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-md border border-border bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md border border-rust bg-white p-5 text-sm">
            <p className="font-semibold text-rust">{t.liveUnavailable}</p>
            <p className="mt-1 text-text-secondary">{error}</p>
            <p className="mt-2 text-text-secondary">
              {t.unaffected}
            </p>
            <button
              type="button"
              onClick={() => setRefreshTick((n) => n + 1)}
              className="mt-3 min-h-11 rounded-md border border-navy px-4 text-sm font-medium text-navy"
            >
              {t.tryAgain}
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="card text-sm text-text-secondary">
            {t.noMatch}
          </div>
        ) : (
          <>
            <ul className="grid gap-3 md:grid-cols-2">
              {articles.slice(0, visibleCount).map((a) => (
                <li key={a.id}>
                  <NewsCard
                    article={a}
                    locale={locale}
                    expanded={expanded === a.id}
                    onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
                  />
                </li>
              ))}
            </ul>
            {articles.length > visibleCount ? (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 25)}
                  className="min-h-11 rounded-md border border-border bg-white px-5 text-sm text-text-secondary hover:border-navy hover:text-navy"
                >
                  {t.showMore(articles.length - visibleCount)}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Analytics */}
      {data && articles.length > 0 ? (
        <div className="mt-7">
          <NewsAnalytics articles={articles} locale={locale} />
        </div>
      ) : null}
    </div>
  );
}

function NewsCard({
  article: a,
  locale,
  expanded,
  onToggle,
}: {
  article: NewsArticle;
  locale: Locale;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = T[locale];
  const chrome = locale === "ar" ? "rtl" : "ltr";
  const label = (v: string) => newsTagLabel(v, locale);
  const whyRelevant: string[] = [];
  if (a.valueChainStages.length > 0)
    whyRelevant.push(t.whyStages(a.valueChainStages.map(label).join(t.listJoin)));
  if (a.locations.length > 0)
    whyRelevant.push(t.whyLocations(a.locations.map(label).join(t.listJoin)));
  if (a.sectors.length > 0)
    whyRelevant.push(t.whySectors(a.sectors.map(label).join(t.listJoin)));
  if (a.actorLayers.length > 0)
    whyRelevant.push(t.whyLayers(a.actorLayers.map(label).join(t.listJoin)));
  whyRelevant.push(t.whyScore(a.relevanceScore));

  return (
    <article className="flex h-full flex-col card" dir={a.language === "ar" ? "rtl" : "ltr"}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wide text-text-secondary" dir={chrome}>
        <span className="font-semibold">{a.sourceName}</span>
        <span>·</span>
        <span>{fmtDateTime(a.publishedAt, locale)}</span>
        <span className="rounded-sm border border-border px-1 py-0.5">{LANG_BADGE[locale][a.language] ?? a.language}</span>
        <span className="rounded-sm bg-[#EEF2F7] px-1 py-0.5 capitalize">{locale === "ar" ? (SOURCE_TYPE_AR[a.sourceType] ?? a.sourceType) : a.sourceType}</span>
        {/* Google hands out an opaque redirect instead of the article URL,
            so the reader is told where the link actually goes. */}
        {a.viaAggregator ? (
          <span
            className="rounded-sm bg-[#FAF3E3] px-1 py-0.5 font-semibold normal-case text-[#8a6200]"
            title={t.viaGoogleTitle}
          >
            {t.viaGoogle}
          </span>
        ) : null}
      </p>
      <h3 className="mt-1.5 text-sm font-semibold leading-snug text-navy">
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {a.title} <span aria-hidden dir="ltr">↗</span>
          <span className="sr-only">
            {a.viaAggregator ? t.srVia(a.sourceName) : t.srDirect(a.sourceName)}
          </span>
        </a>
      </h3>
      {a.description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{a.description}</p>
      ) : null}
      {(a.valueChainStages.length > 0 || a.locations.length > 0) && (
        <ul className="mt-2 flex flex-wrap gap-1" dir={chrome}>
          {[...a.valueChainStages.slice(0, 2), ...a.locations.slice(0, 2)].map((tag) => (
            <li key={tag} className="rounded-sm bg-bg px-1.5 py-0.5 text-[10.5px] text-text-secondary">
              {label(tag)}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-2" dir={chrome}>
        {typeof a.relatedCount === "number" && a.relatedCount > 0 ? (
          <p className="text-[11px] text-text-secondary">
            {t.alsoReported(a.relatedCount)}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="mt-1 min-h-8 text-[11px] text-blue underline decoration-dotted underline-offset-2"
        >
          {expanded ? t.hide : t.whyRelevant}
        </button>
        {expanded ? (
          <ul className="mt-1.5 space-y-1 border-s-2 border-border ps-2.5 text-[11px] text-text-secondary">
            {whyRelevant.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
