import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { COMPARABILITY_IN_USE, STATUSES_IN_USE, slimRecords } from "@/lib/map-records";

/**
 * A filter option that matches nothing is worse than a missing one.
 *
 * The map's comparability control offered four grades and every entry
 * carries the same one, so three of the four removed every entry pin in
 * both years - while the episode pins, which no filter touches, stayed on
 * screen. The map went on looking populated after the reader's selection
 * had emptied it, which reads as an answer rather than as a broken
 * control.
 *
 * Both sets are derived from the tracking rather than written down, so an
 * option appears the day an entry carries it and goes the day none does.
 * These tests hold the derivation and the two things that follow from it.
 */
describe("filters offer only what the tracking carries", () => {
  it("derives each set from the entries, with nothing left over", () => {
    const statuses = new Set(slimRecords.map((r) => r.implementationStatus).filter(Boolean));
    const grades = new Set(slimRecords.map((r) => r.comparability).filter(Boolean));
    expect([...STATUSES_IN_USE].sort()).toEqual([...statuses].sort());
    expect([...COMPARABILITY_IN_USE].sort()).toEqual([...grades].sort());
  });

  it("finds every entry under some offered value", () => {
    // The property that makes the filter honest: no entry is unreachable.
    for (const r of slimRecords) {
      expect(STATUSES_IN_USE.has(r.implementationStatus)).toBe(true);
      expect(COMPARABILITY_IN_USE.has(r.comparability)).toBe(true);
    }
  });

  it("hides a control that cannot discriminate", () => {
    // With one grade across all 771 entries the control can only show
    // everything or nothing, so the map does not render it. If the data
    // ever gains a second grade this fails, and the guard around the
    // select is what brings it back - so read this as a reminder to check
    // the map rather than as a rule the data must obey.
    const src = readFileSync("src/components/map/LebanonMap.tsx", "utf8");
    expect(src).toContain("COMPARABILITY_IN_USE.size > 1");
    if (COMPARABILITY_IN_USE.size === 1) {
      expect(
        [...COMPARABILITY_IN_USE][0],
        "the single grade every entry carries has changed",
      ).toBe("qualified");
    }
  });

  it("ignores a filter value nothing carries, rather than emptying the map", () => {
    // A stale link can still name a grade that is no longer offered. The
    // predicate treats an unoffered value as no filter, because acting on
    // it would leave the reader an empty map and no control to undo it.
    const src = readFileSync("src/components/map/LebanonMap.tsx", "utf8");
    expect(src).toMatch(/STATUSES_IN_USE\.has\(statusFilter\)/);
    expect(src).toMatch(/COMPARABILITY_IN_USE\.has\(comparabilityFilter\)/);
  });
});
