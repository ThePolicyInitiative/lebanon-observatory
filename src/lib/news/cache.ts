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

/** Both maps are keyed by free-text query parameters, so without a cap a
 * long-lived process accumulates one entry per distinct search forever.
 * Past the cap the oldest entries go; the fixed-key RSS entries are
 * always among the freshest, so real traffic never loses them. */
const MAX_CACHE_ENTRIES = 200;
const LAST_GOOD_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function evict(map: Map<string, CacheEntry>): void {
  if (map.size <= MAX_CACHE_ENTRIES) return;
  const byAge = [...map.entries()].sort((a, b) => a[1].fetchedAt - b[1].fetchedAt);
  for (let i = 0; i < byAge.length - MAX_CACHE_ENTRIES; i++) map.delete(byAge[i][0]);
}

function sweepLastGood(now: number): void {
  for (const [k, v] of lastGood) {
    if (now - v.fetchedAt > LAST_GOOD_MAX_AGE_MS) lastGood.delete(k);
  }
  evict(lastGood);
}

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
    const now = Date.now();
    const entry = { articles, fetchedAt: now, error: null };
    cache.set(key, entry);
    lastGood.set(key, entry);
    evict(cache);
    sweepLastGood(now);
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
    evict(cache);
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

/**
 * How many hops between the reader and this server append to
 * `x-forwarded-for`. Each hop appends the address it received the request
 * from, so the reader's own address sits that many entries in from the right
 * and everything further left is whatever the reader chose to send.
 *
 * One is the default and covers the usual deployment: a platform edge
 * (Vercel, Netlify) or a single nginx doing `proxy_add_x_forwarded_for`.
 * Two is right when a CDN sits in front of a proxy that also appends -
 * leaving it at one there would key every reader behind an edge into the
 * same bucket and hand them each other's 429s. Served directly by
 * `next start` there is no appending hop at all: Next fills the header from
 * the socket address only when the reader sends none, so a reader who sends
 * their own keeps it and the limit is best-effort. One is still the least
 * wrong setting there, which is why this floors at one.
 */
const TRUSTED_HOPS = Math.max(
  1,
  Math.trunc(Number(process.env.RATE_LIMIT_TRUSTED_HOPS)) || 1,
);

/**
 * The bucket key for one reader, read from the `x-forwarded-for` value.
 * Counting in from the right is what keeps the key out of the reader's
 * control: entries they prepend themselves sit to the left of the ones the
 * trusted hops appended, so they cannot rotate the key to mint fresh
 * buckets. A header shorter than the configured hop count means the topology
 * is not what was configured; the leftmost entry is the best available answer
 * in that case.
 */
export function clientKey(forwarded: string | null): string {
  const hops = (forwarded ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
  if (hops.length === 0) return "local";
  return hops[Math.max(0, hops.length - TRUSTED_HOPS)];
}

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
  // Opportunistic cleanup to bound memory. Swept early enough that a
  // client minting keys cannot grow the map far inside one window.
  if (hits.size > 1000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}
