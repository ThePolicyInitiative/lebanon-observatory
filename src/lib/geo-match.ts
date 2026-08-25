/**
 * Place-name matching between the tracking's free-text location
 * names and the OCHA COD town/district layer. Transliteration from
 * Arabic varies wildly (Shaqra/Chaqra, Habboush/Habbouch, Jibsheet/
 * Jibchit, Tayr Debba/Tayr Debbeh), so matching runs in three tiers:
 *
 *   1. normalized equality - case, punctuation, Arabic article prefixes
 *      (el/al/ech/ej/…), common digraph variants (ch/sh, q/k, aa, ou),
 *      doubled letters and trailing a/e/h folded away;
 *   2. consonant skeleton - vowels (and y/w) dropped; only unambiguous
 *      skeletons that identify exactly one town are indexed;
 *   3. a small alias table of well-known places whose source spelling
 *      cannot be derived mechanically (Tyre→Sour, Dahieh→Baabda,
 *      the Costa Brava landfill→Choueifat El-Aamrousiyeh).
 *
 * Nothing is guessed beyond these tiers: regional phrases such as
 * "South Lebanon" deliberately match nothing here and stay in the
 * zone-level totals.
 */

export type TownRef = { name: string; district: string };

export type LocationIndex = {
  /** normalized name → town */
  exact: Map<string, TownRef>;
  /** consonant skeleton → town (unambiguous entries only) */
  skeleton: Map<string, TownRef>;
  /** normalized / skeleton district name → COD district name */
  districts: Map<string, string>;
};

const ARTICLES = /\b(el|al|et|ed|es|ez|ech|ej|en|em|er|the|of|in)\b/g;
const GENERIC =
  /\b(district|city|villages?|towns?|camps?|areas?|street|schools?|shelters?|landfill|coastal|relevant|listed|other|frontline|surrounding|where|and)\b/gi;

export function normalizePlace(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’'`\-–_().]/g, " ")
    .replace(ARTICLES, " ")
    .replace(/ch/g, "sh")
    .replace(/q/g, "k")
    .replace(/aa/g, "a")
    .replace(/ou/g, "u")
    .replace(/[éèê]/g, "e")
    .replace(/\s+/g, "")
    .replace(/(.)\1+/g, "$1")
    .replace(/[hea]+$/, "");
}

function skeletonOf(normalized: string): string {
  return normalized.replace(/[aeiouyw]/g, "");
}

/**
 * Aliases (pre-normalized key → COD target). Well-known geography only.
 *
 * These are read before the mechanical tiers, because a hand-written
 * decision should beat a fuzzy one. Read afterwards they were useless for
 * exactly the ambiguous names they exist to settle: "Hamra" met the
 * Nabatieh village of that name first and pinned Beirut's Hamra eighty
 * kilometres south of itself.
 */
const TOWN_ALIASES: Record<string, string> = {
  aitarun: "Aaintaroun",
  hanuiy: "Hanaouay",
  costabrav: "Choueifat El-Aamrousiyeh",
  costabravalandfil: "Choueifat El-Aamrousiyeh",
  // The tracking itself misspells Taybe's suffix ("Matjaayoun").
  tayb: "Taybet Matjaayoun",
  // Beirut's Hamra, which the layer holds as the quarter Ras Beyrouth. It
  // needs saying because there is a village called Hamra in Nabatieh, and
  // the mechanical tiers reach that one.
  //
  // Cities that appear only as a group's address belong in no alias here:
  // Tripoli was not struck in either war, and a marker on it would say that
  // work happened somewhere nothing was traced.
  hamr: "Ras Beyrouth",
  // Sidon, for the same reason: "Saida" and the Baalbek village "Saaideh"
  // both fold to "said", and the exact index reaches Saaideh first - ninety
  // kilometres north-east, in the Bekaa. map-events.json already anchors the
  // city's episodes on its three core cadastres; this names the old city, the
  // one they share a centre with.
  said: "Saida El-Qadimeh",
};
const DISTRICT_ALIASES: Record<string, string> = {
  tyr: "Sour",
  sidon: "Saida",
  dahi: "Baabda",
  dahiy: "Baabda",
  suthernsuburbsbeirut: "Baabda",
  beirutsuthernsuburbs: "Baabda",
  karantin: "Beirut",
  bast: "Beirut",
  marelias: "Beirut",
  mareliascamp: "Beirut",
  balbeck: "Baalbek",
};

export function buildLocationIndex(towns: TownRef[]): LocationIndex {
  const exact = new Map<string, TownRef>();
  const prefixCandidates = new Map<string, TownRef | null>();
  const skelCandidates = new Map<string, TownRef | null>();
  const districts = new Map<string, string>();

  for (const t of towns) {
    if (!t.name || t.name === "Conflict") continue;
    const norm = normalizePlace(t.name);
    if (norm.length >= 3 && !exact.has(norm)) exact.set(norm, t);

    // Disambiguating suffixes ("Habbouch En-Nabatiyeh") → the bare prefix,
    // kept only when it identifies a single town.
    const m = t.name.match(/^(.+?)\s+E[a-z]*-/);
    if (m) {
      const p = normalizePlace(m[1]);
      if (p.length >= 3) {
        prefixCandidates.set(p, prefixCandidates.has(p) ? null : t);
      }
    }

    const sk = skeletonOf(norm);
    if (sk.length >= 4) {
      skelCandidates.set(sk, skelCandidates.has(sk) ? null : t);
    }

    const dNorm = normalizePlace(t.district);
    if (dNorm.length >= 3 && !districts.has(dNorm)) districts.set(dNorm, t.district);
    const dSk = skeletonOf(dNorm);
    if (dSk.length >= 3 && !districts.has(dSk)) districts.set(dSk, t.district);
  }

  for (const [p, t] of prefixCandidates) {
    if (t && !exact.has(p)) exact.set(p, t);
  }
  const skeleton = new Map<string, TownRef>();
  for (const [sk, t] of skelCandidates) {
    if (t) skeleton.set(sk, t);
  }
  return { exact, skeleton, districts };
}

type Match =
  | { kind: "town"; town: string; district: string }
  | { kind: "district"; district: string };

function matchPart(index: LocationIndex, part: string): Match | null {
  for (const candidate of [part, part.replace(GENERIC, " ")]) {
    const key = normalizePlace(candidate);
    if (!key) continue;
    const aliasTown = TOWN_ALIASES[key];
    if (aliasTown) {
      const t = index.exact.get(normalizePlace(aliasTown));
      if (t) return { kind: "town", town: t.name, district: t.district };
    }
    const town = index.exact.get(key) ?? index.skeleton.get(skeletonOf(key));
    if (town) return { kind: "town", town: town.name, district: town.district };
    const district = index.districts.get(key) ?? DISTRICT_ALIASES[key];
    if (district) return { kind: "district", district };
  }
  return null;
}

/**
 * Match an entry's location names. Returns the towns named directly and
 * every district its locations fall in (a town match implies
 * its district).
 */
export function matchLocations(
  index: LocationIndex,
  locationNames: string[],
): { towns: Set<string>; districts: Set<string> } {
  const towns = new Set<string>();
  const districts = new Set<string>();
  for (const loc of locationNames) {
    const parts = [loc, ...loc.split(/\s*(?:\/|,|\(|\)| and | in )\s*/i)];
    for (const p of parts) {
      if (!p.trim()) continue;
      const m = matchPart(index, p);
      if (!m) continue;
      if (m.kind === "town") towns.add(m.town);
      districts.add(m.district);
    }
  }
  return { towns, districts };
}
