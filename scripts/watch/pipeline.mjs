/**
 * One pass over the registry: what moved, what it now says, and what
 * that would change in the data.
 *
 * Detection never writes. `survey()` is safe to run on any checkout at
 * any time, and is what the report command and the publish command both
 * start from; only `commitReadings()` touches `src/data`.
 */

import { SOURCES } from "./registry.mjs";
import { applyPlan, readData, writeData } from "./data-io.mjs";

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Statuses a source can come back with:
 *
 *   unchanged   the document we already published is still the current one
 *   moved       a new document, read and checked, ready to write
 *   suspect     a new document whose reading failed its checks
 *   alert       a watch-only source that moved; a human has to read it
 *   error       the source could not be reached or understood
 */
export async function survey(state, { only = null } = {}) {
  const results = [];

  for (const source of SOURCES) {
    if (only && source.id !== only) continue;
    const seen = state.sources?.[source.id] ?? null;

    try {
      const doc = await source.discover();
      if (!doc) {
        results.push({ source, status: "error", detail: "source returned no document" });
        continue;
      }
      const identity = source.docIdentity(doc);
      if (seen && seen.publishedIdentity === identity) {
        results.push({ source, status: "unchanged", doc, identity });
        continue;
      }

      if (source.tier === "alert") {
        results.push({
          source,
          status: "alert",
          doc,
          identity,
          detail: source.describeDoc(doc),
        });
        continue;
      }

      const reading = await source.read(doc);
      const verdict = source.check(reading, seen?.reading ?? null);
      if (!verdict.ok) {
        results.push({
          source,
          status: "suspect",
          doc,
          identity,
          reading,
          problems: verdict.problems,
          // A reading that failed its checks is an unresolved problem,
          // so it is re-read on every run until it passes or a human
          // changes the extractor. `repeat` lets the report say so
          // instead of announcing the same document as news each day.
          repeat: seen?.suspectIdentity === identity,
        });
        continue;
      }

      results.push({
        source,
        status: "moved",
        doc,
        identity,
        reading,
        detail: source.describeReading(reading),
        plan: source.plan(reading, doc),
      });
    } catch (err) {
      results.push({ source, status: "error", detail: err.message });
    }
  }

  return results;
}

/**
 * Writes the readings that passed, and stamps the citation register.
 *
 * The `accessedDate` of a cited source is moved only when its document
 * moved. A daily run that finds nothing new leaves the register alone,
 * so the date on a citation keeps meaning "when this figure was last
 * taken from this document" rather than "when a cron job last ran".
 */
export function commitReadings(results, { dryRun = false } = {}) {
  const moved = results.filter((r) => r.status === "moved");
  const applied = [];

  for (const r of moved) {
    applied.push(...applyPlan(r.plan, { dryRun }));
  }

  const stamped = [];
  const ids = [...new Set(moved.map((r) => r.source.sourceId).filter(Boolean))];
  if (ids.length) {
    const sources = readData("report-sources.json");
    const today = todayIso();
    for (const id of ids) {
      const entry = sources.find((s) => s.id === id);
      if (!entry) throw new Error(`report-sources.json has no entry ${id}`);
      if (entry.accessedDate === today) continue;
      stamped.push({ id, from: entry.accessedDate, to: today });
      entry.accessedDate = today;
    }
    if (!dryRun && stamped.length) writeData("report-sources.json", sources);
  }

  return { applied, stamped };
}

/**
 * Records what this run published, so the next one can tell it is old.
 *
 * Only a document that was actually acted on advances
 * `publishedIdentity`. A suspect reading records its identity separately
 * and stays outstanding: the next run reads it again, which is what
 * makes fixing an extractor enough to resolve it, with no flag to
 * remember and no state to clear by hand.
 */
export function advanceState(state, results) {
  const next = { ...state, sources: { ...(state.sources ?? {}) } };
  const now = new Date().toISOString();

  for (const r of results) {
    if (r.status === "unchanged" || r.status === "error") continue;
    const prior = next.sources[r.source.id] ?? {};

    if (r.status === "suspect") {
      next.sources[r.source.id] = {
        ...prior,
        seenAt: now,
        suspectIdentity: r.identity,
        suspectProblems: r.problems,
      };
      continue;
    }

    const { suspectIdentity, suspectProblems, ...clean } = prior;
    void suspectIdentity;
    void suspectProblems;
    next.sources[r.source.id] = {
      ...clean,
      publishedIdentity: r.identity,
      seenAt: now,
      ...(r.reading ? { reading: r.reading } : {}),
    };
  }
  return next;
}
