import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The type scale, and the rule that keeps call sites on it.
 *
 * The scale was declared and then almost entirely ignored: 11 call sites
 * used the tokens and 646 used a raw Tailwind utility or a hand-typed
 * bracket size. A scale nothing reads is not a scale, it is a comment -
 * and the cost was not only inconsistency.
 *
 * globals.css lifts --text-micro and --text-meta by one step under
 * [dir="rtl"], because IBM Plex Arabic at 11px is optically smaller than
 * Inter at 11px and Arabic letterforms carry meaning in strokes above and
 * below the baseline. A raw `text-[11px]` does not lift. So every one of
 * those call sites was quietly opting the Arabic tree out of a legibility
 * rule the site had already decided on.
 */

const SRC = join(process.cwd(), "src");

/**
 * The [dir="rtl"] RULE, not the first mention of it - the comment above
 * the scale names the block, and matching that instead sliced the tokens
 * out of their own :root.
 */
const rtlBlockStart = (css: string) => css.search(/^\[dir="rtl"\] \{/m);

function sources(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.tsx$/.test(name)) out.push(p);
  }
  return out;
}

/** A Tailwind font-size utility that is not one of ours. */
const RAW = /(?:^|[\s"'`])(?:(?:sm|md|lg|xl|2xl):)?text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|\[[0-9.]+(?:px|rem)\])(?=[\s"'`]|$)/;

describe("the type scale", () => {
  it("is the only place a font size is chosen", () => {
    const offenders: string[] = [];
    for (const file of sources(SRC)) {
      readFileSync(file, "utf-8")
        .split("\n")
        .forEach((line, i) => {
          // Comments explain the history and may name the old utilities.
          const code = line.replace(/\/\*.*?\*\//g, "").replace(/\/\/.*$/, "");
          if (RAW.test(code)) offenders.push(`${file.replace(process.cwd(), "")}:${i + 1}  ${code.trim().slice(0, 90)}`);
        });
    }
    expect(
      offenders,
      `these choose a font size outside the scale - use text-micro/meta/body/lead/h3/h2/h1/display:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });

  /**
   * The scale itself. Named for the job, so the sizes may move - but they
   * have to stay ordered and distinct, which is the one property a scale
   * cannot lose and still be one.
   */
  it("keeps its steps ordered and distinct", () => {
    const css = readFileSync(join(SRC, "app", "globals.css"), "utf-8");
    const root = css.slice(css.indexOf(":root"), rtlBlockStart(css));
    const order = ["micro", "meta", "body", "lead", "h3", "h2", "h1", "display"];
    const px = order.map((name) => {
      const m = new RegExp(`--text-${name}:\\s*([0-9.]+)rem`).exec(root);
      expect(m, `--text-${name} is missing from :root`).toBeTruthy();
      return Number(m![1]) * 16;
    });
    for (let i = 1; i < px.length; i++) {
      expect(px[i], `${order[i]} is not larger than ${order[i - 1]}`).toBeGreaterThan(px[i - 1]);
    }
    // The floor: micro is the smallest the Arabic face survives.
    expect(px[0]).toBeGreaterThanOrEqual(11);
  });

  /**
   * The Arabic lift, which is the reason the migration was worth doing
   * rather than only tidy. It applies to the two smallest steps and to
   * those only - from body up the faces are close enough that a bump
   * would just make the Arabic pages look shouted.
   */
  it("lifts the two smallest steps for Arabic, and no others", () => {
    const css = readFileSync(join(SRC, "app", "globals.css"), "utf-8");
    const rtlStart = rtlBlockStart(css);
    const rtl = css.slice(rtlStart, css.indexOf("}", rtlStart));
    const root = css.slice(css.indexOf(":root"), rtlStart);
    const val = (block: string, name: string) => {
      const m = new RegExp(`--text-${name}:\\s*([0-9.]+)rem`).exec(block);
      return m ? Number(m[1]) * 16 : null;
    };
    for (const name of ["micro", "meta"]) {
      const base = val(root, name)!;
      const lifted = val(rtl, name);
      expect(lifted, `Arabic does not lift --text-${name}`).toBeTruthy();
      expect(lifted!).toBeGreaterThan(base);
      expect(lifted! - base, `the ${name} lift should be one step`).toBeLessThanOrEqual(2);
    }
    for (const name of ["body", "lead", "h3", "h2", "h1", "display"]) {
      expect(val(rtl, name), `--text-${name} should not be lifted for Arabic`).toBeNull();
    }
  });
});

describe("density", () => {
  /**
   * 44px is the pointer target, not a density knob. Tightening the header
   * means taking the padding off around the target, never off the target -
   * so --control-h is named here to keep it out of the tuning, and this
   * says so in a way that fails if anyone tunes it anyway.
   */
  it("keeps the pointer target at 44px however the density is tuned", () => {
    const css = readFileSync(join(SRC, "app", "globals.css"), "utf-8");
    const m = /--control-h:\s*([0-9.]+)rem/.exec(css);
    expect(m, "--control-h is missing").toBeTruthy();
    expect(Number(m![1]) * 16).toBe(44);
  });

  it("leaves the header exactly as tall as its target plus its padding", () => {
    const css = readFileSync(join(SRC, "app", "globals.css"), "utf-8");
    const nav = readFileSync(join(SRC, "components", "SiteNav.tsx"), "utf-8");
    const header = Number(/--header-h:\s*([0-9.]+)px/.exec(css)![1]);
    // The row is py-N around a min-h-11 target, inside a 1px-bordered bar.
    const py = /py-([0-9.]+)/.exec(nav.slice(nav.indexOf("<header")))![1];
    const padding = Number(py) * 4 * 2;
    expect(nav, "the header no longer sizes itself from the token").toContain(
      "min-h-[var(--header-h)]",
    );
    expect(header, `44px target + ${padding}px padding + 1px border`).toBe(44 + padding + 1);
  });
});
