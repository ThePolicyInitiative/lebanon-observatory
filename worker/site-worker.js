const DISTRICTS_URL = "https://services7.arcgis.com/75E2CRDA8iMPOf2z/ArcGIS/rest/services/Lebanon_dministrative_boundaries/FeatureServer/2/query?where=1%3D1&outFields=admin2Name%2Cadmin2Na_1%2Cadmin2Pcod%2Cadmin1Name%2Cadmin1Na_1%2Cadmin1Pcod&f=geojson";

let dataCache = null;
let snapshotCache = null;
let districtCache = null;
const sourceChecks = new Map();
const newsChecks = new Map();

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
  });
}

function csvValue(value) {
  const safeValue = String(value).replace(/^([=+\-@])/, "'$1");
  return `"${safeValue.replaceAll('"', '""')}"`;
}

async function assetResponse(request, env, pathname) {
  if (!env.ASSETS?.fetch) throw new Error("Static asset service is unavailable");
  const assetUrl = new URL(pathname, request.url);
  return env.ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
}

async function applicationData(request, env) {
  if (dataCache) return dataCache;
  const response = await assetResponse(request, env, "/data/observatory-data.json");
  if (!response.ok) throw new Error("Application data is unavailable");
  dataCache = await response.json();
  return dataCache;
}

async function snapshotsByUrl(request, env) {
  if (snapshotCache) return snapshotCache;
  const response = await assetResponse(request, env, "/data/source-snapshots.json");
  if (!response.ok) return new Map();
  const snapshot = await response.json();
  const targets = Array.isArray(snapshot.targets) ? snapshot.targets : [];
  snapshotCache = new Map(targets.filter(item => item && typeof item.url === "string").map(item => [item.url, item]));
  return snapshotCache;
}

function selectRecords(records, params) {
  const filter = params.get("filter") || "All";
  const period = params.get("period") || "All";
  const query = (params.get("q") || "").trim().toLowerCase();
  const sort = params.get("sort") || "latest";
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
      headers: { Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.1" }
    });
    const contentType = result.headers.get("content-type") || "";
    const payload = contentType.includes("text/html") ? await result.text() : "";
    const check = {
      id: source.id,
      state: result.ok ? "reachable" : "response-error",
      status: result.status,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      contentType,
      ...(payload ? pageMetadata(payload) : {})
    };
    sourceChecks.set(source.id, check);
    return check;
  } catch (error) {
    const check = {
      id: source.id,
      state: error?.name === "AbortError" ? "timeout" : "unreachable",
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      error: error?.name === "AbortError" ? "Source check timed out" : "Network request failed"
    };
    sourceChecks.set(source.id, check);
    return check;
  } finally {
    clearTimeout(timeout);
  }
}

async function districts() {
  if (districtCache) return districtCache;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const result = await fetch(DISTRICTS_URL, {
      signal: controller.signal,
      headers: { Accept: "application/geo+json,application/json" }
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

function currentSources(sources, snapshots) {
  return sources.map(source => ({ ...source, check: sourceChecks.get(source.id) || null, snapshot: snapshots.get(source.href) || null }));
}

function currentNews(news, snapshots) {
  return news.map(item => ({ ...item, check: newsChecks.get(item.id) || null, snapshot: snapshots.get(item.href) || null }));
}

async function api(request, env, url) {
  const data = await applicationData(request, env);
  const { records, sectors, sources, news, reviewedAt } = data;
  const snapshots = await snapshotsByUrl(request, env);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({ ok: true, app: "Lebanon Reconstruction Observatory", reviewedAt, recordCount: records.length, sourceCount: sources.length, newsCount: news.length });
  }
  if (request.method === "GET" && url.pathname === "/api/records") return json({ records: selectRecords(records, url.searchParams), total: records.length, reviewedAt });
  if (request.method === "GET" && url.pathname === "/api/sectors") return json({ sectors, reviewedAt });
  if (request.method === "GET" && url.pathname === "/api/sources") return json({ sources: currentSources(sources, snapshots), reviewedAt, snapshotCount: snapshots.size });
  if (request.method === "GET" && url.pathname === "/api/news") {
    const checkedAt = [...newsChecks.values()].map(check => check.checkedAt).sort().at(-1) || null;
    return json({ news: currentNews(news, snapshots), checkedAt, reviewedAt, snapshotCount: snapshots.size });
  }
  if (request.method === "GET" && url.pathname === "/api/map/districts") return json(await districts());
  if (request.method === "POST" && url.pathname === "/api/refresh") {
    await Promise.all(sources.map(checkSource));
    return json({ checkedAt: new Date().toISOString(), checks: [...sourceChecks.values()], sources: currentSources(sources, snapshots) });
  }
  if (request.method === "POST" && url.pathname === "/api/news/refresh") {
    await Promise.all(news.map(async item => {
      const check = await checkSource({ id: `news:${item.id}`, href: item.href });
      newsChecks.set(item.id, check);
    }));
    return json({ checkedAt: new Date().toISOString(), checks: [...newsChecks.values()], news: currentNews(news, snapshots) });
  }
  if (request.method === "GET" && url.pathname === "/api/export.csv") {
    const selected = selectRecords(records, url.searchParams);
    const header = ["Record", "Response period", "Type", "Publisher / partner", "Location / coverage", "Headline measure", "Supporting detail", "Publication date", "Primary source"];
    const rows = selected.map(record => [record.name, record.period, record.filter, record.status, record.place, record.funding, record.marker, record.date, record.href]);
    const csv = [header, ...rows].map(row => row.map(csvValue).join(",")).join("\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=lebanon-reconstruction-observatory-records.csv", "Cache-Control": "no-store" } });
  }
  return json({ error: "Unknown API endpoint" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await api(request, env, url);
      return await env.ASSETS.fetch(request);
    } catch (error) {
      if (url.pathname.startsWith("/api/")) return json({ error: "Service unavailable" }, 503);
      return new Response("Service unavailable", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  }
};
