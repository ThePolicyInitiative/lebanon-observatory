import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import finance from "@/data/finance.json";
import timeline from "@/data/timeline.json";
import { copyStrings, parse, rel, srcFiles } from "./source-tree";

/**
 * The disbursement figures written into prose, checked against the
 * finance data they describe.
 *
 * This is the gate that lets `scripts/auto-update.mjs` publish without a
 * human. That script writes only the fields the watch registry declares
 * machine-owned - amounts, shares, dates inside `src/data` - and it can
 * see nothing of the thirty-odd sentences, alt texts and chart captions
 * that carry the same figures by hand, in two languages. Left to itself
 * it would move the data and leave the page saying the old number.
 *
 * So: every figure of the disbursement family that appears in copy must
 * be one the finance data currently supports. When a new status report
 * moves the disbursed amount, this suite fails, the publish is abandoned
 * and the tree is restored - the pipeline stops rather than shipping a
 * page that contradicts itself, until the copy is carried across (or
 * rewritten to read the figure from the data, after which the sentences
 * disappear from this scan on their own).
 *
 * Following `figures-in-copy.test.ts`, no wording is pinned. The scan
 * reads whatever figures the copy currently carries and asks the data
 * whether they are derivable; a rewrite that keeps the arithmetic honest
 * never touches this file.
 */

const step = (id: string) => {
  const s = finance.funnel.find((f) => f.id === id);
  if (!s) throw new Error(`finance.json has no funnel step "${id}"`);
  return s;
};

const NEED = step("need").amountUsd;
const FRAMEWORK = step("framework").amountUsd;
const LOAN = step("approved").amountUsd;
const DISBURSED = step("disbursed").amountUsd;
const PCT_OF_LOAN = step("disbursed").pctOfLoan!;

/** Two decimals, as every figure in this family is written. */
const dp2 = (n: number) => Number(n.toFixed(2));

/**
 * Every amount in millions that the finance data supports, each with the
 * derivation that earns it a place. A figure in copy that is not on this
 * list is either stale or invented, and the failure message says which
 * line carries it.
 */
const AMOUNTS_M = new Map<number, string>([
  [dp2(DISBURSED / 1e6), "disbursed"],
  [dp2(LOAN / 1e6), "initial loan"],
  [dp2(FRAMEWORK / 1e6), "LEAP framework"],
  [dp2(NEED / 1e6), "assessed need"],
  [dp2((FRAMEWORK - LOAN) / 1e6), "framework less the initial loan"],
  [dp2((LOAN - DISBURSED) / 1e6), "loan not yet disbursed"],
  [dp2(LOAN / 1e6 / 100), "one square of the hundred-square waffle"],
]);

/** The same, for shares. */
const SHARES = new Map<number, string>([
  [dp2(PCT_OF_LOAN), "share of the loan disbursed"],
  [dp2(100 - PCT_OF_LOAN), "share of the loan not yet disbursed"],
  [dp2((DISBURSED / NEED) * 100), "disbursed as a share of need"],
  [dp2((LOAN / NEED) * 100), "loan as a share of need"],
  [dp2((FRAMEWORK / NEED) * 100), "framework as a share of need"],
  [dp2((LOAN / FRAMEWORK) * 100), "loan as a share of the framework"],
  [dp2(((FRAMEWORK - LOAN) / FRAMEWORK) * 100), "gap as a share of the framework"],
  [0, "nothing"],
  [100, "all of it"],
]);

/** A line is in scope when it talks about disbursement, in either language. */
const MENTIONS_DISBURSEMENT = /disburs|المدفوع|مدفوع|دُفع|دفع/i;

/**
 * Amounts: "US$4.13 million", "US$4.13M", "4.13 مليون دولار",
 * "4.13 ملايين دولار". Digits stay Western on both sides of the site,
 * which is what lets one pattern read both.
 */
