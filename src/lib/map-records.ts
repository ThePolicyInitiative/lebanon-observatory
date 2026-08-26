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
  | "functionColumn"
  | "locationNames"
  | "regions"
  | "implementationStatus"
  | "comparability"
> & {
  action: string;
  /** The same action text in Arabic, for the Arabic map's popups. */
  actionAr?: string;
  locationNamesAr?: string[];
};

export const slimRecords = roleRecordsSlimJson as SlimRecord[];

/**
 * The implementation statuses entries actually carry.
 *
 * The shared vocabulary names nine, because it has to be able to label
 * whatever the data holds. Only four occur: not_verified (404), underway
 * (301), formal_mandate (54) and procurement (12). The filters were built
 * from the vocabulary, so a reader could select "Completed output",
 * "Announced", "Planned", "Finance committed" or "Finance disbursed" and
 * get an empty list every time.
 *
 * "Completed output" is the sharpest of those. This site's central finding
 * is that there was none by the cut-off - so offering it as a filter
 * suggested a populated category and then returned nothing, which reads as
 * a broken control rather than as the finding it actually is. The finding
 * belongs in the analysis, where it is stated plainly; it does not belong
 * in a dropdown that looks like it failed.
 *
 * Derived rather than listed, so a status appears in the filters the day an
 * entry carries it and disappears the day none does.
 */
export const STATUSES_IN_USE: ReadonlySet<string> = new Set(
  slimRecords.map((r) => r.implementationStatus).filter(Boolean),
);

/**
 * The comparability grades any entry actually carries.
 *
 * The same problem as the statuses above, in its sharpest form: the map's
 * comparability control offered four grades, and every one of the 771
 * entries is "qualified". Three of the four therefore removed every entry
 * pin in both years, leaving the episode pins - which the filter does not
 * touch - still on the map. So the map stayed populated while the
 * reader's selection had quietly emptied it, which is worse than looking
 * broken: it looks like an answer.
 *
 * The fourth grade selects everything, so the control cannot discriminate
 * at all. The map hides it while that is true and brings it back the day
 * a second grade appears, which is why this is derived rather than a
 * decision written down once.
 */
export const COMPARABILITY_IN_USE: ReadonlySet<string> = new Set(
  slimRecords.map((r) => r.comparability).filter(Boolean),
);
