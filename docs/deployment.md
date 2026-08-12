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

Notes for serverless hosts: the news cache and rate limiter are in-memory
per instance. That is acceptable behaviour (each instance keeps its own
cache and the client tolerates cold caches), but if you scale horizontally
and want a shared cache, put a CDN cache in front of `/api/news` - the
route already sends `s-maxage=300, stale-while-revalidate=1500` - or swap
the cache module for Redis.

## Performance

- **Data is split by consumer.** `src/lib/data.ts` is the server-side
  source of truth (full evidence base, source catalogues).
  `src/lib/data-client.ts` carries only what browser components need -
  counts, wording, small datasets - so importing one constant never ships
  the whole corpus. `src/lib/map-records.ts` holds the map's own
  projection (355 kB versus 774 kB: identity and classification, no
  narrative text). Regenerate it whenever `role-records.json` changes.
- **MapLibre loads on demand.** The vector map is the default and is part
  of the server HTML; the ~940 kB GL library is imported inside the
  effect that runs only when a reader opts into pan-and-zoom, and its CSS
  is imported by the map route rather than the root layout.
- Charts render with ECharts' SVG renderer; the change heatmap and the
  actor register/matrix are dynamically imported so they do not block
  first paint.
- Fonts are self-hosted through `next/font` (Inter + Source Serif 4).
- All analytical pages are statically prerendered; only `/api/news` is
  dynamic.
- Fixed-height chart and skeleton containers avoid cumulative layout shift.

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
   On the SVG map also verify: wheel/drag and button zoom, the four region
   quick views, district labels appearing from ×1.8 zoom, pin/marker labels
   from ×2.2, the scale bar staying readable at every zoom level, the town
   search zooming to its result, and diamond markers opening the episode
   panel. Then switch the three map views: "Located records" (three-tier
   shading, amber named towns), "Change 2024 → 2026" (green/rust diverging
   by district, both years regardless of the year toggle), and "Damage
   assessment 2026" (worst-cadaster badges, Dahieh debris badge, the
   two-zone caveat box, pins and diamonds hidden). The occupation hatch must
   cover only the Blue Line border-strip towns, with dashed outlines on the
   four containing districts, and the mini-map inset must appear when
   zoomed and recentre on click.
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
10. The copy-shareable-link control on chart frames.
11. Loading and empty states: news skeletons, empty filter results,
    explorer with zero matches.
12. The planned / under way / completed distinction: statuses in the
    explorer drawer, funnel "Not verified" rows, and the timeline legend.
