import { describe, expect, it } from "vitest";
import {
  STAGES,
  LAYERS,
  stageCounts,
  countsFor,
  changeFor,
  yearTotal,
  layerTotal,
  MUNICIPAL_POWER_GAP,
  locations,
  kpis,
  financeFunnel,
  timeline,
  sources,
  roleRecords,
  getSource,
} from "@/lib/data";
import {
  kpiSchema,
  roleRecordSchema,
  sourceRecordSchema,
  stageCountsSchema,
} from "@/lib/schemas";
import stageCountsJson from "@/data/stage-counts.json";

describe("analytical dataset integrity", () => {
  it("has exactly twelve stages in the specified order", () => {
    expect(STAGES).toHaveLength(12);
    expect(STAGES[0]).toBe("Strategy and coordination");
    expect(STAGES[4]).toBe("Procurement and contracting");
    expect(STAGES[11]).toBe("Oversight and accountability");
  });

  it("validates the stage-counts file against its schema", () => {
    expect(() => stageCountsSchema.parse(stageCountsJson)).not.toThrow();
  });

  it("matches the confirmed 2024 total of 343 actor-stage records", () => {
    expect(yearTotal(2024)).toBe(343);
  });

  it("matches the seeded 2026 total of 360 (difference vs 363 is flagged in methodology)", () => {
    expect(yearTotal(2026)).toBe(360);
  });

  it("reproduces the layer totals cited in the analysis", () => {
    expect(layerTotal(2024, "municipal")).toBe(19);
    expect(layerTotal(2026, "municipal")).toBe(12);
    expect(layerTotal(2024, "ngo_international")).toBe(80);
    expect(layerTotal(2024, "community")).toBe(145);
    expect(layerTotal(2026, "community")).toBe(172);
  });

  it("reproduces the specified international-agency changes", () => {
    const change = changeFor("ngo_international");
    expect(change[0]).toBe(8); // strategy +8
    expect(change[2]).toBe(-7); // assessment -7
    expect(change[4]).toBe(1); // procurement +1
    expect(change[8]).toBe(4); // shelter +4
    expect(change[9]).toBe(5); // relief +5
    expect(change[11]).toBe(3); // oversight +3
  });

  it("reproduces the specified community changes", () => {
    const change = changeFor("community");
    expect(change[9]).toBe(35); // relief +35
    expect(change[0]).toBe(25); // strategy +25
    expect(change[8]).toBe(7); // shelter +7
    expect(change[1]).toBe(-11); // finance -11
    expect(change[5]).toBe(-9); // rubble -9
    expect(change[6]).toBe(-5); // debris -5
    expect(change[7]).toBe(-5); // reconstruction -5
  });

  it("reproduces the official-institution shifts", () => {
    expect(countsFor(2024, "official")[7]).toBe(8);
    expect(countsFor(2026, "official")[7]).toBe(13);
    expect(countsFor(2024, "official")[4]).toBe(4);
    expect(countsFor(2026, "official")[4]).toBe(5);
    expect(countsFor(2024, "official")[11]).toBe(3);
    expect(countsFor(2026, "official")[11]).toBe(4);
    expect(countsFor(2024, "official")[1]).toBe(15);
    expect(countsFor(2026, "official")[1]).toBe(7);
  });

  it("shows zero municipal finance, reconstruction-authority and oversight power in both years", () => {
    for (const year of [2024, 2026] as const) {
      expect(countsFor(year, "municipal")[1]).toBe(0); // finance
      expect(countsFor(year, "municipal")[7]).toBe(0); // reconstruction & services
      expect(countsFor(year, "municipal")[11]).toBe(0); // oversight
    }
    const powerRow = MUNICIPAL_POWER_GAP.find((r) => r.fn.includes("Finance"));
    expect(powerRow?.y2024).toBe(0);
    expect(powerRow?.y2026).toBe(0);
  });

  it("keeps every layer present for both years", () => {
    for (const year of ["2024", "2026"] as const) {
      for (const layer of LAYERS) {
        expect(stageCounts[year][layer]).toHaveLength(12);
      }
    }
  });
});

