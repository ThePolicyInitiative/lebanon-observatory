import { describe, expect, it } from "vitest";
import ts from "typescript";
import {
  comparabilityLabel,
  layerLabel,
  regionLabel,
  stageList,
  stageShortList,
  statusLabel,
  statusList,
  cautionCounts,
  cautionMap,
} from "@/lib/vocab";
import { LAYERS, STAGES } from "@/lib/data-client";
import {
  keysOf,
  lineOf,
  literalText,
  parse,
  propName,
  rel,
  srcFiles,
  unwrap,
  walkAst,
} from "./source-tree";

/**
 * The bilingual parity rule, enforced where the copy actually lives.
 *
 * Reader copy is written as `{ en: ..., ar: ... }` tables held module-local
 * beside the component that prints them - several hundred of them across
 * src/. The compiler catches part of this already: a component reads
 * `T[locale]` with locale typed `"en" | "ar"`, so a key that is ACCESSED
 * has to exist on both branches. What the compiler cannot see is an `ar`
 * slot left holding the English text, an `ar` slot left empty, a key
 * reached only through an index, or the two branches drifting into
 * different shapes. Those are what this suite is for.
 *
 * Deliberately structural. It never asserts a particular sentence, so an
 * author rewriting the copy - in either language - never has to come here.
 */

const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const LATIN = /[A-Za-z]/;

/**
 * Keys whose values are machine strings living inside a bilingual table:
 * an anchor id, a route, a colour, a discriminant. They are the same on
 * both sides on purpose, so the Arabic-script rule does not apply to them.
 * Key parity still does.
 */
const MACHINE_KEYS = new Set([
  "id",
  "kind",
  "key",
  "href",
  "url",
  "path",
  "slug",
  "type",
  "code",
  "cls",
  "className",
  "color",
  "bg",
  "icon",
  "lang",
  "dir",
  "locale",
  "n",
]);

/**
 * Latin strings that are correct Arabic-side copy: proper names the site
 * prints unchanged in both languages, and keyboard key names.
 */
const LATIN_OK = new Set([
  "LEAP",
  "RDNA",
  "CDR",
  "MoSA",
  "WASH",
  "OSM",
  "UN",
  "EN",
  "AR",
  "FR",
  "Enter",
  "Escape",
  "Tab",
  "English",
  "Arabic",
  "French",
  "Other",
]);

type Shape = "object" | "array" | "string" | "template" | "function" | "other";

function shapeOf(n: ts.Expression): Shape {
  const e = unwrap(n);
  if (ts.isObjectLiteralExpression(e)) return "object";
  if (ts.isArrayLiteralExpression(e)) return "array";
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return "string";
  if (ts.isTemplateExpression(e)) return "template";
  if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) return "function";
  return "other";
}

/**
 * A `{ en, ar }` literal is a language table unless it is a language-CODE
 * map - `{ en: "English", ar: "Arabic", fr: ..., other: ... }`, where en
 * and ar are data keys and every value is written in one language. The
 * sibling code keys are what tells the two apart.
 */
function isLanguageTable(obj: ts.ObjectLiteralExpression): boolean {
  const keys = keysOf(obj);
  if (!keys.includes("en") || !keys.includes("ar")) return false;
  return !keys.some((k) => ["fr", "de", "es", "other"].includes(k));
}

function branch(obj: ts.ObjectLiteralExpression, name: "en" | "ar"): ts.Expression | null {
  const p = obj.properties.find((q) => propName(q) === name);
  if (!p || !ts.isPropertyAssignment(p)) return null;
  return p.initializer;
}

/** Both halves of one table, compared key by key all the way down. */
function diff(where: string, path: string, enNode: ts.Expression, arNode: ts.Expression): string[] {
  const out: string[] = [];
  const en = unwrap(enNode);
  const ar = unwrap(arNode);
  const se = shapeOf(en);
  const sa = shapeOf(ar);

  if (se !== sa) {
    out.push(`${where}${path}: en is a ${se}, ar is a ${sa}`);
    return out;
  }

  if (se === "object" && ts.isObjectLiteralExpression(en) && ts.isObjectLiteralExpression(ar)) {
    const ke = keysOf(en);
    const ka = keysOf(ar);
    const onlyEn = ke.filter((k) => !ka.includes(k));
    const onlyAr = ka.filter((k) => !ke.includes(k));
    if (onlyEn.length)
      out.push(`${where}${path}: English-only key(s) with no Arabic twin: ${onlyEn.join(", ")}`);
    if (onlyAr.length)
      out.push(`${where}${path}: Arabic-only key(s) with no English twin: ${onlyAr.join(", ")}`);
    for (const p of en.properties) {
      const name = propName(p);
      if (name === null || !ts.isPropertyAssignment(p)) continue;
      const twin = ar.properties.find((q) => propName(q) === name);
      if (!twin || !ts.isPropertyAssignment(twin)) continue;
      out.push(...diff(where, `${path}.${name}`, p.initializer, twin.initializer));
    }
    return out;
  }

  if (se === "array" && ts.isArrayLiteralExpression(en) && ts.isArrayLiteralExpression(ar)) {
    if (en.elements.length !== ar.elements.length) {
      out.push(
        `${where}${path}: en has ${en.elements.length} item(s), ar has ${ar.elements.length}`,
      );
      return out;
    }
    en.elements.forEach((el, i) => {
      out.push(...diff(where, `${path}[${i}]`, el, ar.elements[i]));
    });
    return out;
  }

  if (se === "string") {
    const textEn = literalText(en);
    const textAr = literalText(ar);
    const key = path.split(/[.[]/).pop()?.replace(/\]$/, "") ?? "";
    if (textEn !== null && ARABIC.test(textEn))
      out.push(`${where}${path}: the English slot is written in Arabic`);
    if (textAr !== null) {
      if (textAr.trim() === "") out.push(`${where}${path}: the Arabic slot is empty`);
      else if (
        !ARABIC.test(textAr) &&
        LATIN.test(textAr) &&
        !MACHINE_KEYS.has(key) &&
        !LATIN_OK.has(textAr.trim())
      )
        out.push(
          `${where}${path}: the Arabic slot carries Latin text - "${textAr.slice(0, 60)}"`,
        );
    }
  }
  return out;
}

