# Deployment

## Requirements

- Node.js 20+ (developed on Node 24)
- No database required. The analytical dataset ships as validated JSON.

## Steps (any Node host: Vercel, Netlify, a VPS, a container)

```bash
npm ci
cp .env.example .env.local     # set NEXT_PUBLIC_SITE_URL and optional keys
npm run build
npm start                      # serves on PORT (default 3000)
```

Set environment variables in your host's dashboard rather than committing
`.env.local`. Only `NEXT_PUBLIC_*` variables are exposed to the browser -
keep `NEWS_API_KEY` strictly server-side (the code already does).

Notes for serverless hosts: both news routes (`/api/news` and
`/api/news/volume`) are dynamic and each keeps its own in-memory cache per
instance, as does the rate limiter. That is acceptable behaviour (each
instance keeps its own cache, the client tolerates cold caches and an empty
coverage series), but if you scale horizontally and want a shared cache, put
a CDN cache in front of them - `/api/news` sends `s-maxage=300,
stale-while-revalidate=1500` and `/api/news/volume` sends `s-maxage=1800,
stale-while-revalidate=3600` - or swap the cache module for Redis. Both
routes shorten their own CDN window when they are serving a degraded answer:
`/api/news` drops to `s-maxage=60, stale-while-revalidate=300` when every
provider is down, and `/api/news/volume` to the same when its series is
missing, so a CDN never pins a failure for longer than the server waits
before retrying.

### Rate limiting and proxies

`/api/news` allows 60 requests per five minutes per reader, keyed off
`x-forwarded-for`. Which entry in that header identifies the reader depends
on your topology, so the number of hops that append to it is configurable:
set `RATE_LIMIT_TRUSTED_HOPS` (see `.env.example`) to `1` for a platform edge
or a single reverse proxy, `2` for a CDN in front of a proxy that also
appends, and so on. Leaving it too low behind a multi-hop chain keys every
reader behind one edge into a shared bucket and hands them each other's
429s. Served directly by `next start` there is no appending hop at all - Next
fills the header from the socket address only when the reader sends none, so
a reader who sends their own keeps it and the limit is best-effort. If your
platform publishes a single-value client-address header instead
(`CF-Connecting-IP` and the like), that header is the more reliable key and
is worth a small change in `src/lib/news/cache.ts`.

## Response headers

`next.config.ts` sets these on every response (`source: '/(.*)'`), and
`poweredByHeader` is off so no `X-Powered-By` ships:

| Header | Value | Why |
| --- | --- | --- |
| `Content-Security-Policy` | see below | Confines the page to its own origin |
| `X-Content-Type-Options` | `nosniff` | No content-type guessing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No path leakage to publishers |
| `X-Frame-Options` | `DENY` | Clickjacking, for browsers predating `frame-ancestors` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` | The site needs none of them |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Ignored over plain http, correct once TLS is on |

The policy is nonce-free on purpose. Every analytical page is prerendered
and its static HTML carries Next's own inline bootstrap and flight scripts;
a per-request nonce would force all of those pages to render dynamically,
which is the trade Next's own guide describes. So `script-src` keeps
`'unsafe-inline'` and the rest is tightened around it. Two directives look
removable and are not: MapLibre builds its worker from a Blob URL
(`worker-src blob:`) and decodes raster imagery into `blob:` images
(`img-src blob:`). Dropping either degrades the pan-and-zoom map to the SVG
fallback with no visible error, which is why checklist item 4 below is worth
running with the browser console open after the first deploy.

`connect-src` names one external host unconditionally:
`https://demotiles.maplibre.org`. With no style URL configured, the map's
inline fallback style takes its glyphs from there, and the town-label layer
fetches them from zoom 10.2 up - without it the labels vanish while the rest
of the map still draws. If you set `NEXT_PUBLIC_MAP_STYLE_URL`, that host's
origin is appended to `connect-src` and `img-src` automatically (and its own
style supplies the glyphs). Any other external origin you ever add - an
embed, a font host, an analytics endpoint - has to be named in the policy or
it will be blocked.

