"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NewsArticle, NewsResponse } from "@/lib/types";
import { fmtDateTime } from "@/lib/format";
import { useUrlState } from "@/lib/useUrlState";
import NewsAnalytics from "./NewsAnalytics";

const TABS = [
  { id: "latest", label: "Latest updates" },
  { id: "official", label: "Official updates" },
  { id: "humanitarian", label: "Humanitarian reports" },
  { id: "media", label: "General media" },
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

const LANG_LABEL: Record<string, string> = { en: "EN", ar: "AR", fr: "FR", other: "Other" };

export default function NewsExplorer() {
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
        if (r.status === 429) throw new Error("Rate limit reached - please wait a few minutes and refresh.");
        if (!r.ok) throw new Error(`The news service returned an error (HTTP ${r.status}).`);
        return (await r.json()) as NewsResponse;
      })
      .then((d) => {
        setData(d);
        setVisibleCount(25);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [queryString]);

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
    "min-h-11 rounded-md border border-[color:var(--color-border)] bg-white px-2.5 text-sm";

  return (
    <div>
      {/* Disclosure */}
      <p className="card p-3 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        This feed aggregates relevant coverage from selected global, Lebanese,
        humanitarian and official sources. It is broad but not exhaustive.
        Headlines link to the original publishers; nothing here alters the
        verified analysis elsewhere on this site.
      </p>

      {/* Tabs */}
      <div role="tablist" aria-label="News categories" className="mt-4 flex flex-wrap gap-1 border-b border-[color:var(--color-border)]">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => set("tab", t.id)}
              className={`min-h-11 rounded-t-md border-b-2 px-3.5 text-sm transition-colors duration-150 ${
                active
                  ? "border-[color:var(--color-navy)] font-semibold text-[color:var(--color-navy)]"
                  : "border-transparent text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-navy)]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="news-q" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">
            Search
          </label>
          <input
            id="news-q"
            type="search"
            defaultValue={get("q")}
            onKeyDown={(e) => {
              if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
            }}
            onBlur={(e) => set("q", e.target.value)}
            placeholder="e.g. compensation, rubble, LEAP…"
            className={`mt-1 w-full ${inputCls}`}
          />
        </div>
        <div>
          <label htmlFor="news-from" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">From</label>
          <input id="news-from" type="date" value={get("from")} onChange={(e) => set("from", e.target.value)} className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label htmlFor="news-to" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">To</label>
          <input id="news-to" type="date" value={get("to")} onChange={(e) => set("to", e.target.value)} className={`mt-1 ${inputCls}`} />
        </div>
        <div>
          <label htmlFor="news-lang" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Language</label>
          <select id="news-lang" value={get("language")} onChange={(e) => set("language", e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="">All</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="fr">French</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="news-loc" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Location</label>
          <select id="news-loc" value={get("location")} onChange={(e) => set("location", e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="">All</option>
            <option value="South and Nabatieh">South and Nabatieh</option>
            <option value="Beirut and Mount Lebanon">Beirut and Mount Lebanon</option>
            <option value="Bekaa and Baalbek-Hermel">Bekaa and Baalbek-Hermel</option>
            <option value="North">North</option>
            <option value="Camps and migrant communities">Camps and migrant communities</option>
          </select>
        </div>
        <div>
          <label htmlFor="news-sector" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Sector</label>
          <select id="news-sector" value={get("sector")} onChange={(e) => set("sector", e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="">All</option>
            {["Housing", "Roads and transport", "Electricity", "Water", "Debris and environment", "Health", "Education", "Heritage and culture"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="news-stage" className="block text-[11px] font-semibold text-[color:var(--color-text-secondary)]">Value-chain stage</label>
          <select id="news-stage" value={get("stage")} onChange={(e) => set("stage", e.target.value)} className={`mt-1 ${inputCls}`}>
            <option value="">All</option>
            {["Strategy and coordination", "Finance and compensation", "Damage and needs assessment", "Safety and access", "Procurement and contracting", "Rubble clearance", "Debris treatment and disposal", "Reconstruction and services", "Shelter and return", "Relief and protection", "Livelihoods and community recovery", "Oversight and accountability"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={get("relevant") === "1"}
            onChange={(e) => set("relevant", e.target.checked ? "1" : "0")}
            className="h-4 w-4 accent-[color:var(--color-navy)]"
          />
          Only highly relevant
        </label>
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-sm text-[color:var(--color-text-secondary)]"
        >
          Reset filters
        </button>
        <button
          type="button"
          onClick={() => setRefreshTick((t) => t + 1)}
          className="min-h-11 rounded-md border border-[color:var(--color-navy)] bg-white px-3 text-sm font-medium text-[color:var(--color-navy)]"
        >
          Refresh
        </button>
      </div>

      {/* Status line */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--color-text-secondary)]">
        {data ? (
          <>
            <span>Last updated: {fmtDateTime(data.lastUpdated)}</span>
            {data.providers.map((p) => (
              <span key={p.name} className="inline-flex items-center gap-1">
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${p.ok ? "bg-[color:var(--color-teal)]" : "bg-[color:var(--color-rust)]"}`}
                />
                {p.name}
                {p.ok
                  ? p.fromCache && p.cacheAgeSeconds !== null
                    ? ` (cached ${Math.round(p.cacheAgeSeconds / 60)} min ago)`
                    : " (live)"
                  : " (unavailable - showing last good data)"}
              </span>
            ))}
            <span>{data.total} matched articles</span>
          </>
        ) : null}
      </div>

      {/* Official directory under Official tab */}
      {tab === "official" ? (
        <div className="mt-4 card p-4">
          <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
            Monitored official sources &amp; key trackers
          </h3>
          <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
            Official updates are aggregated where public feeds exist; these
            institutional pages, project entries and data portals are
            monitored directly and linked here rather than scraped.
          </p>
          {[...new Set(OFFICIAL_DIRECTORY.map((o) => o.group))].map((group) => (
            <div key={group} className="mt-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-teal)]">
                {group}
              </h4>
              <ul className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
                {OFFICIAL_DIRECTORY.filter((o) => o.group === group).map((o) => (
                  <li key={o.url}>
                    <a href={o.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center text-[color:var(--color-blue)] underline-offset-2 hover:underline">
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
      <div className="mt-5" aria-live="polite">
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2" aria-busy="true" aria-label="Loading news">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-md border border-[color:var(--color-border)] bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md border border-[color:var(--color-rust)] bg-white p-5 text-sm">
            <p className="font-semibold text-[color:var(--color-rust)]">Live updates unavailable</p>
            <p className="mt-1 text-[color:var(--color-text-secondary)]">{error}</p>
            <p className="mt-2 text-[color:var(--color-text-secondary)]">
              The analytical data on this site is a separate, verified analysis and is unaffected by news-provider outages.
            </p>
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="mt-3 min-h-11 rounded-md border border-[color:var(--color-navy)] px-4 text-sm font-medium text-[color:var(--color-navy)]"
            >
              Try again
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="card p-5 text-sm text-[color:var(--color-text-secondary)]">
            No articles match the current filters. Widen the date range,
            clear the search terms, or switch off &ldquo;only highly
            relevant&rdquo;.
          </div>
        ) : (
          <>
            <ul className="grid gap-3 md:grid-cols-2">
              {articles.slice(0, visibleCount).map((a) => (
                <li key={a.id}>
                  <NewsCard
                    article={a}
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
                  className="min-h-11 rounded-md border border-[color:var(--color-border)] bg-white px-5 text-sm text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-navy)] hover:text-[color:var(--color-navy)]"
                >
                  Show more ({articles.length - visibleCount} remaining)
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Analytics */}
      {data && articles.length > 0 ? (
        <div className="mt-10">
          <NewsAnalytics articles={articles} />
        </div>
      ) : null}
    </div>
  );
}

function NewsCard({
  article: a,
  expanded,
  onToggle,
}: {
  article: NewsArticle;
  expanded: boolean;
  onToggle: () => void;
}) {
  const whyRelevant: string[] = [];
  if (a.valueChainStages.length > 0) whyRelevant.push(`Mentions value-chain stages: ${a.valueChainStages.join("; ")}.`);
  if (a.locations.length > 0) whyRelevant.push(`References tracked locations: ${a.locations.join("; ")}.`);
  if (a.sectors.length > 0) whyRelevant.push(`Touches tracked sectors: ${a.sectors.join("; ")}.`);
  if (a.actorLayers.length > 0) whyRelevant.push(`Involves actor layers: ${a.actorLayers.join("; ")}.`);
  whyRelevant.push(`Automated relevance score: ${a.relevanceScore}/100 (keyword-based, not a quality judgment).`);

  return (
    <article className="flex h-full flex-col card p-4" dir={a.language === "ar" ? "rtl" : "ltr"}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] uppercase tracking-wide text-[color:var(--color-text-secondary)]" dir="ltr">
        <span className="font-semibold">{a.sourceName}</span>
        <span>·</span>
        <span>{fmtDateTime(a.publishedAt)}</span>
        <span className="rounded-sm border border-[color:var(--color-border)] px-1 py-0.5">{LANG_LABEL[a.language]}</span>
        <span className="rounded-sm bg-[#EEF2F7] px-1 py-0.5 capitalize">{a.sourceType}</span>
      </p>
      <h3 className="mt-1.5 text-sm font-semibold leading-snug text-[color:var(--color-navy)]">
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {a.title} <span aria-hidden dir="ltr">↗</span>
          <span className="sr-only">(opens original article)</span>
        </a>
      </h3>
      {a.description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">{a.description}</p>
      ) : null}
      {(a.valueChainStages.length > 0 || a.locations.length > 0) && (
        <ul className="mt-2 flex flex-wrap gap-1" dir="ltr">
          {[...a.valueChainStages.slice(0, 2), ...a.locations.slice(0, 2)].map((t) => (
            <li key={t} className="rounded-sm bg-[color:var(--color-bg)] px-1.5 py-0.5 text-[10.5px] text-[color:var(--color-text-secondary)]">
              {t}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-2" dir="ltr">
        {typeof a.relatedCount === "number" && a.relatedCount > 0 ? (
          <p className="text-[11px] text-[color:var(--color-text-secondary)]">
            Also reported by {a.relatedCount} other source{a.relatedCount > 1 ? "s" : ""}.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="mt-1 min-h-8 text-[11px] text-[color:var(--color-blue)] underline decoration-dotted underline-offset-2"
        >
          {expanded ? "Hide" : "Why is this relevant?"}
        </button>
        {expanded ? (
          <ul className="mt-1.5 space-y-1 border-l-2 border-[color:var(--color-border)] pl-2.5 text-[11px] text-[color:var(--color-text-secondary)]">
            {whyRelevant.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
