import adm1 from "@/data/lebanon-adm1.json";
import adm2 from "@/data/lebanon-adm2.json";
import locationsJson from "@/data/locations.json";
import litaniJson from "@/data/litani.json";

/**
 * Build-time projection of Lebanon's boundaries (geoBoundaries ADM1
 * governorates + ADM2 districts, public domain) into SVG path space.
 * Pure and server-safe: the computed paths are embedded in
 * server-rendered HTML, so the maps are visible even before (or
 * without) any client-side JavaScript.
 */

export const VIEW_W = 620;
export const VIEW_H = 860;
const PAD = 18;

export type GeoFeature = {
  properties: Record<string, string | number | null>;
  geometry:
    | { type: "Polygon"; coordinates: number[][][] }
    | { type: "MultiPolygon"; coordinates: number[][][][] };
};

const govFeatures = (adm1 as { features: GeoFeature[] }).features;
const districtFeatures = (adm2 as { features: GeoFeature[] }).features;

function eachCoord(f: GeoFeature, cb: (lon: number, lat: number) => void) {
  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) for (const ring of poly) for (const [lon, lat] of ring) cb(lon, lat);
}

// Fit the projection to the ADM1 envelope (the national outline).
let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;
for (const f of govFeatures) {
  eachCoord(f, (lon, lat) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
}

const latMid = (minLat + maxLat) / 2;
const latCos = Math.cos((latMid * Math.PI) / 180);
const scale = Math.min(
  (VIEW_W - 2 * PAD) / ((maxLon - minLon) * latCos),
  (VIEW_H - 2 * PAD) / (maxLat - minLat),
);

export function projectPoint(lon: number, lat: number): { x: number; y: number } {
  return {
    x: PAD + (lon - minLon) * latCos * scale,
    y: PAD + (maxLat - lat) * scale,
  };
}

/** The inverse of projectPoint - the projection is linear, so this is exact. */
export function unprojectPoint(x: number, y: number): { lon: number; lat: number } {
  return {
    lon: minLon + (x - PAD) / (latCos * scale),
    lat: maxLat - (y - PAD) / scale,
  };
}

/**
 * The national outline as flat rings, for testing whether a point is on
 * Lebanese land. Pins are fanned around a town centroid by geometry
 * alone, which knows nothing about the coast, so a coastal town's fan
 * would otherwise put entries out in the Mediterranean.
 *
 * Nine rings, 2,153 points - small enough to ray-cast per pin.
 */
const LAND_RINGS: { pts: number[][]; minLon: number; maxLon: number; minLat: number; maxLat: number }[] =
  govFeatures.flatMap((f) => {
    const polys =
      f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    return polys.flatMap((poly) =>
      poly.map((ring) => {
        let a = Infinity;
        let b = -Infinity;
        let c = Infinity;
        let d = -Infinity;
        for (const [lon, lat] of ring) {
          if (lon < a) a = lon;
          if (lon > b) b = lon;
          if (lat < c) c = lat;
          if (lat > d) d = lat;
        }
        return { pts: ring, minLon: a, maxLon: b, minLat: c, maxLat: d };
      }),
    );
  });

/** True when lon/lat falls inside any governorate polygon. */
export function isOnLand(lon: number, lat: number): boolean {
  for (const ring of LAND_RINGS) {
    if (lon < ring.minLon || lon > ring.maxLon || lat < ring.minLat || lat > ring.maxLat)
      continue;
    let inside = false;
    const p = ring.pts;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i];
      const [xj, yj] = p[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

/** SVG units per kilometre (one degree of latitude ≈ 110.574 km). */
export const PX_PER_KM = scale / 110.574;

function ringCentroid(ring: number[][]): { x: number; y: number; area: number } {
  const pts = ring.map(([lon, lat]) => projectPoint(lon, lat));
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    const cross = p.x * q.y - q.x * p.y;
    a += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  if (Math.abs(a) < 1e-6) {
    const sx = pts.reduce((s, p) => s + p.x, 0);
    const sy = pts.reduce((s, p) => s + p.y, 0);
    return { x: sx / pts.length, y: sy / pts.length, area: 0 };
  }
  return { x: cx / (3 * a), y: cy / (3 * a), area: Math.abs(a) / 2 };
}

/** Projected centroid of a feature's largest polygon - a label/marker anchor. */
export function featureCentroid(f: GeoFeature): { x: number; y: number } {
  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let best = { x: 0, y: 0, area: -1 };
  for (const poly of polys) {
    const c = ringCentroid(poly[0]);
    if (c.area > best.area) best = c;
  }
  return { x: best.x, y: best.y };
}

/** Geographic centroid of a feature's largest polygon (for GL layers). */
export function featureCentroidLonLat(f: GeoFeature): { lon: number; lat: number } {
  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let best: { lon: number; lat: number; area: number } = { lon: 0, lat: 0, area: -1 };
  for (const poly of polys) {
    const ring = poly[0];
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % ring.length];
      const cross = x1 * y2 - x2 * y1;
      a += cross;
      cx += (x1 + x2) * cross;
      cy += (y1 + y2) * cross;
    }
    if (Math.abs(a) < 1e-12) continue;
    const area = Math.abs(a) / 2;
    if (area > best.area) best = { lon: cx / (3 * a), lat: cy / (3 * a), area };
  }
  if (best.area < 0) {
    const ring = polys[0]?.[0] ?? [[0, 0]];
    const sx = ring.reduce((s, p) => s + p[0], 0);
    const sy = ring.reduce((s, p) => s + p[1], 0);
    return { lon: sx / ring.length, lat: sy / ring.length };
  }
  return { lon: best.lon, lat: best.lat };
}

/**
 * The largest polygon of a feature: its outer ring first, then its holes.
 */
function largestPolygon(f: GeoFeature): number[][][] {
  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let best = polys[0] ?? [[]];
  let bestArea = -1;
  for (const poly of polys) {
    const ring = poly[0];
    let a = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % ring.length];
      a += x1 * y2 - x2 * y1;
    }
    const area = Math.abs(a) / 2;
    if (area > bestArea) {
      bestArea = area;
      best = poly;
    }
  }
  return best;
}

