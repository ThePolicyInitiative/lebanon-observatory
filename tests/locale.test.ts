import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { AR } from "@/lib/i18n";
import { kpis } from "@/lib/data";

/**
 * The Arabic side has to stay a mirror of the English one. The failure this
 * guards against is the one the site actually had: a language switch that
 * changed a single page and left every link pointing back into English.
 *
 * Scope note. These checks read page FILES: which routes exist, what each
 * page file links to, how much Arabic it carries. Since the Arabic rebuild
 * most reader copy lives in shared bilingual modules that both sides mount,
 * which no file-level count can see. That copy is guarded by
 * `bilingual-tables.test.ts`, which compares the two branches of every
 * language table, and by the rendered `/ar` check in the Playwright suite,
 * which reads what a browser actually paints. The floors below stay what
 * they always were: a guard against a page cut back to a stub.
 */

/** The pages with their own entry in AR.pages. */
const PAGES = ["actors", "actions", "findings", "reported", "entries"];
/**
 * The two halves of the site have separate root layouts, so each lives in
 * its own route group. Route groups do not appear in a URL: (en)/actors is
 * /actors and (ar)/ar/actors is /ar/actors.
 */
const app = join(process.cwd(), "src", "app");
const en = join(app, "(en)");
const ar = join(app, "(ar)", "ar");

/** Route segments that carry a page, read off disk rather than listed. */
function routesIn(root: string): string[] {
  return readdirSync(root)
    .filter((name) => statSync(join(root, name)).isDirectory())
    .filter((name) => existsSync(join(root, name, "page.tsx")))
    .sort();
}

