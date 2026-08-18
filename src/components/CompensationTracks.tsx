import compensation from "@/data/compensation.json";

/**
 * Compensation: two tracks, one confirmation standard, zero confirmed
 * payments. The module keeps announced, reported and confirmed strictly
 * apart - the discipline the subject demands most.
 */
export default function CompensationTracks() {
  const tracks = [compensation.stateTrack, compensation.parallelTrack];
  return (
    <figure className="card p-4 sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          Compensation: two tracks, no confirmed payment
        </h3>
        <p className="mt-1 max-w-3xl text-sm text-[color:var(--color-text-secondary)]">
          {compensation.note}
        </p>
      </figcaption>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {tracks.map((t) => (
          <section
            key={t.label}
            aria-label={t.label}
            className="flex flex-col rounded-md border border-[color:var(--color-border)]"
          >
            <header className="border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-2.5">
              <h4 className="text-sm font-semibold text-[color:var(--color-navy)]">
                {t.label}
              </h4>
            </header>
            <div className="flex-1 space-y-3 p-4 text-[13px] leading-relaxed">
              <p>
                <span className="font-bold uppercase tracking-wide text-[11px] text-[color:var(--color-y2024)]">
                  2024 ·{" "}
                </span>
                {t.status2024}
              </p>
              <ul className="space-y-2.5">
                {t.instruments.map((i) => (
                  <li key={i.id} className="rounded border border-[color:var(--color-border)] p-3">
                    <p className="font-semibold text-[color:var(--color-navy)]">{i.label}</p>
                    <p className="mt-1">{i.detail}</p>
                    <p className="mt-1.5">
                      <span className="rounded-sm bg-[#FAF3E3] px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#8a6200]">
                        {i.evidenceLevel}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
              <p>
                <span className="font-bold uppercase tracking-wide text-[11px] text-[color:var(--color-y2026)]">
                  2026 ·{" "}
                </span>
                {t.status2026}
              </p>
            </div>
            <p className="border-t border-dashed border-[color:var(--color-border)] px-4 py-2.5 text-[13px]">
              <span className="font-semibold text-[color:var(--color-rust)]">
                Confirmed payments:{" "}
              </span>
              {t.confirmedPayments}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-4 rounded-md border-l-4 border-[color:var(--color-navy)] bg-[color:var(--color-bg)] p-4 text-sm leading-relaxed">
        {compensation.distributionalFinding}
      </p>
    </figure>
  );
}
