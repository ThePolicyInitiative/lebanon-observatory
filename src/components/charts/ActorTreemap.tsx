import { LAYER_META } from "@/lib/colors";
import type { Locale } from "@/lib/vocab";
import { actorBase, actorLabel } from "@/lib/actor-names";
import { roleRecords } from "@/lib/data";
import type { ActorLayer, Year } from "@/lib/types";
import ActorTreemapChart, { type TreemapYear } from "./ActorTreemapChart";

/**
 * Treemap of the traced actor landscape: one cell per named actor,
 * area = traced role mentions, grouped and coloured by layer. The
 * spec palette's teal/plum pair is CVD-tight, so identity never rides on
 * colour alone: cells are grouped by layer region, separated by white
 * gaps and direct-labelled wherever they are large enough to read.
 *
 * The counting runs here, on the server. Doing it in the browser meant
 * shipping the whole register to produce one integer per actor.
 */

function countYear(year: Year, locale: Locale): TreemapYear {
  const byLayer = new Map<ActorLayer, Map<string, number>>();
  for (const r of roleRecords) {
    if (r.year !== year) continue;
    const actor = actorLabel(actorBase(r.actorName), locale);
    if (!byLayer.has(r.actorLayer)) byLayer.set(r.actorLayer, new Map());
    const m = byLayer.get(r.actorLayer)!;
    m.set(actor, (m.get(actor) ?? 0) + 1);
  }
  return {
    year,
    layers: LAYER_META.map((l) => ({
      id: l.id,
      actors: [...(byLayer.get(l.id)?.entries() ?? [])].sort((a, b) => b[1] - a[1]),
    })),
  };
}

/**
 * The label a cell shows back to the untranslated base name, so a click
 * can open that actor in the register. The cells carry display labels,
 * and only the base resolves to an anchor.
 */
function baseByLabel(locale: Locale): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of roleRecords) {
    const base = actorBase(r.actorName);
    out[actorLabel(base, locale)] = base;
  }
  return out;
}

/** Built once per language, at module scope, not per render. */
const DATA: Record<Locale, TreemapYear[]> = {
  en: [countYear(2024, "en"), countYear(2026, "en")],
  ar: [countYear(2024, "ar"), countYear(2026, "ar")],
};

const BASES: Record<Locale, Record<string, string>> = {
  en: baseByLabel("en"),
  ar: baseByLabel("ar"),
};

export default function ActorTreemap({ locale = "en" }: { locale?: Locale } = {}) {
  return <ActorTreemapChart data={DATA[locale]} bases={BASES[locale]} locale={locale} />;
}
