
/**
 * The shelter-and-return cycle ran twice with the same machine and faster
 * clocks. Movement statistics are not proof of durable return.
 */
const ROWS: { metric: string; y2024: string; y2026: string }[] = [
  {
    metric: "Peak traced displacement",
    y2024: ">834,000 traced IDPs (≈1.2M including movement into Syria)",
    y2026: ">1 million displaced; registration exceeded 667,000 within eight days",
  },
  {
    metric: "Shelter mobilisation",
    y2024: ">1,100 collective shelters - overwhelmingly public schools - at 84% capacity",
    y2026: "344 schools converted within nine days (92% full); 660 sites at peak",
  },
  {
    metric: "Peak shelter population",
    y2024: "≈190,000 people",
    y2026: ">136,000 people",
  },
  {
    metric: "Relief scale",
    y2024: "4.2M hot and cold meals; 73,000 ready-to-eat kits; emergency cash to 226,000 people within 24 hours of displacement",
    y2026: ">14.5M meals by late June; WASH for >1M people; cash-for-shelter standing up with initial capacity ≈8,200 households",
  },
  {
    metric: "Emptying after cessation",
    y2024: "≈76% of shelter residents left within two days of 27 November; 296 of 1,009 monitored sites closed by 29 November",
    y2026: "From >136,000 to 29,700 people in 278 sites across six weeks of June–July",
  },
  {
    metric: "Residual displacement",
    y2024: ">100,000 people still displaced into January 2025, many returned to damaged buildings",
    y2026: "741,111 reported returned by 15 July; 412,700 still displaced",
  },
];

const DURABLE_RETURN = [
  { dim: "Housing", state: "Unrepaired - no financed instrument for either war's private damage" },
  { dim: "Services", state: "Partially restored - three hospitals and 35 health centres closed at 6 July; water and electricity led reported gaps in return areas" },
  { dim: "Safety", state: "Unresolved south of the Litani - continuing ordnance, strikes and occupied border villages" },
  { dim: "Tenure", state: "Unaddressed - co-ownership, inheritance, tenancy and entries gaps untouched" },
  { dim: "Livelihoods", state: "Unprogrammed - the largest loss lines had no institutional owner in either year" },
];

export default function DisplacementCycle() {
  return (
    <figure className="card p-4 sm:p-5">
      <figcaption>
        <h3 className="text-base font-semibold text-[color:var(--color-navy)]">
          The shelter-and-return cycle, run twice
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Shelter is the state-plus-humanitarian system&apos;s proven
          competence - and durable return is nobody&apos;s mandate.
          &ldquo;Returned&rdquo; counts registrations of movement; it cannot
          see secondary displacement or doubling-up, and the series splices
          different reporting systems at different dates.
        </p>
      </figcaption>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-[13px]">
          <caption className="sr-only">
            Displacement and shelter metrics for the 2024 and 2026 cycles.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2.5 py-2 text-left font-semibold text-[color:var(--color-navy)]">Metric</th>
              <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2.5 py-2 text-left font-semibold" style={{ color: "var(--color-y2024)" }}>2024 cycle</th>
              <th scope="col" className="border-b-2 border-[color:var(--color-border)] px-2.5 py-2 text-left font-semibold" style={{ color: "var(--color-y2026)" }}>2026 cycle</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.metric} className="odd:bg-[color:var(--color-bg)] align-top">
                <th scope="row" className="border-b border-[color:var(--color-border)] px-2.5 py-2 text-left font-medium">{r.metric}</th>
                <td className="border-b border-[color:var(--color-border)] px-2.5 py-2">{r.y2024}</td>
                <td className="border-b border-[color:var(--color-border)] px-2.5 py-2">{r.y2026}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 panel-sunken p-4">
        <h4 className="text-sm font-semibold text-[color:var(--color-navy)]">
          Why movement is not durable return (situation at the cut-off)
        </h4>
        <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
          The durable-return test - housing, services, safety, tenure,
          livelihoods - was failed on at least three of five dimensions for
          large populations, and aid financing threatened food, rent and
          protection support from September.
        </p>
        <ul className="mt-3 space-y-1.5 text-[13px]">
          {DURABLE_RETURN.map((d) => (
            <li key={d.dim} className="flex gap-2">
              <span className="w-24 shrink-0 font-semibold text-[color:var(--color-rust)]">{d.dim}</span>
              <span>{d.state}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 note-caution text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
        Both post-war moments produced the same risk at the same point:
        populations living in damaged structures through a winter while
        institutions process - except 2026 added occupied and demolished
        border villages whose residents cannot even return to rubble.
        July&apos;s reassuring return curves will be cited to close the
        emergency exactly when the unfinanced phase begins.
      </p>
    </figure>
  );
}
