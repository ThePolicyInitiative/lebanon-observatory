import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AR_COUNT, arabicCount, type ArCountForms } from "@/lib/vocab";
import { fmtUsd } from "@/lib/format";

/**
 * Arabic count agreement, which nothing tested and everything got wrong.
 *
 * The rule has four shapes, not two: the bare noun at one, the dual at
 * two - which carries the twoness itself, so the numeral is dropped - the
 * plural from three to ten, and the singular again from eleven up, in the
 * accusative. That accusative alif is a written letter, so the error is
 * visible in undiacritised text rather than merely heard.
 *
 * Nearly every interpolated count on the Arabic side was written in the
 * eleven-and-up form and then used at every value. Map clusters were the
 * sharpest case: a cluster exists only when two or more pins merge, so
 * the one range that form is never right for was the only range it saw.
 *
 * The rule had five correct hand-written implementations and about twenty
 * wrong ones, and three files got it right in one string and wrong in
 * another a dozen lines away. That is a missing shared function, and this
 * is the test that was missing with it.
 */
describe("arabicCount", () => {
  const entry = AR_COUNT.entry;

  it("drops the numeral where the noun already carries the count", () => {
    // One and two are the forms with no digit: "مدخل واحد", "مدخلان".
    expect(arabicCount(1, entry)).toBe("مدخل واحد");
    expect(arabicCount(2, entry)).toBe("مدخلان");
    expect(arabicCount(1, entry)).not.toMatch(/\d/);
    expect(arabicCount(2, entry)).not.toMatch(/\d/);
  });

  it("takes the plural from three to ten and the singular from eleven", () => {
    for (const n of [3, 4, 7, 9, 10]) {
      expect(arabicCount(n, entry), `${n} should take the plural`).toBe(`${n} ${entry.few}`);
    }
    for (const n of [11, 12, 47, 100, 771]) {
      expect(arabicCount(n, entry), `${n} should take the singular`).toBe(`${n} ${entry.many}`);
    }
    // The boundary itself, which is where a hand-written ladder slips.
    expect(arabicCount(10, entry)).toBe("10 مدخلات");
    expect(arabicCount(11, entry)).toBe("11 مدخلاً");
  });

  it("says none rather than counting to zero, where a form is given", () => {
    expect(arabicCount(0, entry)).toBe("لا مدخلات");
    // And falls back to the plural where none is, rather than throwing.
    expect(arabicCount(0, AR_COUNT.actor)).toBe("0 جهات");
  });

  /**
   * An adjective has to agree with the noun that just changed, so it
   * travels inside the form rather than being concatenated outside it.
   */
  it("keeps an adjective agreeing with the noun it follows", () => {
    expect(arabicCount(1, AR_COUNT.entryTraced)).toBe("مدخل مرصود واحد");
    expect(arabicCount(2, AR_COUNT.entryTraced)).toBe("مدخلان مرصودان");
    expect(arabicCount(4, AR_COUNT.entryTraced)).toBe("4 مدخلات مرصودة");
    expect(arabicCount(40, AR_COUNT.entryTraced)).toBe("40 مدخلاً مرصوداً");
  });

  it("gives every counted noun all four forms, in Arabic", () => {
    const arabic = /[؀-ۿ]/;
    for (const [name, forms] of Object.entries(AR_COUNT as Record<string, ArCountForms>)) {
      for (const key of ["one", "two", "few", "many"] as const) {
        expect(forms[key], `${name}.${key} is missing`).toBeTruthy();
        expect(arabic.test(forms[key]), `${name}.${key} is not Arabic`).toBe(true);
      }
      // The dual and the singular are different words, or one of them is
      // a copy that was never thought about.
      expect(forms.one, `${name}: one and two are identical`).not.toBe(forms.two);
      expect(forms.few, `${name}: few and many are identical`).not.toBe(forms.many);
    }
  });
});

/**
 * The one shipped figure that lands inside three-to-ten: the LEAP
 * project-management component is exactly US$10,000,000, so /ar/money
 * rendered "10 مليون دولار" where the language wants "10 ملايين".
 */
