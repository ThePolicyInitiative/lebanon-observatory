import type { GeoFeature } from "./geo";

/**
 * Point-in-land testing against the town polygons.
 *
 * The governorate outline is nine coarse rings, so a pin could sit a few
 * hundred metres out on a fine shoreline and still pass. The town layer
 * is 1,640 rings and 32,822 points - the same boundaries the map draws -
 * so testing against it is testing against what the reader sees.
 *
 * Rings are bucketed into a uniform grid by bounding box, so a point only
 * ever ray-casts the handful of polygons whose box covers its cell rather
 * than all 1,640.
 */

type Ring = {
  pts: number[][];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type LandIndex = {
  cell: number;
  buckets: Map<string, Ring[]>;
};

function bbox(pts: number[][]): Omit<Ring, "pts"> {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

/**
 * `project` maps a feature's lon/lat into the caller's units, so the
 * vector map can index in projected space and the pan-and-zoom map in
 * lon/lat. `cell` is the grid size in those same units.
 */
export function buildLandIndex(
  features: GeoFeature[],
  cell: number,
  project: (lon: number, lat: number) => [number, number] = (lon, lat) => [lon, lat],
): LandIndex {
  const buckets = new Map<string, Ring[]>();
  for (const f of features) {
    if (String(f.properties.adm3_name ?? "") === "Conflict") continue;
    const polys =
      f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys)
      for (const raw of poly) {
        const pts = raw.map(([lon, lat]) => project(lon, lat) as number[]);
        const ring: Ring = { pts, ...bbox(pts) };
        const x0 = Math.floor(ring.minX / cell);
        const x1 = Math.floor(ring.maxX / cell);
        const y0 = Math.floor(ring.minY / cell);
        const y1 = Math.floor(ring.maxY / cell);
        for (let x = x0; x <= x1; x++)
          for (let y = y0; y <= y1; y++) {
            const key = `${x}:${y}`;
            const list = buckets.get(key);
            if (list) list.push(ring);
            else buckets.set(key, [ring]);
          }
      }
  }
  return { cell, buckets };
}

/** True when the point falls inside any town polygon. */
export function isOnLandIndexed(index: LandIndex, x: number, y: number): boolean {
  const list = index.buckets.get(
    `${Math.floor(x / index.cell)}:${Math.floor(y / index.cell)}`,
  );
  if (!list) return false;
  for (const ring of list) {
    if (x < ring.minX || x > ring.maxX || y < ring.minY || y > ring.maxY) continue;
    let inside = false;
    const p = ring.pts;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i];
      const [xj, yj] = p[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}
