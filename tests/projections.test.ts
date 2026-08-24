import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import roleRecords from "@/data/role-records.json";
import { slimRecords } from "@/lib/map-records";

/**
 * The full log in role-records.json is projected twice for the browser:
 * role-records-slim.json (the map) and public/cells/*.json (the change
 * heatmap's drawer). Both are checked-in files with no generator, so
 * these tests are the regeneration guard: a hand edit to the log that
 * skips a projection fails here instead of silently desyncing pages.
 */

const LAYERS = ["official", "ngo_international", "municipal", "community"];

describe("slim projection stays in sync with the full log", () => {
  const byId = new Map(roleRecords.map((r) => [r.id, r]));

  it("has exactly the ids of the full log", () => {
    expect(slimRecords.length).toBe(roleRecords.length);
    for (const s of slimRecords) {
      expect(byId.has(s.id), `slim id ${s.id} missing from the full log`).toBe(
        true,
      );
    }
  });

  it("agrees with the full log on every shared field", () => {
    for (const s of slimRecords) {
      const full = byId.get(s.id)!;
      for (const field of [
        "year",
        "actorName",
        "actorLayer",
        "actorSubtype",
        "stage",
        "stageNo",
        "implementationStatus",
        "comparability",
      ] as const) {
        expect(s[field], `${s.id}.${field}`).toEqual(full[field]);
      }
      expect(s.locationNames, `${s.id}.locationNames`).toEqual(
        full.locationNames,
      );
    }
  });
});

describe("heatmap cell files stay in sync with the full log", () => {
  it("partitions all entries across the 48 cells with the drawer fields", () => {
    let total = 0;
    for (const layer of LAYERS) {
      for (let stageNo = 1; stageNo <= 12; stageNo++) {
        const file = join(
          __dirname,
          "..",
          "public",
          "cells",
          `${layer}-${stageNo}.json`,
        );
        const cell = JSON.parse(readFileSync(file, "utf8")) as {
          id: string;
          year: number;
          actorName: string;
          functionColumn: string;
          implementationStatus: string;
          locationNames: string[];
          summary: string;
        }[];
        const expected = roleRecords
          .filter((r) => r.actorLayer === layer && r.stageNo === stageNo)
          .map((r) => ({
            id: r.id,
            year: r.year,
            actorName: r.actorName,
            functionColumn: r.functionColumn,
            implementationStatus: r.implementationStatus,
            locationNames: r.locationNames,
            summary: r.summary,
          }));
        expect(cell, `${layer}-${stageNo}.json`).toEqual(expected);
        total += cell.length;
      }
    }
    expect(total).toBe(roleRecords.length);
  });
});
