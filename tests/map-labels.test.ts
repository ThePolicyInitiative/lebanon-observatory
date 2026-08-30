import { describe, expect, it } from "vitest";
import { boxesOverlap, labelBox, packLabels, packReserved, textWidth } from "@/lib/map-labels";
import { DISTRICT_LABELS } from "@/lib/geo";

/**
 * The map printed names on top of each other in two different ways.
 *
 * At the opening view it took the six busiest towns with no test between
 * them at all, so on a 375 px phone seven of the thirteen strings on
 * screen overlapped another. Zoomed in it did avoid collisions, but only
 * between town labels - the city, district and river names are drawn
 * unconditionally and were invisible to it, so "Nabatieh" printed
 * straight through "Nabatieh Et-Tahta 22" at every zoom to the deepest.
 *
 * Both come down to the same two things: reserve the right shape, and let
 * the labels that are always drawn claim their ground first.
 */
describe("label boxes", () => {
  it("reserves a shape as wide as the text, not a circle", () => {
    // The bug a radius hides: two names whose anchors are comfortably
    // apart, running towards each other.
    const a = labelBox(0, 0, "Nabatieh Et-Tahta 22", 10);
    const b = labelBox(60, 0, "Chehour 8", 10);
    expect(Math.hypot(60, 0)).toBeGreaterThan(22); // a radius would allow it
    expect(boxesOverlap(a, b)).toBe(true);
  });

  it("lets names sit close when they stack rather than collide", () => {
    // And the converse: a radius rejects these, boxes do not.
    const a = labelBox(0, 0, "Qana 8", 10);
    const b = labelBox(0, 18, "Tibnine 8", 10);
    expect(boxesOverlap(a, b)).toBe(false);
  });

  it("centres a middle-anchored box on its point", () => {
    const b = labelBox(100, 50, "MARJAAYOUN", 10, "middle");
    expect((b.x0 + b.x1) / 2).toBeCloseTo(100, 6);
    const start = labelBox(100, 50, "MARJAAYOUN", 10);
    expect(start.x0).toBe(100);
  });

  it("puts most of the box above the baseline", () => {
    const b = labelBox(0, 0, "x", 10);
    expect(b.y0).toBeLessThan(0);
    expect(b.y1).toBeGreaterThan(0);
    expect(Math.abs(b.y0)).toBeGreaterThan(Math.abs(b.y1));
  });
});

/**
 * How wide the text actually comes out.
 *
 * The widths below were read out of the browser that draws the map -
 * canvas measureText, on the Inter next/font serves, at the size, weight,
 * case and letter-spacing each layer draws in. They are what the estimate
 * has to match, and matching them is the whole of this fix: a box narrower
 * than its text is a label the packing believes it has cleared.
 *
 * Summing advances ignores kerning, so the estimate runs a little wide on
 * pairs like AY. That direction is safe - a wide box drops a lower-priority
 * name, a narrow one prints two names through each other - so the
 * tolerance here is asymmetric, and deliberately so.
 */
describe("text width", () => {
  /** [text, fontSize, style, width Chromium lays it out at] */
  const MEASURED: [string, number, Parameters<typeof textWidth>[2], number][] = [
    // The district layer: 9.5px, weight 600, uppercase, 0.4px spacing.
    ["Sour", 9.5, { uppercase: true, letterSpacing: 0.4 }, 28.3],
    ["Chouf", 9.5, { uppercase: true, letterSpacing: 0.4 }, 36.0],
    ["Baabda", 9.5, { uppercase: true, letterSpacing: 0.4 }, 42.3],
    ["Marjaayoun", 9.5, { uppercase: true, letterSpacing: 0.4 }, 72.3],
    ["Kesrwane", 9.5, { uppercase: true, letterSpacing: 0.4 }, 56.9],
    // The city layer: 10.5px, weight 600, as written.
    ["Beirut", 10.5, {}, 30.2],
    ["Nabatieh", 10.5, {}, 45.8],
    ["Baalbek", 10.5, {}, 40.5],
    // A town label, which carries its count.
    ["Shama", 9, {}, 29.8],
    ["Chehour", 9, {}, 37.5],
  ];

  it("matches what the browser lays out", () => {
    for (const [text, size, style, real] of MEASURED) {
      const w = textWidth(text, size, style);
      const err = w / real - 1;
      expect(err, `"${text}" is ${(err * 100).toFixed(1)}% off`).toBeGreaterThan(-0.01);
      expect(err, `"${text}" is ${(err * 100).toFixed(1)}% off`).toBeLessThan(0.05);
    }
  });

  /**
   * The defect this replaced. Every one of the 26 district names was
   * handed to the packing 5-38% narrower than it prints, because the
   * estimate averaged every glyph at 0.55 em and knew about neither the
   * uppercase transform nor the letter-spacing.
   */
  it("no longer under-states a single district name", () => {
    for (const l of DISTRICT_LABELS) {
      const drawn = textWidth(l.label, 9.5, { uppercase: true, letterSpacing: 0.4 });
      const flat = l.label.length * 9.5 * 0.55;
      expect(drawn, `${l.label} is not wider than the old estimate`).toBeGreaterThan(flat);
    }
  });

  it("counts the uppercase transform and the letter-spacing", () => {
    const plain = textWidth("Baabda", 9.5);
    expect(textWidth("Baabda", 9.5, { uppercase: true })).toBeGreaterThan(plain);
    expect(textWidth("Baabda", 9.5, { letterSpacing: 0.4 })).toBeCloseTo(
      plain + 6 * 0.4,
      6,
    );
  });

  it("scales with the font size, so zoom cannot change what fits", () => {
    expect(textWidth("Chehour", 19)).toBeCloseTo(textWidth("Chehour", 9.5) * 2, 6);
  });

  it("treats an unmeasured character as a wide one rather than a narrow one", () => {
    // Over-measuring drops a lower-priority label; under-measuring prints
    // two names through each other.
    expect(textWidth("م", 10)).toBeGreaterThan(textWidth("i", 10));
  });
});