## Caching of the runtime JSON

`public/cells/*.json`, `public/entries/*.json` and `public/geo/*` are
addressed by meaning rather than by content hash: their URLs stay the same
across deploys while their contents move with the data. Next serves `public/`
as `public, max-age=0` by default, so `next.config.ts` overrides it:

- `/geo/:path*` - `public, max-age=86400, stale-while-revalidate=604800`.
  Administrative boundaries are geometry that only moves when the layer is
  replaced, and `lebanon-adm3.geojson` alone is 835 kB (144 kB gzipped).
- `/cells/:path*` and `/entries/:path*` - `public, max-age=300,
  stale-while-revalidate=86400`. Five minutes is long enough that reopening a
  cell drawer or an entry panel inside a session is instant, short enough
  that a data release is visible almost immediately after a deploy.

Header rules are checked before the filesystem, so they reach `public/` files.
The only exception is hashed `/_next/static` assets, whose immutable
`Cache-Control` cannot be overridden and does not need to be.

## Performance

- **Data is split by consumer.** `src/lib/data.ts` is the server-side
  source of truth (the full entry log and the source register) and
  re-exports everything shared from `src/lib/data-client.ts`, which
  carries only what browser components need. `src/lib/map-records.ts`
  holds the slim projection the map and explorer filter on (identity,
  classification and action text in both languages). Two static
  projections live under `public/`: `cells/` (one file per heatmap cell,
  fetched when a reader opens a cell drawer) and `entries/` (one file
  per entry, fetched when the explorer opens a detail panel). All three
  projections are guarded by `tests/projections.test.ts`, which fails
  whenever `role-records.json` changes without them.
- **MapLibre loads on demand.** The vector map is the default and is part
  of the server HTML; the ~940 kB GL library is imported inside the
  effect that runs only when a reader opts into pan-and-zoom, and its CSS
  is imported by the map route rather than the root layout.
- Charts render with ECharts' SVG renderer; the change heatmap and the
  actor register/matrix are dynamically imported so they do not block
  first paint.
- Fonts are self-hosted through `next/font` (Inter + Source Serif 4).
- All analytical pages are statically prerendered, as are `/robots.txt`,
  `/sitemap.xml`, `/manifest.webmanifest` and both feeds. The only dynamic
  routes are `/api/news` and `/api/news/volume`.
- Fixed-height chart and skeleton containers avoid cumulative layout shift.
- Compression is Next's default: `next start` gzips both rendered content
  and static files, which covers the `/cells`, `/entries` and `/geo` fetches
  and the API responses. Only set `compress: false` if you put a proxy in
  front that compresses instead.

## Feeds and installation

- `/feed.xml` (English) and `/ar/feed.xml` (Arabic) are Atom feeds of the
  observatory's own dated stream: the milestone chain the finance page charts
  plus the updates reported in open web coverage that the actors page
  carries, newest first. They are not a mirror of the live news page, which
  aggregates other publishers by machine and already links each item to
  whoever wrote it. Both are prerendered and send `public, max-age=3600,
  stale-while-revalidate=86400`. Each item keeps the framing it has on its
  page: reported updates name their publisher and say they enter no count,
  matrix or map; milestones say they are part of the tracking.
- Autodiscovery is currently at the HTTP level only - `next.config.ts` sends
  a `Link: </feed.xml>; rel="alternate"` header on the English pages and the
  `/ar/feed.xml` equivalent on the Arabic ones. The in-page
  `<link rel="alternate" type="application/atom+xml">` still wants adding to
  the two root layouts, which is what browser and reader autodiscovery
  mostly looks at.
- `src/app/manifest.ts` makes the site installable (`/manifest.webmanifest`,
  linked automatically into both language halves). There is deliberately no
  service worker: the point of these pages is that the figures on screen are
  the current ones, and a cached copy of an analytical page is worse than a
  page that plainly fails to load.

## Manual verification checklist (run before each release)

1. Every chart's screen-reader description matches its rendered figures
   (on-page data-table and export controls are intentionally disabled).
