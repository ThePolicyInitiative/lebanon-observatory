import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ExplorerClient from "./ExplorerClient";
import Takeaways from "@/components/Takeaways";
import { slimRecords } from "@/lib/map-records";
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
          The underlying tracking: one row per traced actor and function, for
          2024 and 2026, read through the two layers of the analysis - actors
          sorted into four groups, actions sorted into four categories. Rows
          show traced activity, never performance, and chart-level stage
          counts are recomputed at entry level from this base, so explorer
          rows are finer-grained than the chart figures by construction. How
          the entries were compiled is set out on{" "}
          <Link
            href="/methodology"
            className="font-medium text-blue underline-offset-2 hover:underline"
          >
            the methodology page
          </Link>
          .
        </>
      }
      figures={[
        { value: String(slimRecords.length), label: "traced entries, 2024 and 2026 together" },
        { value: "105 → 130", label: "actors traced, 2024 then 2026" },
        { value: "12", label: "stages of the response" },
        { value: "2", label: "years under comparison" },
      ]}
    >
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-white" />}>
          <ExplorerClient />
        </Suspense>
      </div>

      <div className="mt-7">
        <Takeaways
          changed="The count of entries rose between the two years, and the official group widened inside it."
          unchanged="Most entries remain traced presence or a mandate, not completed output."
          matters="What is counted here is what public reporting says, not what happened on the ground. The distance between the two is the subject of this site."
        />
      </div>
    </PageShell>
  );
}
