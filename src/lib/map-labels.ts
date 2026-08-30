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
 * Inter's advance width per character at weight 600, in em.
 *
 * Read out of the browser that draws the map - `measureText` on the very
 * font `next/font` serves, at 100px and divided - rather than estimated,
 * and covering every character the three label layers can print: the
 * district names, the gazetteer's 1,544 town names, the city names and
 * the counts appended to a town label.
 *
 * Inter's italic advances are identical to its upright ones here, so the
 * river label needs no special case.
 */
const GLYPH_EM: Record<string, number> = {
  " ": 0.252, "'": 0.3257, "(": 0.373, ")": 0.373, ",": 0.3188, "-": 0.4653,
  ".": 0.3188, "/": 0.3789, "’": 0.2939,
  "0": 0.6597, "1": 0.4229, "2": 0.623, "3": 0.6362, "4": 0.666,
  "5": 0.6123, "6": 0.6396, "7": 0.5762, "8": 0.6401, "9": 0.6396,
  A: 0.7275, B: 0.6592, C: 0.7368, D: 0.7222, E: 0.6055, F: 0.5879,
  G: 0.749, H: 0.7456, I: 0.2769, J: 0.5796, K: 0.7031, L: 0.5654,
  M: 0.9224, N: 0.7593, O: 0.7686, P: 0.645, Q: 0.7729, R: 0.6523,
  S: 0.6504, T: 0.6602, U: 0.7358, V: 0.7275, W: 1.02, X: 0.7197,
  Y: 0.7134, Z: 0.6523,
  a: 0.5742, b: 0.624, c: 0.5825, d: 0.624, e: 0.5913, f: 0.3887,
  g: 0.6255, h: 0.6123, i: 0.2617, j: 0.2617, k: 0.5693, l: 0.2617,
  m: 0.9004, n: 0.6118, o: 0.6089, p: 0.624, q: 0.624, r: 0.397,
  s: 0.5493, t: 0.353, u: 0.6123, v: 0.5869, w: 0.8394, x: 0.5688,
  y: 0.5884, z: 0.5659,
};

/**
 * What an unmeasured character counts as. Wider than all but four letters,
 * because over-measuring only drops a lower-priority label while
 * under-measuring prints two names through each other.
 */
const UNKNOWN_EM = 0.75;

/** How the layer draws the text, where that changes how wide it comes out. */
export type LabelStyle = {
  /** Drawn through `text-transform: uppercase`, as the district layer is. */
  uppercase?: boolean;
  /** SVG letter-spacing, in the same units as `fontSize`. */
  letterSpacing?: number;
};

/**
 * How wide a run of text is drawn, in the units `fontSize` is given in.
 *
 * Summing advances ignores kerning, which the browser applies to pairs
 * like AY and JA. Measured across all 26 district names and the gazetteer,
 * that costs at most +4% and never less than -0.31%: the sum is a hair
 * wide, which is the safe direction here.
 */
export function textWidth(
  text: string,
  fontSize: number,
  style: LabelStyle = {},
): number {
  const t = style.uppercase ? text.toUpperCase() : text;
  let em = 0;
  for (const c of t) em += GLYPH_EM[c] ?? UNKNOWN_EM;
  // Letter-spacing is added after every character, the last one included.
  return em * fontSize + t.length * (style.letterSpacing ?? 0);
}

/**
 * The box a run of text occupies, in the same units its position is given
 * in.
 *
 * Width used to be `characters × fontSize × 0.55`, which holds for the
 * mixed-case city and town layers - measured, they land within 3% - and
 * badly under-states the district layer, which is drawn uppercase at
 * weight 600 with letter-spacing. Every district name came out 5-38%
 * narrower than the glyphs inside it (mean 24.6%), so district labels
 * were passed to the packing as boxes they did not fit in, and printed
 * through the town names they were supposed to be tested against.
 */
export function labelBox(
  x: number,
  y: number,
  text: string,
  fontSize: number,
  anchor: "start" | "middle" = "start",
  style: LabelStyle = {},
): LabelBox {
  const w = textWidth(text, fontSize, style);
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
