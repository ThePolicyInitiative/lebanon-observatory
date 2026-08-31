import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/vocab";

/**
 * The home page's own primitives, shared by both languages.
 *
 * The two home pages are legitimately a different template from the other
 * routes - they are a narrative sequence, not a page of modules - so they
 * stay out of PageShell. But they had each declared their own copies of
 * these primitives, and the copies had drifted in exactly the way two
 * copies do: same figure at two sizes in two weights, same label at two
 * leadings. A deliberate adjustment and an accident look identical in the
 * diff, which is the whole difficulty with duplicated components.
 *
 * One drift survives on purpose: Arabic takes looser leading than Latin at
 * the same size, because its letterforms carry meaning above and below the
 * baseline. That rule lives here, once, with the reason written down, and
 * every primitive that sets running text takes a locale for it.
 */

/**
 * The numbered eyebrow and heading that opens each narrative movement.
 *
 * The five findings sit under one umbrella heading, so they render as h3
 * and keep the h2 slot for the section that contains them; the default
 * stays h2 for a movement that is its own top-level section.
 */
export function SectionHeading({
  index,
  title,
  as: Tag = "h2",
  children,
}: {
  index: number;
  title: string;
  as?: "h2" | "h3";
  children?: ReactNode;
}) {
  return (
    <div className="prose-measure">
      <p className="flex items-center gap-2.5 font-sans text-micro font-bold uppercase tracking-widest text-teal">
        {String(index).padStart(2, "0")}
        <span aria-hidden className="h-px w-8 bg-amber" />
      </p>
      <Tag className="mt-2 text-h1 font-semibold">{title}</Tag>
      {children}
    </div>
  );
}

/** The plain heading of an unnumbered top-level section. */
export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-h2 font-semibold text-navy">
      {children}
    </h2>
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

/** One card for one of the two analytical layers, worded by framework.ts. */
export function LayerCard({
  title,
  body,
  locale = "en",
  children,
}: {
  title: string;
  body: string;
  locale?: Locale;
  children?: ReactNode;
}) {
  return (
    <article className="card">
      <h3 className="text-h3 font-semibold text-navy">{title}</h3>
      <p
        className={`mt-2 text-body text-text ${
          locale === "ar" ? "leading-loose" : "leading-relaxed"
        }`}
      >
        {body}
      </p>
      {children}
    </article>
  );
}

/**
 * The whole-tracking totals, printed once, as a quiet full-bleed strip
 * rather than indicator cards: they size the work, they do not compare
 * actor groups, and giving them card weight made them read as findings.
 */
export function ScaleStrip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="border-y border-border bg-surface">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-baseline gap-x-10 gap-y-2 px-4 py-5 sm:px-6">
        {children}
      </div>
    </section>
  );
}

/** A plain figure tile: one dated figure, one plain-language label. */
export function FigureTile({
  value,
  label,
  locale = "en",
}: {
  value: string;
  label: string;
  locale?: Locale;
}) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="figure-number text-h3 text-navy">{value}</div>
      <div
        className={`mt-1 text-meta text-text-secondary ${
          locale === "ar" ? "leading-loose" : "leading-relaxed"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