/** Distance from a point to the nearest edge of a ring set, in ring units. */
function distanceToEdges(poly: number[][][], x: number, y: number): number {
  let best = Infinity;
  for (const ring of poly) {
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % ring.length];
      const ax = x1 - x;
      const ay = y1 - y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(ax + t * dx, ay + t * dy);
      if (d < best) best = d;
    }
  }
  return best;
}

/** Whether a point lies in the ring set's interior (outer ring, minus holes). */
function polygonContains(poly: number[][][], x: number, y: number): boolean {
  const inRing = (ring: number[][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  if (!inRing(poly[0])) return false;
  for (let r = 1; r < poly.length; r++) if (inRing(poly[r])) return false;
  return true;
}

/**
 * The pole of inaccessibility: the interior point furthest from every edge.
 *
 * A polygon centroid is the average of a shape, not a point inside it. For
 * a crescent, an L or a coastal sliver it can sit outside the shape
 * altogether - seventeen of the boundary layer's towns are like that - and
 * even when it stays inside it can hug an edge. Sour's centroid is 54 m
 * from its own boundary and Chaaitiyeh's is 59 m, so a fan of entries drawn
 * around either lands in the neighbouring town.
 *
 * This point is the centre of the largest circle that fits inside the
 * polygon, so two things hold that the centroid cannot promise: it is
 * always inside the shape, and it leaves the most room before an edge is
 * reached. `room` is that radius, in whatever units the rings were given -
 * projected SVG units or degrees of latitude - which is exactly the budget
 * a pin fan may spend.
 *
 * Found by grid search, refined eight times around the best cell. Beam
 * search rather than the exact algorithm, because the exact one needs a
 * priority queue for a gain no one can see at map scale; the result is
 * deterministic, so a pin never moves between renders.
 */
export function poleOfInaccessibility(poly: number[][][]): {
  x: number;
  y: number;
  room: number;
} {
  const ring = poly[0] ?? [];
  if (ring.length === 0) return { x: 0, y: 0, room: 0 };

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Outside the shape the score goes negative, so the search is pulled
  // inward even when it starts on a cell that misses the polygon.
  const score = (x: number, y: number) => {
    const d = distanceToEdges(poly, x, y);
    return polygonContains(poly, x, y) ? d : -d;
  };

  let bestX = (minX + maxX) / 2;
  let bestY = (minY + maxY) / 2;
  let bestScore = score(bestX, bestY);
  let step = Math.max((maxX - minX) / 24, (maxY - minY) / 24);

  for (let pass = 0; pass < 8 && step > 0; pass++) {
    for (let x = minX; x <= maxX; x += step) {
      for (let y = minY; y <= maxY; y += step) {
        const s = score(x, y);
        if (s > bestScore) {
          bestScore = s;
          bestX = x;
          bestY = y;
        }
      }
    }
    minX = bestX - step;
    maxX = bestX + step;
    minY = bestY - step;
    maxY = bestY + step;
    step /= 3;
  }

  return { x: bestX, y: bestY, room: Math.max(0, bestScore) };
}

/**
 * Where a town's pins belong on the vector map, in projected units, with
 * the room a fan has around them before it leaves the town.
 */
export function featureAnchor(f: GeoFeature): { x: number; y: number; room: number } {
  const poly = largestPolygon(f).map((ring) =>
    ring.map(([lon, lat]) => {
      const p = projectPoint(lon, lat);
      return [p.x, p.y];
    }),
  );
  return poleOfInaccessibility(poly);
}

/**
 * The same anchor for the pan-and-zoom map, in degrees. Longitude is
 * squashed by the cosine of the town's own latitude while the point is
 * searched for, so the circle that defines it is round on the ground
 * rather than an ellipse, then unsquashed on the way out. `room` comes
 * back in degrees of latitude.
 */
export function featureAnchorLonLat(f: GeoFeature): {
  lon: number;
  lat: number;
  room: number;
} {
  const poly = largestPolygon(f);
  const ring = poly[0] ?? [];
  if (ring.length === 0) return { lon: 0, lat: 0, room: 0 };
  const lat0 = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const k = Math.max(0.2, Math.cos((lat0 * Math.PI) / 180));
  const squashed = poly.map((r) => r.map(([lon, lat]) => [lon * k, lat]));
  const p = poleOfInaccessibility(squashed);
  return { lon: p.x / k, lat: p.y, room: p.room };
}

export function toSvgPath(f: GeoFeature): string {
  return toPath(f);
}

function toPath(f: GeoFeature): string {
  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys
    .map((poly) =>
      poly
        .map((ring) => {
          const pts = ring.map(([lon, lat]) => {
            const { x, y } = projectPoint(lon, lat);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          });
          return `M${pts.join("L")}Z`;
        })
        .join(""),
    )
    .join("");
}

export type GovPath = {
  d: string;
  name: string;
  zoneId: string;
  zoneLabel: string;
};

export const GOV_PATHS: GovPath[] = govFeatures.map((f) => {
  const name = String(f.properties.shapeName ?? "");
  const region = locationsJson.regions.find((r) => r.governorates.includes(name));
  return {
    d: toPath(f),
    name,
    zoneId: region?.id ?? "",
    zoneLabel: region?.label ?? name,
  };
});

/**
 * The zones the two wars hit and the assessments cover. The north lies
 * outside every assessed zone, so the map carries it as context rather
 * than as subject.
 */
export const AFFECTED_ZONE_IDS = [
  "south_nabatieh",
  "beirut_mount_lebanon",
  "bekaa_baalbek_hermel",
];

/**
 * Two adm3_name values in the COD town layer are not town names: "Conflict"
 * marks a contested sliver and "Litige" a disputed area, 65 of them spread
 * across fifteen districts. Painting either as a label invents a place, so
 * both maps ask here rather than each carrying its own list - which is how
 * the vector map came to exclude both while the pan-and-zoom map excluded
 * only one.
 */
const UNNAMED_AREA_NAMES = new Set(["Conflict", "Litige"]);

export function isUnnamedArea(name: string | null | undefined): boolean {
  return UNNAMED_AREA_NAMES.has(String(name ?? "").trim());
}

/** The same rule as a MapLibre filter expression, for the GL layers. */
export function unnamedAreaFilter(property: string) {
  return ["all", ...[...UNNAMED_AREA_NAMES].map((n) => ["!=", property, n])];
}

/**
 * Regional grouping for the OCHA COD governorate names used by the
 * town-level (ADM3) layer.
 */
const COD_ADM1_ZONE: Record<string, string> = {
  Beirut: "beirut_mount_lebanon",
  "Mount Lebanon": "beirut_mount_lebanon",
  North: "north",
  Akkar: "north",
  Bekaa: "bekaa_baalbek_hermel",
  "Baalbek-El Hermel": "bekaa_baalbek_hermel",
  South: "south_nabatieh",
  "El Nabatieh": "south_nabatieh",
};

export function zoneForCodAdm1(adm1Name: string | null | undefined): string {
  return COD_ADM1_ZONE[String(adm1Name ?? "")] ?? "";
}

/** COD district (adm2_name) spellings of the occupied border districts. */
export const OCCUPIED_COD_DISTRICTS_2026 = [
  "Sour",
  "Bent Jbeil",
  "Marjaayoun",
  "Hasbaya",
];

/**
 * Towns forming the border strip along the Blue Line: within the
 * districts traced as containing occupied areas, the towns whose
 * own polygons reach the southern national boundary. Derived purely
 * from the boundary data (per longitude bin, the southernmost
 * vertex latitude traces the border; a town qualifies when one of its
 * vertices sits on that envelope). This is the closest honest shape to
 * the traced occupied border villages and the strip demarcated on
 * 18 June 2026, which has no published geometry.
 */
export function computeBorderStripTowns(
  features: GeoFeature[],
  districts: string[] = OCCUPIED_COD_DISTRICTS_2026,
): Set<string> {
  // Edge topology: the COD layer is topologically clean (shared town
  // boundaries use identical vertex chains), so an edge used by only
  // one town polygon lies on the national outline. The tracking's
  // "Conflict" slivers (Ghajar–Shebaa, the Metula-adjacent strip) are
  // excluded from the count, so towns behind them still register as
  // border towns - which is exactly where occupation is traced.
  const real = features.filter((f) => {
    const n = String(f.properties.adm3_name ?? "");
    return n !== "" && n !== "Conflict";
  });
  const eachSegment = (
    f: GeoFeature,
    cb: (a: number[], b: number[]) => void,
  ) => {
    const polys =
      f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys)
      for (const ring of poly)
        for (let i = 0; i < ring.length - 1; i++) cb(ring[i], ring[i + 1]);
  };
  const keyOf = (a: number[], b: number[]) => {
    const s1 = `${a[0]},${a[1]}`;
    const s2 = `${b[0]},${b[1]}`;
    return s1 < s2 ? `${s1}|${s2}` : `${s2}|${s1}`;
  };
  const counts = new Map<string, number>();
  for (const f of real)
    eachSegment(f, (a, b) => {
      const k = keyOf(a, b);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });

  const out = new Set<string>();
  for (const f of real) {
    const name = String(f.properties.adm3_name ?? "");
    const district = String(f.properties.adm2_name ?? "");
    if (!districts.includes(district)) continue;
    let hit = false;
    eachSegment(f, (a, b) => {
      if (hit || (counts.get(keyOf(a, b)) ?? 0) !== 1) return;
      // Sour district also has coastline; only its Naqoura corner
      // (below ~33.12°N) lies on the Blue Line.
      if (district === "Sour" && (a[1] + b[1]) / 2 >= 33.12) return;
      hit = true;
    });
    if (hit) out.add(name);
  }
  return out;
}

/** District (qada) → regional-grouping crosswalk, by governorate membership. */
const DISTRICT_ZONE: Record<string, string> = {
  // South and Nabatieh
  Saida: "south_nabatieh",
  Sour: "south_nabatieh",
  Jezzine: "south_nabatieh",
  Nabatiye: "south_nabatieh",
  "Bent Jbail": "south_nabatieh",
  Marjaayoun: "south_nabatieh",
  Hasbaya: "south_nabatieh",
  // Beirut and Mount Lebanon
  Beirut: "beirut_mount_lebanon",
  Baabda: "beirut_mount_lebanon",
  Aley: "beirut_mount_lebanon",
  Chouf: "beirut_mount_lebanon",
  "El Metn": "beirut_mount_lebanon",
  Kesrouan: "beirut_mount_lebanon",
  Jbail: "beirut_mount_lebanon",
  // Bekaa and Baalbek-Hermel
  Zahle: "bekaa_baalbek_hermel",
  "West Bekaa": "bekaa_baalbek_hermel",
  Rachaya: "bekaa_baalbek_hermel",
  Baalbek: "bekaa_baalbek_hermel",
  Hermel: "bekaa_baalbek_hermel",
  // North
  Tripoli: "north",
  Zgharta: "north",
  Bcharre: "north",
  Batroun: "north",
  Koura: "north",
  "Minieh-Dinnieh": "north",
  Akkar: "north",
};

export type DistrictPath = {
  d: string;
  name: string;
  zoneId: string;
  zoneLabel: string;
};

export const DISTRICT_PATHS: DistrictPath[] = districtFeatures.map((f) => {
  const name = String(f.properties.shapeName ?? "");
  const zoneId = DISTRICT_ZONE[name] ?? "";
  const region = locationsJson.regions.find((r) => r.id === zoneId);
  return {
    d: toPath(f),
    name,
    zoneId,
    zoneLabel: region?.label ?? name,
  };
});

/** District (qada) label anchors for the zoomed-in label layer. */
export const DISTRICT_LABELS: { name: string; x: number; y: number }[] =
  districtFeatures.map((f) => ({
    name: String(f.properties.shapeName ?? ""),
    ...featureCentroid(f),
  }));

/**
 * Border districts containing Israeli-occupied areas in 2026. The tracking
 * entries occupied border villages and an expanded occupation zone
 * demarcated on 18 June 2026, but publishes no precise boundary geometry -
 * so the map hatches the districts that contain occupied areas rather
 * than inventing a zone outline. These four districts adjoin the Blue Line.
 */
export const OCCUPIED_BORDER_DISTRICTS_2026 = [
  "Sour",
  "Bent Jbail",
  "Marjaayoun",
  "Hasbaya",
];

/**
 * Dissolve a set of town polygons into boundary paths: every edge used
 * by exactly one member of the group is on that group's outline. Because
 * the outline is derived from the same polygons the map fills, the
 * borders always sit exactly on the areas - no cross-source mismatch.
 */
export function dissolveBoundary(features: GeoFeature[]): string {
  const counts = new Map<string, number>();
  const seg = (f: GeoFeature, cb: (a: number[], b: number[]) => void) => {
    const polys =
      f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys)
      for (const ring of poly)
        for (let i = 0; i < ring.length - 1; i++) cb(ring[i], ring[i + 1]);
  };
  const key = (a: number[], b: number[]) => {
    const s1 = `${a[0]},${a[1]}`;
    const s2 = `${b[0]},${b[1]}`;
    return s1 < s2 ? `${s1}|${s2}` : `${s2}|${s1}`;
  };
  for (const f of features) seg(f, (a, b) => counts.set(key(a, b), (counts.get(key(a, b)) ?? 0) + 1));
  const parts: string[] = [];
  for (const f of features)
    seg(f, (a, b) => {
      if ((counts.get(key(a, b)) ?? 0) !== 1) return;
      const p1 = projectPoint(a[0], a[1]);
      const p2 = projectPoint(b[0], b[1]);
      parts.push(`M${p1.x.toFixed(1)},${p1.y.toFixed(1)}L${p2.x.toFixed(1)},${p2.y.toFixed(1)}`);
    });
  return parts.join("");
}

