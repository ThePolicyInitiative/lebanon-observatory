import Link from "next/link";
import type { ReactNode } from "react";
import { AR } from "@/lib/i18n";

/**
 * The frame every Arabic page shares: heading, opening passage, the one
 * caution that page turns on, and the way through to the English original.
 * Figures come from the same data the English side reads, so a number
 * cannot say one thing in Arabic and another in English.
 */
export default function ArabicPageShell({
  title,
  lede,
  point,
  englishHref,
  figures,
  children,
}: {
  title: string;
  /** Both optional: a page whose English twin carries no opening passage
   * must not grow one here, or the two languages stop matching. */
  lede?: string;
  /** A node, not a string: the English cautions carry links inline, and an
   * Arabic caution that cannot hold them ends up repeating itself further
   * down the page to put the links somewhere. */
  point?: ReactNode;
  englishHref: string;
  figures?: { value: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          {title}
        </h1>
        {lede ? (
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {lede}
          </p>
        ) : null}
        {point ? (
          <p className="note-caution mt-4 text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
            {point}
          </p>
        ) : null}
      </header>

      {figures && figures.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((f) => (
            <li key={f.label} className="card p-3.5">
              <p className="figure-number text-2xl text-[color:var(--color-navy)]">
                {f.value}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
                {f.label}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {children}

      <div className="mt-8 card p-3.5 sm:p-4">
        <p className="text-[13px] leading-relaxed text-[color:var(--color-text)]">
          {AR.common.figuresNote}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
          {AR.common.englishModules}
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {/* hrefLang, not lang/dir: the English is the destination, while
              the label itself is Arabic and has to lay out right-to-left
              like its sibling - otherwise its arrow lands on the far side. */}
          <Link
            href={englishHref}
            hrefLang="en"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            {AR.common.openEnglish} ←
          </Link>
          <Link
            href="/ar"
            className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            {AR.common.backToArabicHome} ←
          </Link>
        </p>
      </div>
    </div>
  );
}
