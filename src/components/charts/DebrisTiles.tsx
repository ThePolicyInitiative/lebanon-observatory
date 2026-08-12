import destruction from "@/data/destruction.json";

/**
 * Debris volumes as three deliberate stat tiles - NOT a shared-axis chart,
 * because the three estimates use different methods, scopes and timings
 * and must never be compared or summed.
 */
export default function DebrisTiles() {
  const south = destruction.zones2026.find((z) => z.id === "south-litani")!;
  const bml = destruction.zones2026.find((z) => z.id === "beirut-ml")!;

  const tiles = [
    {
      figure: "≈12M m³",
      title: "2024 war, six governorates",
      detail: destruction.debris2024.detail,
      method: "Remote-sensing volume estimates with stated density assumptions",
    },
    {
      figure: "3.1M m³",
      title: "2026, South of the Litani only",
      detail: south.buildings,
      method: south.method,
    },
    {
      figure: "648,942 m³",
      title: "2026, Beirut & Mount Lebanon only",
      detail: bml.debris,
      method: bml.method,
    },
  ];

  return (
    <figure className="card card-interactive p-4 sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          Three debris estimates, three separate rulers
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Deliberately not one chart: the estimates differ in scope, method and
          timing, so they are shown side by side and never summed or compared.
        </p>
      </figcaption>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.title}
            className="panel-sunken p-4"
          >
            <p className="text-2xl font-bold tabular-nums tracking-tight text-[color:var(--color-navy)]">
              {t.figure}
            </p>
            <p className="mt-0.5 text-[13px] font-semibold text-[color:var(--color-text)]">
              {t.title}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
              {t.detail}
            </p>
            <p className="mt-2 border-t border-dashed border-[color:var(--color-border)] pt-1.5 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {t.method}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        The 2026 zone figures are snapshots of assessed zones only and are not
        cumulative with the 2024 estimate. Quantities of this order sit beyond
        any municipal capability - the dataset compares them to years of
        national construction activity.
      </p>
    </figure>
  );
}
