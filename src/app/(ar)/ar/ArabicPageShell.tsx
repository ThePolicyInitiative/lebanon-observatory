import Link from "next/link";
import type { ReactNode } from "react";
import PageShell from "@/components/PageShell";
import { AR } from "@/lib/i18n";

/**
 * The Arabic route frame: the shared PageShell, plus the way through to the
 * English original.
 *
 * The frame itself used to live here and be re-typed by hand on the nine
 * English routes. It is one component now, so the two languages cannot
 * drift apart in the shape of the page - only in what they are given to
 * put in it, which is what the parity rule is actually about.
 *
 * Everything Arabic-specific is the tail below: the note that both
 * languages read the same numbers, and the two links out. It goes through
 * PageShell's `after` slot because it has to sit inside the container's
 * measure, after the children.
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
  lede?: ReactNode;
  point?: ReactNode;
  englishHref: string;
  figures?: { value: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <PageShell
      title={title}
      lede={lede}
      point={point}
      figures={figures}
      after={
        <div className="mt-8 card">
          <p className="text-meta leading-relaxed text-text">
            {AR.common.figuresNote}
          </p>
          <p className="mt-2 text-meta leading-relaxed text-text-secondary">
            {AR.common.englishModules}
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-body">
            {/* hrefLang, not lang/dir: the English is the destination, while
                the label itself is Arabic and has to lay out right-to-left
                like its sibling - otherwise its arrow lands on the far side. */}
            <Link
              href={englishHref}
              hrefLang="en"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              {AR.common.openEnglish} ←
            </Link>
            <Link
              href="/ar"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              {AR.common.backToArabicHome} ←
            </Link>
          </p>
        </div>
      }
    >
      {children}
    </PageShell>
  );
}