describe("the Arabic side", () => {
  it("has a page for every English page", () => {
    for (const p of PAGES) {
      expect(existsSync(join(en, p, "page.tsx")), `English /${p} is missing`).toBe(true);
      expect(existsSync(join(ar, p, "page.tsx")), `Arabic /ar/${p} is missing`).toBe(true);
    }
    expect(existsSync(join(ar, "page.tsx"))).toBe(true);
  });

  /**
   * The same check, without a list to keep up to date. A route added on one
   * side and not the other is the failure mode this catches, and the list
   * above cannot catch it because a new route is not in the list.
   */
  it("mirrors every route either side gains, listed or not", () => {
    expect(routesIn(ar)).toEqual(routesIn(en));
  });

  it("sets Arabic and right-to-left on the document itself, not on a wrapper", () => {
    const layout = readFileSync(join(app, "(ar)", "layout.tsx"), "utf-8");
    // Both attributes have to sit on <html>. On a <div> inside <body> they
    // reach the CSS and nothing else: not a crawler, not a screen reader
    // announcing the document language.
    const html = /<html\s[^>]*>/.exec(layout)?.[0] ?? "";
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');

    const english = readFileSync(join(app, "(en)", "layout.tsx"), "utf-8");
    const englishHtml = /<html\s[^>]*>/.exec(english)?.[0] ?? "";
    expect(englishHtml).toContain('lang="en"');
    expect(englishHtml).toContain('dir="ltr"');
  });

  /**
   * The Arabic headline figure is a translation of the words around the
   * number, never of the number. If the two strings ever carry different
   * digits, one language is telling the reader something the other is not.
   */
  it("prints the same digits in both languages for every indicator", () => {
    const digits = (s: string) => s.replace(/[^\d.%]/g, "");
    for (const kpi of kpis) {
      expect(kpi.displayAr, `${kpi.id} has no Arabic figure`).toBeTruthy();
      expect(digits(kpi.displayAr), `${kpi.id} disagrees across languages`).toBe(
        digits(kpi.display),
      );
    }
  });

  it("names every page in Arabic in the navigation", () => {
    const arabic = /[؀-ۿ]/;
    // The seven tab labels, the header's search control, the home label,
    // and the footer topic names that are not one of the tabs.
    for (const key of [
      "home",
      "aim",
      "actors2",
      "actions",
      "map",
      "findings",
      "methodology",
      "reported",
      "search",
      "actors",
      "news",
      "explorer",
      "method",
    ] as const) {
      expect(arabic.test(AR.nav[key]), `nav.${key} is not Arabic`).toBe(true);
    }
  });

  it("writes every Arabic page's own copy in Arabic", () => {
    const arabic = /[؀-ۿ]/;
    for (const key of PAGES as (keyof typeof AR.pages)[]) {
      // A page whose English twin carries no opening passage carries none
      // here either, so lede and point are checked where they exist rather
      // than required of every page.
      const page = AR.pages[key] as {
        title: string;
        lede?: string;
        point?: string;
      };
      expect(arabic.test(page.title), `${key} title is not Arabic`).toBe(true);
      if (page.lede !== undefined) {
        expect(page.lede.length, `${key} lede is too thin`).toBeGreaterThan(80);
        expect(arabic.test(page.lede), `${key} lede is not Arabic`).toBe(true);
      }
      if (page.point !== undefined) {
        expect(arabic.test(page.point), `${key} point is not Arabic`).toBe(true);
      }
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
      const dir = join(ar, p);
      const src = readFileSync(join(dir, "page.tsx"), "utf-8");

      // Prose may live in the page, in a component beside it, or in a
      // shared bilingual module the page mounts - the news and explorer
      // pages are heading plus module by design, because their English
      // twins are too. What a reader sees is the page plus everything it
      // mounts, so that is what counts towards the floor.
      let prose = src;
      for (const m of src.matchAll(/from "\.\/([A-Za-z][\w-]*)"/g)) {
        const sibling = join(dir, `${m[1]}.tsx`);
        if (existsSync(sibling)) prose += readFileSync(sibling, "utf-8");
      }
      for (const m of src.matchAll(/from "@\/((?:components|app|lib)\/[^"]+)"/g)) {
        for (const ext of [".tsx", ".ts"]) {
          const mounted = join(import.meta.dirname, "..", "src", `${m[1]}${ext}`);
          if (existsSync(mounted)) {
            prose += readFileSync(mounted, "utf-8");
            break;
          }
        }
      }
      const arabicChars = (prose.match(arabicChar) ?? []).length;

      const sections = (src.match(/<section/g) ?? []).length;
      /**
       * The heaviest modules an Arabic page mounts now come from three
       * places, not one: the shared components, the shared bilingual
       * modules that live under the English route group, and a component
       * beside the page. Counting only the first left the pages that lean
       * hardest on shared copy - entries, reported - scoring zero
       * here and passing on their section count alone.
       */
      const shared = (src.match(/from "@\/(components|app|lib)\//g) ?? []).length;
      const local = (src.match(/from "\.\.?\/[A-Z]/g) ?? []).length;
      expect(
        sections + shared + local,
        `/ar/${p} renders nothing of its own`,
      ).toBeGreaterThanOrEqual(1);
      // One floor for every page. It is set below the thinnest page today so
      // it catches a stub, not so high that it dictates how long a page
      // runs. It measures the page FILE - the copy inside the shared
      // modules is checked by bilingual-tables.test.ts and by the rendered
      // /ar sweep in the Playwright suite.
      expect(arabicChars, `/ar/${p} carries too little Arabic`).toBeGreaterThanOrEqual(200);
    }
  });

  /**
   * Arabic pages may link to English only on purpose - the way through to
   * the full module. A bare nav or footer link is what strands a reader.
   *
   * Every Arabic route is scanned, not just the listed ones, and the shell
   * they all render is scanned with them: it is where the way out and the
   * way home are actually written, and it sits one directory up, outside
   * the sibling pattern the prose count uses.
   */
  it("keeps Arabic pages inside Arabic apart from the deliberate way out", () => {
    const leaks = (src: string) =>
      [...src.matchAll(/href="(\/(?!ar\b)[^"]*)"/g)].map((m) => m[1]);

    for (const p of routesIn(ar)) {
      const src = readFileSync(join(ar, p, "page.tsx"), "utf-8");
      expect(leaks(src), `/ar/${p} links straight into English`).toEqual([]);
      expect(src, `/ar/${p} offers no way through to English`).toContain(
        `englishHref="/${p}"`,
      );
    }

    const shell = join(ar, "ArabicPageShell.tsx");
    expect(existsSync(shell), "the Arabic page shell has moved").toBe(true);
    const shellSrc = readFileSync(shell, "utf-8");
    expect(leaks(shellSrc), "the Arabic shell links straight into English").toEqual([]);
    // The way out is passed in per page, never hardcoded to one route.
    expect(shellSrc).toContain("href={englishHref}");
  });
});
