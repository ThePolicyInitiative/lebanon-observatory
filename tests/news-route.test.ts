import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { NewsArticle } from "@/lib/types";

/**
 * GET /api/news with the providers mocked: parameter validation, failure
 * isolation (one provider down must not empty the response), error
 * masking, pagination, and the spoof-resistance of the rate-limit key.
 */

const article = (id: string, over: Partial<NewsArticle> = {}): NewsArticle => ({
  id,
  title: `Lebanon reconstruction ${id}`,
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
  ...over,
});

vi.mock("@/lib/news/providers", () => ({
  fetchGdelt: vi.fn(),
  fetchNewsApi: vi.fn(),
  fetchReliefWeb: vi.fn(),
  newsApiConfigured: () => false,
}));
vi.mock("@/lib/news/rss", () => ({
  RSS_FEEDS: [{ name: "feed-a" }, { name: "feed-b" }],
  fetchRssFeed: vi.fn(),
}));

async function load() {
  vi.resetModules();
  const providers = await import("@/lib/news/providers");
  const rss = await import("@/lib/news/rss");
  const route = await import("@/app/api/news/route");
  return { providers, rss, route };
}

const req = (qs = "", headers: Record<string, string> = {}) =>
  new NextRequest(`http://localhost/api/news${qs}`, { headers });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/news", () => {
  it("rejects invalid query parameters with a 400", async () => {
    const { route } = await load();
    const res = await route.GET(req("?page=0"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid query/);
  });

  it("isolates a failing provider: the rest still answer, the failure is masked", async () => {
    const { providers, rss, route } = await load();
    vi.mocked(providers.fetchGdelt).mockRejectedValue(
      new Error("HTTP 429 from api.gdeltproject.org"),
    );
    vi.mocked(rss.fetchRssFeed).mockImplementation(async (feed: { name: string }) => [
      article(`${feed.name}-1`, {
        title:
          feed.name === "feed-a"
            ? "Lebanon municipalities resume rubble clearance in Aaitaroun"
            : "Lebanon compensation claims window opens for Nabatieh households",
      }),
    ]);

    const res = await route.GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.articles.length).toBe(2);

    const gdelt = body.providers.find((p: { name: string }) => p.name === "gdelt");
    expect(gdelt.ok).toBe(false);
    // The raw provider error (hostnames, status lines) never reaches readers.
    expect(gdelt.error).toBe("provider temporarily unavailable");
    expect(JSON.stringify(body)).not.toContain("gdeltproject");

    const feedA = body.providers.find((p: { name: string }) => p.name === "feed-a");
    expect(feedA.ok).toBe(true);
  });

  it("paginates: page 2 of 30 articles at pageSize 10", async () => {
    const { providers, rss, route } = await load();
    vi.mocked(providers.fetchGdelt).mockResolvedValue(
      Array.from({ length: 30 }, (_, i) =>
        article(`g${i}`, {
          title: `Lebanon rebuild market${i} sector${i}`,
          publishedAt: `2026-07-${String((i % 28) + 1).padStart(2, "0")}T00:00:00Z`,
        }),
      ),
    );
    vi.mocked(rss.fetchRssFeed).mockResolvedValue([]);

    const res = await route.GET(req("?page=2&pageSize=10"));
    const body = await res.json();
    expect(body.total).toBe(30);
    expect(body.articles).toHaveLength(10);
    expect(body.page).toBe(2);
  });

  it("rate-limits on the nearest-hop address, so rotating the leftmost header entry does not evade it", async () => {
    const { providers, rss, route } = await load();
    vi.mocked(providers.fetchGdelt).mockResolvedValue([]);
    vi.mocked(rss.fetchRssFeed).mockResolvedValue([]);

    let last: Response | null = null;
    for (let i = 0; i < 61; i++) {
      last = await route.GET(
        req("", { "x-forwarded-for": `10.0.0.${i % 250}, 203.0.113.7` }),
      );
    }
    expect(last!.status).toBe(429);
  });
});
