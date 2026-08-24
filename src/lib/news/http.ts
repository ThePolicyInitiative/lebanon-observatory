import "server-only";

/** Shared HTTP client for news providers, on node:https / node:http.
 * Undici-based fetch is avoided deliberately: its connection pooling is
 * blocked by some Windows network-filtering environments while the plain
 * node modules are not, and these modules always run on the Node.js
 * runtime. */

/** Socket-idle timeout: a server that goes silent this long is dropped. */
const FETCH_TIMEOUT_MS = 12000;
/** Wall-clock deadline for one logical request, redirects included: a
 * server that keeps trickling bytes cannot hold the request open past
 * this. */
const TOTAL_DEADLINE_MS = 15000;
const MAX_REDIRECTS = 5;
/** No feed this site reads is anywhere near this size; one misbehaving
 * endpoint must not balloon server memory. */
const MAX_BODY_BYTES = 5 * 1024 * 1024;

export type HttpResult = {
  status: number;
  ok: boolean;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
};

async function httpRequest(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
  redirectsLeft: number = MAX_REDIRECTS,
  deadlineAt: number = Date.now() + TOTAL_DEADLINE_MS,
): Promise<HttpResult> {
  const isHttp = new URL(url).protocol === "http:";
  const mod = isHttp ? await import("node:http") : await import("node:https");
  const budget = deadlineAt - Date.now();
  if (budget <= 0) throw new Error("request deadline exceeded");

  return new Promise<HttpResult>((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method: init?.method ?? "GET",
        headers: {
          "user-agent": "LebanonReconstructionObservatory/1.0 (research; contact via site)",
          accept: "application/json, application/rss+xml, application/xml, text/xml",
          ...init?.headers,
        },
        timeout: Math.min(FETCH_TIMEOUT_MS, budget),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        // Follow redirects (RSS endpoints redirect freely, occasionally
        // across protocols), bounded in depth and by the shared deadline
        // so a redirect loop terminates.
        if (status >= 301 && status <= 308 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) {
            reject(new Error("too many redirects"));
            return;
          }
          const next = new URL(res.headers.location, url).toString();
          httpRequest(next, init, redirectsLeft - 1, deadlineAt).then(resolve, reject);
          return;
        }
        const chunks: Buffer[] = [];
        let received = 0;
        res.on("data", (c: Buffer) => {
          received += c.length;
          if (received > MAX_BODY_BYTES) {
            req.destroy(new Error("response body too large"));
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf-8");
          resolve({
            status,
            ok: status >= 200 && status < 300,
            text: () => Promise.resolve(body),
            json: () => Promise.resolve(JSON.parse(body)),
          });
        });
      },
    );
    const killer = setTimeout(() => {
      req.destroy(new Error("request deadline exceeded"));
    }, budget);
    req.on("close", () => clearTimeout(killer));
    req.on("timeout", () => {
      req.destroy(new Error("request timed out"));
    });
    req.on("error", reject);
    if (init?.body) req.write(init.body);
    req.end();
  });
}

export async function fetchWithRetry(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
  retries = 2,
): Promise<HttpResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await httpRequest(url, init);
      // Retry transient server errors and rate limits with backoff.
      if ((res.status >= 500 || res.status === 429) && attempt < retries) {
        await new Promise((r) => setTimeout(r, (res.status === 429 ? 2000 : 500) * 2 ** attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("fetch failed");
}
