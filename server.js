const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { records, sectors, sources, news, reviewedAt } = require("./data.js");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 4173);
const HOST = "127.0.0.1";
const sourceChecks = new Map();
const newsChecks = new Map();
const SCRAPE_SNAPSHOT_PATH = path.join(ROOT, "data", "source-snapshots.json");
const DISTRICTS_URL = "https://services7.arcgis.com/75E2CRDA8iMPOf2z/ArcGIS/rest/services/Lebanon_dministrative_boundaries/FeatureServer/2/query?where=1%3D1&outFields=admin2Name%2Cadmin2Na_1%2Cadmin2Pcod%2Cadmin1Name%2Cadmin1Na_1%2Cadmin1Pcod&f=geojson";
let districtCache = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

function sendText(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  response.end(body);
}

function csvValue(value) {
  const safeValue = String(value).replace(/^([=+\-@])/, "'$1");
  return `"${safeValue.replaceAll("\"", "\"\"")}"`;
}

function selectRecords(searchParams) {
  const filter = searchParams.get("filter") || "All";
  const period = searchParams.get("period") || "All";
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const sort = searchParams.get("sort") || "latest";
  const matching = records.filter(record => {
    const hasFilter = filter === "All" || record.filter === filter;
    const hasPeriod = period === "All" || record.period === period;
    const searchable = [record.name, record.place, record.filter, record.period, record.status, record.funding, record.marker].join(" ").toLowerCase();
    return hasFilter && hasPeriod && searchable.includes(query);
  });
  return matching.sort((left, right) => {
    if (sort === "scale") return right.scale - left.scale;
    if (sort === "az") return left.name.localeCompare(right.name);
    return right.date.localeCompare(left.date);
  });
}

function cleanText(value) {
  return value.replace(/\s+/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").trim();
}

function pageMetadata(html) {
  const titleMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:og:title|twitter:title)["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/i);
  return {
    pageTitle: titleMatch ? cleanText(titleMatch[1]) : null,
    description: descriptionMatch ? cleanText(descriptionMatch[1]).slice(0, 180) : null
  };
}

async function checkSource(source) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const result = await fetch(source.href, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Lebanon-Reconstruction-Observatory/1.0 (+local-source-check)",
        "Accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.1"
      }
    });
    const contentType = result.headers.get("content-type") || "";
    const payload = contentType.includes("text/html") ? await result.text() : "";
    const metadata = payload ? pageMetadata(payload) : {};
    const check = {
      id: source.id,
      state: result.ok ? "reachable" : "response-error",
      status: result.status,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      contentType,
      ...metadata
    };
    sourceChecks.set(source.id, check);
    return check;
  } catch (error) {
    const check = {
      id: source.id,
      state: error.name === "AbortError" ? "timeout" : "unreachable",
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      error: error.name === "AbortError" ? "Source check timed out" : "Network request failed"
    };
    sourceChecks.set(source.id, check);
    return check;
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshSources() {
  const checks = await Promise.all(sources.map(checkSource));
  return checks;
}

async function checkNewsItem(item) {
  const check = await checkSource({ id: `news:${item.id}`, href: item.href });
  newsChecks.set(item.id, check);
  return check;
}

async function refreshNews() {
  return Promise.all(news.map(checkNewsItem));
}

async function districts() {
  if (districtCache) return districtCache;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const result = await fetch(DISTRICTS_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "Lebanon-Reconstruction-Observatory/1.0 (+local-map-service)", "Accept": "application/geo+json,application/json" }
    });
    if (!result.ok) throw new Error("Boundary service returned an error");
    const data = await result.json();
    if (!Array.isArray(data.features) || data.features.length < 26) throw new Error("Boundary service returned incomplete district data");
    districtCache = { data, fetchedAt: new Date().toISOString(), source: "Lebanon Administrative Boundaries: ArcGIS FeatureServer (Districts ADM2)" };
    return districtCache;
  } finally {
    clearTimeout(timeout);
  }
}

