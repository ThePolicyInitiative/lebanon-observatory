import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AR } from "@/lib/i18n";

/**
 * The Arabic side has to stay a mirror of the English one. The failure this
 * guards against is the one the site actually had: a language switch that
 * changed a single page and left every link pointing back into English.
 */

const PAGES = ["compare", "actors", "damage", "map", "finance", "news", "explorer"];
const app = join(process.cwd(), "src", "app");

describe("the Arabic side", () => {
  it("has a page for every English page", () => {
    for (const p of PAGES) {
      expect(existsSync(join(app, p, "page.tsx")), `English /${p} is missing`).toBe(true);
      expect(existsSync(join(app, "ar", p, "page.tsx")), `Arabic /ar/${p} is missing`).toBe(true);
    }
    expect(existsSync(join(app, "ar", "page.tsx"))).toBe(true);
  });

  it("sets Arabic and right-to-left on everything under /ar", () => {
    const layout = readFileSync(join(app, "ar", "layout.tsx"), "utf-8");
    expect(layout).toContain('lang="ar"');
    expect(layout).toContain('dir="rtl"');
  });

  it("names every page in Arabic in the navigation", () => {
    const arabic = /[؀-ۿ]/;
    for (const key of ["home", "compare", "actors", "damage", "map", "finance", "news", "explorer"] as const) {
      expect(arabic.test(AR.nav[key]), `nav.${key} is not Arabic`).toBe(true);
    }
  });

  it("writes every Arabic page's own copy in Arabic", () => {
    const arabic = /[؀-ۿ]/;
    for (const key of PAGES as (keyof typeof AR.pages)[]) {
      const page = AR.pages[key];
      expect(arabic.test(page.title), `${key} title is not Arabic`).toBe(true);
      expect(page.lede.length, `${key} lede is too thin`).toBeGreaterThan(80);
      expect(arabic.test(page.lede), `${key} lede is not Arabic`).toBe(true);
      expect(arabic.test(page.point), `${key} point is not Arabic`).toBe(true);
    }
  });

  /**
   * Every Arabic page has to be a page, not a heading with a link out. It
   * satisfies that either by carrying its own sections of Arabic prose or by
   * rendering the shared modules, which bring their own. The thresholds are
   * deliberately low: they catch a page cut back to a stub, they do not pin
   * the shape of any page.
   */
  it("gives every Arabic page real content of its own", () => {
    const arabicChar = /[؀-ۿ]/g;
    for (const p of PAGES) {
      const dir = join(app, "ar", p);
      const src = readFileSync(join(dir, "page.tsx"), "utf-8");

      // Prose may live in the page or in a component beside it, as the news
      // feed's does, so both count towards the same floor.
      let prose = src;
      for (const m of src.matchAll(/from "\.\/([A-Za-z][\w-]*)"/g)) {
        const sibling = join(dir, `${m[1]}.tsx`);
        if (existsSync(sibling)) prose += readFileSync(sibling, "utf-8");
      }
      const arabicChars = (prose.match(arabicChar) ?? []).length;

      const sections = (src.match(/<section/g) ?? []).length;
      const shared = (src.match(/from "@\/components\//g) ?? []).length;
      const local = (src.match(/from "\.\/[A-Z]/g) ?? []).length;
      expect(
        sections + shared + local,
        `/ar/${p} renders nothing of its own`,
      ).toBeGreaterThanOrEqual(1);
      // One floor for every page. It is set below the thinnest page today so
      // it catches a stub, not so high that it dictates how long a page runs.
      expect(arabicChars, `/ar/${p} carries too little Arabic`).toBeGreaterThanOrEqual(200);
    }
  });

  /**
   * Arabic pages may link to English only on purpose - the way through to
   * the full module. A bare nav or footer link is what strands a reader.
   */
  it("keeps Arabic pages inside Arabic apart from the deliberate way out", () => {
    for (const p of PAGES) {
      const src = readFileSync(join(app, "ar", p, "page.tsx"), "utf-8");
      const englishHrefs = [...src.matchAll(/href="(\/(?!ar\b)[^"]*)"/g)].map((m) => m[1]);
      expect(englishHrefs, `/ar/${p} links straight into English`).toEqual([]);
      expect(src).toContain(`englishHref="/${p}"`);
    }
  });
});
