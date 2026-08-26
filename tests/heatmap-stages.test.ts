import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { HEATMAP_STAGES, stageList, stageShortList } from "@/lib/vocab";
import { changeFor, countsFor } from "@/lib/data-client";
import { LAYER_META } from "@/lib/colors";

/**
 * Both heat maps draw every stage except strategy and coordination.
 *
 * Strategy is the stage nearly every actor touches, so its column sat far
 * above the rest and set the top of a ramp the other eleven then shared -
 * the figures ended up answering "who coordinates" rather than where
 * traced presence sits along the chain.
 *
 * The two charts share one list so they cannot drift apart, and the thing
 * most likely to break quietly is the index arithmetic: the x value in a
 * cell is now a position on the drawn axis, not a stage number, and every
 * lookup that turns one back into the other has to agree.
 */
describe("heat map stage selection", () => {
  it("drops strategy and keeps the other eleven, in order", () => {
    expect(HEATMAP_STAGES).toHaveLength(11);
    expect(HEATMAP_STAGES).not.toContain(0);
    expect([...HEATMAP_STAGES]).toEqual([...HEATMAP_STAGES].sort((a, b) => a - b));
    expect(stageList("en")[0]).toBe("Strategy and coordination");
    for (const i of HEATMAP_STAGES) expect(i).toBeGreaterThan(0);
    expect(Math.max(...HEATMAP_STAGES)).toBeLessThan(stageList("en").length);
  });

  it.each(["en", "ar"] as const)("resolves to real stage names in %s", (locale) => {
    const long = stageList(locale);
    const short = stageShortList(locale);
    for (const i of HEATMAP_STAGES) {
      expect(long[i], `stage ${i} has no long label in ${locale}`).toBeTruthy();
      expect(short[i], `stage ${i} has no short label in ${locale}`).toBeTruthy();
    }
    // The strategy label still exists - it is omitted from two figures,
    // not removed from the site's vocabulary.
    expect(long[0]).toBeTruthy();
    expect(short[0]).toBeTruthy();
  });

  it("maps a drawn position back to the stage its number belongs to", () => {
    // The bug this guards: reading counts[x] where x is the axis position
    // would silently shift every cell one stage to the left.
    for (const lm of LAYER_META) {
      const counts = countsFor(2026, lm.id as never);
      const change = changeFor(lm.id as never);
      HEATMAP_STAGES.forEach((stageIdx, x) => {
        expect(counts[stageIdx]).toBe(counts[HEATMAP_STAGES[x]]);
        expect(change[stageIdx]).toBe(change[HEATMAP_STAGES[x]]);
      });
      // And position 0 is the second stage, not the first.
      expect(HEATMAP_STAGES[0]).toBe(1);
    }
  });

  it("keeps both charts reading the shared list rather than a literal 12", () => {
    // Either chart falling back to a hardcoded stage count would draw a
    // twelfth column with no data behind it, or drop a real one.
    for (const file of [
      "src/components/charts/YearHeatmaps.tsx",
      "src/components/charts/ChangeHeatmap.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src, `${file} does not use the shared stage list`).toContain("HEATMAP_STAGES");
      expect(src, `${file} still indexes cells against a literal 12`).not.toMatch(/li \* 12 \+/);
      expect(src, `${file} still loops to a literal 12`).not.toMatch(/si < 12/);
    }
  });

  it("describes the figure it actually draws", () => {
    // The description is the text alternative for a reader who does not
    // get the colours, so a stale count there is a wrong figure.
    const src = readFileSync("src/components/charts/ChangeHeatmap.tsx", "utf8");
    expect(src).not.toContain("twelve value-chain stages");
    expect(src).toContain("eleven value-chain stages");
    // The old description named a strategy cell as its second-largest
    // gain; that cell is no longer drawn.
    expect(src).not.toContain("community coordination (+25)");
  });
});
