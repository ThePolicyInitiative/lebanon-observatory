import {
  layers,
  stageShortList,
  statusLabel,
  statusList,
  type Locale,
} from "@/lib/vocab";

/**
 * The shape of whatever the explorer's filters currently match.
 *
 * The explorer was a filter sidebar and a list: you could narrow to 40
 * rows out of 771 and still have no idea what those 40 were - which
 * years, which layers, which end of the chain. Every count here is of the
 * matched rows, so the profile redraws as the filters move and the
 * filtering itself becomes legible.
 */

export type ProfileRow = {
  year: number;
  actorLayer: string;
  stageNo: number;
  implementationStatus: string;
};

const T = {
  en: {
    title: "What the current filters match",
    sub: "Counted over the matched rows, not the whole tracking. Presence, never performance.",
    empty: "Nothing matches. Widen a filter to see the shape of the result.",
    byYear: "By year",
    byLayer: "By actor layer",
    byStage: "By chain stage",
    byStatus: "By status",
    rows: (n: number) => `${n} matched`,
  },
  ar: {
    title: "ما يطابقه الترشيح الحالي",
    sub: "معدود على الصفوف المطابِقة، لا على التتبّع كله. حضور، لا أداء.",
    empty: "لا شيء مطابق. وسّع أحد المرشّحات لترى شكل النتيجة.",
    byYear: "بحسب السنة",
    byLayer: "بحسب طبقة الجهات",
    byStage: "بحسب مرحلة السلسلة",
    byStatus: "بحسب الحالة",
    rows: (n: number) => `${n} مطابقاً`,
  },
} as const;

function Bars({
  items,
  total,
}: {
  items: { key: string; label: string; value: number; color: string }[];
  total: number;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((i) => (
        <li key={i.key}>
          <p className="flex items-baseline justify-between gap-2 text-[11.5px]">
            <span className="min-w-0 truncate text-[color:var(--color-text)]" title={i.label}>
              {i.label}
            </span>
            <span className="shrink-0 tabular-nums text-[color:var(--color-text-secondary)]">
              {i.value}
              {total > 0 ? (
                <span className="ms-1 text-[10px]">
                  {Math.round((i.value / total) * 100)}%
                </span>
              ) : null}
            </span>
          </p>
          <span
            aria-hidden
            className="mt-0.5 block h-2 rounded-sm"
            style={{
              width: `${(i.value / max) * 100}%`,
              minWidth: i.value > 0 ? 3 : 0,
              background: i.color,
            }}
          />
        </li>
      ))}
    </ul>
  );
}

export default function ResultProfile({
  rows,
  locale = "en",
}: {
  rows: ProfileRow[];
  locale?: Locale;
}) {
  const t = T[locale];
  const total = rows.length;
  const count = <K extends string | number>(pick: (r: ProfileRow) => K) => {
    const m = new Map<K, number>();
    for (const r of rows) m.set(pick(r), (m.get(pick(r)) ?? 0) + 1);
    return m;
  };

  const byYear = count((r) => r.year);
  const byLayer = count((r) => r.actorLayer);
  const byStage = count((r) => r.stageNo);
  const byStatus = count((r) => r.implementationStatus);

  const shorts = stageShortList(locale);
  const stageMax = Math.max(1, ...[...byStage.values()]);

  const statusItems = statusList(locale)
    .map(([key]) => ({
      key,
      label: statusLabel(key, locale),
      value: byStatus.get(key) ?? 0,
      color: "var(--color-navy)",
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <figure className="card p-3.5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-[color:var(--color-navy)]">
          {t.title}
        </h2>
        <span className="text-[11px] tabular-nums text-[color:var(--color-text-secondary)]">
          {t.rows(total)}
        </span>
      </figcaption>
      <p className="mt-1 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
        {t.sub}
      </p>

      {total === 0 ? (
        <p className="mt-3 text-[12.5px] text-[color:var(--color-text-secondary)]">{t.empty}</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              {t.byYear}
            </h3>
            <Bars
              total={total}
              items={[2024, 2026].map((y) => ({
                key: String(y),
                label: String(y),
                value: byYear.get(y) ?? 0,
                color: y === 2024 ? "var(--color-y2024)" : "var(--color-y2026)",
              }))}
            />
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              {t.byLayer}
            </h3>
            <Bars
              total={total}
              items={layers(locale).map((l) => ({
                key: l.id,
                label: l.short,
                value: byLayer.get(l.id) ?? 0,
                color: l.color,
              }))}
            />
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              {t.byStage}
            </h3>
            <ul className="mt-2 space-y-1">
              {shorts.map((label, i) => {
                const v = byStage.get(i + 1) ?? 0;
                return (
                  <li key={label} className="flex items-center gap-1.5 text-[10.5px]">
                    <span
                      className="w-16 shrink-0 truncate text-[color:var(--color-text-secondary)]"
                      title={label}
                    >
                      {label}
                    </span>
                    <span
                      aria-hidden
                      className="h-2 rounded-sm bg-[color:var(--color-navy)]"
                      style={{ width: `${(v / stageMax) * 60}%`, minWidth: v > 0 ? 3 : 0 }}
                    />
                    <span className="tabular-nums text-[color:var(--color-text-secondary)]">
                      {v || ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              {t.byStatus}
            </h3>
            <Bars total={total} items={statusItems} />
          </div>
        </div>
      )}
    </figure>
  );
}
