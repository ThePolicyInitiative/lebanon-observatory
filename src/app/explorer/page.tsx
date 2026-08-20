import type { Metadata } from "next";
import { Suspense } from "react";
import ExplorerClient from "./ExplorerClient";

export const metadata: Metadata = {
  title: "Data explorer",
  description:
    "Who did what and where: searchable actor-stage tracking for Lebanon's reconstruction system, 2024 and 2026, with citations and confirmation notes.",
};

export default function ExplorerPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          Who did what, and where
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          The underlying tracking: one row per traced actor and
          function, for 2024 and 2026. Rows show traced presence - never
          performance. Chart-level stage counts are recomputed at entry level
          from this base, so explorer rows are finer-grained than the chart
          figures by construction.
        </p>
      </header>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}>
          <ExplorerClient />
        </Suspense>
      </div>
    </div>
  );
}
