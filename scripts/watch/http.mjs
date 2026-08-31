/**
 * HTTP for the source watcher, on node:https.
 *
 * Deliberately not `fetch`: undici's connection pooling is blocked by the
 * Windows network filtering this project is developed behind, while the
 * plain node modules go through. `src/lib/news/http.ts` makes the same
 * choice for the same reason; this is its build-time twin, kept separate
 * because that module is `server-only` and carries the news providers'
 * response shape.
 */

import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const SOCKET_TIMEOUT_MS = 20_000;
const TOTAL_DEADLINE_MS = 60_000;
const MAX_REDIRECTS = 5;
/** ISR PDFs run to a few hundred KB. 25MB is a runaway, not a report. */
const MAX_BODY_BYTES = 25 * 1024 * 1024;

const UA = "LebanonReconstructionObservatory/1.0 (research; +https://github.com)";

function once(url, init, redirectsLeft, deadlineAt) {
  const budget = deadlineAt - Date.now();
  if (budget <= 0) return Promise.reject(new Error(`deadline exceeded: ${url}`));
  const send = new URL(url).protocol === "http:" ? httpRequest : httpsRequest;

  return new Promise((resolve, reject) => {
    const req = send(
      url,
      {
        method: init.method ?? "GET",
        headers: {
          "user-agent": UA,
          accept: init.accept ?? "application/json, text/html, */*",
          ...init.headers,
        },
        timeout: Math.min(SOCKET_TIMEOUT_MS, budget),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 301 && status <= 308 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) return reject(new Error(`too many redirects: ${url}`));
          const next = new URL(res.headers.location, url).toString();
          return once(next, init, redirectsLeft - 1, deadlineAt).then(resolve, reject);
        }
        const chunks = [];
        let received = 0;
        res.on("data", (c) => {
          received += c.length;
          if (received > MAX_BODY_BYTES) {
            req.destroy(new Error(`response body over ${MAX_BODY_BYTES} bytes: ${url}`));
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          resolve({
            status,
            ok: status >= 200 && status < 300,
            url,
            body,
            text: () => body.toString("utf8"),
            json: () => JSON.parse(body.toString("utf8")),
          });
        });
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error(`socket idle ${SOCKET_TIMEOUT_MS}ms: ${url}`)));
    req.on("error", reject);
    if (init.body) req.write(init.body);
    req.end();
  });
}

/**
 * One logical GET, retried on the failures that are worth retrying.
 *
 * 429 and 5xx are transient by definition and GDELT in particular answers
 * 429 under no load at all; a 404 or a 403 is an answer and is returned as
 * one, so a caller can tell "the source refused us" from "the network
 * broke" without catching.
 */
export async function get(url, init = {}, attempt = 1) {
  const deadlineAt = Date.now() + TOTAL_DEADLINE_MS;
  try {
    const res = await once(url, init, MAX_REDIRECTS, deadlineAt);
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await sleep(attempt * 2000);
      return get(url, init, attempt + 1);
    }
    return res;
  } catch (err) {
    if (attempt < 3) {
      await sleep(attempt * 2000);
      return get(url, init, attempt + 1);
    }
    throw err;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
