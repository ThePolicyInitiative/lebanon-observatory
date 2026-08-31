import { locations } from "@/lib/data-client";
import { cautionMap, regionLabel, type Locale } from "@/lib/vocab";
import type { ActorLayer } from "@/lib/types";

/**
 * A layer's geography, as bars rather than a column of numbers.
 *
 * The tab printed seven regions against two year columns and asked the
 * reader to difference them in their head. The bars do it: the drop in
 * the south or the growth in the camps is a shape now, and the exact
 * counts still sit at the end of each bar.
 */

const T = {
  en: {
    title: "Where this layer was traced",
    sub: "Location mentions per region, both years. Presence is where activity was traced, never where damage or need was greatest.",
    unmappable: "Not mappable to one governorate",
  },
  ar: {
    title: "أين رُصدت هذه الطبقة",
    sub: "إشارات المواقع بحسب المنطقة في السنتين. والحضور هو حيث رُصد النشاط، لا حيث كان الدمار أو الحاجة أكبر.",
    unmappable: "غير قابلة للإسناد إلى محافظة واحدة",
  },
} as const;

export default function RegionPresence({
  layer,
  locale = "en",
  showCaveat = true,
}: {
  layer: ActorLayer;
  locale?: Locale;
  showCaveat?: boolean;
}) {
  const t = T[locale];
  const rows = locations.regions.map((r) => {
    const m24 = locations.mentions["2024"][r.id as keyof (typeof locations.mentions)["2024"]];
    const m26 = locations.mentions["2026"][r.id as keyof (typeof locations.mentions)["2026"]];
    return {
      id: r.id,
      label: locale === "ar" ? regionLabel(r.id, "ar") : r.label,
      mappable: r.mappable,
      v24: m24[layer] ?? 0,
      v26: m26[layer] ?? 0,
    };
  });
  const max = Math.max(1, ...rows.flatMap((r) => [r.v24, r.v26]));

  return (
    <figure className="card">
      <figcaption>
        <h3 className="text-lead font-semibold text-navy">
          {t.title}
        </h3>
        <p className="mt-1 text-body text-text-secondary">{t.sub}</p>
      </figcaption>

      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-4 rounded-sm bg-y2024" />
          2024
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-4 rounded-sm bg-y2026" />
          2026
        </span>
      </p>

      <ul className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <li key={r.id}>
            <p className="flex items-baseline justify-between gap-2 text-meta">
              <span className="text-text">
                {r.label}
                {!r.mappable ? (
                  <span className="ms-1.5 text-micro text-text-secondary">
                    ({t.unmappable})
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 tabular-nums text-text-secondary">
                {r.v24} → <strong className="text-navy">{r.v26}</strong>
              </span>
            </p>
            <span className="mt-1 block space-y-[3px]">
              {[
                { v: r.v24, color: "var(--color-y2024)" },
                { v: r.v26, color: "var(--color-y2026)" },
              ].map((row, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="block h-2 rounded-sm"
                  style={{
                    width: `${(row.v / max) * 100}%`,
                    minWidth: row.v > 0 ? 3 : 0,
                    background: row.color,
                  }}
                />
              ))}
            </span>
          </li>
        ))}
      </ul>

      {showCaveat ? (
        <p className="mt-3 note-caution text-meta leading-relaxed text-text-secondary">
          {cautionMap(locale)}
        </p>
      ) : null}
    </figure>
  );
}
