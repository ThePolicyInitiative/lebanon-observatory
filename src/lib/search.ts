import type { Locale } from "./vocab";

/**
 * The shared half of the site-wide search: the shape of the index that
 * scripts/build-search-index.mjs writes, and the query helpers the search
 * page runs over it. No React here, so the generator's test can import the
 * same helpers the browser uses.
 *
 * One index holds both languages. A reader typing in Arabic and a reader
 * typing in English reach the same target; only the label printed beside it
 * changes. That is why matching runs over both labels at once rather than
 * over the language the page happens to be in.
 */

export type SearchKind =
  | "page"
  | "actor"
  | "place"
  | "stage"
  | "layer"
  | "indicator"
  | "milestone";

/**
 * One target. Keys are short because the index carries a few hundred of
 * them and is fetched over the wire:
 *   k   kind
 *   t   English label        ta  Arabic label
 *   c   English context      ca  Arabic context
 *   x   English text that is searched but never printed, and xa its twin
 *   h   English href         ha  Arabic href, only when it is not /ar + h
 */
export type SearchItem = {
  k: SearchKind;
  t: string;
  ta: string;
  c?: string;
  ca?: string;
  x?: string;
  xa?: string;
  h: string;
  ha?: string;
};

export type SearchIndex = {
  note: string;
  counts: Partial<Record<SearchKind, number>>;
  items: SearchItem[];
};

/** The order the groups are shown in, broad targets before narrow ones. */
export const KIND_ORDER: SearchKind[] = [
  "page",
  "actor",
  "place",
  "stage",
  "layer",
  "indicator",
  "milestone",
];

const KIND_LABELS: Record<Locale, Record<SearchKind, string>> = {
  en: {
    page: "Pages",
    actor: "Actors",
    place: "Places",
    stage: "Value-chain stages",
    layer: "Actor layers",
    indicator: "Indicators",
    milestone: "Milestones",
  },
  ar: {
    page: "الصفحات",
    actor: "الجهات الفاعلة",
    place: "الأماكن",
    stage: "مراحل سلسلة القيمة",
    layer: "طبقات الجهات",
    indicator: "المؤشرات",
    milestone: "المحطات",
  },
};

export function kindLabel(kind: SearchKind, locale: Locale): string {
  return KIND_LABELS[locale][kind];
}

export function labelOf(item: SearchItem, locale: Locale): string {
  return locale === "ar" ? item.ta : item.t;
}

export function contextOf(item: SearchItem, locale: Locale): string {
  return (locale === "ar" ? item.ca : item.c) ?? "";
}

/**
 * The Arabic twin of a target. Stored only where it differs from the
 * English one - an Arabic page whose section carries a different id - so
 * everything else derives it the way the routes themselves are laid out.
 */
export function hrefOf(item: SearchItem, locale: Locale): string {
  if (locale !== "ar") return item.h;
  if (item.ha) return item.ha;
  return item.h === "/" ? "/ar" : `/ar${item.h}`;
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Folds a string down to what a reader means by it.
 *
 * Latin: case and accents. Arabic: tashkeel and tatweel dropped, the alef
 * forms unified, ya and alef maqsura unified, ta marbuta folded onto ha,
 * the hamza carriers folded onto their letters and the Arabic-Indic digits
 * written as Latin ones. Someone typing "النبطيه" without diacritics finds
 * "النبطيّة", and "٢٠٢٤" finds 2024.
 */
export function normalize(input: string): string {
  let out = input.normalize("NFKD");
  // Combining marks: Latin accents first, then the Arabic vowel marks,
  // the daggers and the hamza carriers NFKD has just separated.
  out = out.replace(/[\u0300-\u036f\u064b-\u0655\u0670\u0640]/g, "");
  out = out
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "");
  out = out.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
  return out
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** One item with everything the matcher reads folded once, up front. */
export type PreparedItem = {
  item: SearchItem;
  /** Both labels, both context lines and both hidden halves, folded. */
  hay: string;
  /** The two labels on their own, for ranking. */
  labels: string[];
};

export function prepare(items: SearchItem[]): PreparedItem[] {
  return items.map((item) => {
    const labels = [normalize(item.t), normalize(item.ta)];
    const rest = [item.c, item.ca, item.x, item.xa]
      .filter((s): s is string => Boolean(s))
      .map(normalize);
    return { item, labels, hay: [...labels, ...rest].join(" ") };
  });
}

export function tokenize(query: string): string[] {
  return normalize(query).split(" ").filter(Boolean);
}

/** A token matches with or without the Arabic definite article. */
function has(hay: string, token: string): boolean {
  if (hay.includes(token)) return true;
  return token.startsWith("ال") && hay.includes(token.slice(2));
}

const MISS = 9;

function labelScore(label: string, query: string): number {
  if (!query) return MISS;
  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (label.includes(` ${query}`)) return 2;
  if (label.includes(query)) return 3;
  return MISS;
}

/**
 * Every item all the query's words appear in, best first.
 *
 * A whole-query hit on a label outranks one buried in a context line, and
 * an item whose words are only scattered across its text comes last. Within
 * one score the group order decides, then the order the index was built in,
 * which is alphabetical for actors and chronological for milestones.
 */
export function runQuery(prepared: PreparedItem[], query: string): SearchItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const whole = tokens.join(" ");

  const hits: { item: SearchItem; score: number; kind: number; at: number }[] = [];
  prepared.forEach((p, at) => {
    if (!tokens.every((t) => has(p.hay, t))) return;
    let score = Math.min(...p.labels.map((l) => labelScore(l, whole)));
    if (score === MISS) score = has(p.hay, whole) ? 4 : 5;
    hits.push({ item: p.item, score, kind: KIND_ORDER.indexOf(p.item.k), at });
  });

  hits.sort((a, b) => a.score - b.score || a.kind - b.kind || a.at - b.at);
  return hits.map((h) => h.item);
}

/** The hits of one kind, in the order runQuery put them. */
export function groupByKind(results: SearchItem[]): { kind: SearchKind; items: SearchItem[] }[] {
  return KIND_ORDER.map((kind) => ({
    kind,
    items: results.filter((r) => r.k === kind),
  })).filter((g) => g.items.length > 0);
}
