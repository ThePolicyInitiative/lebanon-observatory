import type { Metadata } from "next";
import { Suspense } from "react";
import ExplorerClient from "./ExplorerClient";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/entries"),
  title: "Data explorer",
  description:
    "Who did what and where: searchable actor-stage tracking for Lebanon's reconstruction system, 2024 and 2026, with citations and confirmation notes.",
};

export default function ExplorerPage() {
  return (
    <PageShell
      title="Who did what, and where"
      lede={
        <>
          The underlying tracking: one row per traced actor and
          function, for 2024 and 2026. Rows show traced presence - never
          performance. Chart-level stage counts are recomputed at entry level
          from this base, so explorer rows are finer-grained than the chart
          figures by construction.
        </>
      }
    >
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}>
          <ExplorerClient />
        </Suspense>
      </div>
    </PageShell>
  );
}
