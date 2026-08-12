# Data import and update guide

## What the analytical dataset is

The site's analytical layer is a set of validated JSON files in `src/data`:

| File | Contents | Grain |
| --- | --- | --- |
| `stage-counts.json` | Documented actor-stage presence, 4 layers × 12 stages × 2 years | analytical (actor × stage × year) |
| `role-records.json` | Evidence log: 771 records | fine (actor × function column × year) |
| `actors.json` | 235 actor entries with subtype, de jure/de facto notes | actor × year |
| `catalog-sources.json` | Mention-level source catalogue (110 entries with URLs) | mention |
| `locations.json` | Location mentions by regional grouping, layer and year | region × layer × year |
| `kpis.json` | Key indicators with definition, period, scope, type, sources | indicator |
| `finance.json` | Financing funnel, LEAP components, procurement packages, adjacent flows | metric |
| `timeline.json` | Milestone chain Dec 2024 – Jul 2026 | event |
| `report-sources.json` | Source register (61 entries) | source |
| `gazetteer.json` | Named localities with approximate coordinates | locality |

Two grains coexist deliberately: charts read the analytical stage counts;
the evidence explorer shows the finer evidence log. The mapping from the
31 source function columns to the 12 value-chain stages is fixed and
documented in this file.

## How the evidence base was generated

The `role-records`, `actors` and `catalog-sources` files were generated from
the project's source workbooks (an actor × function evidence matrix for each
year plus two mention-level source catalogues) by a transformation script
that:

1. mapped workbook actor groups to the four display layers (with a
   name-based override that routes municipal actors to the municipal layer);
2. mapped each function column to its value-chain stage via the published
   crosswalk;
3. split cell text into mandate-flavoured and action-flavoured sentences
   using the workbook's own boilerplate phrases;
4. assigned a conservative implementation status (`formal_mandate`,
   `procurement`, `underway` = documented activity, else `not_verified`);
   **no record is ever assigned `completed`**;
5. parsed named locations and mapped them to regional groupings;
6. attached mention-level sources by token matching between actor names and
   catalogue mentions (unmatched records fall back to the compiled evidence
   base citation).

Internal workbook names are not displayed anywhere on the site.

## Updating the dataset

1. Edit the JSON directly (small corrections) or regenerate from an updated
   workbook using the same rules above.
2. Validate: `npm test`. The suite asserts the 2024 total (343), the seeded
   2026 total (360 - the difference against the report-level 363 is
   deliberately flagged, not reconciled), the specified per-layer deltas,
   municipal zeros, funnel arithmetic, schema validity of every record, and
   that source IDs resolve.
3. If new figures change any hard-coded editorial claim (e.g. "1.65%
   disbursed"), update the KPI/finance JSON *and* the page copy that cites
   it.

## Adding a new evidence year

- Extend the `Year` union in `src/lib/types.ts` and the schemas.
- Add the year's counts to `stage-counts.json` and mentions to
  `locations.json`.
- Comparability rules apply: never merge damage estimates across years with
  different scope or method; label every cross-year comparison.
