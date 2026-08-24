import sourcesJson from "@/data/report-sources.json";
import roleRecordsJson from "@/data/role-records.json";
import type { ActorLayer, RoleRecord, SourceRecord, Year } from "./types";

/**
 * The server-side slice of the tracking: the full entry log and the
 * source register. Browser components must never import from here - the
 * full log rides along with any symbol. Everything shared between the
 * server and browser slices lives in `data-client.ts` and is re-exported
 * below, so the two can never state different things.
 */
export {
  STAGES,
  LAYERS,
  stageCounts,
  countsFor,
  changeFor,
  yearTotal,
  layerTotal,
  ROLE_MIX_GROUPS,
  roleMixFor,
  MUNICIPAL_POWER_GAP,
  locations,
  kpis,
  finance,
  financeFunnel,
  timeline,
  actors,
  CAUTION_COUNTS,
  CAUTION_MAP,
} from "./data-client";

export const sources = sourcesJson as SourceRecord[];
export const roleRecords = roleRecordsJson as RoleRecord[];

const sourceById = new Map(sources.map((s) => [s.id, s]));
export function getSource(id: string): SourceRecord | undefined {
  return sourceById.get(id);
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
