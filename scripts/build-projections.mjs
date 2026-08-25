/**
 * Rebuilds every derived projection of the tracking from
 * src/data/role-records.json:
 *
 *   src/data/role-records-slim.json  the map and explorer filter on this
 *   public/cells/{layer}-{stageNo}.json   the change heatmap's cell drawer
 *   public/entries/{id}.json              the explorer's detail panel
 *
 * tests/projections.test.ts fails whenever the log changes and these do
 * not, so run this after any edit to role-records.json:
 *
 *   npm run projections
 *
 * The projections exist so the browser never downloads the whole log to
 * render one drawer. Keep the field lists here and in the test identical.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "src", "data");
const publicDir = join(root, "public");

const LAYERS = ["official", "ngo_international", "municipal", "community"];
const flatten = (v) => (v ? v.replace(/\n+/g, " ").trim() : v);

const log = JSON.parse(readFileSync(join(dataDir, "role-records.json"), "utf8"));

/* ------------------------------------------------------- slim projection */
const slim = log.map((r) => ({
  id: r.id,
  year: r.year,
  actorName: r.actorName,
  actorLayer: r.actorLayer,
  actorSubtype: r.actorSubtype,
  stage: r.stage,
  stageNo: r.stageNo,
  functionColumn: r.functionColumn,
  locationNames: r.locationNames,
  locationNamesAr: r.locationNamesAr ?? [],
  regions: r.regions,
  implementationStatus: r.implementationStatus,
  comparability: r.comparability,
  action: (r.tracedAction ?? flatten(r.summary)) || "",
  actionAr: r.tracedActionAr ?? flatten(r.summaryAr) ?? undefined,
}));
const slimPath = join(dataDir, "role-records-slim.json");
writeFileSync(slimPath, JSON.stringify(slim, null, 2) + "\n");

/* -------------------------------------------------------- heatmap cells */
const cellDir = join(publicDir, "cells");
mkdirSync(cellDir, { recursive: true });
let cellFiles = 0;
for (const layer of LAYERS) {
  for (let stageNo = 1; stageNo <= 12; stageNo++) {
    const rows = log
      .filter((r) => r.actorLayer === layer && r.stageNo === stageNo)
      .map((r) => ({
        id: r.id,
        year: r.year,
        actorName: r.actorName,
        functionColumn: r.functionColumn,
        implementationStatus: r.implementationStatus,
        locationNames: r.locationNames,
        locationNamesAr: r.locationNamesAr ?? [],
        summary: r.summary,
        summaryAr: r.summaryAr ?? null,
      }));
    writeFileSync(join(cellDir, `${layer}-${stageNo}.json`), JSON.stringify(rows));
    cellFiles++;
  }
}

/* ------------------------------------------------------ per-entry detail */
const entryDir = join(publicDir, "entries");
mkdirSync(entryDir, { recursive: true });
// Cleared first, so an entry deleted from the log stops being served.
for (const f of readdirSync(entryDir)) unlinkSync(join(entryDir, f));
for (const r of log) {
  writeFileSync(join(entryDir, `${r.id}.json`), JSON.stringify(r));
}

const bytes = (dir) =>
  readdirSync(dir).reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);

console.log(`role-records-slim.json  ${log.length} entries, ${statSync(slimPath).size} bytes`);
console.log(`public/cells            ${cellFiles} files, ${bytes(cellDir)} bytes`);
console.log(`public/entries          ${log.length} files, ${bytes(entryDir)} bytes`);
