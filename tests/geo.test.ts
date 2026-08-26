import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  GOV_PATHS,
  DISTRICT_PATHS,
  DISTRICT_LABELS,
  CITY_LABELS,
  OCCUPIED_BORDER_DISTRICTS_2026,
  OCCUPIED_COD_DISTRICTS_2026,
  zoneForCodAdm1,
  computeBorderStripTowns,
  projectPoint,
  featureCentroid,
  PX_PER_KM,
  VIEW_W,
  VIEW_H,
  type GeoFeature,
} from "@/lib/geo";

describe("boundary projection", () => {
  it("projects all nine governorates into valid SVG paths", () => {
    expect(GOV_PATHS).toHaveLength(9);
    for (const p of GOV_PATHS) {
      expect(p.d.startsWith("M")).toBe(true);
      expect(p.d.length).toBeGreaterThan(50);
    }
  });

  it("projects all 26 districts, each mapped to a regional grouping", () => {
    expect(DISTRICT_PATHS).toHaveLength(26);
    for (const p of DISTRICT_PATHS) {
      expect(p.zoneId, `district ${p.name} has no zone`).not.toBe("");
      expect(p.d.startsWith("M")).toBe(true);
    }
  });

  it("assigns districts to the four mappable zones with the right counts", () => {
    const byZone = new Map<string, number>();
    for (const p of DISTRICT_PATHS) {
      byZone.set(p.zoneId, (byZone.get(p.zoneId) ?? 0) + 1);
    }
    expect(byZone.get("south_nabatieh")).toBe(7);
    expect(byZone.get("beirut_mount_lebanon")).toBe(7);
    expect(byZone.get("bekaa_baalbek_hermel")).toBe(5);
    expect(byZone.get("north")).toBe(7);
  });

  it("marks only real border districts as containing occupied areas, all in the south zone", () => {
    const names = new Set(DISTRICT_PATHS.map((p) => p.name));
    for (const d of OCCUPIED_BORDER_DISTRICTS_2026) {
      expect(names.has(d), `unknown district ${d}`).toBe(true);
      const path = DISTRICT_PATHS.find((p) => p.name === d)!;
      expect(path.zoneId).toBe("south_nabatieh");
    }
    expect(OCCUPIED_BORDER_DISTRICTS_2026).toHaveLength(4);
  });

  it("anchors a label inside the viewBox for all 26 districts", () => {
    expect(DISTRICT_LABELS).toHaveLength(26);
    for (const l of DISTRICT_LABELS) {
      expect(l.name).not.toBe("");
      expect(l.x).toBeGreaterThan(0);
      expect(l.x).toBeLessThan(VIEW_W);
      expect(l.y).toBeGreaterThan(0);
      expect(l.y).toBeLessThan(VIEW_H);
    }
  });

  it("computes a sane geographic centroid for a simple polygon", async () => {
    const { featureCentroidLonLat } = await import("@/lib/geo");
    const square: GeoFeature = {
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [35.4, 33.4],
            [35.6, 33.4],
            [35.6, 33.6],
            [35.4, 33.6],
            [35.4, 33.4],
          ],
        ],
      },
    };
    const c = featureCentroidLonLat(square);
    expect(Math.abs(c.lon - 35.5)).toBeLessThan(0.001);
    expect(Math.abs(c.lat - 33.5)).toBeLessThan(0.001);
  });

  it("computes a sane centroid for a simple polygon", () => {
    // A degenerate "feature" whose ring is a small square of lon/lat points.
    const square: GeoFeature = {
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [35.4, 33.4],
            [35.6, 33.4],
            [35.6, 33.6],
            [35.4, 33.6],
            [35.4, 33.4],
          ],
        ],
      },
    };
    const c = featureCentroid(square);
    const expected = projectPoint(35.5, 33.5);
    expect(Math.abs(c.x - expected.x)).toBeLessThan(0.5);
    expect(Math.abs(c.y - expected.y)).toBeLessThan(0.5);
  });

  it("exposes a positive kilometre scale", () => {
    expect(PX_PER_KM).toBeGreaterThan(1);
    expect(PX_PER_KM).toBeLessThan(20);
  });

  it("projects the Litani river inside the viewBox, from the coast to the Bekaa", async () => {
    const { LITANI_PATHS, LITANI_SEGMENTS } = await import("@/lib/geo");
    expect(LITANI_SEGMENTS.length).toBeGreaterThan(10);
    expect(LITANI_PATHS.length).toBe(LITANI_SEGMENTS.length);
    for (const d of LITANI_PATHS) expect(d.startsWith("M")).toBe(true);
    const pts = LITANI_SEGMENTS.flat();
    const lons = pts.map((p) => p[0]);
    const lats = pts.map((p) => p[1]);
    // Mouth near Tyre, source in the northern Bekaa.
    expect(Math.min(...lons)).toBeLessThan(35.3);
    expect(Math.max(...lons)).toBeGreaterThan(35.9);
    expect(Math.min(...lats)).toBeGreaterThan(33.2);
    expect(Math.max(...lats)).toBeLessThan(34.1);
  });

  /**
   * The projection box is width-bound, and VIEW_H depends on it staying
   * that way.
   *
   * VIEW_H is the exact height the country occupies at the scale the
   * width decides, plus padding - which only holds while scale_x is the
   * smaller of the two. The margin is about a hundredth of a unit: one
   * unit shorter and the height would bind instead, moving every
   * projected coordinate, every path, every centroid and every pin on
   * both maps. Nothing else would fail; the map would simply be drawn
   * somewhere slightly different from where it was measured.
   */
  it("keeps the projection width-bound, which is what VIEW_H assumes", async () => {
    const { VIEW_W, VIEW_H, projectPoint } = await import("@/lib/geo");
    const gov = JSON.parse(
      readFileSync("src/data/lebanon-adm1.json", "utf8"),
    ) as { features: { geometry: { coordinates: unknown } }[] };
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    const walk = (c: unknown): void => {
      if (Array.isArray(c) && typeof c[0] === "number") {
        minLon = Math.min(minLon, c[0] as number);
        maxLon = Math.max(maxLon, c[0] as number);
        minLat = Math.min(minLat, c[1] as number);
        maxLat = Math.max(maxLat, c[1] as number);
      } else if (Array.isArray(c)) for (const p of c) walk(p);
    };
    for (const f of gov.features) walk(f.geometry.coordinates);

    const PAD = 18;
    const latCos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
    const scaleX = (VIEW_W - 2 * PAD) / ((maxLon - minLon) * latCos);
    const scaleY = (VIEW_H - 2 * PAD) / (maxLat - minLat);
    expect(scaleX, "the height now binds - every coordinate has moved").toBeLessThanOrEqual(scaleY);

    // And the box is a close fit, which is the other half of the choice:
    // the country should not hang from the top of an oversized frame.
    const contentH = (maxLat - minLat) * scaleX;
    const slack = VIEW_H - contentH - 2 * PAD;
    expect(slack, `${slack.toFixed(1)} units of dead ground below the country`).toBeLessThan(6);

    // The southern tip sits inside the frame, near its bottom edge.
    const south = projectPoint((minLon + maxLon) / 2, minLat);
    expect(south.y).toBeLessThan(VIEW_H);
    expect(VIEW_H - south.y).toBeLessThan(VIEW_H * 0.05);
  });

  it("anchors the Litani label on the river it names", async () => {
    const { LITANI_LABEL_ANCHOR, LITANI_SEGMENTS, projectPoint, VIEW_W, VIEW_H } =
      await import("@/lib/geo");
    // A hardcoded lon/lat had drifted 23.5 units - about 5.6 km - off the
    // line, printing the word over the town of Jibchit. The anchor is now
    // taken from the geometry, so it cannot drift again.
    let nearest = Infinity;
    for (const seg of LITANI_SEGMENTS) {
      for (let i = 1; i < seg.length; i++) {
        const p1 = projectPoint(seg[i - 1][0], seg[i - 1][1]);
        const p2 = projectPoint(seg[i][0], seg[i][1]);
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len2 = dx * dx + dy * dy;
        let t = len2 === 0 ? 0 : ((LITANI_LABEL_ANCHOR.x - p1.x) * dx + (LITANI_LABEL_ANCHOR.y - p1.y) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        nearest = Math.min(
          nearest,
          Math.hypot(LITANI_LABEL_ANCHOR.x - (p1.x + t * dx), LITANI_LABEL_ANCHOR.y - (p1.y + t * dy)),
        );
      }
    }
    expect(nearest, `label sits ${nearest.toFixed(2)} units off the river`).toBeLessThan(1);
    expect(LITANI_LABEL_ANCHOR.x).toBeGreaterThan(0);
    expect(LITANI_LABEL_ANCHOR.x).toBeLessThan(VIEW_W);
    expect(LITANI_LABEL_ANCHOR.y).toBeGreaterThan(0);
    expect(LITANI_LABEL_ANCHOR.y).toBeLessThan(VIEW_H);
  });

  it("projects every city label inside the viewBox", () => {
    expect(CITY_LABELS.length).toBeGreaterThanOrEqual(5);
    // No northern city is labelled: the map shows where the war and the
    // reconstruction were traced, and neither reached the north.
    expect(CITY_LABELS.map((c) => c.name)).not.toContain("Tripoli");
    // Zahle went for the same reason once it was looked at: every label
    // draws a filled dot, and the tracking says nothing about Zahle at
    // all. tests/jurisdiction-places.test.ts holds that rule generally.
    expect(CITY_LABELS.map((c) => c.name)).not.toContain("Zahle");
    for (const c of CITY_LABELS) {
      const { x, y } = projectPoint(c.lon, c.lat);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(VIEW_W);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(VIEW_H);
    }
  });
});