describe("money in Arabic", () => {
  it("counts whole millions three to ten with the plural", () => {
    expect(fmtUsd(10_000_000, "ar")).toBe("10 ملايين دولار");
    expect(fmtUsd(3_000_000, "ar")).toBe("3 ملايين دولار");
    expect(fmtUsd(20_000_000, "ar")).toBe("20 مليون دولار");
    expect(fmtUsd(250_000_000, "ar")).toBe("250 مليون دولار");
  });

  /**
   * A fractional count takes the singular by convention, and the finance
   * funnel already writes "4.13 مليون دولار" by hand. Routed through the
   * ladder unguarded, 4.13 would fall in the three-to-ten branch.
   */
  it("leaves a fractional million in the singular", () => {
    expect(fmtUsd(4_130_000, "ar")).toBe("4.13 مليون دولار");
    expect(fmtUsd(9_500_000, "ar")).toBe("9.5 مليون دولار");
  });

  it("leaves the English side alone", () => {
    expect(fmtUsd(10_000_000, "en")).toBe("US$10 million");
    expect(fmtUsd(4_130_000, "en")).toBe("US$4.13 million");
  });

  /**
   * The billion row sits in a column of digits opposite "US$1 billion",
   * so it keeps its numeral even though Arabic would drop it in prose.
   */
  it("keeps the numeral on the billion, which sits in a figure column", () => {
    expect(fmtUsd(1_000_000_000, "ar")).toBe("1 مليار دولار");
  });
});

/**
 * The scan that stops the next string from re-introducing the bug.
 *
 * Every wrong site had the same shape: a digit interpolated straight into
 * an Arabic template immediately before a counted noun. That is what this
 * looks for. It cannot catch a count assembled some other way, which is
 * why the helper exists - but it does catch the copy-paste that put
 * twenty of these on the site.
 */
describe("no new interpolated counts", () => {
  /** The counted nouns, in the accusative-singular form that gives it away. */
  const COUNTED = [
    "مدخلاً",
    "مدخل",
    "مدخلات",
    "جهة",
    "جهات",
    "مرحلة",
    "مراحل",
    "إشارة",
    "إشارات",
    "مادة",
    "موادّ",
    "دبّوساً",
    "نشاطاً",
    "مكاناً",
    "نتيجة",
    "مطابقاً",
    "متبقياً",
  ];

  /**
   * The two constructions that put a digit against a counted noun and are
   * right anyway. Both are grammar, not exemptions.
   *
   * `أعلى ${n} جهات` - "the top N actors" - is already the plural form,
   * and n is 4 or 5 there, which is the range that takes it.
   *
   * `${n} من أصل ${total} مادة` is partitive: من أصل supplies the
   * partition, so the counted noun belongs to `total`, which is the whole
   * archive at 249 and correctly takes the singular. The year heading in
   * the same file, which is not partitive, was the genuine fault.
   */
  const ALLOWED = [/أعلى \$\{[^}]*\} جهات/, /من أصل \$\{[^}]*\} مادة/];

  function sources(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) sources(p, out);
      else if (/\.tsx?$/.test(name)) out.push(p);
    }
    return out;
  }

  it("interpolates no digit straight into a counted Arabic noun", () => {
    const offenders: string[] = [];
    for (const file of sources(join(process.cwd(), "src"))) {
      // vocab.ts is where the forms are declared, so it is the one file
      // that says these words next to nothing.
      if (file.endsWith(join("lib", "vocab.ts"))) continue;
      const text = readFileSync(file, "utf-8");
      text.split("\n").forEach((line, i) => {
        if (ALLOWED.some((a) => a.test(line))) return;
        for (const noun of COUNTED) {
          // `${...}` then at most a space or two, then the noun.
          if (new RegExp(`\\$\\{[^}]*\\}\\s{0,2}${noun}(?![\\u0600-\\u06FF])`).test(line)) {
            offenders.push(`${file.replace(process.cwd(), "")}:${i + 1}  ${noun}`);
          }
        }
      });
    }
    expect(
      offenders,
      `these interpolate a count into an Arabic noun without arabicCount():\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });
});
