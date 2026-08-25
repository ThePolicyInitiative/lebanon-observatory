import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import { bannedHitsInPage } from "../vocab-patterns";

/**
 * The hydrated site, in a real browser.
 *
 * Everything else in the suite reads source or data. Nothing else mounts a
 * component, so until this file existed the whole client half of the site
 * shipped unobserved: hydration on every route, the keyboard model on the
 * composite widgets, the two drawers and their focus handling, and the
 * map's fall back to the vector view. An uncaught error in any of those is
 * invisible to a static check and immediately visible to a reader.
 *
 * The assertions are deliberately structural - roles, ARIA state, focus,
 * request status, direction - and never a sentence. Copy is rewritten
 * often and by several hands; the contracts below are what has to hold
 * whatever the words say.
 */

const app = join(process.cwd(), "src", "app");

/** Route segments read off disk, so a new page is covered the day it lands. */
function segments(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => statSync(join(root, name)).isDirectory())
    .filter((name) => existsSync(join(root, name, "page.tsx")))
    .sort();
}

const EN_ROUTES = ["/", ...segments(join(app, "(en)")).map((s) => `/${s}`)];
const AR_ROUTES = ["/ar", ...segments(join(app, "(ar)", "ar")).map((s) => `/ar/${s}`)];
const ROUTES = [...EN_ROUTES, ...AR_ROUTES];

/**
 * Console noise that is not a defect in the page: a request the browser
 * reports as failed. The news feed reaches optional upstreams that are not
 * configured in a local run, and a 404 or a rate limit there is handled
 * copy, not a broken page. Everything else counts.
 */
const IGNORED_CONSOLE = [
  /Failed to load resource/i,
  /the server responded with a status of/i,
  /net::ERR_/i,
];

type Watch = { errors: string[]; crashes: string[] };

/** Starts recording uncaught errors and console errors for one page. */
function watch(page: Page): Watch {
  const w: Watch = { errors: [], crashes: [] };
  page.on("pageerror", (e) => w.crashes.push(`${e.name}: ${e.message}`));
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (IGNORED_CONSOLE.some((r) => r.test(text))) return;
    w.errors.push(text);
  });
  return w;
}

