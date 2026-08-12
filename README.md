# Lebanon Reconstruction Observatory

**From Emergency Substitution to Programmed Reconstruction: how Lebanon's
post-war reconstruction system changed between 2024 and 2026.**

A policy-analysis and data-journalism website tracking who held authority, who
controlled finance and procurement, who delivered, and who absorbed the cost of
delay — built on a verified actor-role evidence base with a strict separation
between analytical data and live news.

Evidence cut-off: **31 July 2026**.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS 4
- ECharts (SVG renderer) for analytical charts
- MapLibre GL JS for the interactive map (geoBoundaries LBN ADM1, public domain)
- Zod for runtime validation
- Vitest for automated tests
- Analytical data ships as validated JSON in `src/data` (no database required;
  `DATABASE_URL` is reserved for a future PostgreSQL/Supabase migration)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in optional keys
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Tests and data bundle:

```bash
npm test                     # data-integrity + news-pipeline + API-contract tests
```

## Site structure

| Route | Purpose |
| --- | --- |
| `/` | Hero, typed KPI cards, seven-part narrative, institutional-shift diagram, change heatmap, financing funnel, live-news teaser |
| `/compare` | 2024 \| side-by-side \| 2026 control with a "show change" switch across eleven dimensions, year summaries, the three-streams framework, composition charts and the shelter-and-return cycle |
| `/actors` | Four actor-layer tabs: profiles, gains/losses, mandate vs action, chain roles, geography, named actors, municipal power-gap dumbbell, diverging change charts |
| `/damage` | The damage evidence kept honest: four non-additive 2024 building-count tracks, sector damage/losses/needs chart, the two bounded 2026 assessment zones with verification badges |
| `/map` | MapLibre map of documented role concentration by governorate zone with locality points, filters, legend, full-screen, table alternative; automatic SVG vector-map fallback when WebGL is unavailable; non-mappable groupings shown honestly as panels |
| `/finance` | Six-concept separation, nested financing funnel with magnified disbursement bar, LEAP components, procurement package statuses, adjacent flows, the compensation-tracks module, milestone timeline, speed-of-functions analysis |
| `/news` | Live aggregation (GDELT + ReliefWeb + optional NewsAPI) with tabs, filters, dedup, provider status, coverage analytics |
| `/explorer` | Searchable evidence log (771 records) with filter sidebar and detail drawer |
| `/api/news` | Server-side news aggregation endpoint (see `docs/news-providers.md`) |

## Analytical discipline (enforced in code and tests)

- Counts measure **documented presence**, never performance; the caution is
  attached to every count-based visual.
- Committed finance ≠ disbursed finance ≠ completed output; the funnel keeps
  each step separate and tests assert the arithmetic.
- 2024 and 2026 damage estimates are never merged into a cumulative or
  national scale; no invented damage-intensity layer exists on the map.
- Missing evidence renders as **"Not verified"** — never as zero, never as done.
- No record in the evidence log carries `completed` status, because no
  completed reconstruction output was publicly verified by the cut-off
  (asserted by a test).
- The live-news feed is aggregation, not analysis: it never modifies the
  verified dataset, links to original publishers, and shows no AI summaries.

## Documentation

- `docs/data-import.md` — how the evidence base was built and how to update it
- `docs/news-providers.md` — provider setup, caching, quotas, failure modes
- `docs/deployment.md` — deployment and configuration

## Accessibility

WCAG 2.2 AA targets: full keyboard navigation, visible focus states, skip
link, semantic headings, `aria` labelling on charts and map, a data-table
alternative for every chart, reduced-motion support, ≥44px touch targets, and
no meaning encoded by colour alone (every heatmap cell and diverging bar
prints its value; year identity is carried by labels and marker shapes as
well as colour). Manual checks are listed in `docs/deployment.md`.

## Updating with new evidence

1. Add or amend records in `src/data/*.json` (schemas in `src/lib/schemas.ts`).
2. `npm test` — the integrity suite recomputes totals and validates schemas.
3. `npm run build`.

The analytical dataset and the live-news feed are deliberately separate;
news reporting is never a substitute for verified evidence.
