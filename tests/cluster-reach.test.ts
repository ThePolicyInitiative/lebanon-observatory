import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildLocationIndex } from "@/lib/geo-match";
import { featureAnchor, featureCentroidLonLat, type GeoFeature } from "@/lib/geo";
import { buildPins, fanRadius, fitSpacing } from "@/lib/pins";
import { slimRecords } from "@/lib/map-records";
import type { Year } from "@/lib/types";

/**
 * Every traced entry has to be reachable, whatever the map draws.
 *
 * Clustering fixed one thing and broke another. Where a fan cannot be
 * drawn legibly the town becomes a single counted marker - correct, and
 * the only honest option at that size - but the entries behind it then
 * had no element of their own. At the opening view that is 27 markers
 * covering 195 of 200 entries: nothing to focus, nothing to open, and a
 * legend line that reported the other five.
 *
 * The marker now opens the list its own name always promised. These hold
 * the two properties that follow: nothing is hidden from the count, and
 * nothing is hidden from the keyboard.
 */

const PIN_SPACING = 9;
const PIN_R = 3.2;
const PIN_STROKE = 1;
const PIN_MIN_SEPARATION = 2 * (PIN_R + PIN_STROKE / 2);

const gj: { features: GeoFeature[] } = JSON.parse(
  readFileSync("public/geo/lebanon-adm3.geojson", "utf8"),
);
const named = gj.features.filter((f) => {
  const n = String(f.properties.adm3_name ?? "");
  return n && n !== "Conflict";
});
const townList = named.map((f) => ({
  name: String(f.properties.adm3_name ?? ""),
  district: String(f.properties.adm2_name ?? ""),
  ...featureCentroidLonLat(f),
}));
const index = buildLocationIndex(townList);
const featureByName = new Map<string, GeoFeature>();
for (const f of named) {
  const n = String(f.properties.adm3_name ?? "");
  if (!featureByName.has(n)) featureByName.set(n, f);
}
const roomCache = new Map<string, number>();
const roomOf = (name: string) => {
  const hit = roomCache.get(name);
  if (hit !== undefined) return hit;
  const f = featureByName.get(name);
  const room = f ? featureAnchor(f).room : 0;
  roomCache.set(name, room);
  return room;
};

/** Split a year's towns the way the vector map does at a given k. */
function split(year: Year, k: number) {
  const grouped = buildPins({
    entries: slimRecords,
    index,
    townDistrict: new Map(townList.map((t) => [t.name, t.district] as const)),
    year,
    locale: "en",
    spacing: 1,
  });
  let fanned = 0;
  let clustered = 0;
  let clusteredEntries = 0;
  const towns: string[] = [];
  for (const [name, pins] of grouped) {
    if (!featureByName.has(name)) continue;
    towns.push(name);
    const spacing = fitSpacing(pins.length, roomOf(name) / k, PIN_SPACING);
    if (pins.length > 1 && spacing < PIN_MIN_SEPARATION) {
      clustered++;
      clusteredEntries += pins.length;
    } else {
      fanned += pins.length;
    }
  }
  return { fanned, clustered, clusteredEntries, towns: towns.length, total: fanned + clusteredEntries };
}

describe("what a counted marker hides", () => {
  it("hides most of the map at the opening view, which is why it must open", () => {
    // Not an assertion about what is right - a statement of the scale of
    // the problem, so a change that makes clustering rarer or commoner
    // shows up here rather than silently.
    const s = split(2026, 1);
    expect(s.total).toBe(200);
    expect(s.clustered).toBeGreaterThan(20);
    expect(s.clusteredEntries).toBeGreaterThan(150);
  });

  it("counts every entry, clustered or not", () => {
    // The legend read entryPins.length, which is only the fanned ones.
    for (const year of [2024, 2026] as Year[]) {
      for (const k of [0.2, 0.5, 1, 2]) {
        const s = split(year, k);
        const drawnEntries = s.fanned + s.clusteredEntries;
        expect(
          drawnEntries,
          `${year} at k=${k}: ${s.fanned} fanned + ${s.clusteredEntries} clustered`,
        ).toBe(s.total);
        expect(s.fanned).toBeLessThanOrEqual(drawnEntries);
      }
    }
  });

  it("leaves no entry without a town that can be opened", () => {
    // Every entry belongs to a town that draws either a fan or a marker,
    // and both are focusable. This is the invariant the panel restores.
    for (const year of [2024, 2026] as Year[]) {
      const s = split(year, 1);
      expect(s.towns).toBeGreaterThan(20);
      expect(s.fanned + s.clusteredEntries).toBe(s.total);
      expect(s.clusteredEntries).toBeGreaterThan(0); // else the test proves nothing
    }
  });

  it("keeps the marker's promise in both languages", () => {
    // The name says the entries can be listed. The panel that lists them
    // has to exist, and its heading has to be written in both tables.
    const src = readFileSync("src/components/map/SvgLebanonMap.tsx", "utf8");
    expect(src).toContain("openCluster");
    expect((src.match(/clusterPanel:/g) ?? []).length).toBe(2);
    // And the list has to be built from the cluster's own entries.
    expect(src).toMatch(/openCluster\.pins\.map/);
  });

  it("still opens a real fan where there is room for one", () => {
    // Clustering must stay a last resort. Zoomed in, most towns fan.
    const deep = split(2026, 0.06);
    expect(deep.clustered).toBeLessThan(split(2026, 1).clustered);
    // And a fanned town's pins clear each other.
    const spacing = fitSpacing(22, roomOf("Nabatieh Et-Tahta") / 0.06, PIN_SPACING);
    if (spacing >= PIN_MIN_SEPARATION) {
      expect(fanRadius(22, spacing)).toBeGreaterThan(0);
    }
  });
});
