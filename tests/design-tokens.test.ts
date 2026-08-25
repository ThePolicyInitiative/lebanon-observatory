import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LAYER_COLORS, UI, YEAR_COLORS } from "@/lib/colors";

/**
 * The palette exists twice, and this is what holds the two copies together.
 *
 * It has to exist twice: the site is styled from CSS custom properties in
 * globals.css, but ECharts writes colours straight into canvas and SVG paint
 * attributes, where `var(--token)` does not reliably resolve - so the chart
 * layer needs JavaScript literals and cannot read the custom properties.
 *
 * Two copies with no guard is how the palette silently forked. Every value
 * in src/lib/colors.ts had drifted from the token it mirrors: the teal that
 * every NGO/international chip and series is drawn from measured 4.49:1 on
 * white against the token's 5.49:1; the 2026 green measured 3.99:1 against
 * 4.84:1; and `UI.background` named a warm off-white (#FAFAF7) on a site
 * whose ground is a cool grey (#EAEFF4). None of it was visible in review,
 * because both files looked authoritative and neither named the other.
 *
 * So: change a colour in globals.css, and this test tells you what to bring
 * across. It never asserts a particular colour - only that the two copies
 * agree, and that anything carrying text can actually be read.
 */

const CSS = readFileSync(
  join(import.meta.dirname, "..", "src", "app", "globals.css"),
  "utf8",
);

/** The `:root` value of one custom property, lowercased. */
function token(name: string): string {
  const m = CSS.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`globals.css has no --${name}`);
  return m[1].trim().toLowerCase();
}

const lower = (s: string) => s.trim().toLowerCase();

/* ---------------------------------------------------------------- contrast -- */

function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe("the palette's two copies", () => {
  it("gives every JavaScript colour the same value as the token it mirrors", () => {
    const pairs: [string, string, string][] = [
      ["LAYER_COLORS.official", LAYER_COLORS.official, "color-navy"],
      ["LAYER_COLORS.ngo_international", LAYER_COLORS.ngo_international, "color-teal"],
      ["LAYER_COLORS.municipal", LAYER_COLORS.municipal, "color-amber"],
      ["LAYER_COLORS.community", LAYER_COLORS.community, "color-magenta"],
      ["YEAR_COLORS.y2024", YEAR_COLORS.y2024, "color-y2024"],
      ["YEAR_COLORS.y2026", YEAR_COLORS.y2026, "color-y2026"],
      ["YEAR_COLORS.y2024Text", YEAR_COLORS.y2024Text, "color-y2024-text"],
      ["YEAR_COLORS.y2026Text", YEAR_COLORS.y2026Text, "color-y2026-text"],
      ["YEAR_COLORS.negative", YEAR_COLORS.negative, "color-rust"],
      ["YEAR_COLORS.warning", YEAR_COLORS.warning, "color-amber"],
      ["UI.background", UI.background, "color-bg"],
      ["UI.navy", UI.navy, "color-navy"],
      ["UI.blue", UI.blue, "color-blue"],
      ["UI.teal", UI.teal, "color-teal"],
      ["UI.amber", UI.amber, "color-amber"],
      ["UI.magenta", UI.magenta, "color-magenta"],
      ["UI.rust", UI.rust, "color-rust"],
      ["UI.text", UI.text, "color-text"],
      ["UI.textSecondary", UI.textSecondary, "color-text-secondary"],
      ["UI.border", UI.border, "color-border"],
    ];

    const drifted = pairs
      .filter(([, js, name]) => lower(js) !== token(name))
      .map(([label, js, name]) => `${label} is ${lower(js)}, but --${name} is ${token(name)}`);

    expect(drifted).toEqual([]);
  });

  /**
   * The values these three replaced. They are barred by value rather than by
   * name because the failure mode was a literal pasted into a component, not
   * an import - and a literal is invisible to the type system.
   */
  it("keeps the retired low-contrast values out of the palette", () => {
    const retired = ["#1b8295", "#bd5a46", "#2f8f6b", "#fafaf7", "#263645", "#667588"];
    const live = [
      ...Object.values(LAYER_COLORS),
      ...Object.values(YEAR_COLORS),
      ...Object.values(UI),
    ].map(lower);

    expect(live.filter((c) => retired.includes(c))).toEqual([]);
  });
});

describe("colours that carry text", () => {
  const WHITE = "#ffffff";

  /**
   * Each accent against the surface it actually prints text on. The tints
   * are the chip backgrounds the components pair them with; they are written
   * here as literals because that is how the components hold them, and this
   * test is the thing that would notice if one of them moved.
   */
  const TEXT_ON: [string, string, string][] = [
    ["navy on white", UI.navy, WHITE],
    ["text on white", UI.text, WHITE],
    ["text on the page ground", UI.text, UI.background],
    ["secondary text on white", UI.textSecondary, WHITE],
    ["secondary text on the page ground", UI.textSecondary, UI.background],
    ["blue link on white", UI.blue, WHITE],
    ["teal on white", UI.teal, WHITE],
    ["teal on its chip tint", UI.teal, "#e8f1f3"],
    ["rust on white", UI.rust, WHITE],
    ["rust on its chip tint", UI.rust, "#f7e9e5"],
    ["2026 green text on white", YEAR_COLORS.y2026Text, WHITE],
    ["2026 green text on its chip tint", YEAR_COLORS.y2026Text, "#e8f1ec"],
    ["2024 blue text on white", YEAR_COLORS.y2024Text, WHITE],
    ["2024 blue text on its chip tint", YEAR_COLORS.y2024Text, "#eef2f7"],
    ["rust figure on the white card", YEAR_COLORS.negative, WHITE],
    ["white on the teal fill", WHITE, UI.teal],
    ["white on the navy fill", WHITE, UI.navy],
  ];

  it("clears 4.5:1 everywhere it prints", () => {
    const failures = TEXT_ON.filter(([, fg, bg]) => contrast(fg, bg) < 4.5).map(
      ([label, fg, bg]) => `${label}: ${contrast(fg, bg).toFixed(2)}:1 (${fg} on ${bg})`,
    );
    expect(failures).toEqual([]);
  });

  /**
   * The green needed a darker sibling precisely because the fill green does
   * not clear 4.5:1 on the green tint. If a later change made the fill green
   * dark enough to carry its own text, the sibling would be dead weight -
   * this says so rather than leaving it to be discovered.
   */
  it("still needs the separate text siblings for both years", () => {
    expect(contrast(YEAR_COLORS.y2026, "#e8f1ec")).toBeLessThan(4.5);
    expect(contrast(YEAR_COLORS.y2024, "#eef2f7")).toBeLessThan(4.5);
  });

  /**
   * The focus ring is not text, so it answers to the 3:1 non-text threshold
   * rather than 4.5:1 - but it has to clear that on every ground it can land
   * on, and a third of this site's links sit on navy. The blue ring managed
   * 2.32:1 there, which is why `.on-navy` re-points it to white.
   */
  it("keeps the focus ring visible on both grounds it lands on", () => {
    const blue = token("color-blue");
    expect(contrast(blue, WHITE)).toBeGreaterThanOrEqual(3);
    expect(contrast(WHITE, token("color-navy"))).toBeGreaterThanOrEqual(3);
    expect(contrast(WHITE, token("color-navy-deep"))).toBeGreaterThanOrEqual(3);
    // The reason the override exists; if this ever passes, it can go.
    expect(contrast(blue, token("color-navy"))).toBeLessThan(3);
  });
});
