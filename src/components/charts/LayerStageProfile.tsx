import { countsFor } from "@/lib/data-client";
import { cautionCounts, layers, stageShortList, type Locale } from "@/lib/vocab";
import type { ActorLayer } from "@/lib/types";

/**
 * Where one actor layer sits along the twelve-stage chain, both years.
 *
 * The tabs stated a layer's shape in prose - "strong in coordination,
 * absent from procurement" - and left the reader to take it on trust.
 * This draws it: two bars per stage on one shared scale, so the shape and
 * the change are visible at once.
 *
 * Deliberately plain SVG rather than a charting library: it renders in
 * the server HTML, costs nothing to load, and the shape is the point.
 */

const T = {
  en: {
    title: "Where this layer sits along the chain",
    sub: "Traced presence per value-chain stage, both years on one scale. The bar is the count, not the size of what was done.",
    none: "No traced presence in either year.",
    y24: "2024",
    y26: "2026",
    total: "Total",
  },
  ar: {
    title: "أين تقع هذه الطبقة على امتداد السلسلة",
    sub: "الحضور المرصود في كل مرحلة من سلسلة القيمة، السنتان على مقياس واحد. والشريط هو العدد، لا حجم ما أُنجز.",
    none: "لا حضور مرصود في أي من السنتين.",
    y24: "2024",
    y26: "2026",
    total: "المجموع",
  },
} as const;

export default function LayerStageProfile({
  layer,
  locale = "en",
  showCaveat = true,
}: {
  layer: ActorLayer;
  locale?: Locale;
  showCaveat?: boolean;
}) {
  const t = T[locale];
  const meta = layers(locale).find((l) => l.id === layer)!;
  const shorts = stageShortList(locale);
  const a = countsFor(2024, layer);
  const b = countsFor(2026, layer);
  const max = Math.max(1, ...a, ...b);
  const sum = (xs: number[]) => xs.reduce((x, y) => x + y, 0);

  return (
    <figure className="card">
      <figcaption>
        <h3 className="text-base font-semibold text-navy">
          {t.title}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">{t.sub}</p>
      </figcaption>

      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-4 rounded-sm bg-y2024" />
          {t.y24}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-4 rounded-sm bg-y2026" />
          {t.y26}
        </span>
        <span className="tabular-nums">
          {t.total}: {sum(a)} → {sum(b)}
        </span>
      </p>

      <ul className="mt-3 space-y-1.5">
        {shorts.map((label, i) => {
          const v24 = a[i] ?? 0;
          const v26 = b[i] ?? 0;
          const delta = v26 - v24;
          return (
            <li key={label} className="grid grid-cols-[9.5rem_1fr_2.5rem] items-center gap-2">
              <span className="text-[12.5px] leading-snug text-text">
                <span className="tabular-nums text-text-secondary">
                  {i + 1}.
                </span>{" "}
                {label}
              </span>
              <span className="space-y-[3px]">
                {[
                  { v: v24, color: "var(--color-y2024)" },
                  { v: v26, color: "var(--color-y2026)" },
                ].map((row, ri) => (
                  <span key={ri} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2 rounded-sm"
                      style={{
                        width: `${(row.v / max) * 100}%`,
                        minWidth: row.v > 0 ? 3 : 0,
                        background: row.color,
                      }}
                    />
                    <span className="text-[11.5px] tabular-nums text-text-secondary">
                      {row.v}
                    </span>
                  </span>
                ))}
              </span>
              <span
                className={`justify-self-end rounded-sm px-1 py-0.5 text-[11.5px] font-bold tabular-nums ${
                  // A delta is direction of change, so it belongs to the
                  // valence family - not to the state ramp, and not to the
                  // hand-typed green that was standing in for it.
                  delta > 0
                    ? "bg-[#E8F1EC] text-good"
                    : delta < 0
                      ? "bg-[#F7E9E5] text-rust"
                      : "text-text-secondary"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta === 0 ? "·" : delta}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="sr-only">
        {meta.label}: {shorts.map((s, i) => `${s} ${a[i]}→${b[i]}`).join("; ")}
      </p>

      {showCaveat ? (
        <p className="mt-3 note-caution text-xs leading-relaxed text-text-secondary">
          {cautionCounts(locale)}
        </p>
      ) : null}
    </figure>
  );
}
