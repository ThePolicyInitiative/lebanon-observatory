import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LAYER_LABELS,
  LOCALITY_AR,
  REGIONS,
  STAGES_AR,
  actorAnchor as mirrorAnchor,
  actorBase as mirrorBase,
  fmtDate as mirrorDate,
  buildIndex,
} from "../scripts/build-search-index.mjs";
import { actorAnchor, actorHref } from "@/app/(en)/who/actor-anchor";
import { layerLabel, regionLabel, stageList } from "@/lib/vocab";
import { actorBase } from "@/lib/actor-names";
import { eventsByLocality, localityName } from "@/lib/events";
import { fmtDate } from "@/lib/format";
import { hrefOf, normalize, prepare, runQuery, type SearchItem } from "@/lib/search";
import actors from "@/data/actors.json";
import gazetteer from "@/data/gazetteer.json";
import locations from "@/data/locations.json";
import kpis from "@/data/kpis.json";
import roleRecords from "@/data/role-records.json";
import timeline from "@/data/timeline.json";
import stageCounts from "@/data/stage-counts.json";
import { bannedHit } from "./vocab-patterns";

/**
 * public/search-index.json is a checked-in build product: the search page
 * fetches it, nothing regenerates it at request time. So this suite is the
 * regeneration guard, in the shape of projections.test.ts - a data revision
 * that is not followed by `node scripts/build-search-index.mjs` fails here
 * rather than quietly serving a stale index to readers.
 *
 * It also pins the four things the generator has to mirror rather than
 * import, because Node cannot read the site's TypeScript: the actor anchor
 * scheme, the Arabic stage and layer names, the regional names and the way
 * a date is written. A mirror that drifts is a second opinion about where
 * a link goes, or about how a town is spelled.
 */

const SHIPPED = join(__dirname, "..", "public", "search-index.json");
const built = buildIndex();
const shipped = JSON.parse(readFileSync(SHIPPED, "utf8"));
const items = shipped.items as SearchItem[];

describe("the shipped index matches what the generator produces", () => {
  /**
   * The serialized string, not the parsed object: a file that was
   * hand-edited, reordered or pretty-printed parses to the same object
   * while `node scripts/build-search-index.mjs` would still rewrite it,
   * and a build product that differs from its generator on disk is
   * exactly what this suite exists to catch. The trailing newline is
   * part of what main() writes.
   */
  it("is byte-for-byte what the current data builds", () => {
    expect(
      readFileSync(SHIPPED, "utf8"),
      "public/search-index.json is stale - run: node scripts/build-search-index.mjs",
    ).toBe(`${JSON.stringify(built.index)}\n`);
  });

  it("dropped no anchor while building", () => {
    expect(built.warnings).toEqual([]);
  });

  it("stays small enough to fetch on one page", () => {
    const kb = readFileSync(SHIPPED).byteLength / 1024;
    expect(kb, `the index has grown to ${kb.toFixed(1)} KB`).toBeLessThan(250);
  });
});

describe("the generator's mirrors still agree with the modules they mirror", () => {
  it("anchors actors exactly as actor-anchor.ts does", () => {
    for (const a of actors) {
      const base = actorBase(a.name);
      expect(mirrorBase(a.name), a.name).toBe(base);
      expect(mirrorAnchor(base), base).toBe(actorAnchor(base));
    }
  });

  it("names the twelve stages as vocab.ts does", () => {
    expect(STAGES_AR).toEqual(stageList("ar"));
    expect(stageCounts.stages).toEqual(stageList("en"));
  });

  it("names the four layers as vocab.ts does", () => {
    for (const layer of LAYER_LABELS) {
      expect(layer.en, layer.id).toBe(layerLabel(layer.id, "en"));
      expect(layer.ar, layer.id).toBe(layerLabel(layer.id, "ar"));
    }
  });

  it("names the regional groupings as vocab.ts does", () => {
    for (const region of locations.regions) {
      const mirror = REGIONS[region.id as keyof typeof REGIONS];
      expect(mirror, region.id).toBeTruthy();
      expect(mirror.en, region.id).toBe(regionLabel(region.id, "en"));
      expect(mirror.ar, region.id).toBe(regionLabel(region.id, "ar"));
    }
    expect(Object.keys(REGIONS).sort()).toEqual(
      locations.regions.map((r) => r.id).sort(),
    );
  });

  it("writes a date as format.ts does, in both languages", () => {
    for (const e of timeline) {
      expect(mirrorDate(e.date), e.date).toBe(fmtDate(e.date));
      expect(mirrorDate(e.date, "ar"), e.date).toBe(fmtDate(e.date, "ar"));
    }
  });

  /**
   * The gazetteer carries no Arabic, so the Arabic name of a town is read
   * from map-events.json - the same `nameAr` that localityName() hands the
   * Arabic map. Values, not just keys: a hand-kept table here was a third
   * opinion about how a town is spelled, and it had already drifted on two
   * of the twenty-five, so a reader typing the town exactly as the map
   * prints it found nothing.
   */
  it("names every locality exactly as the Arabic map names it", () => {
    const shippedAr = new Map(
      items.filter((i) => i.k === "place").map((i) => [i.t, i.ta]),
    );
    for (const l of gazetteer.localities) {
      const onTheMap = eventsByLocality.get(l.name);
      expect(onTheMap, `${l.name} has no entry in map-events.json`).toBeTruthy();
      const arabic = localityName(onTheMap!, "ar");
      expect(arabic, `${l.name} has no nameAr in map-events.json`).not.toBe(l.name);
      expect(LOCALITY_AR[l.name], l.name).toBe(arabic);
      expect(shippedAr.get(l.name), `${l.name} in the shipped index`).toBe(arabic);
    }
  });
});

