import "server-only";

/** Shared HTTPS client for news providers, on node:https. Undici-based
 * fetch is avoided deliberately: its connection pooling is blocked by
 * some Windows network-filtering environments while plain node:https is
 * not, and these modules always run on the Node.js runtime. */

const FETCH_TIMEOUT_MS = 12000;

export type HttpResult = {
  status: number;
  ok: boolean;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
};

function httpRequest(
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<HttpResult> {
  return import("node:https").then(
    (https) =>
      new Promise<HttpResult>((resolve, reject) => {
        const req = https.request(
          url,
          {
            method: init?.method ?? "GET",
            headers: {
              "user-agent": "LebanonReconstructionObservatory/1.0 (research; contact via site)",
              accept: "application/json, application/rss+xml, application/xml, text/xml",
              ...init?.headers,
            },
            timeout: FETCH_TIMEOUT_MS,
          },
          (res) => {
            // Follow same-protocol redirects (RSS endpoints redirect freely).
            const status = res.statusCode ?? 0;
            if (status >= 301 && status <= 308 && res.headers.location) {
              res.resume();
              const next = new URL(res.headers.location, url).toString();
              httpRequest(next, init).then(resolve, reject);
              return;
            }
            const chunks: Buffer[] = [];
            res.on("data", (c: Buffer) => chunks.push(c));
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
        req.on("timeout", () => {
          req.destroy(new Error("request timed out"));
        });
        req.on("error", reject);
        if (init?.body) req.write(init.body);
        req.end();
      }),
  );
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