describe("location mentions", () => {
  it("matches the specified 2024 and 2026 tables at spot-check points", () => {
    expect(locations.mentions["2024"].south_nabatieh.community).toBe(55);
    expect(locations.mentions["2024"].national_multi.official).toBe(77);
    expect(locations.mentions["2024"].named_localities.community).toBe(52);
    expect(locations.mentions["2026"].south_nabatieh.official).toBe(34);
    expect(locations.mentions["2026"].national_multi.ngo_international).toBe(79);
    expect(locations.mentions["2026"].named_localities.community).toBe(62);
  });

  /**
   * Neither war reached the northern governorates, so the north is not a
   * grouping at all: not a row that reads zero, not a filter that returns
   * nothing, not an empty bar. This guards the whole shape of that rule -
   * no northern grouping in the table, and no entry tagged to one.
   */
  it("carries no northern grouping and tags no entry to one", () => {
    for (const year of ["2024", "2026"] as const) {
      expect(
        Object.keys(locations.mentions[year]),
        `${year} mentions still carry a northern grouping`,
      ).not.toContain("north");
    }
    expect(
      locations.regions.map((r) => r.id),
      "locations.json still declares a northern region",
    ).not.toContain("north");
    expect(
      roleRecords.filter((r) => (r.regions ?? []).includes("north")).map((r) => r.id),
      "entries still tagged to the north",
    ).toEqual([]);
  });
});

describe("KPIs and finance", () => {
  it("validates every KPI against the schema (definition, period, scope, source, kind)", () => {
    for (const kpi of kpis) {
      expect(() => kpiSchema.parse(kpi)).not.toThrow();
    }
  });

  it("carries the core figures with correct magnitudes", () => {
    const byId = new Map(kpis.map((k) => [k.id, k]));
    expect(byId.get("kpi-total-cost")?.value).toBe(14_000_000_000);
    expect(byId.get("kpi-needs")?.value).toBe(11_000_000_000);
    expect(byId.get("kpi-leap-framework")?.value).toBe(1_000_000_000);
    expect(byId.get("kpi-leap-loan")?.value).toBe(250_000_000);
    expect(byId.get("kpi-disbursed")?.value).toBe(4_130_000);
    expect(byId.get("kpi-disbursed-pct")?.value).toBe(1.65);
  });

  it("keeps the funnel arithmetic honest", () => {
    const framework = financeFunnel.find((f) => f.id === "framework")!;
    const approved = financeFunnel.find((f) => f.id === "approved")!;
    const disbursed = financeFunnel.find((f) => f.id === "disbursed")!;
    expect(framework.pctOfNeed).toBeCloseTo(9.09, 2);
    expect(approved.pctOfNeed).toBeCloseTo(2.27, 2);
    expect(disbursed.pctOfLoan).toBeCloseTo(1.65, 2);
    expect((disbursed.amountUsd / 11_000_000_000) * 100).toBeLessThan(0.05);
  });

  it("never marks contracted works or confirmed output as completed", () => {
    for (const step of financeFunnel.filter((f) => f.amountUsd === 0)) {
      expect(step.status).toBe("not_verified");
    }
  });
});

describe("sources and citations", () => {
  it("validates every source record", () => {
    for (const s of sources) {
      expect(() => sourceRecordSchema.parse(s)).not.toThrow();
    }
  });

  it("resolves every sourceId cited by KPIs, funnel steps and timeline events", () => {
    const cited = new Set<string>([
      ...kpis.flatMap((k) => k.sourceIds),
      ...financeFunnel.flatMap((f) => f.sourceIds),
      ...timeline.flatMap((t) => t.sourceIds),
    ]);
    for (const id of cited) {
      expect(getSource(id), `missing source ${id}`).toBeDefined();
    }
  });
});

describe("evidence log", () => {
  it("validates every role record against the schema", () => {
    for (const r of roleRecords) {
      const parsed = roleRecordSchema.safeParse(r);
      expect(parsed.success, `invalid record ${r.id}`).toBe(true);
    }
  });

  it("contains records for both years and all four layers", () => {
    const years = new Set(roleRecords.map((r) => r.year));
    const layers = new Set(roleRecords.map((r) => r.actorLayer));
    expect(years).toEqual(new Set([2024, 2026]));
    expect(layers.size).toBe(4);
  });

  it("never marks any record as completed output (none was confirmed)", () => {
    expect(roleRecords.some((r) => r.implementationStatus === "completed")).toBe(false);
  });
});