test.describe("every route", () => {
  test("hydrates without an uncaught error or a React complaint", async ({ page }) => {
    test.setTimeout(60_000 + ROUTES.length * 15_000);
    const w = watch(page);
    const failures: string[] = [];
    for (const route of ROUTES) {
      w.errors.length = 0;
      w.crashes.length = 0;
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator("body")).toBeVisible();
      for (const c of w.crashes) failures.push(`${route}: uncaught - ${c}`);
      for (const e of w.errors) failures.push(`${route}: console error - ${e}`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });

  /**
   * The rendered half of the vocabulary rule. The static scan reads string
   * literals; this reads what the browser paints, which is the only place
   * a word assembled at runtime out of fragments ever appears.
   *
   * Everything the live feed prints is left out: headlines and mastheads
   * are other people's words, quoted as published, and rewriting one would
   * be a misquote. That means the news routes, and it means the teaser the
   * home pages carry - so the feed is refused here rather than filtered
   * afterwards, which also makes the sweep independent of what happens to
   * be in the news today. The teaser then renders its own bounded failure
   * copy, which IS the site's words and is scanned with the rest.
   */
  test("prints none of the banned words to the reader", async ({ page }) => {
    test.setTimeout(60_000 + ROUTES.length * 15_000);
    await page.route("**/api/news**", (route) => route.abort());
    const offenders: string[] = [];
    for (const route of ROUTES.filter((r) => !r.includes("/news"))) {
      await page.goto(route, { waitUntil: "networkidle" });
      const text = await page.locator("body").innerText();
      for (const hit of bannedHitsInPage(text)) offenders.push(`${route}: ${hit}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

test.describe("the Arabic side", () => {
  test("renders right-to-left, in Arabic, with real content", async ({ page }) => {
    await page.goto("/ar", { waitUntil: "networkidle" });
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "ar");
    await expect(html).toHaveAttribute("dir", "rtl");

    const text = await page.locator("body").innerText();
    const arabic = (text.match(/[؀-ۿ]/g) ?? []).length;
    // A page that regressed to English keeps its wrapper and loses this.
    expect(arabic, "the Arabic home page paints too little Arabic").toBeGreaterThan(500);
  });
});

/** The one-of-many keyboard model, on a widget a reader actually meets. */
test.describe("the composite-widget keyboard model", () => {
  const group = (page: Page) => page.locator('[role="tablist"] [role="tab"]');

  test("keeps one Tab stop and moves selection with the arrow keys", async ({ page }) => {
    await page.goto("/actors", { waitUntil: "networkidle" });
    const tabs = group(page);
    await expect(tabs.first()).toBeVisible();
    expect(await tabs.count()).toBeGreaterThan(1);

    // One Tab stop for the whole group: the rest are reachable by arrow.
    await expect(page.locator('[role="tablist"] [role="tab"][tabindex="0"]')).toHaveCount(1);

    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    // Selection follows focus, so the panel moved with it.
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toHaveAttribute("tabindex", "0");
    await expect(tabs.nth(0)).toHaveAttribute("tabindex", "-1");
  });

  test("flips the horizontal keys under right-to-left", async ({ page }) => {
    await page.goto("/ar/actors", { waitUntil: "networkidle" });
    const tabs = group(page);
    await expect(tabs.first()).toBeVisible();
    expect(await tabs.count()).toBeGreaterThan(1);

    await tabs.nth(0).focus();
    // Left means visually left. Under RTL that is the NEXT item in DOM
    // order, which is what makes this the opposite of the English case.
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("the explorer drawer", () => {
  test("opens an entry, traps focus in it, and hands focus back on close", async ({ page }) => {
    const w = watch(page);
    await page.goto("/explorer", { waitUntil: "networkidle" });

    const firstRow = page.locator("table tbody tr").first();
    await expect(firstRow).toBeVisible();

    const entryFetch = page.waitForResponse((r) => /\/entries\/[^/]+\.json$/.test(r.url()));
    await firstRow.click();
    const entry = await entryFetch;
    expect(entry.status()).toBe(200);

    // A native modal dialog: the browser makes everything behind it inert,
    // which is the whole reason this is a <dialog> and not a <div>.
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((d) => d.contains(document.activeElement)),
      "focus stayed outside the open drawer",
    ).toBe(true);
    expect((await dialog.innerText()).trim().length).toBeGreaterThan(40);

    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    // Closing releases the top layer first, then restores focus to the
    // control that opened the drawer. Reversed, the restore is a no-op.
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("table")),
      "focus did not come back to the row that opened the drawer",
    ).toBe(true);

    expect(w.crashes).toEqual([]);
  });
});

test.describe("the change heatmap", () => {
  test("walks the grid by keyboard and opens the entries behind a cell", async ({ page }) => {
    const w = watch(page);
    await page.goto("/", { waitUntil: "networkidle" });

    const chart = page.locator('[role="application"]').first();
    await chart.scrollIntoViewIfNeeded();
    await chart.focus();
    await expect(chart).toBeFocused();

    // Right then left returns the keyboard cell to where it started, so
    // the cell Enter opens is deterministic while the arrow keys are still
    // the thing being exercised.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");

    const cellFetch = page.waitForResponse((r) => /\/cells\/[^/]+\.json$/.test(r.url()));
    await page.keyboard.press("Enter");
    const cell = await cellFetch;
    expect(cell.status()).toBe(200);

    const drawer = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(drawer).toBeVisible();
    // The cell the keyboard starts on has entries behind it, so the drawer
    // has to list them rather than print its empty state.
    await expect(drawer.locator("li").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    // Focus goes back to the chart the drawer grew out of.
    await expect(chart).toBeFocused();

    expect(w.crashes).toEqual([]);
  });
});

test.describe("the map", () => {
  test("draws the vector map and completes its cadastre request", async ({ page }) => {
    const w = watch(page);
    const cadastre = page.waitForResponse((r) => r.url().includes("lebanon-adm3.geojson"));
    await page.goto("/map", { waitUntil: "networkidle" });

    const response = await cadastre;
    expect(response.status()).toBe(200);
    await expect(page.locator('svg[role="group"]').first()).toBeVisible();
    expect(w.crashes).toEqual([]);
  });

  test("stays on the vector map when the browser has no WebGL", async ({ page }) => {
    // Deterministic, unlike relying on whether this machine's headless
    // Chromium happens to have a working software rasteriser.
    await page.addInitScript(() => {
      const real = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        id: string,
        ...rest: unknown[]
      ) {
        if (id === "webgl" || id === "webgl2" || id === "experimental-webgl") return null;
        return (real as (...a: unknown[]) => unknown).call(this, id, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    const w = watch(page);
    await page.goto("/map", { waitUntil: "networkidle" });
    await expect(page.locator('svg[role="group"]').first()).toBeVisible();

    // The opt-in is gated on WebGL being there, so pressing it must leave
    // the reader on the vector map rather than on a blank canvas.
    const optIn = page.locator('button[aria-pressed]').first();
    if (await optIn.count()) {
      await optIn.scrollIntoViewIfNeeded();
      await optIn.click();
      await expect(optIn).toHaveAttribute("aria-pressed", "false");
    }
    await expect(page.locator('svg[role="group"]').first()).toBeVisible();
    expect(w.crashes).toEqual([]);
  });
});

/**
 * The sticky budget, asserted where it actually bites.
 *
 * Sticky chrome is the one kind of layout defect that a desktop review
 * cannot see: every bar here fits comfortably at 1280px and three of them
 * ate most of a phone. The map's control bar reached 453px under the 65px
 * header - 78% of a 667px viewport before any map was visible - and the
 * actor tab bar 205px, because four full layer names cannot pair on a
 * 343px line.
 *
 * Both languages, deliberately. The Arabic strings are shorter in three of
 * the four cases (its tab bar was already one row where English took four),
 * so a threshold checked only in Arabic would have passed throughout.
 */
test.describe("the sticky budget on a phone", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const route of ROUTES) {
    test(`leaves most of the viewport to the reader on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const measured = await page.evaluate(() => {
        const stuck = [...document.querySelectorAll<HTMLElement>("*")].filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.position !== "sticky" && cs.position !== "fixed") return false;
          // Only what pins VERTICALLY costs the reader viewport height. The
          // actor matrices freeze their row headers with `sticky start-0` on
          // roughly 180 <th> cells - horizontal sticky, which takes no
          // vertical space at all. Summing those gave 7,270px on /actors.
          return cs.top !== "auto";
        });
        // Nested sticky elements would double-count; keep only outermost.
        const outermost = stuck.filter((el) => !stuck.some((o) => o !== el && o.contains(el)));
        const total = outermost.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0);
        return {
          total,
          viewport: window.innerHeight,
          bars: outermost.map((el) => ({
            tag: el.tagName.toLowerCase(),
            h: Math.round(el.getBoundingClientRect().height),
          })),
        };
      });

      // Half the screen. Generous - the worst offender was at 78% - but it
      // is a budget, not a target, and it is what makes a regression loud.
      expect(
        measured.total,
        `sticky chrome ${Math.round(measured.total)}px of ${measured.viewport}px: ${JSON.stringify(measured.bars)}`,
      ).toBeLessThan(measured.viewport * 0.5);
    });
  }
});
