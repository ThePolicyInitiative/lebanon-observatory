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
 * from the boundary dataset (per longitude bin, the southernmost
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
  // one town polygon lies on the national outline. The dataset's
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
 * Border districts containing Israeli-occupied areas in 2026. The dataset
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
 * borders always sit exactly on the areas - no cross-dataset mismatch.
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

/** Major-city reference labels (well-known coordinates, village precision). */
export const CITY_LABELS: { name: string; lon: number; lat: number }[] = [
  { name: "Beirut", lon: 35.5018, lat: 33.8938 },
  { name: "Tripoli", lon: 35.8497, lat: 34.4367 },
  { name: "Saida", lon: 35.3758, lat: 33.5606 },
  { name: "Tyre", lon: 35.2038, lat: 33.2705 },
  { name: "Nabatieh", lon: 35.4836, lat: 33.3772 },
  { name: "Zahle", lon: 35.902, lat: 33.8463 },
  { name: "Baalbek", lon: 36.2181, lat: 34.0058 },
];
