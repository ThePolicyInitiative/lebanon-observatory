import type { Locale } from "@/lib/vocab";

/** Closing block used at the end of every analytical page. */
const T = {
  en: { changed: "What changed", unchanged: "What did not change", matters: "Why it matters" },
  ar: { changed: "ما الذي تغيّر", unchanged: "ما الذي لم يتغيّر", matters: "لماذا يهمّ" },
} as const;

export default function Takeaways({
  changed,
  unchanged,
  matters,
  locale = "en",
}: {
  changed: string;
  unchanged: string;
  matters: string;
  locale?: Locale;
}) {
  const t = T[locale];
  return (
    <section
      aria-label="Key takeaways"
      className="grid gap-4 card p-3.5 md:grid-cols-3"
    >
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--color-teal)]">
          {t.changed}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-text)]">
          {changed}
        </p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--color-rust)]">
          {t.unchanged}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-text)]">
          {unchanged}
        </p>
      </div>
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--color-navy)]">
          {t.matters}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-text)]">
          {matters}
        </p>
      </div>
    </section>
  );
}
