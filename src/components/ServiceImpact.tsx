import serviceImpact from "@/data/service-impact.json";

/**
 * 2026 service-restoration status: dated, per-sector figures showing that
 * services ran on the emergency chains, not yet on LEAP works.
 */
export default function ServiceImpact() {
  return (
    <figure className="rounded-md border border-[color:var(--color-border)] bg-white p-4 transition-shadow duration-200 hover:shadow-[0_2px_14px_rgba(23,59,99,0.07)] sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          Services under the 2026 war: the restoration that had to run on
          emergency chains
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Each figure carries its own date and reporter; none is a projection.
        </p>
      </figcaption>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {serviceImpact.items.map((item) => (
          <div
            key={item.sector}
            className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-4"
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              {item.sector}
            </p>
            <p className="mt-1 text-lg font-bold leading-snug tracking-tight text-[color:var(--color-navy)]">
              {item.figure}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
              {item.detail}
            </p>
            <p className="mt-2 border-t border-dashed border-[color:var(--color-border)] pt-1.5 text-[11px] font-medium text-[color:var(--color-text-secondary)]">
              {item.reporter}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}
