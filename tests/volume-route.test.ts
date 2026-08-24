import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * GET /api/news/volume with the HTTP layer mocked: GDELT date
 * normalization, the empty-fallback shape on failure, and the CDN
 * header shortening its window when the payload is a failure.
 */

vi.mock("@/lib/news/http", () => ({
  fetchWithRetry: vi.fn(),
}));

async function load() {
  vi.resetModules();
  const http = await import("@/lib/news/http");
  const route = await import("@/app/api/news/volume/route");
  return { http, route };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/news/volume", () => {
  it("normalises GDELT timestamps and rounds values", async () => {
    const { http, route } = await load();
    vi.mocked(http.fetchWithRetry).mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => "",
      json: async () => ({
        timeline: [
          {
            data: [
              { date: "20260801T000000Z", value: 1.2345678 },
              { date: "20260802T000000Z", value: 0.5 },
              { date: "bad", value: "junk" },
            ],
          },
        ],
      }),
    });

    const res = await route.GET();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.points[0]).toEqual({ date: "2026-08-01", value: 1.2346 });
    expect(body.points[1]).toEqual({ date: "2026-08-02", value: 0.5 });
    expect(body.points).toHaveLength(2);
    expect(res.headers.get("cache-control")).toContain("s-maxage=1800");
  });

  it("answers a cold failure with the empty shape and a short CDN window", async () => {
    const { http, route } = await load();
    vi.mocked(http.fetchWithRetry).mockRejectedValue(new Error("HTTP 429"));

    const res = await route.GET();
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.points).toEqual([]);
    expect(body.error).toBe("provider temporarily unavailable");
    // A 30-minute CDN pin on an empty chart would outlive the server's
    // own 60s failure TTL by a factor of thirty.
    expect(res.headers.get("cache-control")).toContain("s-maxage=60");
  });
});
