/**
 * The rules a machine-gathered row must pass before it may join the
 * reported layer. Pure functions only - the pipeline in
 * `scripts/news-ingest.mjs` decides what to do with a failure, and
 * `tests/news-ingest.test.ts` exercises everything here offline.
 *
 * The vocabulary regexes are imported from `tests/vocab-patterns.ts` - the
 * same module the guard suites read - never copied. A copy is how the
 * search-index script once drifted from `src/lib/vocab.ts` for weeks.
 * (Node 23.6+ strips the type annotations natively; the news workflow
 * runs on Node 24 for this.)
 */

import { BANNED, AR_BANNED, allowed } from "../../tests/vocab-patterns.ts";
import { updateKey } from "./content-key.mjs";

export { BANNED, AR_BANNED, allowed, updateKey };

export const LAYERS = ["official", "municipal", "ngo_international", "community"];
export const SOURCE_KINDS = ["press", "institutional", "social"];
export const ARCHIVE_KINDS = ["news", "research", "official", "assessment", "rights"];
export const ARCHIVE_LANGUAGES = ["en", "ar", "fr", "en/ar"];
export const ARCHIVE_YEARS = [2024, 2025, 2026];

/*
 * The relevance gate `scripts/web-sweep.py` applies to feed titles,
 * applied here to the opened page itself: a page must name the country
 * and touch at least one reconstruction theme, or the lead is dropped
 * before it costs a writing call.
 */
export const COUNTRY = /lebanon|liban|لبنان|اللبناني/i;
export const THEMES = new RegExp(
  [
    "reconstruct", "rebuild", "rubble", "debris", "compensat",
    "shelter", "displac", "damage", "recovery", "tender",
    "procurement", "restoration", "rehabilitat", "return",
    "إعمار", "ترميم", "أنقاض", "ركام", "تعويض", "إيواء", "نزوح",
    "أضرار", "تأهيل", "عودة", "مناقصة", "إغاثة",
    "reconstruction", "décombres", "indemnis",
  ].join("|"),
  "i",
);

export const relevant = (text) => COUNTRY.test(text) && THEMES.test(text);

/*
 * Leads whose titles announce the stories this site tracks most closely
 * jump the queue when a run's writing caps bind, so a major development
 * is never crowded out by routine items. Ordering only - a salient lead
 * still faces the same gates as any other.
 */
export const SALIENT =
  /LEAP|World Bank|البنك الدولي|compensat|تعويض|disburs|Council of the South|مجلس الجنوب|cabinet|مجلس الوزراء|council of ministers|tender|مناقصة|pilot zone|تجريبية|نموذجية|reconstruction fund|صندوق إعادة|CDR|مجلس الإنماء/i;

/** Em and en dashes are banned from copy alongside the vocabulary. */
const DASHES = /[–—]/;

/**
 * Phrasings that frame a date as the limit of the information, which the
 * site does not do anywhere. The writer is told not to produce them; this
 * catches the ones that slip through anyway.
 */
const DATE_LIMIT = /\bas of\b|\bcut-?off\b|\bdata available (?:through|until)\b|حتى تاريخ/i;