describe("what the index covers", () => {
  const kinds = (k: string) => items.filter((i) => i.k === k);

  it("counts what it says it counts", () => {
    const counted: Record<string, number> = {};
    for (const i of items) counted[i.k] = (counted[i.k] ?? 0) + 1;
    expect(counted).toEqual(shipped.counts);
    expect(items.length).toBe(
      Object.values(counted).reduce((a, b) => a + b, 0),
    );
  });

  /**
   * The site serves ten routes; the index covers nine of them. The tenth
   * is the search page itself, which is deliberately not a target of its
   * own search.
   */
  it("reaches every page it indexes, and not the search page itself", () => {
    const routes = new Set(kinds("page").map((i) => i.h.split("#")[0]));
    expect([...routes].sort()).toEqual(
      // Sorted, because the assertion sorts what it is comparing against.
      ["/", "/about", "/compare", "/destroyed", "/entries", "/map", "/money", "/reported", "/who"],
    );
    expect(items.some((i) => i.h.startsWith("/search"))).toBe(false);
  });

  /**
   * Every heading in the index has to land at the same depth on both
   * sides. A reader on one side dropped at the top of a long page while
   * the other lands on the section is the parity rule broken quietly.
   */
  it("lands on a section in both languages or in neither", () => {
    for (const i of kinds("page")) {
      const en = i.h.includes("#");
      const ar = hrefOf(i, "ar").includes("#");
      expect(ar, `${i.h} is anchored on one side only`).toBe(en);
    }
  });

  /**
   * actors.json holds one entry per actor and year; the register groups by
   * the body itself, so the index does too. Every entry still has to land
   * on a group, and every group on the register's own anchor.
   */
  it("puts every actor entry on its register anchor", () => {
    const byHref = new Map(kinds("actor").map((i) => [i.h, i]));
    for (const a of actors) {
      const base = actorBase(a.name);
      const item = byHref.get(actorHref(base, "en"));
      expect(item, `${base} has no entry in the index`).toBeTruthy();
      expect(hrefOf(item!, "ar")).toBe(actorHref(base, "ar"));
    }
    expect(byHref.size).toBe(new Set(actors.map((a) => actorBase(a.name))).size);
  });

  /**
   * The index is built from actors.json, but the register the anchors
   * point into is grouped from role-records.json. They agree today; if
   * they ever stop agreeing, one side ships an anchor that lands nowhere,
   * and nothing else in this suite would notice.
   */
  it("anchors nothing the register does not group", () => {
    const onThePage = new Set(
      roleRecords.map((r) => actorHref(actorBase(r.actorName), "en")),
    );
    const inTheIndex = new Set(kinds("actor").map((i) => i.h));
    expect(
      [...inTheIndex].filter((h) => !onThePage.has(h)),
      "the index anchors an actor the register does not print",
    ).toEqual([]);
    expect(
      [...onThePage].filter((h) => !inTheIndex.has(h)),
      "the register prints an actor the index cannot reach",
    ).toEqual([]);
  });

  it("carries both languages on every item", () => {
    const arabic = /[؀-ۿ]/;
    const latin = /[A-Za-z0-9]/;
    for (const i of items) {
      expect(i.t.trim().length, `${i.h} has no English label`).toBeGreaterThan(0);
      expect(i.ta.trim().length, `${i.h} has no Arabic label`).toBeGreaterThan(0);
      // A handful of actors keep a Latin brand in Arabic on purpose, so the
      // rule is that the two labels exist and that the context lines, where
      // a page writes them, are written in the reader's own script.
      if (i.ca) expect(arabic.test(i.ca), `${i.h} context is not Arabic`).toBe(true);
      if (i.c) expect(latin.test(i.c), `${i.h} context is not English`).toBe(true);
    }
  });

  it("reaches every place, stage, layer, indicator and milestone", () => {
    expect(kinds("place").length).toBe(
      locations.regions.length + gazetteer.localities.length,
    );
    expect(kinds("stage").length).toBe(stageCounts.stages.length);
    expect(kinds("layer").length).toBe(LAYER_LABELS.length);
    expect(kinds("indicator").length).toBe(kpis.length);
    expect(kinds("milestone").length).toBe(timeline.length);
  });

  it("links only to routes this site serves", () => {
    const routes = new Set([
      "/",
      "/about",
      "/who",
      "/compare",
      "/destroyed",
      "/entries",
      "/money",
      "/map",
      "/reported",
    ]);
    for (const i of items) {
      const en = i.h.split("#")[0];
      expect(routes.has(en), `${i.h} is not a route`).toBe(true);
      const ar = hrefOf(i, "ar");
      expect(ar.startsWith("/ar"), `${ar} is not an Arabic route`).toBe(true);
      expect(routes.has(ar.split("#")[0].replace(/^\/ar/, "") || "/")).toBe(true);
    }
  });

  /**
   * `note` is included: it is never painted, but the whole file is served
   * at /search-index.json and a reader can open it, so it is as
   * reader-facing as anything else in here.
   */
  it("keeps the banned wording out of everything it carries", () => {
    const offenders: string[] = [];
    const check = (where: string, s: string | undefined) => {
      if (!s) return;
      const hit = bannedHit(s);
      if (hit) offenders.push(`${where}: "${hit}" in ${s.slice(0, 60)}`);
    };
    check("note", shipped.note as string);
    for (const i of items) {
      for (const s of [i.t, i.ta, i.c, i.ca, i.x, i.xa]) check(i.h, s);
    }
    expect(offenders).toEqual([]);
  });

  /** Dates read the way the rest of that language's pages write them. */
  it("prints no bare ISO date on either side", () => {
    for (const i of items) {
      for (const s of [i.c, i.ca]) {
        if (s) expect(s, `${i.h} prints an ISO date`).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      }
    }
  });
});

