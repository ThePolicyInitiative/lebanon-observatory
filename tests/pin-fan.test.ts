import { describe, expect, it } from "vitest";
import { GROUND_SPACING_DEG, degreesPerPixel, fanRadius, fanSpacing } from "@/lib/pins";

/**
 * The fan that scattered pins into the neighbouring towns.
 *
 * Entries share a town centroid, so they are fanned around it. That fan
 * was sized in degrees - a distance on the ground - which is correct for
 * the vector map, drawn once at one scale, and wrong for the pan-and-zoom
 * map, where the same 2.16 km radius is seven pixels at national zoom and
 * four hundred and fifty at street zoom. Zoom in on Nabatieh and its 32
 * entries walked out of Nabatieh.
 *
 * Two things have to hold at once, and they pull against each other: the
 * zoomed-out map has to look exactly as it did, and the zoomed-in map has
 * to keep every pin inside the town it names.
 */

/** Rough metres per degree of latitude, for reading radii in real units. */
const M_PER_DEG = 111_320;

/** The busiest towns in the tracking - the ones that showed the bug. */
const BUSIEST = [
  { town: "Nabatieh", entries: 32 },
  { town: "Southern suburbs", entries: 42 },
  { town: "Tayr Debba", entries: 24 },
];

describe("fan spacing", () => {
  it("is unchanged from the shipped value across the zoomed-out range", () => {
    // The whole-country and governorate views are what the ground spacing
    // was tuned for, and they must not move.
    for (const zoom of [6, 7, 8, 9, 10]) {
      expect(fanSpacing(zoom)).toBe(GROUND_SPACING_DEG);
    }
  });

  it("shrinks once zoomed past the cap, and never grows", () => {
    let previous = Infinity;
    for (let zoom = 6; zoom <= 18; zoom++) {
      const spacing = fanSpacing(zoom);
      expect(spacing).toBeLessThanOrEqual(previous);
      expect(spacing).toBeLessThanOrEqual(GROUND_SPACING_DEG);
      expect(spacing).toBeGreaterThan(0);
      previous = spacing;
    }
    expect(fanSpacing(14)).toBeLessThan(fanSpacing(11));
  });

  it("holds a steady on-screen size once the cap stops binding", () => {
    // Past the cap the fan is a fixed number of pixels, so a reader sees
    // the same spread whatever depth they are at.
    const widths = [12, 13, 14, 15, 16].map(
      (zoom) => fanRadius(32, fanSpacing(zoom)) / degreesPerPixel(zoom),
    );
    for (const width of widths) {
      expect(width).toBeCloseTo(widths[0], 6);
    }
    // And that size is legible: wide enough to separate pins, tight
    // enough to still read as one place.
    expect(widths[0]).toBeGreaterThan(20);
    expect(widths[0]).toBeLessThan(120);
  });

  /**
   * How much ground the scale ceiling gives back as the reader zooms in.
   *
   * This is only half of what bounds a fan. fanSpacing knows about the
   * scale and nothing about the place: it cannot tell whether the town
   * underneath is Nabatieh or a hamlet, so it cannot promise a pin stays
   * inside its town. fitSpacing does that, by capping the fan at the room
   * the town actually has, and tests/pin-containment.test.ts checks the
   * result against the real boundaries.
   *
   * What is checked here is the part fanSpacing is responsible for: that
   * the ground footprint collapses as the reader goes in, so the scale
   * ceiling stops being the binding constraint and the town's own room
   * takes over.
   */
  it("collapses its ground footprint as the reader zooms in", () => {
    for (const { town, entries } of BUSIEST) {
      const far = fanRadius(entries, fanSpacing(8)) * M_PER_DEG;
      const near = fanRadius(entries, fanSpacing(14)) * M_PER_DEG;
      expect(near, `${town} does not tighten between zoom 8 and 14`).toBeLessThan(far / 4);
    }
  });

  it("still separates those towns' pins at national zoom", () => {
    // The other half of the contract: the fan must not collapse into a
    // single unreadable dot at the default view.
    for (const { town, entries } of BUSIEST) {
      const pixels = fanRadius(entries, fanSpacing(8)) / degreesPerPixel(8);
      expect(pixels, `${town} fans ${pixels.toFixed(1)} px at zoom 8`).toBeGreaterThan(4);
    }
  });
});