function copyProblems(field, s) {
  if (typeof s !== "string") return [`${field}: not a string`];
  if (/^https?:\/\//.test(s) || allowed(s)) return [];
  const problems = [];
  const hit = s.match(BANNED) ?? s.match(AR_BANNED);
  if (hit) problems.push(`${field}: banned word "${hit[0]}"`);
  if (DASHES.test(s)) problems.push(`${field}: em/en dash`);
  if (DATE_LIMIT.test(s)) problems.push(`${field}: frames a date as the limit of the information`);
  if (/https?:\/\//.test(s)) problems.push(`${field}: carries a URL; links live in sourceUrl`);
  return problems;
}

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

function badDate(value, today) {
  if (value === null) return null;
  if (typeof value !== "string" || !DATE_SHAPE.test(value) || Number.isNaN(Date.parse(value)))
    return "malformed";
  if (today && value > today) return "in the future";
  return null;
}

/**
 * Everything `revalidation.test.ts`, `duplication.test.ts` and
 * `vocabulary.test.ts` would reject, checked before the row is written -
 * plus floors of this pipeline's own: a machine-gathered row always
 * carries a caution, and its prose must be substantial in both languages.
 *
 * Returns a list of problems; an empty list is a pass.
 *
 * @param {Record<string, unknown>} row
 * @param {{ existingKeys?: Set<string>, today?: string | null }} [opts]
 * @returns {string[]}
 */
export function validateUpdate(row, { existingKeys = new Set(), today = null } = {}) {
  const problems = [];
  if (!row || typeof row !== "object") return ["no row"];

  const required = {
    actor: 3, actorAr: 3, action: 120, actionAr: 80, place: 2, placeAr: 2,
    kind: 3, sourceName: 3, caution: 20, cautionAr: 15,
  };
  for (const [field, floor] of Object.entries(required)) {
    const v = row[field];
    if (typeof v !== "string" || v.trim().length < floor)
      problems.push(`${field}: missing or under ${floor} characters`);
  }

  if (!LAYERS.includes(row.layer)) problems.push(`layer: "${row.layer}" not one of ${LAYERS.join("/")}`);
  if (!SOURCE_KINDS.includes(row.sourceKind))
    problems.push(`sourceKind: "${row.sourceKind}" not one of ${SOURCE_KINDS.join("/")}`);
  if (typeof row.southOfLitani !== "boolean") problems.push("southOfLitani: not a boolean");

  const dateProblem = badDate(row.dateReported ?? null, today);
  if (dateProblem) problems.push(`dateReported: ${dateProblem}`);

  for (const pair of [["dateText", "dateTextAr"], ["detail", "detailAr"]]) {
    const [en, ar] = pair.map((f) => row[f]);
    const empty = (v) => v === null || v === undefined || v === "";
    if (empty(en) !== empty(ar))
      problems.push(`${pair[0]}/${pair[1]}: one language carries it and the other does not`);
  }

  for (const field of [
    "actor", "actorAr", "action", "actionAr", "place", "placeAr", "kind",
    "sourceName", "caution", "cautionAr", "detail", "detailAr", "dateText", "dateTextAr",
  ]) {
    const v = row[field];
    if (typeof v === "string" && v) problems.push(...copyProblems(field, v));
  }

  if (problems.length === 0 && existingKeys.has(updateKey(row)))
    problems.push(`repeats an existing actor and action: ${updateKey(row).slice(0, 80)}`);

  return problems;
}

/**
 * An archive item: publisher and title are quoted verbatim (the same
 * exemption `vocabulary.test.ts` grants them); the focus lines are the
 * observatory's own copy and are held to the vocabulary.
 *
 * @param {Record<string, unknown>} item
 * @param {{ existingUrls?: Set<string>, today?: string | null }} [opts]
 * @returns {string[]}
 */
export function validateArchive(item, { existingUrls = new Set(), today = null } = {}) {
  const problems = [];
  if (!item || typeof item !== "object") return ["no item"];

  for (const [field, floor] of Object.entries({ publisher: 2, title: 8, focus: 40, focusAr: 30 })) {
    const v = item[field];
    if (typeof v !== "string" || v.trim().length < floor)
      problems.push(`${field}: missing or under ${floor} characters`);
  }
  if (!ARCHIVE_KINDS.includes(item.kind))
    problems.push(`kind: "${item.kind}" not one of ${ARCHIVE_KINDS.join("/")}`);
  if (!ARCHIVE_LANGUAGES.includes(item.language))
    problems.push(`language: "${item.language}" not one of ${ARCHIVE_LANGUAGES.join("/")}`);
  if (!ARCHIVE_YEARS.includes(item.year)) problems.push(`year: ${item.year} out of range`);

  const dateProblem = badDate(item.date ?? null, today);
  if (dateProblem) problems.push(`date: ${dateProblem}`);
  else if (item.date && item.year !== Number(item.date.slice(0, 4)))
    problems.push(`year ${item.year} disagrees with date ${item.date}`);

  for (const field of ["focus", "focusAr"]) {
    if (typeof item[field] === "string") problems.push(...copyProblems(field, item[field]));
  }

  if (typeof item.url === "string" && !item.url.startsWith("https://"))
    problems.push(`url: not https`);
  if (item.url && existingUrls.has(item.url)) problems.push("url: already archived");

  return problems;
}

/* ---- reading a fetched page ----------------------------------------- */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘" };

/** The page as prose: enough to judge relevance and to write from. */
export function htmlToText(html) {
  return String(html)
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (_, name) => ENTITIES[name.toLowerCase()] ?? " ")
    .replace(/[ \t\r]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export function htmlTitle(html) {
  const m = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? htmlToText(m[1]).slice(0, 300) : "";
}

/**
 * A Google News RSS link opens a Google page, not the publisher's. The
 * page usually names its destination once; when it names exactly one
 * non-Google address, that is the article. Anything murkier goes to the
 * review queue rather than being guessed at.
 */
export function extractPublisherLink(html) {
  const urls = String(html).match(/https?:\/\/[^\s"'<>\\)]+/g) ?? [];
  const outside = [...new Set(
    urls.filter((u) => {
      try {
        const host = new URL(u).hostname;
        return !/(^|\.)(google\.com|googleusercontent\.com|gstatic\.com|googleapis\.com|w3\.org|schema\.org|youtube\.com)$/.test(host);
      } catch {
        return false;
      }
    }).map((u) => u.replace(/[.,;]+$/, "")),
  )];
  const hosts = new Set(outside.map((u) => new URL(u).hostname));
  return hosts.size === 1 ? outside[0] : null;
}

/**
 * The existing rows nearest to a page, by content-word overlap - what the
 * writer is shown so "this is already carried" is a judgment made against
 * the right rows rather than all of them.
 */
export function nearestRows(text, updates, n = 6) {
  const tokens = new Set(
    String(text).toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, " ").split(" ").filter((w) => w.length > 3),
  );
  return updates
    .map((u) => {
      const key = updateKey(u);
      let score = 0;
      for (const w of key.split(" ")) if (tokens.has(w)) score += 1;
      return { u, score };
    })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ u }) => ({ actor: u.actor, action: `${u.action.slice(0, 140)}...` }));
}

/** The next free archive id: ids are not contiguous, so take max + 1. */
export function nextArchiveId(items) {
  const top = items.reduce((a, i) => Math.max(a, Number(String(i.id).replace(/^c/, "")) || 0), 0);
  return `c${top + 1}`;
}
