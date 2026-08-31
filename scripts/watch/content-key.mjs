/**
 * The dedupe key for reported-layer rows, shared between the guard suite
 * (`tests/duplication.test.ts`) and the ingest pipeline.
 *
 * One module rather than two copies, because the search-index script once
 * hand-mirrored vocabulary from `src/lib/vocab.ts` and drifted silently:
 * the ingest must refuse a row for exactly the repeats the test suite
 * would fail on, or the pipeline writes rows the gate then rejects.
 */

/** Content words only: connectives and punctuation must not hide a repeat. */
const CONNECTIVE = new Set(
  ("and the a an in on of to order which that had has have been was were is " +
    "are at for by with as it its this these from").split(" "),
);

export const contentKey = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .split(" ")
    .filter((w) => w && !CONNECTIVE.has(w))
    .join(" ");

/** The uniqueness key `duplication.test.ts` enforces on web updates. */
export const updateKey = (u) => `${contentKey(u.actor)}|${contentKey(u.action)}`;
