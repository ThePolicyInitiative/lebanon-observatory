import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dissolveBoundary,
  AFFECTED_ZONE_IDS,
  DISTRICT_PATHS,
  GOV_PATHS,
  zoneForCodAdm1,
  type GeoFeature,
} from "@/lib/geo";
import { governorateLabel, GOVERNORATE_NAMES } from "@/lib/vocab";
import { locations } from "@/lib/data";

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

  /**
   * The test above says a name is not an id. This one says the map agrees.
   *
   * It did not. The hover state is compared against `Town.uid`, which
   * always carries a `#index` suffix, and the pin and cluster handlers
   * wrote a bare town name into it. A name is a string and a uid is a
   * string, so it assigned cleanly, matched nothing, and drew no outline
   * at all - while the readout text, which comes from separate state, went
   * on appearing. The missing highlight read as a design decision rather
   * than a bug, which is why it survived: the premise had a test and the
   * code that depends on it did not.
   *
   * `TownUid` is branded now, so this is a compile error too. The scan
   * stays because a brand is only as good as the absence of a cast, and
   * because it names the failure for whoever reads it next.
   */
  it("passes a polygon id, never a name, to the identity state", () => {
    const src = readFileSync(
      join(process.cwd(), "src", "components", "map", "SvgLebanonMap.tsx"),
      "utf-8",
    );
    const writes = [...src.matchAll(/setHoverUid\(([^)]*)\)/g)].map((m) => m[1].trim());
    expect(writes.length, "the hover state has moved").toBeGreaterThan(2);
    for (const arg of writes) {
      if (arg === "null") continue;
      expect(arg, `setHoverUid(${arg}) is not a polygon id`).toMatch(/\.uid$/);
    }

    const compares = [...src.matchAll(/selectedTownUid === ([^;)\s]+)/g)].map((m) => m[1]);
    expect(compares.length, "the selection comparison has moved").toBeGreaterThan(2);
    for (const arg of compares) {
      expect(arg, `selectedTownUid === ${arg} is not a polygon id`).toMatch(/\.uid$/);
    }
  });
});

/**
 * The boundary layer speaks French. The site does not.
 *
 * geoBoundaries ships ADM1 as Liban-Nord, Mont-Liban, Beyrouth, Béqaa,
 * Nabatîyé and Aakkâr, and both maps used to print that raw wherever a
 * governorate had no grouping in locations.json to supply a label - which
 * is exactly the two northern ones. So an Arabic reader hovering the
 * north was shown "Liban-Nord", inside a right-to-left popup, and an
 * English reader was shown it too.
 *
 * The north having no grouping is deliberate and stays: neither war
 * reached those governorates and nothing traced is attributed there. What
 * changes is that being unable to attribute anything to a place is no
 * longer the same as being unable to name it.
 */
describe("governorate names", () => {
  const adm1 = JSON.parse(
    readFileSync(join(process.cwd(), "src", "data", "lebanon-adm1.json"), "utf-8"),
  ) as { features: { properties: { shapeName: string } }[] };

  it("names every governorate the boundary layer carries, in both languages", () => {
    const inData = adm1.features.map((f) => f.properties.shapeName).sort();
    expect(inData.length).toBe(9);
    expect([...GOVERNORATE_NAMES].sort()).toEqual(inData);
    // The set equality above is what proves coverage; this checks the two
    // labels are usable. Keserwan-Jbeil's English form is its shapeName,
    // which is right - that one is not French - so a label equalling its
    // key is not by itself a miss, and the French test below is what
    // catches the case where it would be.
    for (const name of inData) {
      expect(governorateLabel(name, "en"), `${name} has no English name`).toMatch(/[A-Za-z]/);
      expect(governorateLabel(name, "ar"), `${name} has no Arabic name`).toMatch(/[؀-ۿ]/);
    }
  });

  it("prints no French to a reader of either language", () => {
    // The six shapeNames that are French rather than English or Arabic.
    const french = ["Liban-Nord", "Mont-Liban", "Beyrouth", "Béqaa", "Nabatîyé", "Aakkâr"];
    for (const name of french) {
      expect(adm1.features.some((f) => f.properties.shapeName === name)).toBe(true);
      for (const locale of ["en", "ar"] as const) {
        expect(governorateLabel(name, locale)).not.toBe(name);
      }
    }
  });

  /**
   * The two the whole defect turned on: no grouping, so nothing else can
   * name them.
   */
  it("names the two governorates the tracking has no grouping for", () => {
    const grouped = new Set(
      (locations.regions as { governorates?: string[] }[]).flatMap((r) => r.governorates ?? []),
    );
    const ungrouped = adm1.features
      .map((f) => f.properties.shapeName)
      .filter((n) => !grouped.has(n));
    expect(ungrouped.sort()).toEqual(["Aakkâr", "Liban-Nord"]);
    expect(governorateLabel("Liban-Nord", "ar")).toBe("الشمال");
    expect(governorateLabel("Aakkâr", "ar")).toBe("عكار");
  });

  /** The geometry modules hold keys now, never copy. */
  it("keeps reader copy out of the geometry", () => {
    for (const p of [...GOV_PATHS, ...DISTRICT_PATHS] as Record<string, unknown>[]) {
      expect(p, "a path carries a label again").not.toHaveProperty("zoneLabel");
    }
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
