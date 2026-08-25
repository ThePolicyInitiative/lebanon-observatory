import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { AR_BANNED, BANNED, allowed, bannedHit } from "./vocab-patterns";
import { copyStrings as astCopyStrings, parse, rel, srcFiles } from "./source-tree";

/**
 * Reader-facing wording is constrained: the site never talks about
 * datasets, records, documents, evidence, files or verification. This guards
 * the copy only - identifiers such as `roleRecords`, the `Record<>` type,
 * `document.querySelector` and the `not_verified` status key are code, never
 * read by anyone. A word boundary cannot match inside not_verified, so that
 * key needs no exemption here.
 *
 * The word list itself lives in `vocab-patterns.ts`, shared with the
 * rendered sweep in the Playwright suite.
 */

const SRC = join(import.meta.dirname, "..", "src");

function walk(dir: string, match: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, match, out);
    else if (match.test(name)) out.push(p);
  }
  return out;
}

/** Every string a reader could end up seeing, pulled out of the code. */
function copyStrings(source: string): string[] {
  const out: string[] = [];
  // Quoted literals, minus module specifiers and asset paths.
  for (const m of source.matchAll(/"([^"\\\n]{4,})"|'([^'\\\n]{4,})'/g)) {
    const s = m[1] ?? m[2] ?? "";
    if (/^[@./]|\.(json|ts|tsx|css|svg|png|geojson)$/.test(s)) continue;
    out.push(s);
  }
  // Single-line template literals, with the interpolated expressions
  // (code) removed. Pairing backticks across lines cannot be done with a
  // regex - it swallows whole code blocks and reports identifiers as copy
  // - so the multi-line ones are handled by the syntax-tree scan below.
  for (const m of source.matchAll(/`([^`\n]{4,})`/g))
    out.push(m[1].replace(/\$\{[^}]*\}/g, " "));
  for (const m of source.matchAll(/>([^<>{}\n]{4,})</g)) out.push(m[1]);
  return out;
}

function jsonStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => jsonStrings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => jsonStrings(v, out));
  return out;
}

describe("reader-facing vocabulary", () => {
  it("keeps the banned words out of component copy", () => {
    const offenders: string[] = [];
    for (const file of walk(join(SRC), /\.tsx?$/)) {
      for (const s of copyStrings(readFileSync(file, "utf8"))) {
        if (allowed(s) || /^https?:\/\//.test(s)) continue;
        const hit = s.match(BANNED) ?? s.match(AR_BANNED);
        if (hit) offenders.push(`${file.split("src")[1]}: "${hit[0]}" in ${s.slice(0, 70)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * The hole the regex scan above always acknowledged and never closed: a
   * banned word inside a multi-line backtick string or a multi-line run of
   * JSX text. TypeScript's own parser pairs the backticks and the tags, so
   * a whole literal arrives as one string with the interpolated
   * expressions - which are code - already separated out.
   *
   * KNOWN is a debt list, not an exemption list. Every line in it is copy
   * that breaks the vocabulary rule today and that the scan found the
   * moment it could see across a line break; each is a one-word rewrite in
   * the file named. The test fails on anything NOT in the list, so the
   * debt can only shrink. Delete a line here when its copy is fixed.
   */
  const KNOWN: string[] = [];

  it("keeps the banned words out of copy that runs across lines", () => {
    const offenders: string[] = [];
    for (const file of srcFiles()) {
      const sf = parse(file);
      for (const { text, line } of astCopyStrings(sf)) {
        const hit = bannedHit(text);
        if (!hit) continue;
        const key = `${rel(file)}: "${hit}"`;
        if (KNOWN.includes(key)) continue;
        offenders.push(`${key} at line ${line}: ${text.replace(/\s+/g, " ").slice(0, 80)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * Fields that quote someone else verbatim. A publisher's own headline is
   * not this site's copy, and rewriting one to satisfy the house rules
   * would misquote it - the same exemption ALLOWED grants one title at a
   * time, applied where a whole field is quotation. Everything the
   * observatory writes about those items - its own descriptions and notes
   * - is scanned exactly like the rest of the data.
   */
  const QUOTED_FIELDS: Record<string, string[]> = {
    "coverage-archive.json": ["title", "publisher"],
  };

  function scannableStrings(file: string, value: unknown): string[] {
    const quoted = QUOTED_FIELDS[file.split(/[\\/]/).pop() ?? ""];
    if (!quoted) return jsonStrings(value);
    const out: string[] = [];
    const walkValue = (v: unknown, key: string | null) => {
      if (key !== null && quoted.includes(key)) return;
      if (typeof v === "string") out.push(v);
      else if (Array.isArray(v)) v.forEach((x) => walkValue(x, key));
      else if (v && typeof v === "object")
        for (const [k, x] of Object.entries(v)) walkValue(x, k);
    };
    walkValue(value, null);
    return out;
  }

  it("keeps the banned words out of the data files", () => {
    const offenders: string[] = [];
    for (const file of walk(join(SRC, "data"), /\.json$/)) {
      for (const s of scannableStrings(file, JSON.parse(readFileSync(file, "utf8")))) {
        if (allowed(s) || /^https?:\/\//.test(s)) continue;
        const hit = s.match(BANNED) ?? s.match(AR_BANNED);
        if (hit) offenders.push(`${file.split("data")[1]}: "${hit[0]}" in ${s.slice(0, 70)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
