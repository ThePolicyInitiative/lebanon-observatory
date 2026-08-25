import stageCountsJson from "@/data/stage-counts.json";
import locationsJson from "@/data/locations.json";
import kpisJson from "@/data/kpis.json";
import financeJson from "@/data/finance.json";
import timelineJson from "@/data/timeline.json";
import actorsJson from "@/data/actors.json";
import type {
  ActorEntry,
  ActorLayer,
  FinanceMetric,
  Kpi,
  TimelineEvent,
  Year,
} from "./types";

/**
 * The client-side slice of the tracking. Deliberately separate from
 * `data.ts`: that module also pulls the full tracking, the actor
 * catalogue and the source catalogue, so a browser component importing
 * one constant from it would ship all of them. Everything here is small
 * or already slimmed.
 */

export const STAGES: string[] = stageCountsJson.stages;

export const STAGE_SHORT: string[] = [
  "Strategy",
  "Finance",
  "Assessment",
  "Safety",
  "Procurement",
  "Rubble",
  "Debris",
  "Works",
  "Shelter",
  "Relief",
  "Livelihoods",
  "Oversight",
];

export const stageCounts = stageCountsJson.counts as Record<
  "2024" | "2026",
  Record<ActorLayer, number[]>
>;

export const locations = locationsJson;
export const kpis = kpisJson as Kpi[];
export const finance = financeJson;
export const financeFunnel = financeJson.funnel as FinanceMetric[];
export const timeline = timelineJson as TimelineEvent[];
export const actors = actorsJson as ActorEntry[];


export function countsFor(year: Year, layer: ActorLayer): number[] {
  return stageCounts[String(year) as "2024" | "2026"][layer];
}

export function changeFor(layer: ActorLayer): number[] {
  const a = countsFor(2024, layer);
  const b = countsFor(2026, layer);
  return a.map((v, i) => b[i] - v);
}

export function layerTotal(year: Year, layer: ActorLayer): number {
  return countsFor(year, layer).reduce((a, b) => a + b, 0);
}

export const LAYERS: ActorLayer[] = [
  "official",
  "ngo_international",
  "municipal",
  "community",
];

export function yearTotal(year: Year): number {
  return LAYERS.reduce(
    (sum, l) => sum + countsFor(year, l).reduce((s, v) => s + v, 0),
    0,
  );
}

/** Municipal power-gap module (grouped functional values). */
export const MUNICIPAL_POWER_GAP = [
  { fn: "Coordination and reporting", y2024: 6, y2026: 3 },
  { fn: "Damage assessment", y2024: 4, y2026: 2 },
  { fn: "Local clearance and enabling", y2024: 6, y2026: 3 },
  { fn: "Shelter and relief interface", y2024: 3, y2026: 4 },
  { fn: "Finance, reconstruction and oversight power", y2024: 0, y2026: 0 },
];

/*
 * The two standing cautions used to live here as English-only constants.
 * They now live once, in both languages, in `vocab.ts` as
 * cautionCounts(locale) and cautionMap(locale) - a second copy here is
 * how the site's most-repeated caveat ends up saying two things.
 */
