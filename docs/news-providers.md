# Live-news provider setup

All providers are called **server-side only** from `GET /api/news`
(`src/app/api/news/route.ts`). No key or provider URL is ever exposed to the
browser; the client talks only to the site's own endpoint.

## Providers

### GDELT DOC API (primary, keyless)

- Endpoint: `https://api.gdeltproject.org/api/v2/doc/doc`
- Parameters used: `mode=artlist`, `format=json`, `sort=datedesc`,
  `maxrecords=250`, plus `timespan=2w` or `startdatetime`/`enddatetime`
  derived from the `from`/`to` query parameters.
- Query: `(Lebanon OR Lebanese) (reconstruction OR recovery OR rebuilding OR
  rubble OR debris OR housing OR infrastructure OR municipality OR shelter OR
  displacement OR LEAP OR procurement OR "damage assessment" OR "public
  works")` - covering English, Arabic and French reporting (GDELT translates
  queries across languages; original source language and URL are returned).
- No key required. Be a good citizen: the server cache keeps request volume
  far below GDELT's informal limits.

### ReliefWeb API v2 (humanitarian, keyless with registered app name)

- Endpoint: `POST https://api.reliefweb.int/v2/reports`
- Set `RELIEFWEB_APP_NAME` to your approved application name (register at
  https://apidoc.reliefweb.int/). A descriptive default is used otherwise.
- The request filters `primary_country.iso3 = lbn`, queries
  reconstruction/recovery/shelter/displacement/infrastructure/municipal/
  debris terms, sorts by `date.created:desc`, and includes **only** the
  fields needed for cards (title, URL, date, source name, language code).
  Full report text is never retrieved or reproduced; cards link to the
  original report.

### NewsAPI (optional commercial supplement)

- Endpoint: `GET https://newsapi.org/v2/everything`
- Enabled only when `NEWS_API_KEY` is set. The key is sent via the
  `x-api-key` header from the server; it never appears in client JavaScript.
- Respect your NewsAPI plan's terms: the free tier is development-only and
  its results may be delayed. The site functions fully without this provider.

### RSS providers (keyless, always on)

Five RSS feeds broaden coverage beyond the JSON APIs, parsed defensively
server-side (`src/lib/news/rss.ts`) with every string sanitized:

- **Google News** search feeds in English, Arabic and French
  (`news.google.com/rss/search`), scoped to Lebanon-reconstruction terms
  over the last 30 days. Publisher identity comes from each item's
  `<source>` tag; links open via Google News to the original publisher.
- **ReliefWeb Lebanon updates** (`reliefweb.int/updates/rss.xml`) - works
  without the registered application name the JSON API requires.
- **UN News, Middle East** (`news.un.org` RSS), filtered to Lebanon by the
  relevance gate.

Feeds cache on a fixed key (their queries are fixed); the request's own
filters (search, dates, language, tags) are applied server-side after
aggregation.

### Coverage-volume endpoint

`GET /api/news/volume` serves a 3-month daily series from the GDELT
timeline API (`mode=timelinevol`): the share of globally monitored online
news matching the Lebanon-reconstruction query. Cached one hour
(failures 60s). The analytics chart uses it when available and falls back
to counting matched articles.

### Official-source monitoring

Official updates surface two ways: (1) articles whose domain classifies as
official/multilateral/UN are tagged and filterable under the "Official
updates" tab; (2) a manually maintained directory of institutional pages
(PCM, CDR procurement portal, World Bank Lebanon, UN Lebanon, UNDP,
UN-Habitat, OCHA/ReliefWeb, EU Delegation) is linked directly rather than
scraped, respecting each site's terms.

## Pipeline guarantees

- **Sanitization**: every remote string is stripped of HTML and control
  characters; URLs must parse as http(s).
- **Relevance**: Lebanon must be a primary subject and at least one
  reconstruction-related keyword present. "Only highly relevant" raises the
  threshold to core reconstruction terms.
- **Deduplication**: canonical-URL collapse, then normalised-title and
  token-similarity grouping; the earliest article from the best-attested
  publisher leads, with an "Also reported by N other outlets" count.
- **Caching**: per-provider in-memory cache, TTL `NEWS_CACHE_TTL_SECONDS`
  (default 1800s), stale-while-revalidate, and retention of the last
  successful response when a provider fails.
- **Resilience**: 9s request timeout, 2 retries with exponential backoff,
  per-IP rate limiting (60 requests / 5 minutes), provider errors logged
  without secrets.
- **Copyright**: headline + short description + link only; no full-text
  proxying or republication; no AI-generated summaries.

### What the reader is not shown

The response carries `providers[]` (name, ok, fromCache, cacheAgeSeconds,
error) and `lastUpdated`, and no page reads either. That is deliberate, not
an oversight: the per-provider roll-call, the "last updated" stamp and the
matched-article count were all removed from the page, because how the feed
was assembled is not something a reader of the analysis needs to weigh. The
payload stays because it is the only way to see provider health from
`/api/news` when something is wrong. Treat it as operator diagnostics, and
do not put it back on the page without asking.

## Failure modes to test

1. Disconnect the network → the endpoint returns the last cached payload
   with `providers[].ok=false`, and on a cold cache the news page shows its
   error state - "Live updates unavailable", plus a line saying the analysis
   elsewhere on the site is separate and unaffected - while the rest of the
   site carries on.
2. Invalid query parameters → HTTP 400 with field errors (covered by tests).
3. Hammering the endpoint → HTTP 429 after 60 requests in 5 minutes.
