import { describe, expect, it } from "vitest";
import { fmtDate as siteDate, fmtUsd as siteUsd } from "@/lib/format";
import { fmtDate as mirrorDate, fmtUsd as mirrorUsd } from "../scripts/watch/format-mirror.mjs";

/**
 * The writer's copy of the formatting, pinned to the site's.
 *
 * `scripts/watch/format-mirror.mjs` hand-copies `fmtUsd` and `fmtDate`
 * because the scripts run on plain Node with no TypeScript loader. This
 * repository already has one mirror that drifted unnoticed - the search
 * index builder's copy of the stage vocabulary - and the cost there was
 * an Arabic stage name that stayed wrong in a built artefact after every
 * source file had been corrected.
 *
 * A mirror that publishes figures automatically can afford that even
 * less: a drift here means the amount written into the data reads one
 * way and the amount the page renders reads another. So the two are run
 * over the same inputs and compared.
 */

const AMOUNTS = [
  0,
  1,
  999,
  1_000,
  999_999,
  1_000_000,
  2_000_000,
  3_000_000,
  4_130_000,
  9_999_999,
  10_000_000,
  10_500_000,
  99_000_000,
  250_000_000,
  999_999_999,
  1_000_000_000,
  11_000_000_000,
  14_000_000_000,
  1_234_567_890,
];

const DATES = [
  "2026-06-29",
  "2026-01-01",
  "2026-12-31",
  "2025-08-25",
  "2027-03-08",
  "not-a-date",
];

describe("fmtUsd", () => {
  it("agrees with the site in English", () => {
    for (const n of AMOUNTS) expect(mirrorUsd(n, "en"), String(n)).toBe(siteUsd(n, "en"));
  });

  it("agrees with the site in Arabic, including the three-to-ten plural", () => {
    for (const n of AMOUNTS) expect(mirrorUsd(n, "ar"), String(n)).toBe(siteUsd(n, "ar"));
  });

  it("defaults to English in both", () => {
    for (const n of AMOUNTS) expect(mirrorUsd(n), String(n)).toBe(siteUsd(n));
  });
});

describe("fmtDate", () => {
  it("agrees with the site in both languages", () => {
    for (const d of DATES) {
      expect(mirrorDate(d, "en"), d).toBe(siteDate(d, "en"));
      expect(mirrorDate(d, "ar"), d).toBe(siteDate(d, "ar"));
    }
    expect(mirrorDate(null, "en")).toBe(siteDate(null, "en"));
    expect(mirrorDate(null, "ar")).toBe(siteDate(null, "ar"));
  });
});
