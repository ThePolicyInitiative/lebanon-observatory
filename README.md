# Rebuild Lebanon Observatory

A local public-data web application for reviewing Lebanon reconstruction and recovery context.

## Run locally

Run the bundled application server:

```powershell
node server.js
```

Then open `http://127.0.0.1:4173`.

## What works

- Search, filter, sort, and compare a curated source-record library by 2024 and 2026 response period.
- Explore a source-linked actor and action registry that follows the selected response period.
- Export the currently visible records as server-generated CSV.
- Browse the 10 RDNA sectors and source-linked recovery programs.
- Browse the observatory's actor and action classifications, which keep assessment, financing, relief, and implementation records distinct.
- Switch qualitative map context and explore governorate notes.
- Open every listed primary publication from the site.
- Run an on-demand source check against each listed primary publication.
- Use the local API: `/api/health`, `/api/records`, `/api/sectors`, `/api/sources`, `/api/export.csv`, and `POST /api/refresh`.

## Data model

`data.js` is the maintainable local data layer. Each record keeps a publication date, source organization, headline measure, supporting detail, and direct primary-source link. `server.js` serves the site, exposes its data through local JSON endpoints, generates CSV exports, and runs source-availability / metadata checks on demand.

The site deliberately does not claim live implementation completion data, municipal damage registries, or real-time financial disbursement. Publishing governed project completion data would require an approved source list and a scheduled server-side ingestion process.
## Refresh source metadata

The site includes a small, dependency-free Python collector that checks selected primary institutional pages and writes title, description, publication metadata, HTTP status and check time to `data/source-snapshots.json`.

```powershell
python scripts/scrape_official_sources.py
```

This does not copy article bodies or treat page availability as implementation evidence. The generated snapshot is used only to show source-monitoring detail in the website.
