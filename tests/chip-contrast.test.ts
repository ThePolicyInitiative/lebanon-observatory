import { describe, expect, it } from "vitest";
import { LAYER_COLORS } from "@/lib/colors";
import { chipBackground, contrastWithWhite, pinOutline } from "@/lib/pins";

/**
 * The layer chip on an opened pin prints the layer's name in white on the
 * layer's own colour. Three of the four colours carry white text; the
 * municipal amber does not, at 2.55:1 against the 4.5:1 text needs, and
 * the chip is set at 10.5px, which is not large text under any reading.
 *
 * chipBackground keeps the colour wherever it works and darkens it where
 * it does not, so a layer stays recognisably itself rather than being
 * swapped for another hue.
 */
describe("layer chip contrast", () => {
  const layers = Object.entries(LAYER_COLORS as Record<string, string>);

  it("has the four actor layers to check", () => {
    expect(layers.length).toBeGreaterThanOrEqual(4);
  });

  it.each(Object.entries(LAYER_COLORS as Record<string, string>))(
    "carries white text on the %s chip",
    (layer, color) => {
      const ratio = contrastWithWhite(chipBackground(color));
      expect(ratio, `${layer} chip is ${ratio.toFixed(2)}:1 behind white text`).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("leaves a colour alone when it already carries white text", () => {
    // Only the layer that fails should change - a fix that repaints every
    // chip would be discarding the palette to solve one contrast bug.
    const changed = layers.filter(([, c]) => chipBackground(c) !== c);
    const failing = layers.filter(([, c]) => contrastWithWhite(c) < 4.5);
    expect(changed.map(([l]) => l).sort()).toEqual(failing.map(([l]) => l).sort());
    expect(changed.length).toBeLessThan(layers.length);
  });

  it("darkens the layer's own colour rather than substituting another", () => {
    for (const [, color] of layers) {
      const bg = chipBackground(color);
      if (bg === color) continue;
      expect(bg).toBe(pinOutline(color));
    }
  });

  it("measures contrast the way WCAG does", () => {
    // Anchors, so a broken luminance implementation cannot quietly pass
    // everything above.
    expect(contrastWithWhite("#FFFFFF")).toBeCloseTo(1, 2);
    expect(contrastWithWhite("#000000")).toBeCloseTo(21, 1);
    expect(contrastWithWhite("#D69600")).toBeCloseTo(2.55, 1);
  });
});
