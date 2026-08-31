import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LEAP_LOAN_ID,
  checkIsrReading,
  isrDateToIso,
  parseIsrDisbursement,
  planLeapIsr,
} from "../scripts/watch/registry.mjs";
import { readData, readPath, valueOf } from "../scripts/watch/data-io.mjs";

/**
 * The extractor that is allowed to publish without a human.
 *
 * Everything here runs against a fixture - the text of the seq. 4
 * Implementation Status and Results Report of 29 June 2026, extracted by
 * `scripts/watch/pdf-text.mjs` from the PDF the citation register points
 * at. No network: a suite that reached the World Bank would fail on a
 * plane and pass on a bad parse, which is the wrong way round.
 *
 * What is actually being pinned is the mapping from six unlabelled
 * numbers to six meanings. The report prints them with no separators -
 * `250.00250.000.004.13245.880.00` - so a column added upstream would
 * shift every field one place and turn "disbursed" into "cancelled"
 * without changing the shape of anything. The guards below are the
 * reason that ships as a failure rather than as a figure.
 */

const FIXTURE = readFileSync(join(import.meta.dirname, "fixtures", "leap-isr-seq4.txt"), "utf8");

/** The document the fixture came from, as the search API describes it. */
const DOC = {
  url: "https://documents.worldbank.org/curated/en/099062926134535703/pdf/P509428-c4fc70f6-1b1a-434a-be1c-16cfa8a34a3c.pdf",
  issuedOn: "2026-06-29",
  guid: "099062926134535703",
};

describe("report header", () => {
  it("reads the sequence number and the archive date", () => {
    const r = parseIsrDisbursement(FIXTURE)!;
    expect(r.sequence).toBe(4);
    expect(r.archivedOn).toBe("2026-06-29");
  });

  it("converts the report's own date format", () => {
    expect(isrDateToIso("29-Jun-2026")).toBe("2026-06-29");
    expect(isrDateToIso("1-Jan-2027")).toBe("2027-01-01");
    expect(isrDateToIso("29/06/2026")).toBeNull();
    expect(isrDateToIso("29-Xxx-2026")).toBeNull();
  });
});

describe("disbursement table", () => {
  it("maps the six amounts onto the right fields", () => {
    const r = parseIsrDisbursement(FIXTURE)!;
    expect(r.loanId).toBe(LEAP_LOAN_ID);
    expect(r.status).toBe("Effective");
    expect(r.originalUsd).toBe(250_000_000);
    expect(r.revisedUsd).toBe(250_000_000);
    expect(r.cancelledUsd).toBe(0);
    expect(r.disbursedUsd).toBe(4_130_000);
    expect(r.undisbursedUsd).toBe(245_880_000);
    expect(r.pctDisbursed).toBe(1.65);
  });

  it("agrees with the figures the site already publishes", () => {
    // The extractor was written against a report the analysis had
    // already been read by hand. If the two ever disagree, one of them
    // has changed meaning, and this is where that shows up.
    const r = parseIsrDisbursement(FIXTURE)!;
    const finance = readData("finance.json");
    expect(r.disbursedUsd).toBe(readPath(finance, ["funnel", { id: "disbursed" }, "amountUsd"]));
    expect(r.pctDisbursed).toBe(readPath(finance, ["funnel", { id: "disbursed" }, "pctOfLoan"]));
    expect(r.revisedUsd).toBe(readPath(finance, ["funnel", { id: "approved" }, "amountUsd"]));
  });

  it("refuses a row with the wrong number of columns", () => {
    const short = FIXTURE.replace("250.00250.000.004.13245.880.00", "250.00250.000.004.13245.88");
    expect(parseIsrDisbursement(short)).toBeNull();
    const long = FIXTURE.replace(
      "250.00250.000.004.13245.880.00",
      "250.00250.000.004.13245.880.001.00",
    );
    expect(parseIsrDisbursement(long)).toBeNull();
  });

  it("returns nothing when the loan is not in the report", () => {
    expect(parseIsrDisbursement(FIXTURE, "IBRD-00000")).toBeNull();
  });
});

