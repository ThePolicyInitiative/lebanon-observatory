/** Closing block used at the end of every analytical page. */
export default function Takeaways({
  changed,
  unchanged,
  matters,
}: {
  changed: string;
  unchanged: string;
  matters: string;
}) {
  return (
    <section
      aria-label="Key takeaways"
      className="grid gap-4 card p-5 md:grid-cols-3"
    >
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--color-teal)]">
          What changed
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-text)]">
          {changed}
        </p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--color-rust)]">
          What did not change
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-text)]">
          {unchanged}
        </p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--color-navy)]">
          Why it matters
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-text)]">
          {matters}
        </p>
      </div>
    </section>
  );
}
