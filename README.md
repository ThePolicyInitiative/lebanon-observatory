# Lebanon Reconstruction Observatory

**From Emergency Substitution to Programmed Reconstruction: how Lebanon's
post-war reconstruction system changed between 2024 and 2026.**

A bilingual (English / Arabic) policy-analysis site tracking who is rebuilding
Lebanon: who held authority, who controlled finance and procurement, who
delivered, and who absorbed the cost of delay. The site mirrors the structure
of its underlying reconstruction report - aim, importance, methodology,
findings - and keeps a strict separation between the confirmed analysis and
the live reported layer.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS 4
- ECharts (SVG renderer) for analytical charts
- MapLibre GL JS for the pan-and-zoom map, with an SVG fallback map
- Zod for runtime validation
- Vitest + Playwright for the test suites
- The analytical data ships as validated JSON in `src/data` (no database)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in optional keys
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Tests:

```bash
npm test                     # vitest: data integrity, parity, vocabulary, pipeline
npm run test:e2e             # playwright: rendered pages, both languages
npm run lint
```

## Site structure

Every route is mirrored at `/ar/<path>` in Arabic at the same depth.

| Route | Purpose |
| --- | --- |
| `/` | The aim, why it matters, and the five findings in brief |
| `/actors` | The four actor groups: definitions, composition, register and treemap |
| `/actions` | The four action categories, stage visuals, the change heatmap, and the map of where the actions happened |
| `/map` | The traced entries on the country: towns shaded by entry count, with group filters |
| `/findings` | The five findings in full, including the money trail and the damage picture |
| `/methodology` | The eight steps of the method |
| `/reported` | The live layer: what open web coverage reports, plus the long-form archive |
| `/entries` | The full register of traced entries |
| `/search` | Search across pages, places, groups and stages |

## Analytical discipline (enforced by the test suite)

- Counts measure **traced presence**, never performance.
- Committed finance ≠ disbursed finance ≠ completed output; the funnel keeps
  each step separate and tests assert the arithmetic.
- 2024 and 2026 damage estimates are never merged into a cumulative scale.
- What the published material cannot support renders **"Not verified"** -
  never as zero, never as done.
- No traced entry carries `completed` status (asserted by a test).
- The reported layer is kept strictly separate from the confirmed analysis:
  nothing in it enters any count, matrix or map, and every row names its
  publisher and carries a caution.

## Keeping the site current (automation)

Two scheduled GitHub Actions keep the data moving; both gate every change
behind the full test suite and push only what survives it. See
`docs/automation.md` for the full design.

- **Figures** (`.github/workflows/auto-update.yml`, daily): re-reads the
  World Bank's machine-readable LEAP reporting, checks the arithmetic the
  report supplies about itself, and updates the finance figures.
- **Open web** (`.github/workflows/news-sweep.yml`, twice daily): sweeps
  free news feeds in three languages, opens each lead, and - when the
  `ANTHROPIC_API_KEY` repository secret is set - has a Claude model draft
  the bilingual reported-layer rows, which are re-checked mechanically and
  then by the whole suite. Without the secret, leads queue in
  `scripts/watch/news-review.json` for a human read. The confirmed analysis
  is never touched by either workflow.

Run the same pipelines locally:

```bash
npm run auto-update -- --dry-run
python scripts/web-sweep.py --days 7
node scripts/news-ingest.mjs --dry-run
```

## Publishing

1. **Create a GitHub repository** and push this project to it (default
   branch `main`). If you received the project as an archive, extract it,
   then `git init`, commit, and push.
2. **Deploy on a Node host** - Vercel and Netlify both auto-detect Next.js:
   import the repository, set `NEXT_PUBLIC_SITE_URL` to the deployed address
   in the host's dashboard, and deploy. Every later push to `main` deploys
   itself. Full options, headers and the post-deploy checklist:
   `docs/deployment.md`.
3. **Enable the two workflows** under the repository's Actions tab (GitHub
   asks once for scheduled workflows on a new repository).
4. Optional: add `ANTHROPIC_API_KEY` under Settings → Secrets and variables
   → Actions to turn on the writing step of the open-web sweep.

## Documentation

- `docs/automation.md` - the two update pipelines and their safety argument
- `docs/data-import.md` - how the analytical base was built
- `docs/news-providers.md` - live news providers, caching, failure modes
- `docs/deployment.md` - deployment, headers, caching, verification checklists

## Accessibility

WCAG 2.2 AA targets: full keyboard navigation, visible focus states, skip
link, semantic headings, `aria` labelling on charts and map, reduced-motion
support, and no meaning encoded by colour alone. Manual checks are listed in
`docs/deployment.md`.