/** Raw Litani segments (lon/lat), for the GL map. © OpenStreetMap contributors. */
export const LITANI_SEGMENTS = litaniJson.segments as [number, number][][];

/**
 * The Litani river as SVG path strings - the analytical boundary the
 * "South of the Litani" assessment zone and LEAP's scope refer to.
 * Geometry © OpenStreetMap contributors (ODbL), simplified for display.
 */
export const LITANI_PATHS: string[] = LITANI_SEGMENTS.map(
  (seg) =>
    "M" +
    seg
      .map(([lon, lat]) => {
        const { x, y } = projectPoint(lon, lat);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join("L"),
);

/**
 * Major-city reference labels (well-known coordinates, village
 * precision). Northern cities are not among them: this is a map of where
 * the war and the reconstruction were traced, and labelling Tripoli on it
 * invites the reader to look for something there that never happened.
 */
export const CITY_LABELS: { name: string; lon: number; lat: number }[] = [
  { name: "Beirut", lon: 35.5018, lat: 33.8938 },
  { name: "Saida", lon: 35.3758, lat: 33.5606 },
  { name: "Tyre", lon: 35.2038, lat: 33.2705 },
  { name: "Nabatieh", lon: 35.4836, lat: 33.3772 },
  { name: "Zahle", lon: 35.902, lat: 33.8463 },
  { name: "Baalbek", lon: 36.2181, lat: 34.0058 },
];
