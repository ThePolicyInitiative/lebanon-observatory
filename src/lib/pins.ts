import { LAYER_COLORS } from "./colors";
import { actorBase, actorLabel, subtypeLabel } from "./actor-names";
import { layerLabel, stageLabel, statusLabel, type Locale } from "./vocab";
import { eventsByTown, eventsFor, eventText } from "./events";
import { matchLocations, type LocationIndex } from "./geo-match";
import type { SlimRecord } from "./map-records";
import type { Year } from "./types";
import { CHART } from "@/lib/colors";

/**
 * One pin per traced entry, rather than one marker per town.
 *
 * A town marker sized by a count answered "how much happened here" and
 * nothing else: forty entries in Nabatieh were a single circle with a 40
 * on it, and no way to reach any one of them. Each entry is now its own
 * pin, carrying its own actor, stage and status, and coloured by its own
 * actor layer rather than by whichever layer happened to dominate the
 * town.
 *
 * Entries share a town centroid, so pins are fanned around it on a
 * phyllotaxis spiral - the sunflower arrangement, which packs evenly at
 * any count without ring bookkeeping and is fully deterministic, so a pin
 * does not move between renders. The offset is a drawing device: it says
 * "in this town", never "at this address", which is all the sources
 * support. The legend says so too.
 */

/** The golden angle, in radians. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export type PinKind = "entry" | "episode";

export type Pin = {
  id: string;
  kind: PinKind;
  townName: string;
  district: string;
  /** Actor layer, or "context" for conflict-context episodes. */
  layer: string;
  color: string;
  /** Fan offset from the town centroid, in caller units. */
  dx: number;
  dy: number;
  /** Heading for the popup and the accessible name. */
  title: string;
  /** Supporting line: stage and status, or the episode's own text. */
  detail: string;
  /** What the sources say happened - the panel a click opens. */
  body: string;
  /** The layer's own name, for the panel. */
  layerLabel: string;
  /** Actor subtype, where the tracking carries one. */
  subtype: string;
  year: Year;
  date?: string;
};

/**
 * Offset i of n on the sunflower spiral. `spacing` is the distance
 * between neighbouring pins in the caller's units, so an SVG caller can
 * pass viewBox units and a MapLibre caller can pass degrees.
 */
export function fanOffset(i: number, spacing: number): { dx: number; dy: number } {
  if (i === 0) return { dx: 0, dy: 0 };
  const r = spacing * Math.sqrt(i);
  const a = i * GOLDEN;
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r };
}

/** How far the fan reaches for a given count - for hit-testing and labels. */
export function fanRadius(count: number, spacing: number): number {
  return count <= 1 ? 0 : spacing * Math.sqrt(count - 1);
}

/**
 * The widest the fan may open on the ground, in degrees.
 *
 * This is the right unit for the vector map, which is drawn at one fixed
 * scale, and it is what the pan-and-zoom map used at every scale until the
 * fan was made zoom-aware below.
 */
export const GROUND_SPACING_DEG = 0.0035;

/** How far apart neighbouring pins should sit on the screen, in pixels. */
const SCREEN_SPACING_PX = 9;

/** Degrees of longitude per screen pixel at a MapLibre zoom level. */
export function degreesPerPixel(zoom: number): number {
  return 360 / (512 * Math.pow(2, zoom));
}

/**
 * The fan, sized on the screen instead of on the ground.
 *
 * A distance in degrees is the right unit for a map you cannot zoom and
 * the wrong one for a map you can. At the ground spacing above, Nabatieh's
 * 32 entries fan to a 2.16 km radius: about seven pixels at national zoom
 * - one place seen from above, as intended - but about 450 pixels at
 * street zoom, which walks them into the neighbouring towns. The pins were
 * never attached to the wrong town; the fan grew until it reached one.
 *
 * So the spacing is derived from the current zoom and capped by the ground
 * value. Below roughly zoom 11 the cap binds and nothing changes from what
 * shipped. Above it the fan holds steady at about fifty pixels across for
 * a busy town while its footprint shrinks - 1.9 km at zoom 11, 480 m at
 * 13, 60 m at 16 - so a pin stays inside the place it names.
 */
export function fanSpacing(zoom: number): number {
  return Math.min(SCREEN_SPACING_PX * degreesPerPixel(zoom), GROUND_SPACING_DEG);
}

/**
 * How much of the town's own room a fan may fill. The rest is a margin, so
 * a pin sits inside the outline rather than balanced on it.
 */
const ROOM_SHARE = 0.85;

/**
 * The spacing that fits `count` pins inside a town of this much `room`.
 *
 * The fan reaches spacing * sqrt(count - 1), so this inverts that: given
 * the room the anchor has before the boundary, the widest spacing whose
 * fan still stops short of it. Callers take the smaller of this and
 * whatever scale-based spacing they already wanted, so the town's own size
 * is a ceiling and never a floor - a big town does not get a bigger fan
 * than it needs, but a small one is never given a fan it cannot hold.
 *
 * `room` and the result are in the caller's units: projected units on the
 * vector map, degrees of latitude on the pan-and-zoom map.
 */
export function fitSpacing(count: number, room: number, wanted: number): number {
  if (count <= 1 || !Number.isFinite(room) || room <= 0) return wanted;
  return Math.min(wanted, (room * ROOM_SHARE) / Math.sqrt(count - 1));
}

/**
 * Keep a fanned pin on land.
 *
 * The spiral is blind geometry: around a coastal town - Sour, Saida,
 * Beirut, Naqoura - it happily places entries out in the Mediterranean,
 * which reads as a claim that something was traced at sea.
 *
 * The offset is first rotated around the town at the same radius, in
 * twelve steps, so the pin keeps its distance from the centre and the fan
 * keeps its shape; only if the whole circle is water does the radius
 * shrink. `onLand` takes the caller's own units, so the vector map can
 * pass projected coordinates and the pan-and-zoom map lon/lat.
 */
