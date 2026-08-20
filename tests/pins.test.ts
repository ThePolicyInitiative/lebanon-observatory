import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPins,
  clampToLand,
  fanOffset,
  fanRadius,
  layerColor,
  pinOutline,
} from "@/lib/pins";
import { featureCentroid, isOnLand, projectPoint, unprojectPoint, type GeoFeature } from "@/lib/geo";
import { buildLandIndex, isOnLandIndexed } from "@/lib/land";
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

const towns = gj.features.map((f) => {
  const c = featureCentroid(f as unknown as GeoFeature);
  return {
    name: String(f.properties.adm3_name ?? ""),
    district: String(f.properties.adm2_name ?? ""),
    cx: c.x,
    cy: c.y,
  };
});
const index = buildLocationIndex(towns.map((t) => ({ name: t.name, district: t.district })));
const townDistrict = new Map(towns.map((t) => [t.name, t.district] as const));

function pinsFor(year: 2024 | 2026) {
  return buildPins({
    entries: slimRecords,
    index,
    townDistrict,
    year,
    locale: "en",
    spacing: 7,
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

  /**
   * The two properties that decide whether a fan is readable, both
   * measurable without looking at it.
   */
  it("keeps a lane of ground between neighbouring pins", () => {
    // Mirrors SvgLebanonMap: spacing 7, radius 2.4, outline 0.9.
    const SPACING = 7;
    const OUTER = 2.4 + 0.9;
    for (const n of [2, 5, 13, 24, 40, 60]) {
      const pts = Array.from({ length: n }, (_, i) => fanOffset(i, SPACING));
      let nearest = Infinity;
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          nearest = Math.min(nearest, Math.hypot(pts[i].dx - pts[j].dx, pts[i].dy - pts[j].dy));
      expect(nearest, `${n} pins overlap`).toBeGreaterThan(OUTER * 2);
    }
  });

  it("outlines every layer clear of the map's ground", () => {
    // WCAG 1.4.11: graphical objects need 3:1 against what is behind them.
    const GROUND = "#e5eaf0";
    const lin = (c: number) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const lum = (hex: string) =>
      0.2126 * lin(parseInt(hex.slice(1, 3), 16)) +
      0.7152 * lin(parseInt(hex.slice(3, 5), 16)) +
      0.0722 * lin(parseInt(hex.slice(5, 7), 16));
    const contrast = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)];
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    for (const layer of ["official", "ngo_international", "municipal", "community"]) {
      const edge = pinOutline(layerColor(layer));
      expect(contrast(edge, GROUND), `${layer} outline is too faint`).toBeGreaterThanOrEqual(3);
    }
  });

  /**
   * The spiral is blind geometry, so around a coastal town it put entries
   * out in the Mediterranean - 17 of them across the two years, worst at
   * Sour and Choueifat. It also pushed border-town pins over the frontier.
   *
   * The test is against the town polygons the map actually draws, not the
   * nine-ring governorate outline: the coarse version passed two pins that
   * were sitting just off a fine stretch of coast.
   */
  it("never leaves a pin off Lebanese land", () => {
    const land = buildLandIndex(gj.features as unknown as GeoFeature[], 12, (lon, lat) => {
      const { x, y } = projectPoint(lon, lat);
      return [x, y];
    });
    const byName = new Map<string, (typeof towns)[number]>();
    for (const t of towns) if (!byName.has(t.name)) byName.set(t.name, t);
    const ashore = (x: number, y: number) => isOnLandIndexed(land, x, y);
    for (const year of [2024, 2026] as const)
      for (const [name, pins] of pinsFor(year)) {
        const t = byName.get(name);
        if (!t) continue;
        for (const pin of pins) {
          const m = clampToLand(t.cx, t.cy, pin.dx, pin.dy, ashore);
          expect(ashore(t.cx + m.dx, t.cy + m.dy), `${name} ${year}: pin off land`).toBe(true);
        }
      }
  });

  it("tests against the drawn boundary, which is finer than the outline", () => {
    // The governorate outline is nine rings; the town layer is 1,640.
    const land = buildLandIndex(gj.features as unknown as GeoFeature[], 12, (lon, lat) => {
      const { x, y } = projectPoint(lon, lat);
      return [x, y];
    });
    const byName = new Map<string, (typeof towns)[number]>();
    for (const t of towns) if (!byName.has(t.name)) byName.set(t.name, t);
    let coarseLetThrough = 0;
    for (const year of [2024, 2026] as const)
      for (const [name, pins] of pinsFor(year)) {
        const t = byName.get(name);
        if (!t) continue;
        for (const pin of pins) {
          const x = t.cx + pin.dx;
          const y = t.cy + pin.dy;
          const ll = unprojectPoint(x, y);
          if (isOnLand(ll.lon, ll.lat) && !isOnLandIndexed(land, x, y)) coarseLetThrough++;
        }
      }
    expect(coarseLetThrough).toBeGreaterThan(0);
  });
});
