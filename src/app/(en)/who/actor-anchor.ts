import type { Locale } from "@/lib/vocab";

/**
 * The per-actor destination in the register.
 *
 * Derived from the actor's base name as the tracking writes it, never from
 * the label a reader sees, so one actor keeps one anchor in both languages:
 * /actors#actor-... and /ar/actors#actor-... open the same group. The prefix
 * keeps the id clear of the page's own section ids and guarantees it starts
 * with a letter.
 *
 * This module carries no data and no "use client", so the server halves that
 * build the groups and the client halves that link to them can both call it.
 */
export function actorAnchor(base: string): string {
  const slug = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `actor-${slug}`;
}

/** The same anchor as a link, for any surface that names an actor. */
export function actorHref(base: string, locale: Locale = "en"): string {
  return `${locale === "ar" ? "/ar" : ""}/who#${actorAnchor(base)}`;
}