async function sourceSnapshotsByUrl() {
  try {
    const raw = await fs.readFile(SCRAPE_SNAPSHOT_PATH, "utf8");
    const snapshot = JSON.parse(raw);
    const targets = Array.isArray(snapshot.targets) ? snapshot.targets : [];
    return new Map(targets.filter(item => item && typeof item.url === "string").map(item => [item.url, item]));
  } catch (error) {
    return new Map();
  }
}

function currentSources(snapshotByUrl = new Map()) {
  return sources.map(source => ({ ...source, check: sourceChecks.get(source.id) || null, snapshot: snapshotByUrl.get(source.href) || null }));
}

function currentNews(snapshotByUrl = new Map()) {
  return news.map(item => ({ ...item, check: newsChecks.get(item.id) || null, snapshot: snapshotByUrl.get(item.href) || null }));
}

async function serveStatic(response, pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalized = path.normalize(requested).replace(/^([/\\])+/, "");
  const filePath = path.resolve(ROOT, normalized);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) return sendText(response, 403, "Forbidden");
  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, { "Content-Type": mimeTypes[extension] || "application/octet-stream", "Cache-Control": "no-cache" });
    response.end(file);
  } catch (error) {
    if (error.code === "ENOENT") return sendText(response, 404, "Not found");
    return sendText(response, 500, "Unable to read file");
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, { ok: true, app: "Lebanon Reconstruction Observatory", reviewedAt, recordCount: records.length, sourceCount: sources.length, newsCount: news.length });
    }
    if (request.method === "GET" && url.pathname === "/api/records") {
      return sendJson(response, 200, { records: selectRecords(url.searchParams), total: records.length, reviewedAt });
    }
    if (request.method === "GET" && url.pathname === "/api/sectors") {
      return sendJson(response, 200, { sectors, reviewedAt });
    }
    if (request.method === "GET" && url.pathname === "/api/sources") {
      const snapshotByUrl = await sourceSnapshotsByUrl();
      return sendJson(response, 200, { sources: currentSources(snapshotByUrl), reviewedAt, snapshotCount: snapshotByUrl.size });
    }
    if (request.method === "GET" && url.pathname === "/api/news") {
      const checkedAt = [...newsChecks.values()].map(check => check.checkedAt).sort().at(-1) || null;
      const snapshotByUrl = await sourceSnapshotsByUrl();
      return sendJson(response, 200, { news: currentNews(snapshotByUrl), checkedAt, reviewedAt, snapshotCount: snapshotByUrl.size });
    }
    if (request.method === "GET" && url.pathname === "/api/map/districts") {
      const boundaryData = await districts();
      return sendJson(response, 200, boundaryData);
    }
    if (request.method === "POST" && url.pathname === "/api/refresh") {
      const checks = await refreshSources();
      const snapshotByUrl = await sourceSnapshotsByUrl();
      return sendJson(response, 200, { checkedAt: new Date().toISOString(), checks, sources: currentSources(snapshotByUrl) });
    }
    if (request.method === "POST" && url.pathname === "/api/news/refresh") {
      const checks = await refreshNews();
      const snapshotByUrl = await sourceSnapshotsByUrl();
      return sendJson(response, 200, { checkedAt: new Date().toISOString(), checks, news: currentNews(snapshotByUrl) });
    }
    if (request.method === "GET" && url.pathname === "/api/export.csv") {
      const selected = selectRecords(url.searchParams);
      const header = ["Record", "Response period", "Type", "Publisher / partner", "Location / coverage", "Headline measure", "Supporting detail", "Publication date", "Primary source"];
      const rows = selected.map(record => [record.name, record.period, record.filter, record.status, record.place, record.funding, record.marker, record.date, record.href]);
      const csv = [header, ...rows].map(row => row.map(csvValue).join(",")).join("\n");
      response.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=lebanon-reconstruction-observatory-records.csv",
        "Cache-Control": "no-store"
      });
      return response.end(csv);
    }
    if (url.pathname.startsWith("/api/")) return sendJson(response, 404, { error: "Unknown API endpoint" });
    return serveStatic(response, url.pathname);
  } catch (error) {
    return sendJson(response, 500, { error: "Unexpected server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Lebanon Reconstruction Observatory running at http://${HOST}:${PORT}`);
});
