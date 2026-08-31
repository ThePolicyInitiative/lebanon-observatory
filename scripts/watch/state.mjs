/**
 * What the last run saw, per source.
 *
 * Committed alongside the data it explains. A run compares the identity
 * it computes now against the one stored here, so "has this source moved"
 * survives a fresh checkout, a new CI runner and a cold cache - none of
 * which an in-memory or a gitignored cache would.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STATE_FILE = join(import.meta.dirname, "state.json");

export function readState() {
  if (!existsSync(STATE_FILE)) return { sources: {} };
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    return parsed && typeof parsed === "object" ? { sources: {}, ...parsed } : { sources: {} };
  } catch {
    // A corrupt state file must not wedge the pipeline: an empty state
    // makes every source look new, which reports too much rather than
    // too little.
    return { sources: {} };
  }
}

export function writeState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
}
