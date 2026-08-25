import { NextRequest, NextResponse } from "next/server";
import type { NewsArticle, NewsResponse } from "@/lib/types";
import { newsQuerySchema } from "@/lib/news/querySchema";
import {
  fetchGdelt,
  fetchNewsApi,
  fetchReliefWeb,
  newsApiConfigured,
} from "@/lib/news/providers";
import { RSS_FEEDS, fetchRssFeed } from "@/lib/news/rss";
import { cachedProvider, clientKey, rateLimited } from "@/lib/news/cache";
import { dedupe, filterRelevant } from "@/lib/news/pipeline";
import { sanitizeText } from "@/lib/news/tagging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = newsQuerySchema;

export async function GET(req: NextRequest) {
  // Which x-forwarded-for entry identifies the reader depends on how many
  // hops in front of this server append to the header, so the count is
  // configurable and clientKey owns the arithmetic. Its default matches the
  // common one-proxy topology; see RATE_LIMIT_TRUSTED_HOPS in .env.example.
  const ip = clientKey(req.headers.get("x-forwarded-for"));
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const params = parsed.data;
  const q = params.q ? sanitizeText(params.q, 120) : undefined;
  const providerParams = { q, from: params.from, to: params.to };
  const paramsKey = JSON.stringify(providerParams);

  // RSS feeds carry fixed queries, so they cache on a single key and are
  // filtered per-request; the JSON APIs re-query per parameter set.
  const results = await Promise.all([
    cachedProvider("gdelt", paramsKey, () => fetchGdelt(providerParams)),
    // The ReliefWeb JSON API rejects unregistered callers, so without a
    // registered app name it failed on every request and reported itself
    // permanently down. ReliefWeb still reaches the feed through its RSS
    // provider below; this one returns only when it is configured to work.
    ...(process.env.RELIEFWEB_APP_NAME
      ? [cachedProvider("reliefweb", paramsKey, () => fetchReliefWeb(providerParams))]
      : []),
    ...RSS_FEEDS.map((feed) =>
      cachedProvider(feed.name, "fixed", () => fetchRssFeed(feed)),
    ),
    ...(newsApiConfigured()
      ? [cachedProvider("newsapi", paramsKey, () => fetchNewsApi(providerParams))]
      : []),
  ]);

  let articles: NewsArticle[] = results.flatMap((r) => r.articles);

  // Relevance gate: Lebanon must be primary and at least one
  // reconstruction-related signal present. "Only highly relevant" raises
  // the bar to core reconstruction keywords.
  const minScore = params.onlyRelevant === "1" ? 80 : 35;
  articles = filterRelevant(articles, minScore);
  articles = dedupe(articles);

  // Post-filters (RSS providers carry fixed queries, so the free-text
  // search is also applied here across all providers)
  if (q) {
    const needle = q.toLowerCase();
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        (a.description ?? "").toLowerCase().includes(needle),
    );
  }
  if (params.language) articles = articles.filter((a) => a.language === params.language);
  if (params.sourceType) articles = articles.filter((a) => a.sourceType === params.sourceType);
  if (params.location)
    articles = articles.filter((a) =>
      a.locations.some((l) => l.toLowerCase().includes(params.location!.toLowerCase())),
    );
  if (params.sector)
    articles = articles.filter((a) =>
      a.sectors.some((s) => s.toLowerCase().includes(params.sector!.toLowerCase())),
    );
  if (params.stage)
    articles = articles.filter((a) =>
      a.valueChainStages.some((s) => s.toLowerCase().includes(params.stage!.toLowerCase())),
    );
  if (params.actorLayer)
    articles = articles.filter((a) =>
      a.actorLayers.some((s) => s.toLowerCase().includes(params.actorLayer!.toLowerCase())),
    );
  if (params.from)
    articles = articles.filter((a) => a.publishedAt >= `${params.from}T00:00:00`);
  if (params.to)
    articles = articles.filter((a) => a.publishedAt <= `${params.to}T23:59:59`);

  articles.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  const total = articles.length;
  const start = (params.page - 1) * params.pageSize;
  const pageItems = articles.slice(start, start + params.pageSize);

  const body: NewsResponse = {
    articles: pageItems,
    total,
    page: params.page,
    pageSize: params.pageSize,
    providers: results.map((r) => ({
      name: r.name,
      ok: r.ok,
      fromCache: r.fromCache,
      cacheAgeSeconds: r.cacheAgeSeconds,
      error: r.error ? "provider temporarily unavailable" : null,
    })),
    lastUpdated: new Date().toISOString(),
  };

  // A response built while providers are down must not be pinned by a CDN
  // for longer than the server itself would wait before retrying.
  const allDown = results.length > 0 && results.every((r) => !r.ok);
  return NextResponse.json(body, {
    headers: {
      "cache-control": allDown
        ? "public, s-maxage=60, stale-while-revalidate=300"
        : "public, s-maxage=300, stale-while-revalidate=1500",
    },
  });
}
