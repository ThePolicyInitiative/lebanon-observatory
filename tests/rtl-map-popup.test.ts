import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The pan-and-zoom map's popups on the Arabic page.
 *
 * maplibre-gl.css carries a handful of `[dir=rtl] .maplibregl-popup-*`
 * rules that flip which side the tip sits on. They are right when the
 * popup is laid out right-to-left, and this one is not: the map container
 * is deliberately dir="ltr", because the canvas is WebGL and the controls
 * position themselves with physical properties. Those selectors match on
 * an ancestor though, and the Arabic document root is dir="rtl" - so they
 * fired anyway, and the tip pointed away from the pin it belongs to.
 *
 * globals.css puts them back, scoped under the map. This reads the
 * library's own stylesheet rather than a list copied out of it, so a
 * MapLibre upgrade that adds a seventh rule fails here rather than
 * quietly bending another popup.
 */
const LIB = "node_modules/maplibre-gl/dist/maplibre-gl.css";
const OURS = "src/app/globals.css";

/**
 * Selectors in a stylesheet that are both [dir=rtl] and about popups.
 *
 * Comments are stripped first: the override in globals.css explains
 * itself by naming the very selectors it neutralises, and a parser that
 * splits on braces reads that prose as a rule.
 */
function rtlPopupSelectors(css: string): string[] {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("}")
    .map((block) => block.split("{")[0]?.trim() ?? "")
    .filter((sel) => /\[dir=["']?rtl["']?\]/.test(sel) && /maplibregl-popup/.test(sel))
    .flatMap((sel) => sel.split(",").map((s) => s.trim()))
    .filter(Boolean);
}

/** The class chain a selector targets, ignoring dir and descendant syntax. */
function classes(sel: string): string[] {
  return [...sel.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
}

describe("MapLibre popup direction on the Arabic page", () => {
  const lib = readFileSync(LIB, "utf8");
  const ours = readFileSync(OURS, "utf8");

  it("finds the library rules this is guarding against", () => {
    // If MapLibre stops shipping them the override is dead weight, and
    // this says so rather than passing silently.
    expect(rtlPopupSelectors(lib).length).toBeGreaterThan(0);
  });

  it("neutralises every one of them under the map", () => {
    const mine = rtlPopupSelectors(ours).map(classes);
    for (const sel of rtlPopupSelectors(lib)) {
      const needed = classes(sel);
      const covered = mine.some((m) => needed.every((c) => m.includes(c)));
      expect(covered, `no override covers "${sel}"`).toBe(true);
    }
  });

  it("scopes the overrides to the map rather than the whole page", () => {
    // Other things on an Arabic page may legitimately want the RTL
    // treatment; this is only about a container forced to ltr.
    for (const sel of rtlPopupSelectors(ours)) {
      expect(sel, `"${sel}" is not scoped to the map`).toContain("maplibregl-map");
    }
  });

  it("keeps the overrides out of a cascade layer", () => {
    // A layered rule loses to the library's own specificity, which is the
    // trap the letter-spacing backstop above it already fell into once.
    const start = ours.indexOf("maplibregl-popup-anchor-left");
    expect(start).toBeGreaterThan(-1);
    const before = ours.slice(0, start);
    const opened = (before.match(/@layer[^{]*\{/g) ?? []).length;
    const closedBraces = (before.match(/\}/g) ?? []).length;
    const openBraces = (before.match(/\{/g) ?? []).length;
    // Every block opened before this point is also closed before it.
    expect(openBraces, `${opened} layer(s) still open at the override`).toBe(closedBraces);
  });
});
