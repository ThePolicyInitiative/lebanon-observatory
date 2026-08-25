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

/** The governorates the war did not reach, so nothing may be marked there. */
const NORTHERN = new Set([
  "Tripoli",
  "Akkar",
  "El Koura",
  "Zgharta",
  "El Batroun",
  "Bcharre",
  "El Minieh-Dennie",
]);

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

  /**
   * A group's address is not a place where work happened. Tripoli was not
   * struck in either war, and every mention of it in the tracking came from
   * a name - Tripoli Volunteers - so nothing may put a marker there. Hamra
   * is the opposite case: it is a real Beirut location that the mechanical
   * tiers send to a village of the same name in Nabatieh.
   */
  it("puts Hamra in Beirut and puts nothing in Tripoli", () => {
    expect(firstTown("Hamra")).toBe("Ras Beyrouth");

    // Sidon is the third of these: "Saida" and the Baalbek village
    // "Saaideh" fold to one key, and the mechanical tiers reached the
    // village, drawing every Sidon entry in the Bekaa.
    expect(firstTown("Saida")).toBe("Saida El-Qadimeh");
    expect(districtsOf("Saida")).toContain("Saida");

    const tripoli = matchLocations(index, ["Tripoli"]);
    expect(tripoli.towns.size).toBe(0);

    const northern = new Set(
      towns.filter((t) => NORTHERN.has(t.district)).map((t) => t.name),
    );
    for (const rec of roleRecords as { locationNames?: string[] }[]) {
      for (const town of matchLocations(index, rec.locationNames ?? []).towns) {
        expect(
          northern.has(town),
          `nothing was traced in the north, yet ${town} is marked there`,
        ).toBe(false);
      }
    }
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
