import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Reader-facing wording is constrained: the site never talks about
 * datasets, records, documents, evidence or files. This guards the copy
 * only - identifiers such as `roleRecords`, the `Record<>` type and
 * `document.querySelector` are code, never read by anyone.
 */

const BANNED =
  /\b(datasets?|records?|recorded|documents?|documented|documentation|evidence|evidentiary|dossiers?)\b/i;

const AR_BANNED = /(الأدلة|أدلة|موثّقة|موثقة|سجلات|وثائق|ملفات)/;

/** Verbatim third-party titles: altering a citation would misquote it. */
const ALLOWED = [
  "OSM Building Dataset Complete for Conflict Affected Districts in Southern Lebanon",
];

const SRC = join(import.meta.dirname, "..", "src");

function walk(dir: string, match: RegExp, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, match, out);
    else if (match.test(name)) out.push(p);
  }
  return out;
}

function allowed(s: string): boolean {
  return ALLOWED.some((a) => s.includes(a));
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
  // Template literals, with the interpolated expressions (code) removed.
  for (const m of source.matchAll(/`([^`]{4,})`/g))
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
        if (allowed(s)) continue;
        const hit = s.match(BANNED) ?? s.match(AR_BANNED);
        if (hit) offenders.push(`${file.split("src")[1]}: "${hit[0]}" in ${s.slice(0, 70)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the banned words out of the data files", () => {
    const offenders: string[] = [];
    for (const file of walk(join(SRC, "data"), /\.json$/)) {
      for (const s of jsonStrings(JSON.parse(readFileSync(file, "utf8")))) {
        if (allowed(s) || /^https?:\/\//.test(s)) continue;
        const hit = s.match(BANNED) ?? s.match(AR_BANNED);
        if (hit) offenders.push(`${file.split("data")[1]}: "${hit[0]}" in ${s.slice(0, 70)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