describe("town-level (ADM3) layer", () => {
  const gj = JSON.parse(
    readFileSync(join(process.cwd(), "public", "geo", "lebanon-adm3.geojson"), "utf-8"),
  ) as { features: { properties: Record<string, string | null> }[] };

  it("ships 1,600+ cadastral towns", () => {
    expect(gj.features.length).toBeGreaterThanOrEqual(1600);
  });

  it("maps every non-conflict governorate name to a regional grouping", () => {
    const adm1Names = new Set(
      gj.features.map((f) => f.properties.adm1_name).filter((n): n is string => Boolean(n)),
    );
    for (const name of adm1Names) {
      if (name === "Conflict") continue;
      expect(zoneForCodAdm1(name), `unmapped governorate ${name}`).not.toBe("");
    }
  });

  it("contains all four occupied border districts under their COD spellings", () => {
    const adm2Names = new Set(gj.features.map((f) => f.properties.adm2_name));
    for (const d of OCCUPIED_COD_DISTRICTS_2026) {
      expect(adm2Names.has(d), `district ${d} missing from ADM3 data`).toBe(true);
    }
  });

  it("derives a plausible Blue Line border strip, not whole districts", () => {
    const features = gj.features as unknown as GeoFeature[];
    const strip = computeBorderStripTowns(features);
    // Front-line villages the record and coverage repeatedly name.
    for (const town of [
      "Kfar Kila",
      "Meiss Ej-Jabal",
      "Aayta Ech-Chaab",
      "Aaintaroun",
      "Maroun Er-Ras",
    ]) {
      expect(strip.has(town), `${town} should be on the border strip`).toBe(true);
    }
    // Second-line and coastal towns must stay out.
    for (const town of ["Sour", "Tibnine", "Chaqra", "Jibchit", "Nabatieh Et-Tahta"]) {
      expect(strip.has(town), `${town} should NOT be on the border strip`).toBe(false);
    }
    // A strip, not a blanket: far fewer towns than the four districts hold.
    const inDistricts = features.filter((f) =>
      OCCUPIED_COD_DISTRICTS_2026.includes(String(f.properties.adm2_name ?? "")),
    ).length;
    expect(strip.size).toBeGreaterThanOrEqual(15);
    expect(strip.size).toBeLessThan(inDistricts / 2);
  });
});
