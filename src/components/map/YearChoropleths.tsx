import {
  DISTRICT_PATHS,
  GOV_PATHS,
  CITY_LABELS,
  OCCUPIED_BORDER_DISTRICTS_2026,
  projectPoint,
  VIEW_W,
  VIEW_H,
} from "@/lib/geo";
import { locations, CAUTION_MAP } from "@/lib/data";
import type { ActorLayer, Year } from "@/lib/types";

/**
 * Side-by-side geographic heat maps of traced role concentration for
 * 2024 and 2026, drawn at district (qada) detail with governorate
 * outlines and major-city labels. Pure server component: the SVGs are
 * part of the page HTML, visible without JavaScript or WebGL. A shared
 * scale keeps the two years honestly comparable; exact values are
 * printed beneath.
 */

function totalsFor(year: Year): Record<string, number> {
  const y = locations.mentions[String(year) as "2024" | "2026"];
  const out: Record<string, number> = {};
  for (const region of locations.regions) {
    const m = y[region.id as keyof typeof y] as Record<ActorLayer, number> | undefined;
    if (!m) continue;
    out[region.id] = m.official + m.municipal + m.ngo_international + m.community;
  }
  return out;
}

const YEAR_RAMP: Record<Year, string> = { 2024: "#58779B", 2026: "#2F8F6B" };

export default function YearChoropleths() {
  const totals: Record<Year, Record<string, number>> = {
    2024: totalsFor(2024),
    2026: totalsFor(2026),
  };
  const mappable = locations.regions.filter((r) => r.mappable);
  // One shared maximum across both years so shading is comparable.
  const sharedMax = Math.max(
    1,
    ...([2024, 2026] as Year[]).flatMap((y) => mappable.map((r) => totals[y][r.id] ?? 0)),
  );

  return (
    <figure className="card p-4 sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          Geographic heat maps: traced activity, 2024 and 2026
        </h3>
        <p className="mt-1 max-w-3xl text-sm text-[color:var(--color-text-secondary)]">
          District-level maps shaded by each regional grouping&apos;s total
          traced mentions (all four actor layers), on one shared scale so
          the two years are honestly comparable. Exact values are printed
          beneath each map; camps and national-scale activity cannot be drawn
          onto districts and are listed separately.
        </p>
      </figcaption>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {([2024, 2026] as Year[]).map((year) => {
          const ramp = YEAR_RAMP[year];
          return (
            <div key={year}>
              <p
                className="inline-block rounded-sm px-2 py-0.5 text-sm font-bold text-white"
                style={{ background: ramp }}
              >
                {year}
              </p>
              <div className="mt-2 rounded-md border border-[color:var(--color-border)] bg-[#E9EDF2]">
                <svg
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  role="img"
                  aria-label={`District-level heat map of Lebanon for ${year}: ${mappable
                    .map((r) => `${r.label} ${totals[year][r.id] ?? 0} mentions`)
                    .join("; ")}.${year === 2026 ? " Hatched districts contain Israeli-occupied border areas." : ""}`}
                  className="h-auto w-full"
                >
                  <defs>
                    <pattern
                      id={`occupied-hatch-${year}`}
                      width="7"
                      height="7"
                      patternTransform="rotate(45)"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width="7" height="7" fill="transparent" />
                      <line x1="0" y1="0" x2="0" y2="7" stroke="#BD5A46" strokeWidth="2.2" strokeOpacity="0.55" />
                    </pattern>
                  </defs>
                  {DISTRICT_PATHS.map((p) => {
                    const v = totals[year][p.zoneId] ?? 0;
                    const t = v / sharedMax;
                    return (
                      <path
                        key={p.name}
                        d={p.d}
                        fill={ramp}
                        fillOpacity={v === 0 ? 0.08 : 0.2 + t * 0.72}
                        stroke="#FFFFFF"
                        strokeWidth={0.6}
                        strokeOpacity={0.85}
                      >
                        <title>{`${p.name} district - ${p.zoneLabel}: ${v} mentions in ${year}`}</title>
                      </path>
                    );
                  })}
                  {year === 2026
                    ? DISTRICT_PATHS.filter((p) =>
                        OCCUPIED_BORDER_DISTRICTS_2026.includes(p.name),
                      ).map((p) => (
                        <path
                          key={`occ-${p.name}`}
                          d={p.d}
                          fill={`url(#occupied-hatch-${year})`}
                          stroke="#BD5A46"
                          strokeWidth={1.1}
                          strokeOpacity={0.7}
                        />
                      ))
                    : null}
                  {GOV_PATHS.map((p) => (
                    <path
                      key={`gov-${p.name}`}
                      d={p.d}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={1.6}
                    />
                  ))}
                  {CITY_LABELS.map((c) => {
                    const { x, y } = projectPoint(c.lon, c.lat);
                    return (
                      <g key={c.name} aria-hidden>
                        <circle cx={x} cy={y} r={2} fill="#4A5A6B" />
                        <text
                          x={x + 4.5}
                          y={y - 3.5}
                          fontSize={10.5}
                          fill="#3D4C5C"
                          stroke="#FFFFFF"
                          strokeWidth={2.5}
                          paintOrder="stroke"
                          fontWeight={600}
                        >
                          {c.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <ul className="mt-2 space-y-0.5 text-xs tabular-nums text-[color:var(--color-text)]">
                {mappable.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{
                          background: ramp,
                          opacity:
                            (totals[year][r.id] ?? 0) === 0
                              ? 0.08
                              : 0.2 + ((totals[year][r.id] ?? 0) / sharedMax) * 0.72,
                        }}
                      />
                      {r.label}
                    </span>
                    <span className="font-semibold">{totals[year][r.id] ?? 0}</span>
                  </li>
                ))}
                {locations.regions
                  .filter((r) => !r.mappable)
                  .map((r) => {
                    const y = locations.mentions[String(year) as "2024" | "2026"];
                    const m = y[r.id as keyof typeof y] as Record<ActorLayer, number> | undefined;
                    const total = m
                      ? m.official + m.municipal + m.ngo_international + m.community
                      : 0;
                    return (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2 text-[color:var(--color-text-secondary)]"
                      >
                        <span>{r.label} (not mappable)</span>
                        <span className="font-semibold">{total}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-4 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        {CAUTION_MAP} Mention counts are traced at the regional-grouping
        level; district boundaries are shown for geographic orientation, not
        as district-level measurements. On the 2026 panel, rust hatching marks
        the border districts containing Israeli-occupied areas - indicative
        only, since the expanded occupation zone demarcated on 18 June 2026
        has no published boundary geometry.
      </p>
    </figure>
  );
}
