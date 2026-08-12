import "server-only";
import type { NewsArticle } from "@/lib/types";
import {
  classifySourceType,
  detectLanguage,
  sanitizeText,
  safeUrl,
  scoreRelevance,
  tagArticle,
} from "./tagging";

/** Server-side provider adapters. API keys never reach the client:
 * these modules are imported only from the /api/news route handler. */

import { fetchWithRetry } from "./http";
import { articleId } from "./id";

function buildArticle(
  partial: Omit<
    NewsArticle,
    "locations" | "sectors" | "actorLayers" | "valueChainStages" | "relevanceScore" | "duplicateGroupId"
  >,
  /** Extra scoring-only signal (never displayed), e.g. GDELT's
   * sourcecountry, whose doc-level query already matched Lebanon +
   * reconstruction keywords in the article body. */
  extraSignal = "",
): NewsArticle {
  const text = `${partial.title} ${partial.description ?? ""}`;
  return {
    ...partial,
    ...tagArticle(text),
    relevanceScore: scoreRelevance(`${text} ${extraSignal}`),
    duplicateGroupId: null,
  };
}

/* ---------------------------------- GDELT --------------------------------- */

const GDELT_QUERY =
  '(Lebanon OR Lebanese) (reconstruction OR recovery OR rebuilding OR rubble OR debris OR housing OR infrastructure OR municipality OR shelter OR displacement OR LEAP OR procurement OR "damage assessment" OR "public works")';

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  socialimage?: string;
  sourcecountry?: string;
};

export async function fetchGdelt(params: {
  from?: string;
  to?: string;
  q?: string;
}): Promise<NewsArticle[]> {
  const search = new URLSearchParams({
    query: params.q ? `${params.q} ${GDELT_QUERY}` : GDELT_QUERY,
    mode: "artlist",
    format: "json",
    sort: "datedesc",
    maxrecords: "250",
  });
  if (params.from && params.to) {
    search.set("startdatetime", params.from.replace(/-/g, "") + "000000");
    search.set("enddatetime", params.to.replace(/-/g, "") + "235959");
  } else {
    search.set("timespan", "2w");
  }
  const res = await fetchWithRetry(
    `https://api.gdeltproject.org/api/v2/doc/doc?${search.toString()}`,
  );
  if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);
  const text = await res.text();
  let data: { articles?: GdeltArticle[] };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("GDELT returned non-JSON payload");
  }
  const out: NewsArticle[] = [];
  for (const a of data.articles ?? []) {
    const url = safeUrl(a.url);
    const title = sanitizeText(a.title, 240);
    if (!url || !title) continue;
    const seendate = a.seendate ?? "";
    const iso =
      seendate.length >= 15
        ? `${seendate.slice(0, 4)}-${seendate.slice(4, 6)}-${seendate.slice(6, 8)}T${seendate.slice(9, 11)}:${seendate.slice(11, 13)}:${seendate.slice(13, 15)}Z`
        : new Date().toISOString();
    const domain = sanitizeText(a.domain, 100) || new URL(url).hostname;
    // GDELT matched the site query (Lebanon + reconstruction terms) against
    // the article body; a Lebanese sourcecountry or .lb domain supplies the
    // Lebanon signal when the headline alone does not carry it.
    const extraSignal =
      a.sourcecountry === "Lebanon" || domain.endsWith(".lb") ? "lebanon" : "";
    out.push(
      buildArticle(
        {
          id: articleId("gdelt", url),
          title,
          description: null,
          sourceName: domain,
          sourceDomain: domain,
          sourceType: classifySourceType(domain),
          url,
          imageUrl: safeUrl(a.socialimage),
          publishedAt: iso,
          language: detectLanguage(a.language ?? null, title),
          provider: "gdelt",
        },
        extraSignal,
      ),
    );
  }
  return out;
}

/* -------------------------------- ReliefWeb ------------------------------- */

type ReliefWebItem = {
  id: string;
  fields?: {
    title?: string;
    url_alias?: string;
    url?: string;
    date?: { created?: string };
    source?: { name?: string; shortname?: string }[];
    language?: { code?: string }[];
    format?: { name?: string }[];
  };
};

