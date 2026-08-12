"use client";

import type { ReactNode } from "react";
import type { ECharts } from "echarts";

export type TableSpec = {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
};

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  caveat?: string;
  sourceIds?: string[];
  /** Retained for compatibility; the on-page table view is disabled. */
  table?: TableSpec;
  children: ReactNode;
  /** Retained for compatibility with chart components. */
  chartRef?: React.MutableRefObject<ECharts | null>;
  description?: string;
};

/**
 * Shared frame for every analytical visual: title hierarchy, caveat,
 * a screen-reader description and a shareable-URL copy control.
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
      className="card card-interactive p-4 sm:p-5"
    >
      <figcaption>
        <h3 className="text-[17px] font-semibold sm:text-lg">{title}</h3>
        {subtitle ? (
          <p className="prose-measure mt-1.5 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
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
        <p className="note-caution prose-measure mt-4 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
          {caveat}
        </p>
      ) : null}
    </figure>
  );
}
