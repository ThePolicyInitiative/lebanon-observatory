import { describe, expect, it } from "vitest";
import { CHANGE_CHARTS, CONTENT, GOVERNANCE_SHIFT, type Bi } from "@/app/(en)/who/actor-content";
import {
  LAYERS,
  MUNICIPAL_POWER_GAP,
  STAGES,
  changeFor,
  countsFor,
  financeFunnel,
  kpis,
  layerTotal,
  yearTotal,
} from "@/lib/data-client";
import { roleRecords } from "@/lib/data";
import { stageList } from "@/lib/vocab";
import actorsJson from "@/data/actors.json";
import type { ActorLayer } from "@/lib/types";
import { copyStrings, parse, rel, srcFiles } from "./source-tree";

/**
 * Figures written into prose, checked against the figures recomputed from
 * the tracking.
 *
 * The problem this exists for: a sentence like "Relief and protection: +35
 * (20 → 55)" and the number 55 in stage-counts.json are two independent
 * hardcodings that happen to agree. A legitimate revision to the counts
 * updates the data and the data tests, and leaves the sentence quietly
 * false - in both languages, since the Arabic carries the same digits.
 *
 * Nothing here pins wording. The checks read whatever figures the prose
 * currently carries and ask the data whether they are true, so the copy
 * stays hand-written and a rewrite that keeps the arithmetic honest never
 * touches this file.
 */

/** "15 → 23" in English, "15 ← 23" in Arabic: 2024 first, 2026 second. */
const PAIR = /(?<!\d)(\d{1,3})(?!\d)\s*[→←]\s*(?<!\d)(\d{1,3})(?!\d)/g;
/** "+8 (15 → 23)" and "−7 (13 ← 6)". */
const DELTA_PAIR =
  /([+−-])(\d{1,3})\s*\(\s*(?<!\d)(\d{1,3})(?!\d)\s*[→←]\s*(?<!\d)(\d{1,3})(?!\d)\s*\)/g;
/** A bare signed change: "coordination +25", "assessment −7", "(-11)". */
const SIGNED = /(?:^|[\s(])([+−]|-(?=\d))(\d{1,3})(?![\d.%])/g;
/**
 * A share of a column: "24 of 54 traced actors". The Arabic joiner is
 * "من", which one word may sit in front of - "4 فقط من 8", four only of
 * eight - so the pattern allows a single word between the two.
 */
const SHARE_EN = /(?<!\d)(\d{1,3})(?!\d)\s+of\s+(?<!\d)(\d{1,3})(?!\d)/g;
const SHARE_AR = /(?<!\d)(\d{1,3})(?!\d)\s+(?:[^\d\s]+\s+)?من\s+(?<!\d)(\d{1,3})(?!\d)/g;
/** Every figure in a string, for comparing the two languages digit for digit. */
const NUMBER = /\d+(?:\.\d+)?/g;

function signOf(s: string): number {
  return s === "+" ? 1 : -1;
}

/** Every (2024, 2026) pair the tracking actually contains. */
function everyTrackedPair(): Set<string> {
  const out = new Set<string>();
  const add = (a: number, b: number) => out.add(`${a}→${b}`);
  for (const layer of LAYERS) {
    const a = countsFor(2024, layer);
    const b = countsFor(2026, layer);
    a.forEach((v, i) => add(v, b[i]));
    add(layerTotal(2024, layer), layerTotal(2026, layer));
  }
  for (const row of MUNICIPAL_POWER_GAP) add(row.y2024, row.y2026);
  add(yearTotal(2024), yearTotal(2026));
  const byYear = (y: number) => roleRecords.filter((r) => r.year === y).length;
  add(byYear(2024), byYear(2026));
  const actorsIn = (y: number) => actorsJson.filter((a) => a.year === y).length;
  add(actorsIn(2024), actorsIn(2026));
  return out;
}

/** The pairs one layer's prose is allowed to quote. */
function pairsForLayer(layer: ActorLayer): Set<string> {
  const out = new Set<string>();
  const a = countsFor(2024, layer);
  const b = countsFor(2026, layer);
  a.forEach((v, i) => out.add(`${v}→${b[i]}`));
  out.add(`${layerTotal(2024, layer)}→${layerTotal(2026, layer)}`);
  if (layer === "municipal")
    for (const row of MUNICIPAL_POWER_GAP) out.add(`${row.y2024}→${row.y2026}`);
  if (layer === "community")
    out.add(`${layerTotal(2024, "community")}→${layerTotal(2026, "community")}`);
  return out;
}

/**
 * The stage a bullet names, when it names one. Bullets are written
 * "Stage name: figures", and most use the stage's own name in the reader's
 * language, which lets the check land on the exact cell instead of merely
 * somewhere in the row. Anything else - a municipal grouped function, a
 * phrase like "Livelihoods presence" - returns null and falls back to the
 * row-level check.
 */
function stageIndexOf(text: string, locale: "en" | "ar"): number | null {
  const label = text.split(/[:：]/)[0]?.trim();
  if (!label) return null;
  const names = locale === "ar" ? stageList("ar") : STAGES;
  for (const [i, name] of names.entries()) {
    if (label === name) return i;
    if (label.length >= 8 && name.startsWith(label)) return i;
  }
  return null;
}

/** Every reader-facing string in one layer's narrative, in both languages. */
function stringsOf(value: unknown, out: Bi[] = []): Bi[] {
  if (Array.isArray(value)) value.forEach((v) => stringsOf(v, out));
  else if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (typeof rec.en === "string" && typeof rec.ar === "string") out.push(rec as Bi);
    else Object.values(rec).forEach((v) => stringsOf(v, out));
  }
  return out;
}

