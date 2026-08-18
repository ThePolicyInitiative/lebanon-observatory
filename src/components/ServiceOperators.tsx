import ops from "@/data/service-operators.json";

/**
 * The public service operators on their own networks. Same quarantine as
 * everything else web-sourced: none of it enters the counts. It earns its
 * place by being specific - a named substation, one 66 kV line, a single
 * replacement tower - where the assessments only reach the sector.
 */

/**
 * Long passages open from a "See more". The first sentence always stays on
 * the card: what collapses is the elaboration, never the point itself.
 * Sentence split ignores decimals - "US$1.38 billion" must not break.
 */
function Expandable({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z(])/);
  if (parts.length < 2 || text.length < 190) {
    return <p className={className}>{text}</p>;
  }
  const [head, ...rest] = parts;
  // The group name is written out, never interpolated: Tailwind scans the
  // source statically and would emit no rule for a computed class.
  return (
    <details className="group/exp">
      <summary
        className={`cursor-pointer list-none [&::-webkit-details-marker]:hidden ${className}`}
      >
        {head}{" "}
        <span className="whitespace-nowrap font-semibold text-[color:var(--color-blue)] underline-offset-2 hover:underline">
          <span className="group-open/exp:hidden">See more ▸</span>
          <span className="hidden group-open/exp:inline">See less ▾</span>
        </span>
      </summary>
      <p className={`mt-1 ${className}`}>{rest.join(" ")}</p>
    </details>
  );
}

const SERVICE_TONE: Record<string, string> = {
  Electricity: "#D69600",
  Telecommunications: "#1B8295",
  "Irrigation and hydropower": "#2F8F6B",
  "Roads and bridges": "#A34F7C",
};

export default function ServiceOperators() {
  return (
    <section
      aria-labelledby="service-operators"
      className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[#FBFCFD] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="service-operators"
          className="text-xl font-semibold text-[color:var(--color-navy)]"
        >
          The networks, operator by operator
        </h2>
        <span className="rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a6200]">
          Operator-reported · not in the tracking
        </span>
      </div>
      <p className="mt-2 prose-measure text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        Electricity, telecoms, irrigation and roads, as the operators themselves describe
        restoring them. This is the same granularity as the water utility&apos;s own posts and
        the same standing: unconfirmed, and in none of this site&apos;s counts. It is here because
        these accounts name the substation, the line, the bridge and the date, where every
        assessment stops at the sector.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ops.operators.map((o) => (
          <article key={o.id} className="card p-4">
            <p className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span
                className="rounded-sm px-1.5 py-0.5 font-semibold text-white"
                style={{ background: SERVICE_TONE[o.service] ?? "#58779B" }}
              >
                {o.service}
              </span>
              {o.inArea ? (
                <span className="rounded-sm bg-[#E8F1EC] px-1.5 py-0.5 font-semibold text-[#1F6B4E]">
                  Reaches the area
                </span>
              ) : null}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-[color:var(--color-navy)]">
              {o.name}
            </h3>
            <p className="mt-0.5 text-[13px] font-medium italic text-[color:var(--color-text-secondary)]">
              {o.headline}
            </p>

            <ul className="mt-3 space-y-3">
              {o.items.map((i) => (
                <li key={i.what.slice(0, 40)} className="panel-sunken p-2.5">
                  <Expandable
                    text={i.what}
                    className="text-[12.5px] leading-relaxed text-[color:var(--color-text)]"
                  />
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[color:var(--color-text-secondary)]">
                    {i.figure ? (
                      <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 font-semibold tabular-nums text-[color:var(--color-navy)]">
                        {i.figure}
                      </span>
                    ) : null}
                    <span>
                      <span className="font-semibold">Where:</span> {i.where}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-[color:var(--color-text-secondary)]">
                    <span className="font-semibold">When:</span> {i.date}
                  </p>
                </li>
              ))}
            </ul>

            <div className="note-caution mt-3">
              <Expandable
                text={o.constraint}
                className="text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]"
              />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-dashed border-[color:var(--color-border)] pt-1.5 text-[11px]">
              <a
                href={o.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
              >
                {o.sourceName} ↗
              </a>
              {!o.openedDirectly ? (
                <span className="rounded-sm bg-[#FAF3E3] px-1.5 py-0.5 font-semibold text-[#8a6200]">
                  page not opened directly
                </span>
              ) : null}
            </p>
          </article>
        ))}
      </div>

      {/* The finding two ministries state independently */}
      <div className="mt-4 rounded-md border-2 border-[color:var(--color-rust)] bg-[#FBF3F0] p-4">
        <h3 className="text-sm font-bold text-[color:var(--color-rust)]">
          {ops.crossCutting.title}
        </h3>
        <p className="mt-1.5 prose-measure text-[13px] leading-relaxed text-[color:var(--color-text)]">
          {ops.crossCutting.text}
        </p>
        <p className="mt-2 text-[11px]">
          <a
            href={ops.crossCutting.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            {ops.crossCutting.sourceName} ↗
          </a>
          {!ops.crossCutting.openedDirectly ? (
            <span className="ml-2 rounded-sm bg-[#FAF3E3] px-1.5 py-0.5 font-semibold text-[#8a6200]">
              page not opened directly
            </span>
          ) : null}
        </p>
      </div>

      {/* The date every timeline on this page runs into */}
      <div className="mt-4 rounded-md border-2 border-[color:var(--color-navy)] bg-[#EEF2F7] p-4">
        <h3 className="text-sm font-bold text-[color:var(--color-navy)]">
          {ops.horizon.title}
        </h3>
        <p className="mt-1.5 prose-measure text-[13px] leading-relaxed text-[color:var(--color-text)]">
          {ops.horizon.text}
        </p>
        <p className="mt-2 text-[11px]">
          <a
            href={ops.horizon.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            {ops.horizon.sourceName} ↗
          </a>
          {!ops.horizon.openedDirectly ? (
            <span className="ml-2 rounded-sm bg-[#FAF3E3] px-1.5 py-0.5 font-semibold text-[#8a6200]">
              page not opened directly
            </span>
          ) : null}
        </p>
      </div>

      <details className="mt-4 rounded-md border border-dashed border-[color:var(--color-border)] bg-white p-3">
        <summary className="cursor-pointer text-[12px] font-bold text-[color:var(--color-navy)]">
          How to read these accounts ({ops.caveats.length})
        </summary>
        <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {ops.caveats.map((c) => (
            <li key={c.slice(0, 30)} className="flex gap-2">
              <span
                aria-hidden
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-rust)]"
              />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
