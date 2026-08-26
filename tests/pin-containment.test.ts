import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildLocationIndex } from "@/lib/geo-match";
import {
  featureAnchor,
  featureAnchorLonLat,
  featureCentroidLonLat,
  type GeoFeature,
} from "@/lib/geo";
import { buildPins, fanRadius, fanSpacing, fitSpacing } from "@/lib/pins";

/** The vector map's own fan spacing, in screen pixels. */
const PIN_SPACING_SVG = 9;
import { slimRecords } from "@/lib/map-records";
import type { Year } from "@/lib/types";

/**
 * A pin must sit inside the town it names.
 *
 * This is the whole promise the map makes. Entries share one point per
 * town, so they are fanned around it to be individually reachable, and the
 * caveat under the map says the offset means "in this town" and never "at
 * this address". That caveat is only honest while the fan stays inside the
 * town. It did not: the fan was a fixed distance with no relation to the
 * size of the place it was drawn on, and at the map's default view 43 of
 * 289 pins - one in seven - sat in a neighbouring town.
 *
 * Two changes fix it, and this pins both. Pins are anchored at the pole of
 * inaccessibility rather than the centroid, which is always inside the
 * shape and as far from its edges as the shape allows; and the fan is
 * sized by the room that anchor has, so it fills the town and stops.
 */

const gj: { features: GeoFeature[] } = JSON.parse(
  readFileSync("public/geo/lebanon-adm3.geojson", "utf8"),
);

const NAMED = gj.features.filter((f) => {
  const n = String(f.properties.adm3_name ?? "");
  return n && n !== "Conflict";
});

const townList = NAMED.map((f) => ({
  name: String(f.properties.adm3_name ?? ""),
  district: String(f.properties.adm2_name ?? ""),
  ...featureCentroidLonLat(f),
}));

const index = buildLocationIndex(townList);

const featureByName = new Map<string, GeoFeature>();
for (const f of NAMED) {
  const n = String(f.properties.adm3_name ?? "");
  if (!featureByName.has(n)) featureByName.set(n, f);
}

const anchorCache = new Map<string, ReturnType<typeof featureAnchorLonLat>>();
function anchorOf(name: string) {
  const hit = anchorCache.get(name);
  if (hit) return hit;
  const f = featureByName.get(name)!;
  const a = featureAnchorLonLat(f);
  anchorCache.set(name, a);
  return a;
}

