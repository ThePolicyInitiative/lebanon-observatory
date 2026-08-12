import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import districtDamage from "@/data/district-damage.json";
import humanToll from "@/data/human-toll.json";
import leapResults from "@/data/leap-results.json";
import serviceImpact from "@/data/service-impact.json";
import webUpdates from "@/data/web-updates.json";
import destruction from "@/data/destruction.json";
import reportSources from "@/data/report-sources.json";

/** Whole-dataset revalidation: arithmetic, cross-file agreement and links. */

describe("2024 municipal survey", () => {
  it("asset categories sum to the reported total", () => {
    const t = districtDamage.totals;
    expect(
      t.housingUnits + t.businessEstablishments + t.agriculturalAssets + t.infrastructureAssets,
    ).toBe(t.reportedAssets);
  });

  it("named district units sum to the stated subtotal and stay under the housing total", () => {
    const sum = districtDamage.districts.reduce((a, d) => a + d.units, 0);
    expect(sum).toBe(districtDamage.namedDistrictSubtotal);
    expect(sum).toBeLessThan(districtDamage.totals.housingUnits);
  });

  it("agrees with the destruction dataset's municipal-survey track", () => {
    const track = destruction.tracks2024.find((x) => x.id === "municipal-survey")!;
    expect(track.headline).toContain(
      districtDamage.totals.housingUnits.toLocaleString("en-US"),
    );
    // Baabda's 16,000 units and 63% complete share appear in both.
    const baabda = districtDamage.districts.find((d) => d.name === "Baabda")!;
    expect(baabda.units).toBe(16000);
    expect(baabda.completeShare).toBe(63);
    expect(track.detail).toContain("16,000");
    expect(track.detail).toContain("63%");
  });

  it("maps every district onto a real boundary-layer district name", () => {
    const gj = JSON.parse(
      readFileSync(join(process.cwd(), "public", "geo", "lebanon-adm3.geojson"), "utf-8"),
    ) as { features: { properties: Record<string, string | null> }[] };
    const names = new Set(gj.features.map((f) => f.properties.adm2_name));
    for (const d of districtDamage.districts) {
      expect(names.has(d.codName), `unknown district ${d.codName}`).toBe(true);
    }
  });
});

describe("human toll", () => {
  it("keeps the two wars in separate panels with their own dates", () => {
    expect(humanToll.war2026.asOf).toBe("2026-07-15");
    expect(humanToll.war2026.items.length).toBeGreaterThanOrEqual(5);
    expect(humanToll.shelter2024.items.length).toBeGreaterThanOrEqual(5);
    for (const i of [...humanToll.war2026.items, ...humanToll.shelter2024.items]) {
      expect(i.reporter.length).toBeGreaterThan(2);
      expect(i.detail.length).toBeGreaterThan(10);
    }
  });

  it("reports returns as movement, never as durable return", () => {
    const returns = humanToll.war2026.items.find((i) => i.label === "Reported returns")!;
    expect(returns.detail.toLowerCase()).toContain("not proof of durable return");
  });
});

describe("LEAP results board", () => {
  it("carries only known status values and a target for every indicator", () => {
    const allowed = new Set(["zero", "process", "missed", "baseline"]);
    for (const r of leapResults.indicators) {
      expect(allowed.has(r.status), `bad status ${r.status}`).toBe(true);
      expect(r.target.length).toBeGreaterThan(0);
      expect(r.resultJune2026.length).toBeGreaterThan(0);
    }
    expect(leapResults.asOf).toBe("2026-06-29");
  });
});

describe("service impact and web updates", () => {
  it("attributes every service figure to a reporter", () => {
    for (const i of serviceImpact.items) {
      expect(i.reporter.length).toBeGreaterThan(2);
      expect(i.figure.length).toBeGreaterThan(0);
    }
  });

  it("gives every web-sourced update a resolvable https source", () => {
    for (const u of webUpdates.updates) {
      expect(u.sourceUrl.startsWith("https://"), `bad url ${u.sourceUrl}`).toBe(true);
      expect(u.sourceName.length).toBeGreaterThan(2);
      expect(["official", "municipal", "ngo_international", "community"]).toContain(u.layer);
    }
  });
});

describe("source integrity", () => {
  /**
   * Wording passes over the datasets must never touch URLs. These
   * tokens are the fingerprints of past rewrites: "files" turned into
   * "dossiers", "documents" into "reports"/"entries".
   */
  const CORRUPTION =
    /\/dossiers\/|dossiers\.|\/entries\/|entries\.worldbank|\/traced\/|\/reports\/CBP|sites\/default\/reports\/|unicef\.org\/reports\//;

  it("keeps every source link https and structurally intact", () => {
    for (const s of reportSources) {
      if (!s.url) continue;
      expect(s.url.startsWith("https://"), `bad url on ${s.id}: ${s.url}`).toBe(true);
      expect(CORRUPTION.test(s.url), `corrupted path on ${s.id}: ${s.url}`).toBe(false);
    }
  });

  it("keeps every catalogue link intact too", () => {
    const dir = join(process.cwd(), "src", "data");
    const catalog = JSON.parse(
      readFileSync(join(dir, "catalog-sources.json"), "utf-8"),
    ) as { urls?: string[] }[];
    const urls = catalog.flatMap((c) => c.urls ?? []);
    expect(urls.length).toBeGreaterThan(20);
    for (const u of urls) {
      if (!/^https?:/.test(u)) continue;
      expect(CORRUPTION.test(u), `corrupted catalogue url: ${u}`).toBe(false);
    }
  });
});

describe("every data file parses", () => {
  it("loads all JSON in src/data without error", () => {
    const dir = join(process.cwd(), "src", "data");
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThan(10);
    for (const f of files) {
      expect(() => JSON.parse(readFileSync(join(dir, f), "utf-8")), `invalid ${f}`).not.toThrow();
    }
  });
});
