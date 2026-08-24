import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NewsArticle } from "@/lib/types";

/**
 * The provider cache is what stands between readers and this network's
 * hostile providers (rate-limited GDELT, 403ing ReliefWeb). Only the
 * Date is faked: timers and promises stay real so the cache's untracked
 * background refreshes actually run.
 */

const article = (id: string): NewsArticle => ({
  id,
  title: `Lebanon reconstruction update ${id}`,
  description: null,
  sourceName: "Test",
  sourceDomain: "example.lb",
  sourceType: "media",
  url: `https://example.lb/${id}`,
  imageUrl: null,
  publishedAt: "2026-08-01T00:00:00Z",
  language: "en",
  provider: "rss",
  locations: [],
  sectors: [],
  actorLayers: [],
  valueChainStages: [],
  relevanceScore: 90,
  duplicateGroupId: null,
});

async function freshCache() {
  vi.resetModules();
  return await import("@/lib/news/cache");
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("cachedProvider", () => {
  it("fetches cold once and serves the TTL window from cache", async () => {
    const { cachedProvider } = await freshCache();
    const fetcher = vi.fn(async () => [article("a")]);
    const first = await cachedProvider("p", "k", fetcher);
    expect(first.ok).toBe(true);
    expect(first.fromCache).toBe(false);
    expect(first.articles).toHaveLength(1);

    const second = await cachedProvider("p", "k", fetcher);
    expect(second.fromCache).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent cold fetches", async () => {
    const { cachedProvider } = await freshCache();
    const fetcher = vi.fn(
      () => new Promise<NewsArticle[]>((r) => setTimeout(() => r([article("a")]), 5)),
    );
    const [r1, r2] = await Promise.all([
      cachedProvider("p", "k", fetcher),
      cachedProvider("p", "k", fetcher),
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(r1.articles).toHaveLength(1);
    expect(r2.articles).toHaveLength(1);
  });

  it("keeps serving the last good payload while a provider fails, and retries after the short failure TTL", async () => {
    const { cachedProvider } = await freshCache();
    let healthy = true;
    const fetcher = vi.fn(async () => {
      if (!healthy) throw new Error("HTTP 429");
      return [article("good")];
    });

    await cachedProvider("p", "k", fetcher);

    // Success TTL (default 1800s) passes; the next call serves stale and
    // revalidates in the background - against a now-failing provider.
    healthy = false;
    vi.advanceTimersByTime(1801 * 1000);
    const stale = await cachedProvider("p", "k", fetcher);
    expect(stale.fromCache).toBe(true);
    await flush(); // let the background refresh settle

    const afterFailure = await cachedProvider("p", "k", fetcher);
    expect(afterFailure.ok).toBe(false);
    expect(afterFailure.articles.map((a) => a.id)).toEqual(["good"]);

    // The failure entry expires after 60s, not the full success TTL.
    healthy = true;
    vi.advanceTimersByTime(61 * 1000);
    await cachedProvider("p", "k", fetcher);
    await flush();
    const recovered = await cachedProvider("p", "k", fetcher);
    expect(recovered.ok).toBe(true);
    expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("caps the number of cached keys so free-text queries cannot grow memory forever", async () => {
    const { cachedProvider } = await freshCache();
    for (let i = 0; i < 260; i++) {
      await cachedProvider("p", `k${i}`, async () => [article(`a${i}`)]);
      vi.advanceTimersByTime(10);
    }
    // The oldest keys are gone: a re-request refetches instead of serving cache.
    const fetcher = vi.fn(async () => [article("re")]);
    const oldest = await cachedProvider("p", "k0", fetcher);
    expect(oldest.fromCache).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
    // The newest keys survive.
    const newest = await cachedProvider("p", "k259", fetcher);
    expect(newest.fromCache).toBe(true);
  });
});

describe("rateLimited", () => {
  it("allows the window quota, blocks past it, and unblocks after the window", async () => {
    const { rateLimited } = await freshCache();
    for (let i = 0; i < 60; i++) {
      expect(rateLimited("1.2.3.4")).toBe(false);
    }
    expect(rateLimited("1.2.3.4")).toBe(true);
    expect(rateLimited("5.6.7.8")).toBe(false);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(rateLimited("1.2.3.4")).toBe(false);
  });
});