/** Point-in-polygon against a feature's own rings, holes excluded. */
function contains(f: GeoFeature, x: number, y: number): boolean {
  const polys =
    f.geometry.type === "Polygon"
      ? [f.geometry.coordinates]
      : (f.geometry.coordinates as number[][][][]);
  const inRing = (ring: number[][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  for (const poly of polys) {
    if (!inRing(poly[0])) continue;
    let hole = false;
    for (let r = 1; r < poly.length; r++) if (inRing(poly[r])) hole = true;
    if (!hole) return true;
  }
  return false;
}

/** Lay the pins out exactly as the pan-and-zoom map does at one zoom. */
function placeAt(zoom: number, year: Year, locale: "en" | "ar" = "en") {
  const grouped = buildPins({
    entries: slimRecords,
    index,
    townDistrict: new Map(townList.map((t) => [t.name, t.district] as const)),
    year,
    locale,
    spacing: (name, count) => fitSpacing(count, anchorOf(name).room, fanSpacing(zoom)),
  });
  const out: { town: string; lon: number; lat: number }[] = [];
  for (const [name, pins] of grouped) {
    if (!featureByName.has(name)) continue;
    const a = anchorOf(name);
    const lonScale = 1 / Math.max(0.2, Math.cos((a.lat * Math.PI) / 180));
    for (const p of pins) {
      out.push({ town: name, lon: a.lon + p.dx * lonScale, lat: a.lat + p.dy });
    }
  }
  return out;
}

describe("pin containment", () => {
  it("anchors every referenced town inside its own polygon", () => {
    // The centroid cannot promise this; the pole of inaccessibility can.
    const referenced = new Set<string>();
    for (const year of [2024, 2026] as Year[])
      for (const [name] of placeAt(7.3, year).reduce(
        (m, p) => m.set(p.town, true),
        new Map<string, boolean>(),
      ))
        referenced.add(name);

    expect(referenced.size).toBeGreaterThan(20);
    for (const name of referenced) {
      const a = anchorOf(name);
      const f = featureByName.get(name)!;
      expect(contains(f, a.lon, a.lat), `${name}'s anchor is outside ${name}`).toBe(true);
      expect(a.room, `${name} has no room for a fan`).toBeGreaterThan(0);
    }
  });

  /**
   * The zooms that matter: 7.3 is where the map opens, 6 is the furthest
   * out it goes and 12 the furthest in. The bug lived at the opening view,
   * which is the one a reader is guaranteed to see.
   */
  it.each([6, 7.3, 9, 12])("keeps every pin inside its own town at zoom %s", (zoom) => {
    for (const year of [2024, 2026] as Year[]) {
      const pins = placeAt(zoom, year);
      expect(pins.length).toBeGreaterThan(80);
      const strays = pins.filter((p) => !contains(featureByName.get(p.town)!, p.lon, p.lat));
      expect(
        strays.map((s) => s.town),
        `${strays.length}/${pins.length} pins left their town in ${year}`,
      ).toEqual([]);
    }
  });

  it("would have failed before the fix", () => {
    // The old placement: centroid anchor, one spacing for every town. If a
    // change ever restores that, the guard above has to be the thing that
    // catches it - so prove the guard is capable of failing.
    const grouped = buildPins({
      entries: slimRecords,
      index,
      townDistrict: new Map(townList.map((t) => [t.name, t.district] as const)),
      year: 2026,
      locale: "en",
      spacing: fanSpacing(7.3),
    });
    let out = 0;
    let total = 0;
    for (const [name, pins] of grouped) {
      const f = featureByName.get(name);
      if (!f) continue;
      const c = featureCentroidLonLat(f);
      const lonScale = 1 / Math.max(0.2, Math.cos((c.lat * Math.PI) / 180));
      for (const p of pins) {
        total++;
        if (!contains(f, c.lon + p.dx * lonScale, c.lat + p.dy)) out++;
      }
    }
    expect(total).toBeGreaterThan(80);
    expect(out, "the old placement should strand pins outside their towns").toBeGreaterThan(10);
  });

  /**
   * The vector map is the one served by default, so it carries the same
   * promise. It works in projected units and scales its fan by k, the map
   * units per rendered pixel, which changes as the reader zooms - so the
   * bound is checked algebraically rather than at one arbitrary k: the
   * fitted reach is s x sqrt(n-1) <= (room/k) x 0.85 screen pixels, which
   * is room x 0.85 map units once multiplied back by k. That holds for
   * every k, so containment cannot depend on the zoom.
   */
  it("bounds the vector map's fan by the town's room at any zoom", () => {
    const projected = NAMED.map((f) => ({
      name: String(f.properties.adm3_name ?? ""),
      a: featureAnchor(f),
    })).filter((t) => t.a.room > 0);

    const counts = placeAt(7.3, 2026).reduce(
      (m, p) => m.set(p.town, (m.get(p.town) ?? 0) + 1),
      new Map<string, number>(),
    );

    let checked = 0;
    for (const [name, n] of counts) {
      const t = projected.find((p) => p.name === name);
      if (!t) continue;
      checked++;
      for (const k of [0.2, 0.5, 1, 2, 5]) {
        const s = fitSpacing(n, t.a.room / k, PIN_SPACING_SVG);
        const reachInMapUnits = fanRadius(n, s) * k;
        expect(
          reachInMapUnits,
          `${name} reaches ${reachInMapUnits.toFixed(2)} of ${t.a.room.toFixed(2)} at k=${k}`,
        ).toBeLessThanOrEqual(t.a.room);
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it("gives a fan that fills the town rather than a token dot", () => {
    // Containment is trivially satisfiable by collapsing every fan to its
    // centre, which would stack the pins and make them unreachable. The
    // fan has to actually use the room it is given.
    const busy = placeAt(7.3, 2026).reduce(
      (m, p) => m.set(p.town, (m.get(p.town) ?? 0) + 1),
      new Map<string, number>(),
    );
    const crowded = [...busy].filter(([, n]) => n >= 5);
    expect(crowded.length).toBeGreaterThan(5);
    for (const [name, n] of crowded) {
      const a = anchorOf(name);
      const s = fitSpacing(n, a.room, fanSpacing(7.3));
      // Neighbouring pins must stay far enough apart to be separate marks
      // on the ground - at least fifty metres.
      expect(s * 111_320, `${name} fans only ${(s * 111_320).toFixed(0)} m per step`).toBeGreaterThan(50);
    }
  });
});