describe("packing", () => {
  const box = (x: number, y: number, text = "Somewhere") => labelBox(x, y, text, 10);

  it("keeps what fits and drops what does not", () => {
    const kept = packLabels([
      { key: "a", box: box(0, 0) },
      { key: "b", box: box(5, 0) }, // straight through a
      { key: "c", box: box(400, 0) },
    ]);
    expect([...kept].sort()).toEqual(["a", "c"]);
  });

  it("gives the earlier candidate the ground, so priority is the order", () => {
    // The map passes towns by traced volume, so the busier place keeps
    // its name when two cannot both fit.
    const first = packLabels([
      { key: "busy", box: box(0, 0) },
      { key: "quiet", box: box(5, 0) },
    ]);
    expect(first.has("busy")).toBe(true);
    expect(first.has("quiet")).toBe(false);

    const reversed = packLabels([
      { key: "quiet", box: box(5, 0) },
      { key: "busy", box: box(0, 0) },
    ]);
    expect(reversed.has("quiet")).toBe(true);
  });

  it("yields to labels that are drawn whatever happens", () => {
    // This is the "Nabatieh over Nabatieh Et-Tahta" case: the city label
    // is unconditional, so it claims first and the town name gives way.
    const city = box(0, 0, "Nabatieh");
    const kept = packLabels([{ key: "Nabatieh Et-Tahta", box: box(4, 0) }], [city]);
    expect(kept.size).toBe(0);
  });

  /**
   * The labels that are drawn whatever happens still have to clear each
   * other.
   *
   * packLabels takes its reserved boxes as given, which is right for a
   * marker - a marker is drawn regardless - and wrong for a label. The
   * city and district layers are both unconditional, so where a district
   * label sat under the city that names it, the two printed on top of one
   * another: "BEIRUT" through "Beirut", at every zoom the district layer
   * is on.
   */
  it("thins the unconditional labels against each other", () => {
    const city = { key: "city:Beirut", box: box(0, 0, "Beirut") };
    const district = { key: "district:Beirut", box: box(2, 0, "BEIRUT") };
    const far = { key: "district:Baalbek", box: box(400, 0, "BAALBEK") };
    const { kept, boxes } = packReserved([city, district, far]);
    expect(kept.has("city:Beirut")).toBe(true);
    expect(kept.has("district:Beirut"), "the district label prints through the city").toBe(false);
    expect(kept.has("district:Baalbek")).toBe(true);
    // And what comes back is only what survived, so a caller that draws
    // from it cannot draw a suppressed one.
    expect(boxes).toHaveLength(2);
  });

  it("keeps priority in the order given, for reserved labels too", () => {
    const a = { key: "first", box: box(0, 0) };
    const b = { key: "second", box: box(3, 0) };
    expect([...packReserved([a, b]).kept]).toEqual(["first"]);
    expect([...packReserved([b, a]).kept]).toEqual(["second"]);
  });

  it("never returns two labels that overlap each other", () => {
    // The property that matters, over a grid dense enough to force
    // rejections in both axes.
    const candidates = [];
    for (let x = 0; x < 300; x += 7) {
      for (let y = 0; y < 120; y += 5) {
        candidates.push({ key: `${x},${y}`, box: box(x, y, "Tayr Debbeh 12") });
      }
    }
    const reserved = [box(150, 60, "Litani")];
    const kept = packLabels(candidates, reserved);
    expect(kept.size).toBeGreaterThan(3);

    const keptBoxes = candidates.filter((c) => kept.has(c.key)).map((c) => c.box);
    for (let i = 0; i < keptBoxes.length; i++) {
      for (let j = i + 1; j < keptBoxes.length; j++) {
        expect(
          boxesOverlap(keptBoxes[i], keptBoxes[j]),
          `two kept labels overlap: ${i} and ${j}`,
        ).toBe(false);
      }
      expect(
        boxesOverlap(keptBoxes[i], reserved[0]),
        "a kept label overlaps a reserved one",
      ).toBe(false);
    }
  });
});