2. External links in the news feed open the original publishers.
3. Year and actor filters on /compare, /actors, /map, /explorer - including
   "Reset all filters" and shareable URLs.
4. Map layers: year toggle, layer/stage/status filters, popups and
   full-screen. If WebGL is unavailable or blocked, the page must
   automatically show the SVG vector map (same figures, keyboard-selectable
   governorates) within ~7 seconds - a blank map box is a bug.
   On the SVG map also verify: district labels appearing from ×1.8 zoom,
   pin/marker labels from ×2.2, the scale bar staying readable at every zoom
   level, the town search zooming to its result, and diamond markers opening
   the episode panel. The occupation hatch must cover only the Blue Line
   border-strip towns, with dashed outlines on the four containing districts,
   and the mini-map inset must appear when zoomed and recentre on click.

   Note what is NOT here any more. `efac8d0` stripped the view switcher, the
   zoom buttons, the National reset and the five region shortcuts, so there
   is nothing to click for any of them. The map still has four views -
   `entries`, `change`, `survey`, `damage` (`MapView` in
   `SvgLebanonMap.tsx`) - and three of them can now only be reached by
   editing `?view=` in the URL, which means their legends, ViewRanking panels
   and caveat boxes are reader-facing surface with no route to it. That is a
   pending decision, not a checklist step: either give them a control back or
   remove them. Until it is settled, exercise them by URL so a regression in
   an unreachable view is still caught.
5. Mobile layout at 375px: nav menu, filter sheets, stacked cards, map
   panels. Check specifically that no page scrolls horizontally, that the
   actor matrix and evidence table pan inside their own scroll containers
   rather than widening the page, and that the map fills the column width
   (its container is capped at `max-w-[54vh]` so the 620x860 drawing never
   exceeds about three quarters of the viewport height).
6. Keyboard navigation: skip link, tab order, focus visibility, Escape
   closing drawers, chart screen-reader descriptions present.
7. Colour contrast spot-checks (amber-on-white elements always carry text
   labels; nothing encodes meaning by colour alone).
8. News-provider failure states (see docs/news-providers.md).
9. API-key security: view page source and the network tab - no key appears;
   /api/news responses contain no provider URLs with credentials.
10. Shareable URLs: filter state on /explorer, /news, /compare and /map
    survives a reload and a paste into another browser.
11. Loading and empty states: news skeletons, empty filter results,
    explorer with zero matches.
12. The planned / under way / completed distinction: statuses in the
    explorer drawer, funnel "Not verified" rows, and the timeline legend.
13. Arabic parity: /ar carries the same modules at the same depth - the
    interactive map, the explorer with Arabic entry text, the news
    filters, the actors narrative - and every figure matches its English
    twin. Arabic renders in IBM Plex Sans Arabic, not an OS fallback.

## After the first deploy (once per host)

These check the things a visual pass cannot see. Run them against the
deployed host, not localhost.

1. `curl -s https://HOST/robots.txt` and `.../sitemap.xml` contain no
   `localhost` - the single output that silently depends on
   `NEXT_PUBLIC_SITE_URL` being set in the host dashboard.
2. `curl -sI https://HOST/geo/lebanon-adm3.geojson` shows
   `content-encoding: gzip` and the day-long `cache-control` above; the same
   on a `/cells/` and an `/entries/` file for the five-minute one.
3. `curl -sI https://HOST/` shows the six response headers listed earlier and
   no `x-powered-by`.
4. Open the map with the browser console visible and confirm no
   `Content-Security-Policy` violation appears - a blocked worker or blob
   image degrades the GL map to the SVG fallback silently rather than
   erroring, so the console is the only place it shows.
5. `curl -s https://HOST/feed.xml` and `.../ar/feed.xml` parse, and the item
   links resolve to real pages.
6. Run `next start` under something that retains stdout and stderr (systemd
   journal, pm2 with rotation, or the platform's log viewer). Both error
   pages print the failure digest to the reader, and matching a reported
   digest back to a stack trace only works if the process log was kept.
