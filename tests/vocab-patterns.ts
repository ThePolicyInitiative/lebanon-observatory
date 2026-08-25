/**
 * The reader-facing vocabulary rule, in one place.
 *
 * Two suites read these: the static scan in `vocabulary.test.ts`, which
 * looks at the source, and the rendered sweep in `e2e/smoke.spec.ts`,
 * which looks at what a browser actually paints. The static scan cannot
 * see a word assembled at runtime out of fragments; the rendered sweep
 * cannot see a string on a branch no route takes. Neither is complete
 * alone, and both have to be reading the same list of words for the pair
 * to mean anything - hence this module rather than two copies.
 *
 * Not a `.test.ts` file, so vitest does not collect it.
 */

/**
 * The site never talks about datasets, records, documents, evidence,
 * files or verification. This governs copy only - identifiers such as
 * `roleRecords`, the `Record<>` type, `document.querySelector` and the
 * `not_verified` status key are code, never read by anyone.
 */
export const BANNED =
  /\b(datasets?|records?|recorded|documents?|documented|documentation|evidence|evidentiary|dossiers?|files?|sources?|users?|verify|verifies|verified|unverified|verifiable|unverifiable|verification)\b/i;

export const AR_BANNED =
  /(الأدلة|أدلة|موثّقة|موثقة|يوثّق|يوثق|سجلات|وثائق|ملفات|المصادر|مصادر|المصدر|مصدر|تحقّق|تحقق|متحقَّق|مُتحقَّق)/;

/**
 * Strings that keep a banned word for a reason. Two kinds only:
 *
 * - a third-party title quoted verbatim, where a rewrite would misquote it;
 * - a name from outside the site - an HTTP header, a field on someone
 *   else's API, a publisher's masthead - which is an identifier, not copy.
 */
export const ALLOWED = [
  "OSM Building Dataset Complete for Conflict Affected Districts in Southern Lebanon",
  "user-agent",
  "source.name",
  "source.shortname",
  "lebanon-files",
  "Lebanon Files",
];

export function allowed(s: string): boolean {
  return ALLOWED.some((a) => s.includes(a));
}

/** The banned word in `s`, or null. Allowlisted strings never hit. */
export function bannedHit(s: string): string | null {
  if (allowed(s) || /^https?:\/\//.test(s)) return null;
  const hit = s.match(BANNED) ?? s.match(AR_BANNED);
  return hit ? hit[0] : null;
}

/**
 * The rendered sweep works on whole pages, where an allowlisted quotation
 * sits in the same blob as everything else. Cutting the allowlisted
 * strings out first keeps a legitimate quotation from masking the rest of
 * the page, and keeps the two suites judging the same words.
 */
export function bannedHitsInPage(text: string): string[] {
  let rest = text;
  for (const a of ALLOWED) rest = rest.split(a).join(" ");
  const out: string[] = [];
  for (const line of rest.split(/\n+/)) {
    const hit = line.match(BANNED) ?? line.match(AR_BANNED);
    if (hit) out.push(`"${hit[0]}" in: ${line.trim().slice(0, 90)}`);
  }
  return out;
}
