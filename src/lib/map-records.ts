import roleRecordsSlimJson from "@/data/role-records-slim.json";
import type { RoleRecord } from "./types";

/**
 * The map's own projection of the tracking, in its own module so
 * that pages which never open the map do not download it, and the map
 * does not download the full narrative text it never renders.
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
> & { action: string };

export const slimRecords = roleRecordsSlimJson as SlimRecord[];
