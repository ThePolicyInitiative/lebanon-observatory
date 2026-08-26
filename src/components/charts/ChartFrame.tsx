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
  /** Accepted and IGNORED: on-page source chips were removed by design. */
  sourceIds?: string[];
  /** Accepted and IGNORED: the on-page table view was removed by design.
   * Editing a table spec at a call site changes nothing a reader sees. */
  table?: TableSpec;
  children: ReactNode;
  /** Accepted and IGNORED: the frame no longer drives the chart instance. */
  chartRef?: React.MutableRefObject<ECharts | null>;
  description?: string;
};

/**
 * Shared frame for every analytical visual: title hierarchy, caveat and
 * a screen-reader description. Table/export/copy-link controls were
 * removed deliberately and must not return.
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
        {/* 17px was the only one on the site, and being off-scale is how it
            ended up above the 16px section h2s it sits under. text-lg is the
            scale's h3 step and stays below the 20px an h2 now takes. */}
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle ? (
          <p className="prose-measure mt-1.5 text-sm leading-relaxed text-text-secondary">
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
        <p className="note-caution prose-measure mt-4 text-xs leading-relaxed text-text-secondary">
          {caveat}
        </p>
      ) : null}
    </figure>
  );
}