const AMOUNT_PATTERNS = [
  /US\$\s?(\d+(?:\.\d+)?)\s*(?:million\b|M\b)/g,
  /(\d+(?:\.\d+)?)\s*(?:مليون|ملايين)\s*دولار/g,
];

/**
 * Shares: "1.65%", "98.35 percent", "1.65 في المئة". Anchored on the
 * unit so that a ratio ("1.22:1") or a date is never read as one.
 */
const SHARE_PATTERNS = [
  /(\d+(?:\.\d+)?)\s*%/g,
  /(\d+(?:\.\d+)?)\s*percent\b/g,
  /(\d+(?:\.\d+)?)\s*في المئة/g,
];

type Line = { where: string; text: string };

/** Copy from the components and pages, one string literal at a time. */
function copyLines(): Line[] {
  const out: Line[] = [];
  for (const file of srcFiles()) {
    const sf = parse(file);
    for (const s of copyStrings(sf)) {
      if (MENTIONS_DISBURSEMENT.test(s.text)) out.push({ where: rel(file), text: s.text });
    }
  }
  return out;
}

/** And from the milestone chain, which carries the same figures. */
function timelineLines(): Line[] {
  const out: Line[] = [];
  for (const event of timeline) {
    for (const [key, value] of Object.entries(event)) {
      if (typeof value !== "string" || !MENTIONS_DISBURSEMENT.test(value)) continue;
      out.push({ where: `data/timeline.json ${event.id}.${key}`, text: value });
    }
  }
  return out;
}

function offenders(lines: Line[], patterns: RegExp[], allowed: Map<number, string>) {
  const bad: string[] = [];
  for (const line of lines) {
    for (const pattern of patterns) {
      for (const m of line.text.matchAll(pattern)) {
        const value = dp2(Number(m[1]));
        if (allowed.has(value)) continue;
        bad.push(`${line.where}: "${m[0].trim()}" in "${line.text.slice(0, 90)}..."`);
      }
    }
  }
  return bad;
}

describe("disbursement figures in copy", () => {
  const lines = [...copyLines(), ...timelineLines()];

  it("finds the copy it is meant to be checking", () => {
    // A scan that silently matches nothing would pass forever. The site
    // says this in many places; if it ever says it in almost none, the
    // patterns above stopped working rather than the copy improving.
    expect(lines.length).toBeGreaterThan(20);
  });

  it("writes no amount the finance data does not support", () => {
    expect(offenders(lines, AMOUNT_PATTERNS, AMOUNTS_M)).toEqual([]);
  });

  it("writes no share the finance data does not support", () => {
    expect(offenders(lines, SHARE_PATTERNS, SHARES)).toEqual([]);
  });

  it("still says the disbursed amount somewhere, in both languages", () => {
    const amount = dp2(DISBURSED / 1e6);
    const english = lines.filter((l) => /US\$/.test(l.text) && l.text.includes(String(amount)));
    const arabic = lines.filter((l) => /دولار/.test(l.text) && l.text.includes(String(amount)));
    expect(english.length, "English copy carrying the disbursed amount").toBeGreaterThan(0);
    expect(arabic.length, "Arabic copy carrying the disbursed amount").toBeGreaterThan(0);
  });
});

describe("the waffle's own constant", () => {
  it("matches the share in the finance data", () => {
    /*
     * DisbursementWaffle computes its fill from a literal rather than
     * from the data, so the scan above cannot see it: the number sits in
     * an initialiser, not in a sentence.
     */
    const file = srcFiles().find((f) => f.endsWith("DisbursementWaffle.tsx"))!;
    const source = readFileSync(file, "utf8");
    const m = /const disbursedPct\s*=\s*([\d.]+)/.exec(source);
    expect(m, "disbursedPct initialiser in DisbursementWaffle.tsx").not.toBeNull();
    expect(Number(m![1])).toBe(PCT_OF_LOAN);
  });
});
