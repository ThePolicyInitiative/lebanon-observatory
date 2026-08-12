import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALITY_EVENTS, eventsByTown, eventsFor, EVENT_KIND_META } from "@/lib/events";
import gazetteer from "@/data/gazetteer.json";

describe("recorded map episodes (what happened where)", () => {
  const gazetteerNames = new Set(gazetteer.localities.map((l) => l.name));

  it("anchors every episode entry to a real gazetteer locality (so it has a pin)", () => {
    for (const l of LOCALITY_EVENTS) {
      expect(gazetteerNames.has(l.name), `no gazetteer pin for ${l.name}`).toBe(true);
    }
  });

  it("uses only valid years, kinds and substantive text", () => {
    for (const l of LOCALITY_EVENTS) {
      expect(l.events.length).toBeGreaterThan(0);
      for (const e of l.events) {
        expect([2024, 2026]).toContain(e.year);
        expect(Object.keys(EVENT_KIND_META)).toContain(e.kind);
        expect(e.text.length).toBeGreaterThan(30);
        if (e.date) {
          expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(e.date.startsWith(String(e.year)) || e.year === 2024).toBe(true);
        }
      }
    }
  });

  it("maps every townName to a real COD ADM3 town so town clicks find their events", () => {
    const gj = JSON.parse(
      readFileSync(join(process.cwd(), "public", "geo", "lebanon-adm3.geojson"), "utf-8"),
    ) as { features: { properties: Record<string, string | null> }[] };
    const adm3Names = new Set(gj.features.map((f) => f.properties.adm3_name));
    for (const [town] of eventsByTown) {
      expect(adm3Names.has(town), `town spelling '${town}' not in ADM3 data`).toBe(true);
    }
  });

  it("filters and sorts episodes by year", () => {
    const nabatieh = LOCALITY_EVENTS.find((l) => l.name === "Nabatieh")!;
    const y2024 = eventsFor(nabatieh, 2024);
    const y2026 = eventsFor(nabatieh, 2026);
    expect(y2024.length).toBeGreaterThanOrEqual(3);
    expect(y2026.length).toBeGreaterThanOrEqual(2);
    for (const e of y2024) expect(e.year).toBe(2024);
    const dates = y2024.filter((e) => e.date).map((e) => e.date!);
    expect([...dates].sort()).toEqual(dates);
  });

  it("keeps the key recorded episodes present", () => {
    const all = LOCALITY_EVENTS.flatMap((l) => l.events.map((e) => e.text)).join(" | ");
    expect(all).toContain("600 truckloads");
    expect(all).toContain("Recovery Project");
    expect(all).toContain("UNIFIL");
    expect(all).toContain("1,658");
    expect(all).toContain("5,000 business owners");
  });
});
