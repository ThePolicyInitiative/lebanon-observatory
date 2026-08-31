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
      <p className="flex items-center gap-2.5 font-sans text-micro font-bold uppercase tracking-widest text-teal">
        {String(index).padStart(2, "0")}
        <span aria-hidden className="h-px w-8 bg-amber" />
      </p>
      <h2 className="mt-2 text-h1 font-semibold">{title}</h2>
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
      className={`mt-3 text-body text-text ${
        locale === "ar" ? "leading-loose" : "leading-relaxed"
      }`}
    >
      {children}
    </p>
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
    <p className="mt-3 text-body">
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
