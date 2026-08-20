import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildPins, fanOffset, fanRadius } from "@/lib/pins";
import { buildLocationIndex, matchLocations } from "@/lib/geo-match";
import { slimRecords } from "@/lib/map-records";
import { LAYER_COLORS } from "@/lib/colors";

/**
 * The map draws one pin per traced entry. These guard the two properties
 * that makes worth having: nothing is silently merged away, and no two
 * pins land on the same point, which would put an entry out of reach.
 */

const gj = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "public", "geo", "lebanon-adm3.geojson"), "utf8"),
) as { features: { properties: Record<string, string> }[] };

const towns = gj.features.map((f) => ({
  name: String(f.properties.adm3_name ?? ""),
  district: String(f.properties.adm2_name ?? ""),
}));
const index = buildLocationIndex(towns);
const townDistrict = new Map(towns.map((t) => [t.name, t.district] as const));

function pinsFor(year: 2024 | 2026) {
  return buildPins({
    entries: slimRecords,
    index,
    townDistrict,
    year,
    locale: "en",
    spacing: 5.4,
  });
}

describe("map pins", () => {
  it("gives every entry-town pair its own pin", () => {
    for (const year of [2024, 2026] as const) {
      let expected = 0;
      for (const r of slimRecords) {
        if (r.year !== year) continue;
        for (const t of matchLocations(index, r.locationNames ?? []).towns)
          if (t !== "Conflict") expected++;
      }
      const pins = [...pinsFor(year).values()].flat();
      const entryPins = pins.filter((p) => p.kind === "entry");
      expect(entryPins).toHaveLength(expected);
      // Nothing collapsed: every pin id is distinct.
      expect(new Set(entryPins.map((p) => p.id)).size).toBe(entryPins.length);
    }
  });

  it("never stacks two pins on one point", () => {
    for (const year of [2024, 2026] as const)
      for (const [town, pins] of pinsFor(year)) {
        const seen = new Set(pins.map((p) => `${p.dx.toFixed(4)},${p.dy.toFixed(4)}`));
        expect(seen.size, `${town} in ${year} has overlapping pins`).toBe(pins.length);
      }
  });

  it("colours a pin by its own actor layer, not its town's busiest", () => {
    const pins = [...pinsFor(2026).values()].flat().filter((p) => p.kind === "entry");
    for (const p of pins.slice(0, 200))
      expect(p.color).toBe((LAYER_COLORS as Record<string, string>)[p.layer]);
    // A town carrying more than one layer proves the pins are not uniform.
    const mixed = [...pinsFor(2026).values()].find(
      (list) => new Set(list.map((p) => p.color)).size > 1,
    );
    expect(mixed, "no town mixes layers - colours cannot be per-entry").toBeDefined();
  });

  it("carries traced episodes as their own pins too", () => {
    const pins = [...pinsFor(2024).values()].flat();
    expect(pins.some((p) => p.kind === "episode")).toBe(true);
  });

  it("fans deterministically and outward", () => {
    expect(fanOffset(0, 5)).toEqual({ dx: 0, dy: 0 });
    const a = fanOffset(7, 5);
    const b = fanOffset(7, 5);
    expect(a).toEqual(b);
    expect(Math.hypot(...Object.values(fanOffset(20, 5)) as [number, number])).toBeGreaterThan(
      Math.hypot(...Object.values(fanOffset(5, 5)) as [number, number]),
    );
    expect(fanRadius(1, 5)).toBe(0);
    expect(fanRadius(41, 5)).toBeCloseTo(5 * Math.sqrt(40), 5);
  });
});
