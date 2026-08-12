import stageCountsJson from "@/data/stage-counts.json";
import locationsJson from "@/data/locations.json";
import gazetteerJson from "@/data/gazetteer.json";
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
 * The client-side slice of the dataset. Deliberately separate from
 * `data.ts`: that module also pulls the full dataset, the actor
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
export const gazetteer = gazetteerJson;
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

/** Stage groupings used by the actor role-mix comparison. */
export const ROLE_MIX_GROUPS: { id: string; label: string; stages: number[] }[] = [
  { id: "governance", label: "Governance & assessment (stages 1–4)", stages: [0, 1, 2, 3] },
  { id: "works", label: "Works delivery (stages 5–8)", stages: [4, 5, 6, 7] },
  { id: "recovery", label: "Return & recovery (stages 9–11)", stages: [8, 9, 10] },
  { id: "oversight", label: "Oversight (stage 12)", stages: [11] },
];

export function roleMixFor(year: Year, layer: ActorLayer) {
  const counts = countsFor(year, layer);
  const total = counts.reduce((s, v) => s + v, 0);
  return ROLE_MIX_GROUPS.map((g) => {
    const value = g.stages.reduce((s, i) => s + counts[i], 0);
    return {
      group: g.label,
      value,
      pct: total === 0 ? 0 : (value / total) * 100,
    };
  });
}

/** Municipal power-gap module (grouped functional values). */
export const MUNICIPAL_POWER_GAP = [
  { fn: "Coordination and reporting", y2024: 6, y2026: 3 },
  { fn: "Damage assessment", y2024: 4, y2026: 2 },
  { fn: "Local clearance and enabling", y2024: 6, y2026: 3 },
  { fn: "Shelter and relief interface", y2024: 3, y2026: 4 },
  { fn: "Finance, reconstruction and oversight power", y2024: 0, y2026: 0 },
];

export const CAUTION_COUNTS =
  "Counts measure traced actor-stage presence. They do not measure expenditure, effectiveness, beneficiaries, geographic coverage or completed output. The 2026 data also identifies some community and volunteer actors more granularly than the 2024 data.";

export const CAUTION_MAP =
  "Geography shows where activity was traced, not where damage or need was greatest. Regional groupings differ in size, population and reporting intensity; absence of a marker means absence of data, never absence of damage.";