describe("figures written into the actors narrative", () => {
  it("quotes only (2024 → 2026) pairs that exist in that layer's row", () => {
    const wrong: string[] = [];
    for (const layer of LAYERS) {
      const allowed = pairsForLayer(layer);
      for (const bi of stringsOf(CONTENT[layer])) {
        for (const locale of ["en", "ar"] as const) {
          for (const m of bi[locale].matchAll(PAIR)) {
            const key = `${m[1]}→${m[2]}`;
            if (!allowed.has(key))
              wrong.push(
                `${layer}.${locale}: "${m[0]}" is not a ${layer} 2024→2026 pair - ${bi[locale].slice(0, 60)}`,
              );
          }
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it("keeps every quoted change equal to the difference beside it", () => {
    const wrong: string[] = [];
    for (const layer of LAYERS) {
      for (const bi of stringsOf(CONTENT[layer])) {
        for (const locale of ["en", "ar"] as const) {
          for (const m of bi[locale].matchAll(DELTA_PAIR)) {
            const delta = signOf(m[1]) * Number(m[2]);
            const from = Number(m[3]);
            const to = Number(m[4]);
            if (delta !== to - from)
              wrong.push(`${layer}.${locale}: "${m[0]}" - ${to} minus ${from} is ${to - from}`);
          }
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  /**
   * Where a bullet names its stage, the figures have to be that stage's,
   * not merely some cell in the row. This is the check that catches a
   * revision moving a count from one stage to another.
   */
  it("puts each named stage's figures on that stage's cell", () => {
    const wrong: string[] = [];
    let anchored = 0;
    for (const layer of LAYERS) {
      const change = changeFor(layer);
      const y24 = countsFor(2024, layer);
      const y26 = countsFor(2026, layer);
      for (const key of ["gains", "losses"] as const) {
        for (const bi of CONTENT[layer][key]) {
          for (const locale of ["en", "ar"] as const) {
            const text = bi[locale];
            const si = stageIndexOf(text, locale);
            if (si === null) continue;
            anchored++;
            const pair = [...text.matchAll(PAIR)][0];
            if (pair && (Number(pair[1]) !== y24[si] || Number(pair[2]) !== y26[si]))
              wrong.push(
                `${layer}.${key}.${locale} "${text.slice(0, 40)}": says ${pair[1]}→${pair[2]}, stage ${si + 1} is ${y24[si]}→${y26[si]}`,
              );
            const signed = [...text.matchAll(DELTA_PAIR)][0];
            if (signed) {
              const delta = signOf(signed[1]) * Number(signed[2]);
              if (delta !== change[si])
                wrong.push(
                  `${layer}.${key}.${locale} "${text.slice(0, 40)}": says ${signed[1]}${signed[2]}, stage ${si + 1} changed by ${change[si]}`,
                );
            }
          }
        }
      }
    }
    expect(wrong).toEqual([]);
    // A floor on the check itself: if a rewrite stopped naming stages, the
    // loop above would pass by never running.
    expect(anchored).toBeGreaterThan(30);
  });

  /**
   * "24 of 54 traced actors in coordination" is a claim about
   * a layer's share of a whole column, so both halves have to come out of
   * the table: the numerator from that layer's cell, the denominator from
   * the four layers summed at the same stage. The one at the other scale -
   * "145 of 343 entries" - is a layer's total inside a year's total.
   */
  it("quotes a layer's share of a column only where the column says so", () => {
    const wrong: string[] = [];
    let checked = 0;
    for (const layer of LAYERS) {
      const shares = new Set<string>();
      for (const year of [2024, 2026] as const) {
        const mine = countsFor(year, layer);
        const column = LAYERS.map((l) => countsFor(year, l)).reduce((a, b) =>
          a.map((v, i) => v + b[i]),
        );
        mine.forEach((v, i) => shares.add(`${v}/${column[i]}`));
        shares.add(`${layerTotal(year, layer)}/${yearTotal(year)}`);
      }
      for (const bi of stringsOf(CONTENT[layer])) {
        for (const [locale, pattern] of [
          ["en", SHARE_EN],
          ["ar", SHARE_AR],
        ] as const) {
          for (const m of bi[locale].matchAll(pattern)) {
            checked++;
            if (!shares.has(`${m[1]}/${m[2]}`))
              wrong.push(
                `${layer}.${locale}: "${m[0]}" is not a ${layer} share of any column - ${bi[locale].slice(0, 60)}`,
              );
          }
        }
      }
    }
    expect(wrong).toEqual([]);
    /*
     * No floor: share-of-a-column phrases are group-against-group
     * comparisons, which the site now words without figures, so the
     * expected count is zero. The check stays so that any share phrase
     * that returns to the copy is still audited against the table.
     */
    expect(checked).toBeGreaterThanOrEqual(0);
  });

  it("prints the same figures in Arabic as in English", () => {
    const mismatched: string[] = [];
    const all = [
      ...LAYERS.flatMap((l) => stringsOf(CONTENT[l])),
      ...stringsOf(CHANGE_CHARTS),
      ...stringsOf(GOVERNANCE_SHIFT),
    ];
    for (const bi of all) {
      const en = (bi.en.match(NUMBER) ?? []).sort();
      const ar = (bi.ar.match(NUMBER) ?? []).sort();
      if (en.join(",") !== ar.join(","))
        mismatched.push(`en [${en}] vs ar [${ar}] - "${bi.en.slice(0, 60)}"`);
    }
    expect(mismatched).toEqual([]);
  });
});

describe("figures written anywhere in the copy", () => {
  const corpus = srcFiles().flatMap((file) => {
    const sf = parse(file);
    return copyStrings(sf).map(({ text, line }) => ({ text, where: `${rel(file)}:${line}` }));
  });

  it("has copy to check", () => {
    expect(corpus.length).toBeGreaterThan(1000);
  });

  /**
   * A "before → after" pair anywhere in the copy has to be a pair the
   * tracking contains. Years are excluded by construction: the pattern
   * only takes numbers of three digits or fewer, so "17 Dec 2024 → 13 May
   * 2026" is a date range, not a claim about counts.
   */
  it("quotes only (2024 → 2026) pairs the tracking contains", () => {
    const tracked = everyTrackedPair();
    const wrong: string[] = [];
    let checked = 0;
    for (const { text, where } of corpus) {
      for (const m of text.matchAll(PAIR)) {
        checked++;
        if (!tracked.has(`${m[1]}→${m[2]}`))
          wrong.push(`${where}: "${m[0]}" matches nothing in the tracking - ${text.slice(0, 60)}`);
      }
    }
    expect(wrong).toEqual([]);
    /*
     * The sweep has to have swept something. The floor was fifty when the
     * actors narrative quoted a pair per bullet; group comparisons are now
     * worded without figures, and the pairs that remain in print are the
     * whole-tracking actor totals on the two explorer strips.
     */
    expect(checked).toBeGreaterThanOrEqual(2);
  });

  /**
   * A bare "+35" or "−9" in prose is a change figure. Every one has to be
   * a change some layer's row actually shows. Weaker than the per-layer
   * check above - it cannot tell which row - but it needs no upkeep and it
   * covers the sr-only descriptions on figures whose tables are private to
   * their component.
   */
  it("quotes only changes that some layer's row actually shows", () => {
    const known = new Set(LAYERS.flatMap((l) => changeFor(l)));
    const wrong: string[] = [];
    let checked = 0;
    for (const { text, where } of corpus) {
      // Skip the machine strings that look signed: CSS values, offsets.
      if (/^[a-z0-9:_[\]()/. -]+$/.test(text)) continue;
      for (const m of text.matchAll(SIGNED)) {
        checked++;
        const value = signOf(m[1] === "-" ? "−" : m[1]) * Number(m[2]);
        if (!known.has(value))
          wrong.push(`${where}: "${m[1]}${m[2]}" is no layer's change - ${text.slice(0, 60)}`);
      }
    }
    expect(wrong).toEqual([]);
    /*
     * No floor: bare signed changes were how the actors narrative quoted
     * per-group swings, and those are now worded without figures. The
     * check stays armed for any signed figure that returns.
     */
    expect(checked).toBeGreaterThanOrEqual(0);
  });
});

/**
 * The named figures: headline numbers that appear as words in many places
 * at once, where the recomputation is the point and the wording is not.
 * Each entry says what a reader is told and how to get there from the
 * data. If a revision moves the data, the recomputation moves with it and
 * the assertion names every string that now needs rewriting.
 */
describe("headline figures in the copy", () => {
  const corpus = srcFiles()
    .flatMap((file) => copyStrings(parse(file)).map((c) => c.text))
    .join("\n");
  const kpi = (id: string) => kpis.find((k) => k.id === id)!;
  const funnel = (id: string) => financeFunnel.find((f) => f.id === id)!;
  const actorsIn = (year: number) => actorsJson.filter((a) => a.year === year).length;

  const CLAIMS: { what: string; printed: string; fromData: () => string }[] = [
    {
      what: "the disbursed share of the initial loan",
      printed: "1.65",
      fromData: () => String(funnel("disbursed").pctOfLoan),
    },
    {
      what: "the disbursed share, from the KPI",
      printed: "1.65",
      fromData: () => String(kpi("kpi-disbursed-pct").value),
    },
    {
      what: "the undisbursed remainder of the loan",
      printed: "98.35",
      fromData: () => (100 - (funnel("disbursed").pctOfLoan ?? 0)).toFixed(2),
    },
    {
      what: "US$ millions disbursed",
      printed: "4.13",
      fromData: () => (funnel("disbursed").amountUsd / 1e6).toFixed(2),
    },
    {
      what: "US$ millions of initial loan approved",
      printed: "250",
      fromData: () => String(funnel("approved").amountUsd / 1e6),
    },
    {
      what: "the framework share of assessed need",
      printed: "9.09",
      fromData: () => String(funnel("framework").pctOfNeed),
    },
    {
      what: "the approved-loan share of assessed need",
      printed: "2.27",
      fromData: () => String(funnel("approved").pctOfNeed),
    },
    {
      what: "US$ millions of financing gap inside the framework",
      printed: "750",
      fromData: () => ((funnel("framework").amountUsd - funnel("approved").amountUsd) / 1e6).toFixed(0),
    },
    {
      what: "traced entries in the tracking",
      printed: "771",
      fromData: () => String(roleRecords.length),
    },
    /*
     * The per-year entry counts came back into print with the
     * methodology page, which states the 343 / 360 / 363 discrepancy and
     * the 357 + 414 split behind the 771 total.
     */
    {
      what: "entries traced for 2024",
      printed: "357",
      fromData: () => String(roleRecords.filter((r) => r.year === 2024).length),
    },
    {
      what: "entries traced for 2026",
      printed: "414",
      fromData: () => String(roleRecords.filter((r) => r.year === 2026).length),
    },
    {
      what: "actor-stage presences counted for 2024",
      printed: "343",
      fromData: () => String(yearTotal(2024)),
    },
    {
      what: "actor-stage presences counted for 2026",
      printed: "360",
      fromData: () => String(yearTotal(2026)),
    },
    {
      what: "actors across the two years",
      printed: "235",
      fromData: () => String(actorsIn(2024) + actorsIn(2026)),
    },
    {
      what: "actors across the four groups, 2024 then 2026",
      // Printed with the Arabic arrow on the Arabic explorer strip and
      // with the Latin arrow on the English one; either form satisfies
      // the presence check below.
      printed: "105 ← 130",
      fromData: () => `${actorsIn(2024)} ← ${actorsIn(2026)}`,
    },
    /*
     * The community (145 → 172) and municipal (19 → 12) group totals are
     * deliberately no longer printed anywhere: group-against-group
     * comparisons are worded without figures on this site. They remain
     * derivable via layerTotal, so if either returns to print, restore
     * its claim rather than trusting the number.
     */
  ];

  it.each(CLAIMS)("$what still reads $printed after recomputation", ({ printed, fromData }) => {
    expect(fromData()).toBe(printed);
  });

  /**
   * And each of those figures is genuinely in the copy. Without this the
   * table could drift into describing prose nobody prints any more, and
   * pass forever.
   */
  it("names only figures the copy actually prints", () => {
    const absent = CLAIMS.filter(({ printed }) => {
      const plain = printed.replace(/\s*→\s*/, " ");
      return !corpus.includes(printed) && !corpus.includes(plain);
    }).map((c) => `${c.what} (${c.printed}) appears in no copy string`);
    expect(absent).toEqual([]);
  });
});
