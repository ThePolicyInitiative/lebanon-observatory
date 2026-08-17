import { NextResponse } from "next/server";
import { fetchWithRetry } from "@/lib/news/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Media-coverage volume from the GDELT timeline API: the daily share of
 * globally monitored online news matching the Lebanon-reconstruction
 * query, over the last three months. A coverage indicator - not a
 * reconstruction-performance indicator.
 */

type VolumePoint = { date: string; value: number };
type CacheEntry = { points: VolumePoint[]; fetchedAt: number; error: string | null };

let cache: CacheEntry | null = null;
const TTL_MS = 60 * 60 * 1000;
const FAILURE_TTL_MS = 60 * 1000;
/** How long a first request will wait before answering without the series. */
const COLD_WAIT_MS = 3000;

const QUERY =
  '(Lebanon OR Lebanese) (reconstruction OR recovery OR rebuilding OR rubble OR debris OR housing OR infrastructure OR municipality OR shelter OR displacement OR LEAP OR procurement OR "damage assessment")';

async function fetchVolume(retries = 2): Promise<VolumePoint[]> {
  const search = new URLSearchParams({
    query: QUERY,
    mode: "timelinevol",
    format: "json",
    timespan: "3m",
  });
  const res = await fetchWithRetry(
    `https://api.gdeltproject.org/api/v2/doc/doc?${search.toString()}`,
    undefined,
    retries,
  );
  if (!res.ok) throw new Error(`GDELT HTTP ${res.status}`);
  const data = (await res.json()) as {
    timeline?: { data?: { date: string; value: number }[] }[];
  };
  const series = data.timeline?.[0]?.data ?? [];
  return series
    .filter((p) => p && typeof p.value === "number" && typeof p.date === "string")
    .map((p) => ({
      // GDELT dates arrive as YYYYMMDDTHHMMSSZ; normalise to YYYY-MM-DD.
      date: `${p.date.slice(0, 4)}-${p.date.slice(4, 6)}-${p.date.slice(6, 8)}`,
      value: Number(p.value.toFixed(4)),
    }));
}

/** One refresh at a time, so concurrent readers never queue behind each other. */
let inflight: Promise<void> | null = null;

function refresh(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      // GDELT rate-limits hard. One retry, not three: the point is to give
      // up quickly and serve what we have, not to win the argument.
      const points = await fetchVolume(1);
      cache = { points, fetchedAt: Date.now(), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "provider error";
      console.error(`[news] volume provider failed: ${message}`);
      cache = {
        points: cache?.points ?? [],
        fetchedAt: Date.now(),
        error: "provider temporarily unavailable",
      };
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function GET() {
  const now = Date.now();
  const ttl = cache?.error === null ? TTL_MS : FAILURE_TTL_MS;
  if (!cache && !inflight) {
    // Cold, and nobody is fetching yet: wait, but not indefinitely. A healthy
    // GDELT answers in about a second; a throttled one would otherwise hold
    // the reader through the whole timeout and backoff. Past the deadline the
    // response goes out empty and the fetch keeps running for the next
    // request to pick up. Readers arriving while it runs never wait at all.
    await Promise.race([refresh(), new Promise((r) => setTimeout(r, COLD_WAIT_MS))]);
  } else if (cache && now - cache.fetchedAt > ttl) {
    // Stale: answer from cache now and revalidate behind the response, so a
    // rate-limited provider cannot hold the reader for the whole backoff.
    void refresh();
  }
  // refresh() always leaves an entry behind, including on failure, but it is
  // assigned through a closure so the narrowing has to be made explicit.
  const entry: CacheEntry = cache ?? {
    points: [],
    fetchedAt: now,
    error: "provider temporarily unavailable",
  };
  return NextResponse.json(
    {
      points: entry.points,
      ok: entry.error === null,
      error: entry.error,
      lastUpdated: new Date(entry.fetchedAt).toISOString(),
      unit: "Share of globally monitored online news coverage (%)",
    },
    { headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
  );
}
