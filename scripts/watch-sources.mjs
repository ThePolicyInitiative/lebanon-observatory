/**
 * Reports what the watched sources say, and changes nothing.
 *
 *   node scripts/watch-sources.mjs            every source
 *   node scripts/watch-sources.mjs --only=leap-isr
 *   node scripts/watch-sources.mjs --json     machine-readable
 *
 * Exit code 0 always: this command answers a question, and "the World
 * Bank is down today" is an answer, not a failure of this repository.
 * The command that publishes is `scripts/auto-update.mjs`, and it is the
 * one whose exit code means something.
 */

import { readState } from "./watch/state.mjs";
import { survey } from "./watch/pipeline.mjs";

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith("--only="))?.slice(7) ?? null;
const asJson = args.includes("--json");

const state = readState();
const results = await survey(state, { only });

if (asJson) {
  console.log(
    JSON.stringify(
      results.map((r) => ({
        id: r.source.id,
        label: r.source.label,
        tier: r.source.tier,
        status: r.status,
        detail: r.detail ?? null,
        problems: r.problems ?? null,
        document: r.doc ?? null,
        reading: r.reading ?? null,
        changes: r.plan?.length ?? 0,
      })),
      null,
      2,
    ),
  );
} else {
  for (const r of results) {
    const mark = {
      unchanged: "  ",
      moved: "->",
      alert: "!!",
      suspect: "??",
      error: "xx",
    }[r.status];
    console.log(`${mark} ${r.source.id}  ${r.status}  ${r.source.label}`);
    if (r.detail) console.log(`     ${r.detail}`);
    if (r.doc?.url) console.log(`     ${r.doc.url}`);
    for (const p of r.problems ?? []) console.log(`     problem: ${p}`);
    if (r.plan) console.log(`     would write ${r.plan.length} fields`);
  }
  const counts = results.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
  console.log(
    `\n${results.length} sources: ` +
      Object.entries(counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(", "),
  );
}
