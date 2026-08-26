import type { Locale } from "@/lib/vocab";
import { CHROME } from "@/lib/i18n";

/**
 * Closing block used at the end of every analytical page.
 *
 * The three labels are h3, not h2. They were h2 and set at 14px, which made
 * them smaller than most of the h3s above them on the same page - the
 * heading outline said one thing and the type said another. Their size was
 * right: these are labels on three cards, not section headings, and a
 * closing summary should not compete with the sections it summarises. So
 * the level moved to match the size rather than the reverse.
 *
 * The section carries aria-label rather than a visible heading, which makes
 * it a named region: a screen reader announces the block and then the three
 * labels inside it.
 */
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
      aria-label={CHROME[locale].takeaways}
      className="grid gap-4 card md:grid-cols-3"
    >
      <div>
        <h3 className="text-sm font-semibold text-teal">
          {t.changed}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-text">
          {changed}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-rust">
          {t.unchanged}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-text">
          {unchanged}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-navy">
          {t.matters}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-text">
          {matters}
        </p>
      </div>
    </section>
  );
}
