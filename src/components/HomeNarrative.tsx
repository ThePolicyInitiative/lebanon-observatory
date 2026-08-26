import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/vocab";

/**
 * The home page's own primitives, shared by both languages.
 *
 * The two home pages are legitimately a different template from the nine
 * routes - they are a narrative sequence, not a page of modules - so they
 * stay out of PageShell. But they had each declared their own copies of
 * these four, and the copies had drifted in exactly the way two copies do:
 *
 *   - the hero figure was `.figure-number` at 27px on the English side and
 *     `font-semibold tabular-nums` at 24px on the Arabic one, so the same
 *     number, from the same data, printed at two sizes in two weights, and
 *     only one of them got the lining numerals the site declares for figures
 *   - its label was `mt-1.5 leading-snug` against `mt-1 leading-relaxed`
 *   - the narrative body was `leading-relaxed` against `leading-loose`
 *
 * The last of those was right and the others were not, which is the whole
 * difficulty with duplicated components: a deliberate adjustment and an
 * accident look identical in the diff. Arabic does need more leading than
 * Latin at the same size. So it is kept - once, here, with the reason
 * written down - and the rest are unified.
 */

/** The numbered eyebrow and heading that opens each narrative movement. */
export function SectionHeading({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="prose-measure">
      <p className="flex items-center gap-2.5 font-sans text-xs font-bold uppercase tracking-widest text-teal">
        {String(index).padStart(2, "0")}
        <span aria-hidden className="h-px w-8 bg-amber" />
      </p>
      <h2 className="mt-2 text-[26px] font-semibold sm:text-[30px]">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Narrative body text. Arabic takes the looser leading: its letterforms
 * carry meaning above and below the baseline, and lines set for Latin close
 * up on them.
 */
export function Body({ children, locale = "en" }: { children: ReactNode; locale?: Locale }) {
  return (
    <p
      className={`mt-3 text-sm text-text ${
        locale === "ar" ? "leading-loose" : "leading-relaxed"
      }`}
    >
      {children}
    </p>
  );
}

/**
 * The four figures under the hero. `.figure-number` is the site's declared
 * treatment for a figure, and it applies in both languages: the RTL block in
 * globals.css already neutralises the tracking it carries, which is the only
 * part of it Arabic could not take.
 */
export function GlanceFigures({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/20 pt-6 sm:grid-cols-4">
      {items.map(([value, label]) => (
        <div key={label}>
          <dt className="sr-only">{label}</dt>
          <dd>
            <span className="figure-number block text-[27px] text-white">{value}</span>
            <span className="mt-1.5 block text-[11px] leading-snug text-white/65">{label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A link onward to the page that carries the detail. */
export function Onward({
  href,
  children,
  locale = "en",
}: {
  href: string;
  children: ReactNode;
  locale?: Locale;
}) {
  return (
    <p className="mt-3 text-sm">
      <Link
        href={href}
        className="font-medium text-blue underline-offset-2 hover:underline"
      >
        {/* The arrow points the way the reader is going, which is not the
            same direction in the two languages. */}
        {children} {locale === "ar" ? "←" : "→"}
      </Link>
    </p>
  );
}
