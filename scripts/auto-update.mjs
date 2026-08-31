/**
 * Detect, write, rebuild, test, commit, push.
 *
 *   node scripts/auto-update.mjs --dry-run    report and write nothing
 *   node scripts/auto-update.mjs              write, rebuild and test
 *   node scripts/auto-update.mjs --push       ...and publish
 *
 * The test suite is the gate, and it is the whole safety argument for
 * publishing without a human. A run writes only the fields the registry
 * declares machine-owned, then asks the existing suite whether the site
 * still agrees with itself - Arabic and English carrying the same
 * figures, prose matching the data it describes, derived files not
 * stale. If any of that fails, the run puts the tree back exactly as it
 * found it and publishes nothing.
 *
 * Exit codes, chosen so a scheduled runner reports the useful ones:
 *
 *   0   nothing had moved, or a change was published
 *   10  something moved that a human has to read (alert, or a reading
 *       that failed its checks)
 *   20  a change was written and the test suite rejected it; the tree
 *       has been restored
 *   1   the run could not complete
 */

import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { readState, writeState } from "./watch/state.mjs";
import { advanceState, commitReadings, survey } from "./watch/pipeline.mjs";

const ROOT = join(import.meta.dirname, "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const push = args.includes("--push");
const allowDirty = args.includes("--allow-dirty");
const only = args.find((a) => a.startsWith("--only="))?.slice(7) ?? null;

function git(...rest) {
  return execFileSync("git", rest, { cwd: ROOT, encoding: "utf8" }).trim();
}

function node(script, ...rest) {
  execFileSync(process.execPath, [script, ...rest], { cwd: ROOT, stdio: "inherit" });
}

function say(line = "") {
  console.log(line);
}

/*
 * A dirty tree is refused rather than worked around. The restore step
 * below reverts the files this run wrote, and it can only do that safely
 * if nothing else was uncommitted in them when it started - this
 * repository routinely carries a large uncommitted regeneration of
 * public/entries, and reverting that would destroy work.
 */
if (!dryRun && !allowDirty) {
  const dirty = git("status", "--porcelain");
  if (dirty) {
    say("The working tree has uncommitted changes, so this run would not be able to");
    say("restore it if the tests failed. Commit or stash them first, or pass");
    say("--allow-dirty if you are certain.\n");
    say(dirty.split("\n").slice(0, 10).join("\n"));
    process.exit(1);
  }
}

const state = readState();
const results = await survey(state, { only });

for (const r of results) {
  say(`${r.status.padEnd(9)} ${r.source.id}  ${r.detail ?? r.source.label}`);
  for (const p of r.problems ?? []) say(`          problem: ${p}`);
}
say();

const moved = results.filter((r) => r.status === "moved");
const attention = results.filter((r) => r.status === "alert" || r.status === "suspect");
const failed = results.filter((r) => r.status === "error");

for (const r of failed) say(`could not read ${r.source.id}: ${r.detail}`);

if (!moved.length) {
  if (attention.length) {
    say(`${attention.length} source(s) need a human read; nothing was written.`);
    if (!dryRun) writeState(advanceState(state, results));
    process.exit(10);
  }
  say("Nothing moved.");
  process.exit(0);
}

/* ---- write ---------------------------------------------------------- */

const { applied, stamped } = commitReadings(moved, { dryRun });

if (!applied.length && !stamped.length) {
  say("The documents moved but every field already held the new value.");
  if (!dryRun) writeState(advanceState(state, results));
  process.exit(0);
}

say(`${applied.length} field(s) written:`);
for (const a of applied) say(`  ${a.file}  ${a.path}\n    ${a.from}  ->  ${a.to}`);
for (const s of stamped) say(`  report-sources.json  ${s.id}.accessedDate  ${s.from} -> ${s.to}`);
say();

if (dryRun) {
  say("Dry run: nothing was written to disk.");
  process.exit(0);
}

/* ---- rebuild and test ----------------------------------------------- */

function restore() {
  git("checkout", "--", "src/data", "public", "scripts/watch");
}

try {
  say("Rebuilding derived files...");
  node("scripts/build-projections.mjs");
  node("scripts/build-search-index.mjs");
} catch {
  restore();
  say("A derived build failed. The tree has been restored and nothing was published.");
  process.exit(20);
}

try {
  say("Running the test suite...");
  execFileSync(process.execPath, [join("node_modules", "vitest", "vitest.mjs"), "run"], {
    cwd: ROOT,
    stdio: "inherit",
  });
} catch {
  const report = results
    .filter((r) => r.status === "moved")
    .map((r) => `${r.source.id}: ${r.detail}`)
    .join("\n");
  restore();
  say();
  say("The test suite rejected the update. The tree has been restored and nothing");
  say("was published. What moved, for a human to carry through by hand:");
  say();
  say(report);
  say();
  say("The usual cause is a figure written into prose or a chart component that the");
  say("registry does not own. See docs/automation.md.");
  process.exit(20);
}

/* ---- publish -------------------------------------------------------- */

writeState(advanceState(state, results));

const summary = moved.map((r) => r.detail).join("; ");
const body = [
  ...applied.map((a) => `${a.file} ${a.path}: ${a.from} -> ${a.to}`),
  ...stamped.map((s) => `report-sources.json ${s.id}.accessedDate: ${s.from} -> ${s.to}`),
  "",
  ...moved.map((r) => `source: ${r.source.label}\n${r.doc.url ?? ""}`),
].join("\n");

git("add", "src/data", "public", "scripts/watch/state.json");
git("commit", "-m", `data: ${summary}`, "-m", body);
say(`Committed ${git("rev-parse", "--short", "HEAD")}.`);

if (push) {
  git("push");
  say("Pushed. The host builds from the new commit.");
} else {
  say("Not pushed (pass --push).");
}
