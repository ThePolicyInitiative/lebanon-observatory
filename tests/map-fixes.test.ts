import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dissolveBoundary, AFFECTED_ZONE_IDS, zoneForCodAdm1, type GeoFeature } from "@/lib/geo";

const gj = JSON.parse(
  readFileSync(join(process.cwd(), "public", "geo", "lebanon-adm3.geojson"), "utf-8"),
) as { features: GeoFeature[] };

describe("map boundary alignment", () => {
  it("dissolves district outlines from the town polygons themselves", () => {
    const south = gj.features.filter(
      (f) => String(f.properties.adm2_name ?? "") === "Bent Jbeil",
    );
    expect(south.length).toBeGreaterThan(20);
    const d = dissolveBoundary(south);
    expect(d.startsWith("M")).toBe(true);
    // A dissolved outline is far shorter than the sum of every town edge.
    const allEdges = dissolveBoundary(south.slice(0, 1));
    expect(d.length).toBeGreaterThan(allEdges.length);
  });

  it("returns an empty path for an empty group", () => {
    expect(dissolveBoundary([])).toBe("");
  });
});

describe("town identity", () => {
  it("has duplicate town names, so hover must key on polygon identity", () => {
    const counts = new Map<string, number>();
    for (const f of gj.features) {
      const n = String(f.properties.adm3_name ?? "");
      if (!n || n === "Conflict") continue;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    // "Litige" (disputed) repeats dozens of times: name is not an id.
    expect(counts.get("Litige")).toBeGreaterThan(20);
    const uids = new Set(gj.features.map((f, i) => `${f.properties.adm3_name}#${i}`));
    expect(uids.size).toBe(gj.features.length);
  });
});

describe("affected-zone focus", () => {
  it("covers south, Beirut/Mount Lebanon and Bekaa but not the north", () => {
    expect(AFFECTED_ZONE_IDS).toContain("south_nabatieh");
    expect(AFFECTED_ZONE_IDS).toContain("beirut_mount_lebanon");
    expect(AFFECTED_ZONE_IDS).toContain("bekaa_baalbek_hermel");
    expect(AFFECTED_ZONE_IDS).not.toContain("north");
    expect(zoneForCodAdm1("Akkar")).toBe("north");
    expect(AFFECTED_ZONE_IDS.includes(zoneForCodAdm1("Akkar"))).toBe(false);
    expect(AFFECTED_ZONE_IDS.includes(zoneForCodAdm1("El Nabatieh"))).toBe(true);
  });
});