describe("guards", () => {
  const good = () => parseIsrDisbursement(FIXTURE)!;

  it("passes the reading the report actually contains", () => {
    expect(checkIsrReading(good(), null)).toEqual({ ok: true, problems: [] });
  });

  it("catches a mis-parse through the reconciliation", () => {
    // Disbursed and undisbursed swapped: each value is still one the
    // report printed, and only the arithmetic gives it away.
    const swapped = { ...good(), disbursedUsd: 245_880_000, undisbursedUsd: 4_130_000 };
    const verdict = checkIsrReading(swapped, null);
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(" ")).toMatch(/columns did not map|printed share/);
  });

  it("catches a printed share that does not follow from the amounts", () => {
    const verdict = checkIsrReading({ ...good(), pctDisbursed: 16.5 }, null);
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(" ")).toContain("printed share");
  });

  it("refuses more disbursed than the loan holds", () => {
    const verdict = checkIsrReading({ ...good(), disbursedUsd: 400_000_000 }, null);
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(" ")).toContain("exceeds the revised loan");
  });

  it("refuses cumulative disbursement that falls with nothing cancelled", () => {
    const previous = { ...good(), disbursedUsd: 10_000_000, cancelledUsd: 0, sequence: 3 };
    const verdict = checkIsrReading(good(), previous);
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(" ")).toContain("fell from");
  });

  it("allows a fall that a cancellation explains", () => {
    const previous = { ...good(), disbursedUsd: 10_000_000, cancelledUsd: 0, sequence: 3 };
    const cancelledDown = { ...good(), cancelledUsd: 6_000_000 };
    const problems = checkIsrReading(cancelledDown, previous).problems;
    expect(problems.join(" ")).not.toContain("fell from");
  });

  it("refuses a report older than the one already published", () => {
    const previous = { ...good(), sequence: 9 };
    const verdict = checkIsrReading(good(), previous);
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(" ")).toContain("sequence went backwards");
  });

  it("refuses an empty reading", () => {
    expect(checkIsrReading(null, null).ok).toBe(false);
  });
});

describe("the write plan", () => {
  const plan = () => planLeapIsr(parseIsrDisbursement(FIXTURE)!, DOC);

  it("names only fields that exist", () => {
    // A path that no longer resolves - a renamed key, a dropped funnel
    // step - must fail here, at a test, rather than at three in the
    // morning inside a scheduled run.
    for (const change of plan()) {
      const root = readData(change.file);
      expect(() => readPath(root, change.path), change.path.join(" > ")).not.toThrow();
    }
  });

  it("writes exactly what the site already says, from a report it already cites", () => {
    /*
     * The strongest available end-to-end check: run the whole plan
     * against the report the current figures were hand-read from, and
     * every machine-owned field should already hold the value the
     * machine computes. Any disagreement is either a bug in the writer
     * or a figure on the site that its own source does not support.
     *
     * Two fields are exempt and named here rather than skipped
     * silently. The citation url is the documents1 mirror of the same
     * document, which the writer leaves alone. The Arabic display of
     * the disbursed amount reads "4.13 ملايين" in the data while
     * `fmtUsd` renders "4.13 مليون" - the singular that src/lib/format.ts
     * documents as correct for a fractional count, and that the finance
     * funnel and the Arabic money page already print.
     */
    const exempt = new Set(['{"id":"S1"} > url', '{"id":"kpi-disbursed"} > displayAr']);
    const disagreements: string[] = [];

    for (const change of plan()) {
      const key = change.path
        .map((s) => (typeof s === "object" ? JSON.stringify(s) : String(s)))
        .join(" > ");
      if (exempt.has(key)) continue;
      const current = readPath(readData(change.file), change.path);
      const next = valueOf(change);
      if (current !== next) disagreements.push(`${change.file} ${key}: ${current} != ${next}`);
    }

    expect(disagreements).toEqual([]);
  });
});
