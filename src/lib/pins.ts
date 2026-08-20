import { LAYER_COLORS } from "./colors";
import { actorBase, actorLabel } from "./actor-names";
import { stageLabel, statusLabel, type Locale } from "./vocab";
import { eventsByTown, eventsFor } from "./events";
import { matchLocations, type LocationIndex } from "./geo-match";
import type { SlimRecord } from "./map-records";
import type { Year } from "./types";

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

const CONTEXT_COLOR = "#667588";

const T = {
  en: {
    episode: "Traced episode",
    context: "Conflict context",
      stage: "Stage",
    status: "Status",
  },
  ar: {
    episode: "واقعة مرصودة",
    context: "سياق الحرب",
    stage: "المرحلة",
    status: "الحالة",
  },
} as const;

export function layerColor(layer: string): string {
  return (LAYER_COLORS as Record<string, string>)[layer] ?? CONTEXT_COLOR;
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
  spacing: number;
}): Map<string, Pin[]> {
  const t = T[locale];
  const byTown = new Map<string, Pin[]>();

  const push = (town: string, pin: Omit<Pin, "dx" | "dy">) => {
    if (!byTown.has(town)) byTown.set(town, []);
    const list = byTown.get(town)!;
    const { dx, dy } = fanOffset(list.length, spacing);
    list.push({ ...pin, dx, dy });
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
        detail: ev.text,
        date: ev.date ?? undefined,
      });
    }
  }

  return byTown;
}
