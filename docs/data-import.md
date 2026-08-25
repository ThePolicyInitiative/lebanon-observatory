# Data import and update guide

## What the analytical core is

`src/data` holds 26 validated JSON files. Ten of them carry the analytical
core - the figures the charts, the matrices and the explorer are built from:

| File | Contents | Grain |
| --- | --- | --- |
| `stage-counts.json` | Traced actor-stage presence, 4 layers × 12 stages × 2 years | analytical (actor × stage × year) |
| `role-records.json` | Entry log: 771 entries | fine (actor × function column × year) |
| `actors.json` | 235 actor entries with subtype, de jure/de facto notes | actor × year |
| `locations.json` | Location mentions by regional grouping, layer and year | region × layer × year |
| `kpis.json` | Key indicators with definition, period, scope, type, citations | indicator |
| `finance.json` | Financing funnel, LEAP components, procurement packages, adjacent flows | metric |
| `timeline.json` | Milestone chain Dec 2024 – Jul 2026 | event |
| `report-sources.json` | Citation register (62 entries) | citation |
| `gazetteer.json` | Named localities with approximate coordinates | locality |
| `catalog-sources.json` | Mention-level catalogue (110 entries with URLs) | mention |

`catalog-sources.json` is provenance rather than analysis: no app code
imports it, and its only consumer is the URL-integrity assertion in
`tests/revalidation.test.ts`. The `cat…` ids it defines do appear as opaque
chips in the explorer detail panel, but nothing resolves them against the
catalogue.

The remaining sixteen files are reader-facing page content added since this
table was first written - `destruction.json`, `district-damage.json`,
`map-events.json`, `web-updates.json`, `compensation.json`,
`human-toll.json`, `leap-results.json`, `litani.json`, `sectors.json`,
`service-impact.json`, `service-operators.json`, `slwe-posts.json`,
`role-records-slim.json`, `actor-names-ar.json`, `lebanon-adm1.json` and
`lebanon-adm2.json`. They follow the same rule as the core: edit the JSON,
then `npm test`.

Two grains coexist deliberately: charts read the analytical stage counts;
the explorer shows the finer entry log. The mapping from the 31 function
columns in the original workbooks to the 12 value-chain stages is fixed, but
it is not written down anywhere in this repository - it survives only as the
`valueChainStage` already assigned on each entry in `role-records.json`.

## How the entry base was generated

The `role-records`, `actors` and `catalog-sources` files were generated once,
outside this repository, from the project's workbooks (an actor × function
matrix for each year plus two mention-level catalogues), by a transformation
script that:

1. mapped workbook actor groups to the four display layers (with a
   name-based override that routes municipal actors to the municipal layer);
2. mapped each function column to its value-chain stage via the crosswalk;
3. split cell text into mandate-flavoured and action-flavoured sentences
   using the workbook's own boilerplate phrases;
4. assigned a conservative implementation status (`formal_mandate`,
   `procurement`, `underway` = traced activity, else `not_verified`);
   **no entry is ever assigned `completed`**;
5. parsed named locations and mapped them to regional groupings;
6. attached mention-level citations by token matching between actor names and
   catalogue mentions (unmatched entries fall back to the compiled base
   citation).

**That script is not in this repository, and neither are the workbooks it
read.** There is no `scripts/` directory and `package.json` carries only
`dev`, `build`, `start`, `lint` and `test`. The rules above are kept as a
description of how the numbers came to be, not as a path you can re-run: the
JSON in `src/data` is the source of truth now, and the test suite is what
holds it honest. Internal workbook names are not displayed anywhere on the
site.

## Updating the data

1. Edit the JSON directly. There is no regeneration path from this
   repository (see above); reproducing one would need the original workbooks
   from the project owner.
2. Validate: `npm test`. The suite asserts the 2024 total (343), the seeded
   2026 total (360 - the difference against the report-level 363 is
   deliberately flagged, not reconciled), the specified per-layer deltas,
   municipal zeros, funnel arithmetic, schema validity of every entry, and
   that citation IDs resolve. It also keeps the runtime projections under
   `public/` in step with `role-records.json`, and keeps banned reader-facing
   wording out of both the components and the data.
3. If new figures change any hard-coded editorial claim (e.g. "1.65%
   disbursed"), update the KPI/finance JSON *and* the page copy that cites
   it.

## Adding a new year

- Extend the `Year` union in `src/lib/types.ts` and the schemas.
- Add the year's counts to `stage-counts.json` and mentions to
  `locations.json`.
- Comparability rules apply: never merge damage estimates across years with
  different scope or method; label every cross-year comparison.
