import { LAYER_META } from "@/lib/colors";
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

function countYear(year: Year): TreemapYear {
  const byLayer = new Map<ActorLayer, Map<string, number>>();
  for (const r of roleRecords) {
    if (r.year !== year) continue;
    const actor = r.actorName.split(":")[0].trim();
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

const DATA: TreemapYear[] = [countYear(2024), countYear(2026)];

export default function ActorTreemap() {
  return <ActorTreemapChart data={DATA} />;
}
