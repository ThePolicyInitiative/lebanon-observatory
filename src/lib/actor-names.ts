import namesAr from "@/data/actor-names-ar.json";
import type { Locale } from "./vocab";

/**
 * Arabic names for the traced actors, the people named beside them and the
 * subtype labels. Lebanese and Arab bodies carry their own name rather than
 * a translation of the English rendering; a handful of organisations that
 * operate under a Latin brand in Lebanon keep it, because that is the name
 * a reader would search for.
 *
 * `actorName` in the tracking is "Body: Person (Title)", so the two halves
 * are looked up separately and rejoined.
 */

const ACTORS = namesAr.actors as Record<string, string>;
const PEOPLE = namesAr.people as Record<string, string>;
const SUBTYPES = namesAr.subtypes as Record<string, string>;

/** The body, without whatever person is named after the colon. */
export function actorBase(actorName: string): string {
  return actorName.split(":")[0].trim();
}

/** The person named after the colon, or "" where none is. */
export function actorPeople(actorName: string): string {
  return actorName.split(":").slice(1).join(":").trim();
}

export function actorLabel(base: string, locale: Locale): string {
  return locale === "ar" ? (ACTORS[base] ?? base) : base;
}

export function peopleLabel(people: string, locale: Locale): string {
  if (!people) return "";
  return locale === "ar" ? (PEOPLE[people] ?? people) : people;
}

export function subtypeLabel(subtype: string, locale: Locale): string {
  if (!subtype) return "";
  return locale === "ar" ? (SUBTYPES[subtype] ?? subtype) : subtype;
}
