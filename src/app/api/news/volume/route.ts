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

const QUERY =
  '(Lebanon OR Lebanese) (reconstruction OR recovery OR rebuilding OR rubble OR debris OR housing OR infrastructure OR municipality OR shelter OR displacement OR LEAP OR procurement OR "damage assessment")';

async function fetchVolume(): Promise<VolumePoint[]> {
  const search = new URLSearchParams({
    query: QUERY,
    mode: "timelinevol",
    format: "json",
    timespan: "3m",
  });
  const res = await fetchWithRetry(
    `https://api.gdeltproject.org/api/v2/doc/doc?${search.toString()}`,
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

export async function GET() {
  const now = Date.now();
  const ttl = cache?.error === null ? TTL_MS : FAILURE_TTL_MS;
  if (!cache || now - cache.fetchedAt > ttl) {
    try {
      const points = await fetchVolume();
      cache = { points, fetchedAt: now, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "provider error";
      console.error(`[news] volume provider failed: ${message}`);
      cache = {
        points: cache?.points ?? [],
        fetchedAt: now,
        error: "provider temporarily unavailable",
      };
    }
  }
  return NextResponse.json(
    {
      points: cache.points,
      ok: cache.error === null,
      error: cache.error,
      lastUpdated: new Date(cache.fetchedAt).toISOString(),
      unit: "Share of globally monitored online news coverage (%)",
    },
    { headers: { "cache-control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
  );
}
