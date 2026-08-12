
/**
 * The three institutionally separate streams running from 2 March 2026.
 * Confusing them is the most common analytical error in commentary on
 * this period, so the site states the separation explicitly.
 */
const STREAMS = [
  {
    n: 1,
    title: "Recovery from the 2023–24 war",
    color: "var(--color-teal)",
    bg: "#E8F1F3",
    items: [
      "The LEAP programme (effective 26 Feb 2026)",
      "The compensation framework of January 2026",
      "Law 22/2025",
    ],
    verdict:
      "Legally scoped to the previous conflict, financed (partially) - the only stream with a project chain.",
    status: "Financed, procedural, unconverted",
  },
  {
    n: 2,
    title: "Emergency response to the 2026 war",
    color: "var(--color-blue)",
    bg: "#EEF2F7",
    items: [
      "The reactivated DRM / NEOR system",
      "MoSA's formalised humanitarian-coordination mandate",
      "The appeal-funded relief operation",
    ],
    verdict: "Fast, functional - and not a reconstruction system.",
    status: "Operational",
  },
  {
    n: 3,
    title: "Future reconstruction from the 2026 war",
    color: "var(--color-rust)",
    bg: "#F7E9E5",
    items: [
      "An analytical base under construction (two bounded assessments, a real-time database)",
      "No LEAP amendment",
      "No new compensation decision",
      "No dedicated financing identified",
    ],
    verdict:
      "As of the cut-off: no financed instrument of any kind. Households hit in March 2026 faced, structurally, exactly the 2024 vacuum - beside a functioning state programme legally unable to serve them.",
    status: "Empty",
  },
];

export default function ThreeStreams() {
  return (
    <figure className="card p-4 sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          Three streams that must not be merged
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          From 2 March 2026 Lebanon ran three institutionally separate
          streams. Most public confusion about &ldquo;Lebanon&apos;s
          reconstruction&rdquo; in mid-2026 stems from reading stream two&apos;s
          visible activity (meals, shelters, road clearing) or stream
          one&apos;s procedural milestones (tenders, disbursement) as if they
          belonged to stream three - which remained empty.
        </p>
      </figcaption>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {STREAMS.map((s) => (
          <section
            key={s.n}
            aria-label={`Stream ${s.n}: ${s.title}`}
            className="flex flex-col rounded-md border border-[color:var(--color-border)]"
          >
            <header
              className="flex items-center justify-between gap-2 rounded-t-md px-3.5 py-2.5"
              style={{ background: s.bg }}
            >
              <h4 className="text-sm font-semibold" style={{ color: s.color }}>
                Stream {s.n} - {s.title}
              </h4>
            </header>
            <ul className="flex-1 space-y-1.5 px-3.5 pt-3 text-[13px]">
              {s.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="px-3.5 pt-2.5 text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
              {s.verdict}
            </p>
            <p className="px-3.5 py-3">
              <span
                className="rounded-sm border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide"
                style={{ color: s.color, borderColor: s.color }}
              >
                {s.status}
              </span>
            </p>
          </section>
        ))}
      </div>
      <p className="mt-3 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        The firewall between the emergency chain and the project chain is not
        an oversight; it is the design - it protects the programme&apos;s
        legal scope and fiduciary perimeter, and its cost is deferred rather
        than avoided. Nothing in the design connects the emergency
        system&apos;s real-time knowledge of 2026 damage to any financed
        response to that damage, because none exists.
      </p>
    </figure>
  );
}