export function clampToLand(
  cx: number,
  cy: number,
  dx: number,
  dy: number,
  onLand: (x: number, y: number) => boolean,
): { dx: number; dy: number } {
  if (onLand(cx + dx, cy + dy)) return { dx, dy };
  const r = Math.hypot(dx, dy);
  if (r === 0) return { dx, dy };
  const a0 = Math.atan2(dy, dx);
  for (let shrink = 1; shrink >= 0.25; shrink -= 0.25) {
    const rr = r * shrink;
    for (let step = 1; step <= 12; step++) {
      // Alternate either side of the original bearing, so a pin moves the
      // shortest way inland rather than always sweeping one direction.
      const turn = (Math.ceil(step / 2) * (Math.PI / 6)) * (step % 2 === 0 ? -1 : 1);
      const nx = Math.cos(a0 + turn) * rr;
      const ny = Math.sin(a0 + turn) * rr;
      if (onLand(cx + nx, cy + ny)) return { dx: nx, dy: ny };
    }
  }
  return { dx: 0, dy: 0 };
}

const CONTEXT_COLOR = CHART.label;

const T = {
  en: {
    episode: "Traced episode",
    context: "Conflict context",
    stage: "Stage",
    status: "Status",
    noAction: "The tracking carries no action text for this entry.",
  },
  ar: {
    episode: "واقعة مرصودة",
    context: "سياق الحرب",
    stage: "المرحلة",
    status: "الحالة",
    noAction: "لا نص فعل مرصود لهذا المدخل في التتبّع.",
  },
} as const;

export function layerColor(layer: string): string {
  return (LAYER_COLORS as Record<string, string>)[layer] ?? CONTEXT_COLOR;
}

/**
 * A pin's outline: its own colour at 55% brightness.
 *
 * A white outline separates pins from each other but leaves the pin
 * itself to carry all the contrast against the ground, and the municipal
 * amber cannot: measured against the map's grey it reaches 1.87:1, under
 * the 3:1 that graphical objects need. Darkening the pin's own colour for
 * the edge puts every layer between 5.8:1 and 13.6:1 without touching the
 * fills, which are the site's actor-layer identity everywhere else.
 */
export function pinOutline(color: string): string {
  const ch = (i: number) => Math.round(parseInt(color.slice(i, i + 2), 16) * 0.55);
  return `#${[ch(1), ch(3), ch(5)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Every pin for one year: one per entry naming a town, one per traced
 * episode. `spacing` is in the caller's units. Towns are resolved through
 * the same location index both maps already build.
 */
export function buildPins({
  entries,
  index,
  townDistrict,
  year,
  locale,
  spacing,
}: {
  entries: SlimRecord[];
  index: LocationIndex;
  /** Town name to district name, for the pin's second line. */
  townDistrict: Map<string, string>;
  year: Year;
  locale: Locale;
  /**
   * One spacing for every town, or a function given the town and how many
   * pins it ended up with - which is what lets a fan be sized to the town
   * it sits in, since the count is only known once grouping is done.
   */
  spacing: number | ((town: string, count: number) => number);
}): Map<string, Pin[]> {
  const t = T[locale];
  const collected = new Map<string, Omit<Pin, "dx" | "dy">[]>();

  const push = (town: string, pin: Omit<Pin, "dx" | "dy">) => {
    if (!collected.has(town)) collected.set(town, []);
    collected.get(town)!.push(pin);
  };

  for (const r of entries) {
    if (r.year !== year) continue;
    const m = matchLocations(index, r.locationNames ?? []);
    for (const town of m.towns) {
      if (town === "Conflict") continue;
      push(town, {
        id: `${r.id}@${town}`,
        kind: "entry",
        townName: town,
        district: townDistrict.get(town) ?? "",
        layer: r.actorLayer,
        color: layerColor(r.actorLayer),
        title: actorLabel(actorBase(r.actorName), locale),
        detail:
          `${t.stage} ${r.stageNo}: ${stageLabel(r.stageNo, locale)}` +
          ` · ${t.status}: ${statusLabel(r.implementationStatus, locale)}`,
        body:
          (locale === "ar" ? r.actionAr?.trim() : undefined) ||
          r.action?.trim() ||
          t.noAction,
        layerLabel: layerLabel(r.actorLayer, locale),
        subtype: subtypeLabel(r.actorSubtype ?? "", locale),
        year: r.year,
      });
    }
  }

  for (const [town, entry] of eventsByTown) {
    if (town === "Conflict") continue;
    for (const [i, ev] of eventsFor(entry, year).entries()) {
      push(town, {
        id: `ep-${town}-${year}-${i}`,
        kind: "episode",
        townName: town,
        district: townDistrict.get(town) ?? "",
        layer: ev.kind === "context" ? "context" : ev.kind,
        color: ev.kind === "context" ? CONTEXT_COLOR : layerColor(ev.kind),
        title: ev.kind === "context" ? t.context : t.episode,
        detail: eventText(ev, locale),
        body: eventText(ev, locale),
        layerLabel: ev.kind === "context" ? t.context : layerLabel(ev.kind, locale),
        subtype: "",
        year,
        date: ev.date ?? undefined,
      });
    }
  }

  // The fan is laid out only now, because its spacing may depend on how
  // many pins the town turned out to carry.
  const byTown = new Map<string, Pin[]>();
  for (const [town, pins] of collected) {
    const s = typeof spacing === "function" ? spacing(town, pins.length) : spacing;
    byTown.set(
      town,
      pins.map((p, i) => ({ ...p, ...fanOffset(i, s) })),
    );
  }
  return byTown;
}
