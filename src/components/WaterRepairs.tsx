import slwe from "@/data/slwe-posts.json";

/**
 * One utility's own account of its repair work, from its public posts.
 * It sits in the web-sourced quarantine with everything else unverified,
 * and it is here for one reason: almost nothing else reports reconstruction
 * at the level of a single distribution line in a single village.
 */
export default function WaterRepairs() {
  const maxDept = Math.max(...slwe.departments.map((d) => d.posts));
  const maxWork = Math.max(...slwe.work.map((w) => w.posts));
  const restoredShare = Math.round((slwe.restoredCount / slwe.totalPosts) * 100);

  return (
    <section
      aria-labelledby="water-repairs"
      className="rounded-md border border-dashed border-[color:var(--color-border)] bg-[#FBFCFD] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="water-repairs" className="text-xl font-semibold text-[color:var(--color-navy)]">
          One utility, line by line
        </h2>
        <span className="rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a6200]">
          Self-published · not in the verified log
        </span>
      </div>
      <p className="mt-2 prose-measure text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        The {slwe.actor} publishes each repair it makes. {slwe.totalPosts} of those posts,
        translated and grouped here, are the finest-grained account of restoration work anywhere
        in this site - a burst pipe in one village, a pumping line, a 63 mm distribution main.
        None of it is verified, and none of it enters the counts. It is worth reading anyway,
        because the formal tracking has no instrument this small.
      </p>

      {/* Headline figures */}
      <dl className="mt-4 grid gap-3 sm:grid-cols-4">
        {[
          { k: slwe.totalPosts.toLocaleString("en-US"), v: "repair posts, translated" },
          { k: String(slwe.southPosts), v: "from the three departments south of the Litani" },
          { k: `${restoredShare}%`, v: "end with supply restored to subscribers" },
          { k: `${slwe.townsNamed}`, v: `localities named, ${slwe.southTownsNamed} of them in the area` },
        ].map((s) => (
          <div key={s.v} className="panel-sunken p-3">
            <p className="figure-number text-2xl text-[color:var(--color-navy)]">{s.k}</p>
            <p className="mt-1 text-[11px] leading-snug text-[color:var(--color-text-secondary)]">
              {s.v}
            </p>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {/* Where the work is reported */}
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
            By water department
          </h3>
          <ul className="mt-2 space-y-1.5">
            {slwe.departments.map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-[12px]">
                <span className="w-36 shrink-0 truncate">
                  {d.name}
                  {d.inArea ? (
                    <span className="ml-1 text-[10px] font-semibold text-[#1F6B4E]">·south</span>
                  ) : null}
                </span>
                <span
                  aria-hidden
                  className="h-2 rounded-sm"
                  style={{
                    width: `${Math.max(4, (d.posts / maxDept) * 60)}%`,
                    background: d.inArea ? "#2F8F6B" : "#58779B",
                    opacity: 0.8,
                  }}
                />
                <span className="tabular-nums font-semibold">{d.posts}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What kind of work */}
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
            What the posts describe
          </h3>
          <ul className="mt-2 space-y-1.5">
            {slwe.work.map((w) => (
              <li key={w.label} className="flex items-center gap-2 text-[12px]">
                <span className="w-40 shrink-0 truncate">{w.label}</span>
                <span
                  aria-hidden
                  className="h-2 rounded-sm bg-[#1B8295]"
                  style={{ width: `${Math.max(4, (w.posts / maxWork) * 55)}%`, opacity: 0.75 }}
                />
                <span className="tabular-nums font-semibold">{w.posts}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
            A post can describe more than one kind of work, so these do not sum to{" "}
            {slwe.totalPosts}.
          </p>
        </div>
      </div>

      {/* Localities inside the area */}
      <div className="mt-5">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
          Most-named localities south of the Litani
        </h3>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {slwe.topSouthTowns.map((t) => (
            <li
              key={t.name}
              className="chip"
              title={`${t.district} district`}
            >
              {t.name}
              <span className="ml-1 tabular-nums text-[color:var(--color-text-secondary)]">
                {t.posts}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* The posts themselves */}
      <div className="mt-5">
        <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
          In its own words
        </h3>
        <ul className="mt-2 grid gap-2 md:grid-cols-2">
          {slwe.samples.map((s) => (
            <li key={s.text} className="panel-sunken p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                {s.department}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[color:var(--color-text)]">
                {s.text}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* What this is not */}
      <details className="mt-5 rounded-md border border-dashed border-[color:var(--color-border)] bg-white p-3">
        <summary className="cursor-pointer text-[12px] font-bold text-[color:var(--color-navy)]">
          What this source is, and what it cannot tell you ({slwe.caveats.length})
        </summary>
        <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {slwe.caveats.map((c) => (
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
