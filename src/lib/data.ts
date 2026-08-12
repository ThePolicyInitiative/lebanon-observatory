import stageCountsJson from "@/data/stage-counts.json";
import locationsJson from "@/data/locations.json";
import kpisJson from "@/data/kpis.json";
import financeJson from "@/data/finance.json";
import timelineJson from "@/data/timeline.json";
import sourcesJson from "@/data/report-sources.json";
import roleRecordsJson from "@/data/role-records.json";
import roleRecordsSlimJson from "@/data/role-records-slim.json";
import actorsJson from "@/data/actors.json";
import catalogJson from "@/data/catalog-sources.json";
import gazetteerJson from "@/data/gazetteer.json";
import type {
  ActorEntry,
  ActorLayer,
  CatalogSource,
  FinanceMetric,
  Kpi,
  RoleRecord,
  SourceRecord,
  TimelineEvent,
  Year,
} from "./types";

export const STAGES: string[] = stageCountsJson.stages;

export const STAGE_SHORT: string[] = [
  "Strategy & coordination",
  "Finance & compensation",
  "Assessment",
  "Safety & access",
  "Procurement",
  "Rubble clearance",
  "Debris treatment",
  "Reconstruction & services",
  "Shelter & return",
  "Relief & protection",
  "Livelihoods & recovery",
  "Oversight",
];

export const LAYERS: ActorLayer[] = [
  "official",
  "ngo_international",
  "municipal",
  "community",
];

export const stageCounts = stageCountsJson.counts as Record<
  "2024" | "2026",
  Record<ActorLayer, number[]>
>;

export const stageCountsNote = stageCountsJson.note;

export function countsFor(year: Year, layer: ActorLayer): number[] {
  return stageCounts[String(year) as "2024" | "2026"][layer];
}

/** 2026 minus 2024 traced actor-stage presence. */
export function changeFor(layer: ActorLayer): number[] {
  const a = countsFor(2024, layer);
  const b = countsFor(2026, layer);
  return a.map((v, i) => b[i] - v);
}

export function yearTotal(year: Year): number {
  return LAYERS.reduce(
    (sum, l) => sum + countsFor(year, l).reduce((s, v) => s + v, 0),
    0,
  );
}

export function layerTotal(year: Year, layer: ActorLayer): number {
  return countsFor(year, layer).reduce((s, v) => s + v, 0);
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

/** Municipal power-gap module (grouped functional values, from the analytical dataset). */
export const MUNICIPAL_POWER_GAP = [
  { fn: "Coordination and reporting", y2024: 6, y2026: 3 },
  { fn: "Damage assessment", y2024: 4, y2026: 2 },
  { fn: "Local clearance and enabling", y2024: 6, y2026: 3 },
  { fn: "Shelter and relief interface", y2024: 3, y2026: 4 },
  { fn: "Finance, reconstruction and oversight power", y2024: 0, y2026: 0 },
];

export const locations = locationsJson;
export const kpis = kpisJson as Kpi[];
export const finance = financeJson;
export const financeFunnel = financeJson.funnel as FinanceMetric[];
export const timeline = timelineJson as TimelineEvent[];
export const sources = sourcesJson as SourceRecord[];
export const roleRecords = roleRecordsJson as RoleRecord[];

/**
 * Slim projection of the dataset for client components that need
 * identity and classification but not the long narrative text: half the
 * payload of the full set. `hay` is a lower-cased excerpt prefix used
 * only for locality matching on the map.
 */
export type SlimRecord = Pick<
  RoleRecord,
  | "id"
  | "year"
  | "actorName"
  | "actorLayer"
  | "actorSubtype"
  | "stage"
  | "stageNo"
  | "locationNames"
  | "implementationStatus"
  | "comparability"
> & { hay: string };

export const slimRecords = roleRecordsSlimJson as SlimRecord[];
export const actors = actorsJson as ActorEntry[];
export const catalogSources = catalogJson as CatalogSource[];
export const gazetteer = gazetteerJson;

const sourceById = new Map(sources.map((s) => [s.id, s]));
export function getSource(id: string): SourceRecord | undefined {
  return sourceById.get(id);
}

const catalogById = new Map(catalogSources.map((c) => [c.id, c]));
export function getCatalogSource(id: string): CatalogSource | undefined {
  return catalogById.get(id);
}

export function recordsForCell(
  layer: ActorLayer,
  stageNo: number,
  year?: Year,
): RoleRecord[] {
  return roleRecords.filter(
    (r) =>
      r.actorLayer === layer &&
      r.stageNo === stageNo &&
      (year === undefined || r.year === year),
  );
}

export function recordsForLocality(name: string): RoleRecord[] {
  const needle = name.toLowerCase().split("(")[0].trim();
  return roleRecords.filter((r) =>
    r.locationNames.some((l) => l.toLowerCase().includes(needle)) ||
    r.evidenceExcerpt.toLowerCase().includes(needle),
  );
}

/**
 * Shared wording and derivations live in `data-client.ts` so the server
 * and browser slices of the site can never state different things.
 */
export { CAUTION_COUNTS, CAUTION_MAP } from "./data-client";

export const EVIDENCE_CUTOFF = "31 July 2026";
