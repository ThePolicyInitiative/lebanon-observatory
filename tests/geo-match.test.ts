import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildLocationIndex, matchLocations } from "@/lib/geo-match";
import roleRecords from "@/data/role-records.json";
import destruction from "@/data/destruction.json";

const gj = JSON.parse(
  readFileSync(join(process.cwd(), "public", "geo", "lebanon-adm3.geojson"), "utf-8"),
) as { features: { properties: Record<string, string | null> }[] };

const towns = gj.features.map((f) => ({
  name: String(f.properties.adm3_name ?? ""),
  district: String(f.properties.adm2_name ?? ""),
}));
const index = buildLocationIndex(towns);

function firstTown(loc: string): string | undefined {
  return [...matchLocations(index, [loc]).towns][0];
}
function districtsOf(loc: string): string[] {
  return [...matchLocations(index, [loc]).districts];
}

describe("location matching", () => {
  it("resolves transliteration variants to COD town spellings", () => {
    expect(firstTown("Tayr Debba")).toBe("Tayr Debbeh");
    expect(firstTown("Shahabiya")).toBe("Chehabiyeh");
    expect(firstTown("Jibsheet")).toBe("Jibchit");
    expect(firstTown("Habboush")).toBe("Habbouch En-Nabatiyeh");
    expect(firstTown("Kfarkela")).toBe("Kfar Kila");
    expect(firstTown("Shaqra")).toBe("Chaqra");
    expect(firstTown("Meiss al-Jabal")).toBe("Meiss Ej-Jabal");
    expect(firstTown("Burj al-Shamali")).toBe("Borj Ech-Chemali");
    expect(firstTown("Deir Qanoun el Nahr")).toBe("Deir Qanoun En-Nahr");
    expect(firstTown("Qana")).toBe("Qana");
  });

  it("resolves well-known aliases", () => {
    expect(firstTown("Aitaroun")).toBe("Aaintaroun");
    expect(districtsOf("Tyre")).toContain("Sour");
    expect(districtsOf("the southern suburbs of Beirut / Dahieh")).toContain("Baabda");
    expect(firstTown("the Costa Brava landfill / Beirut coastal landfill area")).toBe(
      "Choueifat El-Aamrousiyeh",
    );
  });

  /**
   * Cities the boundary layer holds only as quarters. Without an alias the
   * city's own name matches no town, so the place carries no marker: the
   * whole of Tripoli had none.
   */
  it("puts a marker on cities the layer only holds as quarters", () => {
    expect(firstTown("Tripoli")).toBe("Trablous Et-Tell");
    expect(districtsOf("Tripoli")).toContain("Tripoli");
  });

  /**
   * An alias is a decision; mechanical matching is a guess. Hamra is the
   * case that proves it has to win - there is a village of that name in
   * Nabatieh, eighty kilometres from the Beirut quarter the entries mean.
   */
  it("prefers a written alias to a same-named town elsewhere", () => {
    expect(firstTown("Hamra")).toBe("Ras Beyrouth");
    expect(districtsOf("Hamra")).toContain("Beirut");
  });

  it("resolves district references", () => {
    expect(districtsOf("Bent Jbeil district")).toContain("Bent Jbeil");
    expect(districtsOf("Nabatieh")).toContain(
      towns.find((t) => t.name === "Nabatieh Et-Tahta")!.district,
    );
    expect(districtsOf("Marjaayoun")).toContain("Marjaayoun");
  });

  it("matches nothing for regional phrases and non-places", () => {
    for (const loc of [
      "South Lebanon",
      "the Bekaa",
      "Mount Lebanon",
      "North Lebanon",
      "public schools",
      "TVET schools used for shelter or education continuity",
    ]) {
      const m = matchLocations(index, [loc]);
      expect(m.towns.size, loc).toBe(0);
      expect(m.districts.size, loc).toBe(0);
    }
  });

  it("resolves every worst-hit cadaster in the 2026 damage assessment", () => {
    for (const zone of destruction.zones2026) {
      for (const c of zone.worstCadasters) {
        const m = matchLocations(index, [c.name]);
        expect(m.towns.size, `cadaster ${c.name} should resolve to a town`).toBeGreaterThan(0);
      }
    }
    expect(firstTown("Taybe")).toBe("Taybet Matjaayoun");
    expect(firstTown("Bent Jbeil")).toBe("Bent Jbayl");
  });

  it("localizes at least three quarters of located record mentions", () => {
    let located = 0;
    let matched = 0;
    const regional = new Set([
      "South Lebanon",
      "the Bekaa",
      "Mount Lebanon",
      "North Lebanon",
    ]);
    for (const rec of roleRecords as { locationNames?: string[] }[]) {
      const names = (rec.locationNames ?? []).filter((n) => !regional.has(n));
      if (names.length === 0) continue;
      located++;
      if (matchLocations(index, names).districts.size > 0) matched++;
    }
    expect(located).toBeGreaterThan(150);
    expect(matched / located).toBeGreaterThan(0.75);
  });
});