describe("querying the index", () => {
  const prepared = prepare(items);
  const labels = (q: string) => runQuery(prepared, q).map((i) => `${i.k}:${i.t}`);

  it("folds Arabic so a query without diacritics still matches", () => {
    expect(normalize("النبطيّة")).toBe(normalize("النبطيه"));
    expect(normalize("إعادة")).toBe(normalize("اعادة"));
    expect(normalize("٢٠٢٤")).toBe("2024");
  });

  it("finds a town from either language", () => {
    expect(labels("nabatieh")).toContain("place:Nabatieh");
    expect(labels("النبطيه")).toContain("place:Nabatieh");
    expect(labels("صور")).toContain("place:Tyre (Sour)");
  });

  /**
   * Typed the way the Arabic map prints it, which is the only spelling a
   * reader has seen. "كوستابرافا" is one token on the map and used to be
   * two in the index, so this query returned nothing at all.
   */
  it("finds a town typed the way the map writes it", () => {
    expect(labels("كوستابرافا")).toContain("place:Costa Brava landfill area");
    expect(labels("الضاحية الجنوبية")).toContain(
      "place:Dahieh / southern suburbs (Baabda district)",
    );
  });

  it("finds a milestone by its date, written either way", () => {
    expect(labels("2026-02-26").some((l) => l.startsWith("milestone:"))).toBe(true);
    expect(labels("شباط 2026").some((l) => l.startsWith("milestone:"))).toBe(true);
  });

  it("finds an actor from either language", () => {
    expect(labels("unicef")[0]).toMatch(/^actor:/);
    expect(labels("مجلس الجنوب")).toContain("actor:Council of the South");
    expect(labels("بلديات").length).toBeGreaterThan(0);
  });

  it("finds a stage, an indicator and a milestone", () => {
    expect(labels("rubble")).toContain("stage:Rubble clearance");
    expect(labels("رفع الأنقاض")).toContain("stage:Rubble clearance");
    expect(labels("disbursed").some((l) => l.startsWith("indicator:"))).toBe(true);
    expect(labels("cessation").some((l) => l.startsWith("milestone:"))).toBe(true);
  });

  it("ranks a whole-label hit above a hit buried in the context", () => {
    const hits = runQuery(prepared, "beirut");
    expect(hits.length).toBeGreaterThan(1);
    expect(hits[0].t.toLowerCase()).toContain("beirut");
  });

  it("returns nothing for an empty query and for a word nobody wrote", () => {
    expect(runQuery(prepared, "   ")).toEqual([]);
    expect(runQuery(prepared, "zzzqqq")).toEqual([]);
  });
});