function collectTables() {
  const tables: { where: string; en: ts.Expression; ar: ts.Expression }[] = [];
  for (const file of srcFiles()) {
    const sf = parse(file);
    walkAst(sf, (node) => {
      if (!ts.isObjectLiteralExpression(node) || !isLanguageTable(node)) return;
      const en = branch(node, "en");
      const ar = branch(node, "ar");
      if (!en || !ar) return;
      tables.push({ where: `${rel(file)}:${lineOf(sf, node)}`, en, ar });
    });
  }
  return tables;
}

describe("bilingual copy tables", () => {
  const tables = collectTables();

  it("finds the language tables the components are actually built from", () => {
    // A floor, not a census. It exists so a refactor that moves the copy
    // somewhere this scan cannot see fails here instead of passing
    // vacuously with nothing left to check.
    expect(tables.length).toBeGreaterThan(200);
  });

  it("gives every English key an Arabic twin, and the same shape under it", () => {
    const problems = tables.flatMap((t) => diff(t.where, "", t.en, t.ar));
    expect(problems).toEqual([]);
  });

  it("never leaves a language slot empty or written in the wrong script", () => {
    // Same walk, reported separately so a script failure reads as a
    // translation gap rather than a structural one.
    const problems = tables
      .flatMap((t) => diff(t.where, "", t.en, t.ar))
      .filter((p) => /Arabic slot|English slot/.test(p));
    expect(problems).toEqual([]);
  });
});

/**
 * The shared vocabulary is not written as `{ en, ar }` tables - it is
 * parallel constants behind accessor functions - so the sweep above cannot
 * reach it. It is also the single dictionary every chart, filter and table
 * reads, which makes a missing Arabic entry there worth more than one in
 * any single component. The accessors all fall back to the raw key when a
 * translation is absent, so "the key came back" is exactly the failure.
 */
describe("the shared vocabulary", () => {
  it("names every stage in both languages", () => {
    expect(stageList("ar")).toHaveLength(STAGES.length);
    expect(stageShortList("ar")).toHaveLength(stageShortList("en").length);
    for (const [i, name] of stageList("ar").entries()) {
      expect(ARABIC.test(name), `stage ${i + 1} has no Arabic name`).toBe(true);
    }
    for (const [i, name] of stageShortList("ar").entries()) {
      expect(ARABIC.test(name), `stage ${i + 1} has no short Arabic name`).toBe(true);
    }
  });

  it("names every actor layer in both languages", () => {
    for (const id of LAYERS) {
      expect(layerLabel(id, "en"), `${id} has no English label`).not.toBe(id);
      expect(ARABIC.test(layerLabel(id, "ar")), `${id} has no Arabic label`).toBe(true);
    }
  });

  it("names every status and comparability key in both languages", () => {
    for (const [key] of statusList("en")) {
      expect(ARABIC.test(statusLabel(key, "ar")), `status ${key} has no Arabic label`).toBe(true);
    }
    for (const key of ["direct", "qualified", "not_comparable", "context_only"]) {
      expect(
        ARABIC.test(comparabilityLabel(key, "ar")),
        `comparability ${key} has no Arabic label`,
      ).toBe(true);
    }
  });

  it("names every region in both languages, from one dictionary", () => {
    // The groupings the tracking actually uses. There is no northern one:
    // neither war reached those governorates.
    const regions = [
      "south_nabatieh",
      "beirut_mount_lebanon",
      "bekaa_baalbek_hermel",
      "camps_migrant",
      "national_multi",
      "named_localities",
    ];
    for (const id of regions) {
      expect(regionLabel(id, "en"), `${id} has no English name`).not.toBe(id);
      expect(ARABIC.test(regionLabel(id, "ar")), `${id} has no Arabic name`).toBe(true);
    }
  });

  it("prints both standing cautions in both languages", () => {
    for (const caution of [cautionCounts, cautionMap]) {
      expect(caution("en").length).toBeGreaterThan(80);
      expect(caution("ar").length).toBeGreaterThan(80);
      expect(ARABIC.test(caution("ar"))).toBe(true);
      expect(ARABIC.test(caution("en"))).toBe(false);
    }
  });
});
