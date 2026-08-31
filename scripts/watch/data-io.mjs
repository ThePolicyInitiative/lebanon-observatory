/**
 * Reading and writing `src/data/*.json` by path.
 *
 * A change names its target as a path of steps. A string or a number is
 * an object key or an array index; an object is a match against the
 * elements of an array, so `["funnel", { id: "disbursed" }, "amountUsd"]`
 * reads as "the funnel step whose id is disbursed, its amount". Matching
 * by id rather than by index is what lets the data file be reordered
 * without silently repointing an automated write at the wrong row.
 *
 * A path that matches nothing, or matches more than one element, is an
 * error rather than a no-op. Writers here fail loudly: the alternative is
 * a run that reports success and changes nothing.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fmtDate, fmtDateLong, fmtUsd } from "./format-mirror.mjs";

export const DATA_DIR = join(import.meta.dirname, "..", "..", "src", "data");

export function readData(file) {
  return JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
}

/** Two-space indent and a trailing newline, as every file here is written. */
export function writeData(file, value) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(value, null, 2) + "\n", "utf8");
}

function describePath(path) {
  return path
    .map((step) => (typeof step === "object" ? JSON.stringify(step) : String(step)))
    .join(" > ");
}

function step(node, key, path) {
  if (typeof key === "object" && key !== null) {
    if (!Array.isArray(node))
      throw new Error(`${describePath(path)}: match step used on a non-array`);
    const hits = node.filter((el) =>
      Object.entries(key).every(([k, v]) => el && el[k] === v),
    );
    if (hits.length !== 1)
      throw new Error(
        `${describePath(path)}: ${hits.length} elements match ${JSON.stringify(key)}, expected exactly 1`,
      );
    return hits[0];
  }
  if (node == null || !(key in node))
    throw new Error(`${describePath(path)}: no key "${key}"`);
  return node[key];
}

export function readPath(root, path) {
  let node = root;
  for (const key of path) node = step(node, key, path);
  return node;
}

export function writePath(root, path, value) {
  let node = root;
  for (const key of path.slice(0, -1)) node = step(node, key, path);
  const last = path[path.length - 1];
  if (typeof last === "object")
    throw new Error(`${describePath(path)}: a match cannot be the final step`);
  if (node == null || !(last in node))
    throw new Error(`${describePath(path)}: no key "${last}" to write`);
  node[last] = value;
}

/**
 * The literal a change carries, whichever form it was declared in: a
 * plain value, a formatted amount, or a template with the report date
 * rendered into the language of the field.
 */
export function valueOf(change) {
  if ("value" in change) return change.value;
  if ("usd" in change) return fmtUsd(change.usd, change.locale ?? "en");
  if ("template" in change) {
    if (!change.template.includes("{date}")) return change.template;
    const date =
      change.locale === "ar" ? fmtDate(change.date, "ar") : fmtDateLong(change.date);
    return change.template.replace("{date}", date);
  }
  throw new Error(`change for ${describePath(change.path)} declares no value`);
}

/**
 * Applies a plan, returning only the entries that actually moved.
 *
 * Files are read once, mutated, and written once, so a plan touching six
 * fields of one file produces one write and one diff hunk per field
 * rather than six rewrites.
 */
export function applyPlan(plan, { dryRun = false } = {}) {
  const byFile = new Map();
  for (const change of plan) {
    if (!byFile.has(change.file)) byFile.set(change.file, readData(change.file));
  }

  const applied = [];
  for (const change of plan) {
    const root = byFile.get(change.file);
    const next = valueOf(change);
    const current = readPath(root, change.path);
    if (current === next) continue;
    /*
     * Two strings can name the same thing without being equal. The
     * document search returns report URLs on documents.worldbank.org
     * while the citation register holds the documents1 mirror, so
     * rewriting on inequality alone would churn the register on every
     * run and make a real change hard to see in the diff. A change may
     * therefore declare a token - the document id - whose presence
     * means the field already points where it should.
     */
    if (change.skipIfContains && String(current).includes(change.skipIfContains)) continue;
    writePath(root, change.path, next);
    applied.push({
      file: change.file,
      path: describePath(change.path),
      from: current,
      to: next,
    });
  }

  if (!dryRun) {
    const touched = new Set(applied.map((a) => a.file));
    for (const file of touched) writeData(file, byFile.get(file));
  }
  return applied;
}
