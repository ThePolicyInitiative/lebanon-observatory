import "server-only";
import type { NewsArticle } from "@/lib/types";

/** In-memory provider cache with TTL, stale-while-revalidate and
 * retention of the last successful response when a provider fails. */

type CacheEntry = {
  articles: NewsArticle[];
  fetchedAt: number;
  error: string | null;
};

const cache = new Map<string, CacheEntry>();
const lastGood = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<void>>();

const TTL_MS =
  Math.max(60, Number(process.env.NEWS_CACHE_TTL_SECONDS || 1800)) * 1000;

/** Failed fetches go stale quickly so recovery is not delayed by the
 * success TTL; the last good payload keeps being served meanwhile. */
const FAILURE_TTL_MS = 60 * 1000;

export type ProviderResult = {
  name: string;
  ok: boolean;
  fromCache: boolean;
  cacheAgeSeconds: number | null;
  error: string | null;
  articles: NewsArticle[];
};

async function refresh(
  key: string,
  name: string,
  fetcher: () => Promise<NewsArticle[]>,
): Promise<void> {
  try {
    const articles = await fetcher();
    const entry = { articles, fetchedAt: Date.now(), error: null };
    cache.set(key, entry);
    lastGood.set(key, entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : "provider error";
    // Never log secrets; message contains only status/network info.
    console.error(`[news] provider ${name} failed: ${message}`);
    const prev = lastGood.get(key);
    cache.set(key, {
      articles: prev?.articles ?? [],
      fetchedAt: prev?.fetchedAt ?? Date.now(),
      error: message,
    });
  } finally {
    inflight.delete(key);
  }
}

export async function cachedProvider(
  name: string,
  paramsKey: string,
  fetcher: () => Promise<NewsArticle[]>,
): Promise<ProviderResult> {
  const key = `${name}:${paramsKey}`;
  const entry = cache.get(key);
  const now = Date.now();

  if (!entry) {
    // Cold: fetch synchronously (deduplicated across concurrent requests).
    if (!inflight.has(key)) inflight.set(key, refresh(key, name, fetcher));
    await inflight.get(key);
    const fresh = cache.get(key)!;
    return {
      name,
      ok: fresh.error === null,
      fromCache: false,
      cacheAgeSeconds: 0,
      error: fresh.error,
      articles: fresh.articles,
    };
  }

  const age = now - entry.fetchedAt;
  const ttl = entry.error === null ? TTL_MS : FAILURE_TTL_MS;
  if (age > ttl && !inflight.has(key)) {
    // Stale: serve immediately, revalidate in the background.
    inflight.set(key, refresh(key, name, fetcher));
  }
  return {
    name,
    ok: entry.error === null,
    fromCache: true,
    cacheAgeSeconds: Math.round(age / 1000),
    error: entry.error,
    articles: entry.articles,
  };
}

/* ----------------------------- Rate limiting ------------------------------ */

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 60;
const hits = new Map<string, number[]>();

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_REQUESTS) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  // Opportunistic cleanup to bound memory.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}
