import { describe, expect, it } from "vitest";
import roleRecords from "@/data/role-records.json";
import webUpdates from "@/data/web-updates.json";
import slwe from "@/data/slwe-posts.json";
import ops from "@/data/service-operators.json";
import reportSources from "@/data/report-sources.json";
import stageCounts from "@/data/stage-counts.json";

/**
 * Nothing on this site should say the same thing twice. These guards are
 * against re-import and bulk-rewrite passes, which is how the repeats got in:
 * a source export carrying the same post under two numbers, and a column
 * whose place list was pasted onto the end of the action text.
 */

/** Content words only: connectives and punctuation must not hide a repeat. */
const CONNECTIVE = new Set(
  ("and the a an in on of to order which that had has have been was were is " +
    "are at for by with as it its this these from").split(" "),
);
const contentKey = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .split(" ")
    .filter((w) => w && !CONNECTIVE.has(w))
    .join(" ");

function duplicates<T>(items: T[], key: (t: T) => string) {
  const seen = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (!k) continue;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
}

describe("the water utility's posts", () => {
  it("carries no post that repeats an earlier one", () => {
    const d = duplicates(
      slwe.areaPosts,
      (p) => `${p.department}|${contentKey(p.text)}`,
    );
    expect(d, `repeated posts: ${d.map((x) => x.slice(0, 70)).join(" // ")}`).toEqual([]);
  });

  it("carries no post number twice", () => {
    expect(duplicates(slwe.areaPosts, (p) => String(p.no))).toEqual([]);
  });

  /**
   * The caveat has to state the removals, or the totals cannot be squared
   * against the 606 the export supplied.
   */
  it("says in the caveats how many repeats were removed", () => {
    const all = slwe.caveats.join(" ");
    expect(all).toMatch(/repeat an earlier one/);
    expect(all).toContain(String(slwe.totalPosts));
    expect(all).toContain("606");
  });
});

describe("the register", () => {
  /**
   * The action text used to end with "Locations: X; Y." while every card also
   * printed locationNames beside it - the same places twice on one card.
   */
  it("does not append a location list the location field already carries", () => {
    const offenders = roleRecords
      .filter((r) => /\bLocations:/.test(`${r.tracedAction ?? ""} ${r.summary ?? ""}`))
      .map((r) => r.id);
    expect(offenders, `still appending locations: ${offenders.join(", ")}`).toEqual([]);
  });

  it("gives every entry its own id", () => {
    expect(duplicates(roleRecords, (r) => r.id)).toEqual([]);
  });

  /** One actor may appear in many stages; the same cell may not appear twice. */
  it("carries each actor-stage-function cell once per year", () => {
    const d = duplicates(
      roleRecords,
      (r) => `${r.year}|${r.actorName}|${r.stage}|${r.functionColumn}`,
    );
    expect(d).toEqual([]);
  });
});

describe("the web-sourced entries and the operators", () => {
  it("reports each actor and action once", () => {
    const d = duplicates(
      webUpdates.updates,
      (u) => `${contentKey(u.actor)}|${contentKey(u.action)}`,
    );
    expect(d).toEqual([]);
  });

  it("carries no operator item twice", () => {
    const items = ops.operators.flatMap((o) => o.items.map((i) => `${o.name}|${contentKey(i.what)}`));
    expect(duplicates(items, (x) => x)).toEqual([]);
  });

  it("lists each source id once", () => {
    expect(duplicates(reportSources, (s) => s.id)).toEqual([]);
  });
});

describe("the register payload projection", () => {
  /**
   * The register sends stageNo to the browser and looks the label up from
   * STAGES, rather than repeating the stage name on all 771 entries. That
   * only holds while the two agree exactly.
   */
  it("can rebuild every stage label from stageNo alone", () => {
    const stages: string[] = stageCounts.stages;
    expect(stages).toHaveLength(12);
    for (const r of roleRecords) {
      expect(stages[r.stageNo - 1], `stageNo ${r.stageNo} on ${r.id}`).toBe(r.stage);
    }
  });

  /** The map link uses the group's layer, so an actor may not span layers. */
  it("keeps one actor layer per actor", () => {
    const layerByActor = new Map<string, string>();
    for (const r of roleRecords) {
      const base = r.actorName.split(":")[0].trim();
      const seen = layerByActor.get(base);
      if (seen === undefined) layerByActor.set(base, r.actorLayer);
      else expect(seen, `${base} appears under two layers`).toBe(r.actorLayer);
    }
  });
});
