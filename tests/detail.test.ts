import { describe, expect, it } from "vitest";
import sectors from "@/data/sectors.json";
import destruction from "@/data/destruction.json";
import compensation from "@/data/compensation.json";
import timeline from "@/data/timeline.json";
import { getSource } from "@/lib/data";

describe("sector estimates", () => {
  it("carries the confirmed headline figures", () => {
    const byId = new Map(sectors.sectors.map((s) => [s.id, s]));
    expect(byId.get("housing")?.damage).toBe(4600);
    expect(byId.get("commerce")?.losses).toBe(3400);
    expect(byId.get("agriculture")).toMatchObject({ damage: 118, losses: 586, needs: 263 });
    expect(byId.get("health")).toMatchObject({ damage: 208, losses: 700 });
    expect(byId.get("environment")).toMatchObject({ damage: 512, losses: 790, needs: 444 });
    expect(byId.get("transport")?.damage).toBe(198);
    expect(byId.get("electricity")?.damage).toBe(98);
    expect(byId.get("municipal")?.damage).toBe(41);
  });

  it("uses null (not zero) where the source states no figure", () => {
    const housing = sectors.sectors.find((s) => s.id === "housing")!;
    expect(housing.losses).toBeNull();
    expect(housing.needs).toBeNull();
  });

  it("cites resolvable sources for every sector", () => {
    for (const s of sectors.sectors) {
      expect(s.sourceIds.length).toBeGreaterThan(0);
      for (const id of s.sourceIds) {
        expect(getSource(id), `missing source ${id}`).toBeDefined();
      }
    }
  });
});

describe("destruction evidence", () => {
  it("keeps all four 2024 tracks marked non-comparable (never averaged)", () => {
    expect(destruction.tracks2024).toHaveLength(4);
    for (const t of destruction.tracks2024) {
      expect(t.comparability).toBe("not_comparable");
      for (const id of t.sourceIds) {
        expect(getSource(id), `missing source ${id}`).toBeDefined();
      }
    }
  });

  it("keeps both 2026 zones non-cumulative with 2024 and method-distinct", () => {
    expect(destruction.zones2026).toHaveLength(2);
    const [south, bml] = destruction.zones2026;
    expect(south.checkedBy).toBe("Desk-validated");
    expect(bml.checkedBy).toContain("Field-checked");
    for (const z of destruction.zones2026) {
      expect(z.comparability).toBe("not_comparable");
    }
  });

  it("carries the confirmed worst-cadaster counts", () => {
    const south = destruction.zones2026.find((z) => z.id === "south-litani")!;
    const byName = new Map(south.worstCadasters.map((c) => [c.name, c.destroyed]));
    expect(byName.get("Aaitaroun")).toBe(1658);
    expect(byName.get("Bent Jbeil")).toBe(1076);
    expect(byName.get("Meiss Ej Jabal")).toBe(969);
    expect(byName.get("Taybe")).toBe(824);
  });

  it("labels the presidential estimate as context only", () => {
    expect(destruction.presidentialEstimate.comparability).toBe("context_only");
  });
});

describe("compensation tracks", () => {
  it("asserts no confirmed state payment and no audited parallel figure", () => {
    expect(compensation.stateTrack.confirmedPayments).toContain("None confirmed");
    expect(compensation.parallelTrack.confirmedPayments).toContain("unauditable");
  });

  it("labels every instrument with an evidence level", () => {
    for (const track of [compensation.stateTrack, compensation.parallelTrack]) {
      for (const i of track.instruments) {
        expect(i.evidenceLevel.length).toBeGreaterThan(0);
      }
    }
  });

  it("excludes the unauditable US$400M aggregate rather than repeating it as fact", () => {
    const flows = compensation.parallelTrack.instruments.find((i) => i.id === "reported-flows")!;
    expect(flows.detail).toContain("excluded as unauditable");
  });
});

describe("enriched timeline", () => {
  it("includes the 2025 political conversions and 2026 conflict gates", () => {
    const labels = timeline.map((t) => t.label).join(" | ");
    expect(labels).toContain("Aoun");
    expect(labels).toContain("Salam government");
    expect(labels).toContain("Law 22/2025");
    expect(labels).toContain("US-brokered truce");
    expect(labels).toContain("ceasefire");
  });

  it("resolves every cited source", () => {
    for (const t of timeline) {
      for (const id of t.sourceIds) {
        expect(getSource(id), `missing source ${id} on ${t.id}`).toBeDefined();
      }
    }
  });

  it("keeps month-precision events explicitly labelled", () => {
    const monthPrecision = timeline.filter((t) => t.label.includes("dated to month") || t.label.includes("day not specified"));
    expect(monthPrecision.length).toBeGreaterThanOrEqual(2);
  });
});
