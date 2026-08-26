import mapEvents from "@/data/map-events.json";
import type { Year } from "./types";
import type { Locale } from "./vocab";
import { CHART } from "@/lib/colors";

/** Traced episodes per locality - "what happened where", from the
 * the traced activity. */

export type MapEvent = {
  year: Year;
  date?: string;
  kind: "official" | "municipal" | "ngo_international" | "community" | "context";
  text: string;
  /** The same sentence in Arabic, claiming exactly what `text` claims. */
  textAr?: string;
};

export type LocalityEvents = {
  name: string;
  /** The locality's own name in Arabic. */
  nameAr?: string;
  townNames?: string[];
  events: MapEvent[];
};

/**
 * The episode sentence in the reader's language. These are the
 * observatory's own editorial sentences, not quoted reporting, so the
 * Arabic side shows the Arabic twin; the English text is the fallback if
 * a twin is ever missing.
 */
export function eventText(e: MapEvent, locale: Locale): string {
  return (locale === "ar" ? e.textAr : undefined) ?? e.text;
}

/** The locality heading in the reader's language, same rule. */
export function localityName(l: LocalityEvents, locale: Locale): string {
  return (locale === "ar" ? l.nameAr : undefined) ?? l.name;
}

export const LOCALITY_EVENTS = mapEvents.localities as LocalityEvents[];

export const eventsByLocality = new Map(LOCALITY_EVENTS.map((l) => [l.name, l]));

export const eventsByTown = new Map<string, LocalityEvents>(
  LOCALITY_EVENTS.flatMap((l) => (l.townNames ?? []).map((t) => [t, l] as const)),
);

export function eventsFor(entry: LocalityEvents | undefined, year: Year): MapEvent[] {
  if (!entry) return [];
  return entry.events
    .filter((e) => e.year === year)
    .sort((a, b) => (a.date ?? "9999") < (b.date ?? "9999") ? -1 : 1);
}

export const EVENT_KIND_META: Record<
  MapEvent["kind"],
  { label: string; color: string; bg: string }
> = {
  official: { label: "Official", color: "#173B63", bg: "#EEF2F7" },
  municipal: { label: "Municipal", color: "#8a6200", bg: "#FAF3E3" },
  ngo_international: { label: "NGO / International", color: "#177384", bg: "#E8F1F3" },
  community: { label: "Community", color: "#A34F7C", bg: "#F4EAF0" },
  context: { label: "Conflict context", color: CHART.label, bg: "#EFF1F4" },
};
