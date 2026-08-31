"use client";

import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  caveat?: string;
  children: ReactNode;
  description?: string;
};

/**
 * Shared frame for every analytical visual: title hierarchy, caveat and a
 * screen-reader description. The table view, the on-page source chips and
 * the export controls were removed deliberately and must not return.
 *
 * That last sentence used to be enforced by three props named `table`,
 * `sourceIds` and `chartRef`, each accepted, documented as IGNORED, and
 * destructured out of existence. A comment is not an enforcement: fourteen
 * charts went on passing 104 lines of hand-maintained table data that
 * nothing rendered and nothing tested, and the disbursement waffle's copy
 * had drifted to a figure ten thousand dollars out before anyone looked.
 *
 * The props are gone, so passing one is now a type error - which is what
 * the comment had been trying to be. Charts keep their own chartRef; it was
 * only the handing of it to this frame that did nothing.
 */
export default function ChartFrame({
  id,
  title,
  subtitle,
  caveat,
  children,
  description,
}: Props) {
  return (
    <figure
      id={id}
      aria-describedby={description ? `${id}-desc` : undefined}
      className="card card-interactive"
    >
      <figcaption>
        {/* 17px was the only one on the site, and being off-scale is how it
            ended up above the section h2s it sits under. It names the step
            now rather than a size, so a figure title cannot outgrow the
            heading above it however the scale is later tuned. */}
        <h3 className="text-h3 font-semibold">{title}</h3>
        {subtitle ? (
          <p className="prose-measure mt-1.5 text-body leading-relaxed text-text-secondary">
            {subtitle}
          </p>
        ) : null}
      </figcaption>
      {description ? (
        <p id={`${id}-desc`} className="sr-only">
          {description}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
      {caveat ? (
        <p className="note-caution prose-measure mt-4 text-meta leading-relaxed text-text-secondary">
          {caveat}
        </p>
      ) : null}
    </figure>
  );
}
