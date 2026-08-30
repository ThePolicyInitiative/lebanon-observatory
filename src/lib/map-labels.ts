/**
 * Deciding which place names a map can print without them colliding.
 *
 * A place name is far wider than it is tall, so reserving a radius around
 * its anchor is the wrong shape: two labels a comfortable radius apart
 * still overlap when they run towards each other, and two stacked
 * directly above each other are rejected when they would have been fine.
 * These work in boxes.
 *
 * Kept out of the map component so the packing can be checked against
 * the real geometry rather than only looked at.
 */

export type LabelBox = { x0: number; y0: number; x1: number; y1: number };

/**
 * The box a run of text occupies, in the same units its position is
 * given in.
 *
 * Glyph widths are approximated at 0.55 em. This decides whether to print
 * a name at all, so half a character of slack either way costs nothing -
 * and measuring text properly would mean laying it out first, which is
 * the work being avoided.
 */
export function labelBox(
  x: number,
  y: number,
  text: string,
  fontSize: number,
  anchor: "start" | "middle" = "start",
): LabelBox {
  const w = text.length * fontSize * 0.55;
  const h = fontSize * 1.25;
  const x0 = anchor === "middle" ? x - w / 2 : x;
  // y is a text baseline: most of the box sits above it.
  return { x0, y0: y - h * 0.8, x1: x0 + w, y1: y + h * 0.2 };
}

export function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

export type LabelCandidate<T> = { key: T; box: LabelBox };

/**
 * Greedy packing: take candidates in the order given and keep each one
 * whose box is still clear.
 *
 * `reserved` is for labels that are drawn whatever happens - city names,
 * district names, the river - so they claim their ground first. Without
 * that they were invisible to the packing and every one of them could be
 * printed straight through a town name.
 *
 * Order carries the priority. The map passes towns by traced volume, so
 * where two names cannot both fit, the busier place keeps its name.
 */
export function packLabels<T>(
  candidates: LabelCandidate<T>[],
  reserved: LabelBox[] = [],
): Set<T> {
  const taken = [...reserved];
  const kept = new Set<T>();
  for (const c of candidates) {
    if (taken.some((t) => boxesOverlap(t, c.box))) continue;
    taken.push(c.box);
    kept.add(c.key);
  }
  return kept;
}

/**
 * The reserved labels, thinned so they do not print through each other.
 *
 * `packLabels` takes reserved boxes as given and only protects candidates
 * from them - which is right for a marker, since a marker is drawn
 * whatever happens, but wrong for a label. The city and district layers
 * are both unconditional, so where a district label sits under the city
 * that names it the two printed on top of each other: "BEIRUT" through
 * "Beirut", at every zoom the district layer is on.
 *
 * Order is priority, as everywhere else here. The caller passes the
 * layers in the order it wants them kept, and draws only what comes
 * back.
 */
export function packReserved<T>(candidates: LabelCandidate<T>[]): {
  kept: Set<T>;
  boxes: LabelBox[];
} {
  const boxes: LabelBox[] = [];
  const kept = new Set<T>();
  for (const c of candidates) {
    if (boxes.some((b) => boxesOverlap(b, c.box))) continue;
    boxes.push(c.box);
    kept.add(c.key);
  }
  return { kept, boxes };
}
