import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { fetchWithRetry } from "@/lib/news/http";

/**
 * The HTTP client against a real local server: retry on 5xx, bounded
 * redirects, and the body-size cap. The idle and wall-clock timeouts are
 * multi-second by design and are not exercised here.
 */

let server: Server;
let base: string;
let hits: Record<string, number>;

beforeAll(async () => {
  hits = {};
  server = createServer((req, res) => {
    const path = req.url ?? "/";
    hits[path] = (hits[path] ?? 0) + 1;

    if (path === "/ok") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ fine: true }));
    } else if (path === "/flaky") {
      if (hits[path] === 1) {
        res.writeHead(500);
        res.end("boom");
      } else {
        res.writeHead(200);
        res.end("recovered");
      }
    } else if (path === "/redirect") {
      res.writeHead(302, { location: `${base}/ok` });
      res.end();
    } else if (path === "/loop-a") {
      res.writeHead(302, { location: `${base}/loop-b` });
      res.end();
    } else if (path === "/loop-b") {
      res.writeHead(302, { location: `${base}/loop-a` });
      res.end();
    } else if (path === "/huge") {
      res.writeHead(200, { "content-type": "text/plain" });
      const chunk = Buffer.alloc(1024 * 1024, 120);
      for (let i = 0; i < 6; i++) res.write(chunk);
      res.end();
    } else if (path === "/missing") {
      res.writeHead(404);
      res.end("nope");
    } else {
      res.writeHead(500);
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => server.close(r));
});

describe("fetchWithRetry", () => {
  it("returns a healthy response", async () => {
    const res = await fetchWithRetry(`${base}/ok`);
    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual({ fine: true });
  });

  it("retries a 500 and succeeds on the second attempt", async () => {
    const res = await fetchWithRetry(`${base}/flaky`, undefined, 2);
    expect(res.ok).toBe(true);
    expect(await res.text()).toBe("recovered");
    expect(hits["/flaky"]).toBe(2);
  });

  it("does not retry a 404", async () => {
    const res = await fetchWithRetry(`${base}/missing`, undefined, 2);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
    expect(hits["/missing"]).toBe(1);
  });

  it("follows a redirect to the target", async () => {
    const res = await fetchWithRetry(`${base}/redirect`, undefined, 0);
    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual({ fine: true });
  });

  it("terminates a redirect loop instead of recursing forever", async () => {
    await expect(fetchWithRetry(`${base}/loop-a`, undefined, 0)).rejects.toThrow(
      /too many redirects/,
    );
  });

  it("aborts a response that exceeds the body-size cap", async () => {
    await expect(fetchWithRetry(`${base}/huge`, undefined, 0)).rejects.toThrow(
      /response body too large/,
    );
  });
});