export async function fetchReliefWeb(params: {
  from?: string;
  to?: string;
  q?: string;
}): Promise<NewsArticle[]> {
  const appname = process.env.RELIEFWEB_APP_NAME || "lebanon-reconstruction-observatory";
  const query =
    (params.q ? `${params.q} AND ` : "") +
    "(reconstruction OR recovery OR shelter OR displacement OR infrastructure OR municipal OR debris OR rubble OR housing OR compensation)";
  const body = {
    profile: "list",
    preset: "latest",
    limit: 50,
    query: { value: query, operator: "AND" as const },
    filter: {
      operator: "AND" as const,
      conditions: [
        { field: "primary_country.iso3", value: "lbn" },
        ...(params.from && params.to
          ? [
              {
                field: "date.created",
                value: { from: `${params.from}T00:00:00+00:00`, to: `${params.to}T23:59:59+00:00` },
              },
            ]
          : []),
      ],
    },
    fields: {
      include: ["title", "url_alias", "url", "date.created", "source.name", "source.shortname", "language.code"],
    },
    sort: ["date.created:desc"],
  };
  const res = await fetchWithRetry(
    `https://api.reliefweb.int/v2/reports?appname=${encodeURIComponent(appname)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (res.status === 403) {
    throw new Error(
      "ReliefWeb HTTP 403 - the API requires a registered application name; set RELIEFWEB_APP_NAME (see docs/news-providers.md)",
    );
  }
  if (!res.ok) throw new Error(`ReliefWeb HTTP ${res.status}`);
  const data = (await res.json()) as { data?: ReliefWebItem[] };
  const out: NewsArticle[] = [];
  for (const item of data.data ?? []) {
    const f = item.fields ?? {};
    const url = safeUrl(f.url_alias || f.url);
    const title = sanitizeText(f.title, 240);
    if (!url || !title) continue;
    const sourceName = sanitizeText(f.source?.[0]?.name ?? "ReliefWeb", 120);
    out.push(
      buildArticle({
        id: `rw-${item.id}`,
        title,
        description: null,
        sourceName,
        sourceDomain: "reliefweb.int",
        sourceType: "un",
        url,
        imageUrl: null,
        publishedAt: f.date?.created ?? new Date().toISOString(),
        language: detectLanguage(f.language?.[0]?.code ?? null, title),
        provider: "reliefweb",
      }),
    );
  }
  return out;
}

/* --------------------------------- NewsAPI -------------------------------- */

type NewsApiArticle = {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  source?: { name?: string };
};

export function newsApiConfigured(): boolean {
  return Boolean(process.env.NEWS_API_KEY);
}

export async function fetchNewsApi(params: {
  from?: string;
  to?: string;
  q?: string;
}): Promise<NewsArticle[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return [];
  const search = new URLSearchParams({
    q:
      (params.q ? `${params.q} AND ` : "") +
      'Lebanon AND (reconstruction OR recovery OR rebuilding OR rubble OR debris OR housing OR infrastructure OR municipality OR shelter OR displacement OR "damage assessment")',
    sortBy: "publishedAt",
    pageSize: "50",
  });
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const res = await fetchWithRetry(
    `https://newsapi.org/v2/everything?${search.toString()}`,
    { headers: { "x-api-key": key } },
  );
  if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`);
  const data = (await res.json()) as { articles?: NewsApiArticle[] };
  const out: NewsArticle[] = [];
  for (const a of data.articles ?? []) {
    const url = safeUrl(a.url);
    const title = sanitizeText(a.title, 240);
    if (!url || !title) continue;
    const domain = new URL(url).hostname.replace(/^www\./, "");
    out.push(
      buildArticle({
        id: articleId("na", url),
        title,
        description: sanitizeText(a.description, 300) || null,
        sourceName: sanitizeText(a.source?.name ?? domain, 120),
        sourceDomain: domain,
        sourceType: classifySourceType(domain),
        url,
        imageUrl: safeUrl(a.urlToImage),
        publishedAt: a.publishedAt ?? new Date().toISOString(),
        language: detectLanguage(null, `${title} ${a.description ?? ""}`),
        provider: "newsapi",
      }),
    );
  }
  return out;
}
