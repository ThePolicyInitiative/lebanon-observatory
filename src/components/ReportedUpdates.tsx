import webUpdates from "@/data/web-updates.json";
import { LAYER_META } from "@/lib/colors";
import { fmtDate } from "@/lib/format";

/**
 * Actors and actions reported by external web sources after (or beyond)
 * the verified entry. Deliberately quarantined: nothing here enters the
 * counts, matrices or maps - each entry states only what its linked
 * source reports, with the source named beside it.
 */
/** How much verification the reader should expect behind each entry. */
const SOURCE_KIND: Record<string, { label: string; cls: string }> = {
  institutional: {
    label: "Institutional source",
    cls: "bg-[#E8F1F3] text-[color:var(--color-teal)]",
  },
  press: { label: "Press report", cls: "bg-[#EEF2F7] text-[color:var(--color-navy)]" },
  social: { label: "Social post - self-published", cls: "bg-[#FAF3E3] text-[#8a6200]" },
};

export default function ReportedUpdates() {
  const updates = webUpdates.updates;
  return (
    <section
      aria-labelledby="reported-updates"
      className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[#FBFCFD] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="reported-updates"
          className="text-xl font-semibold text-[color:var(--color-navy)]"
        >
          Reported beyond the tracking
        </h2>
        <span className="rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a6200]">
          Web-sourced · not in the verified log
        </span>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        Additional actors and actions found in open web coverage (gathered{" "}
        {fmtDate(webUpdates.gatheredOn)}), all of it after the 31 July 2026
        cut-off. These are reported claims, quoted with their sources - they
        are not verified against the tracking and enter none of this
        site&apos;s counts or maps. Each entry says how much verification sits
        behind it: an institutional source, a press report, or a self-published
        social post. Follow each link to judge the source yourself.
      </p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {updates.map((u) => {
          const meta = LAYER_META.find((l) => l.id === u.layer);
          return (
            <li
              key={u.sourceUrl + u.actor}
              className="card p-3.5"
            >
              <p className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {meta ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 font-semibold text-white"
                    style={{ background: meta.color }}
                  >
                    {meta.label}
                  </span>
                ) : null}
                {u.sourceKind ? (
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-semibold ${
                      SOURCE_KIND[u.sourceKind]?.cls ?? "bg-[#F2F2EF] text-[color:var(--color-text-secondary)]"
                    }`}
                  >
                    {SOURCE_KIND[u.sourceKind]?.label ?? u.sourceKind}
                  </span>
                ) : null}
                {u.dateReported ? (
                  <span className="font-semibold tabular-nums text-[color:var(--color-text-secondary)]">
                    {fmtDate(u.dateReported)}
                  </span>
                ) : (
                  <span className="text-[color:var(--color-text-secondary)]">date not stated</span>
                )}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-[color:var(--color-navy)]">
                {u.actor}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--color-text)]">
                {u.action}
              </p>
              {u.place ? (
                <p className="mt-1.5 text-[11px] text-[color:var(--color-text-secondary)]">
                  <span className="font-semibold">Where:</span> {u.place}
                </p>
              ) : null}
              <p className="mt-2 border-t border-dashed border-[color:var(--color-border)] pt-1.5 text-[11px]">
                <a
                  href={u.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
                >
                  {u.sourceName} ↗
                </a>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
