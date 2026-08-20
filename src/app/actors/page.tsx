import type { Metadata } from "next";
import { Suspense } from "react";
import ActorTabs from "./ActorTabs";
import ActorTreemap from "@/components/charts/ActorTreemap";
/**
 * These two were lazily loaded because each pulled the whole register into
 * the browser. They now reduce and project on the server and hand small
 * props to their interactive halves, so a plain import is both simpler and
 * faster - nothing heavy is left to defer.
 */
import ActorStageMatrix from "./ActorStageMatrix";
import ActorRegister from "./ActorRegister";
import ReportedUpdates from "@/components/ReportedUpdates";
import WaterRepairs from "@/components/WaterRepairs";
import ServiceOperators from "@/components/ServiceOperators";
import Takeaways from "@/components/Takeaways";

export const metadata: Metadata = {
  title: "Actor layers",
  description:
    "Four actor layers in Lebanon's reconstruction system - official institutions, NGOs and international agencies, municipalities, and community initiatives - profiled for 2024 and 2026 with gains, losses, mandates and delivery.",
};

export default function ActorsPage() {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-[color:var(--color-navy)] sm:text-3xl">
          Actor layers
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          Four principal layers are used throughout this observatory. The
          NGO-and-international layer spans actors with very different
          authority - a UN agency, a multilateral lender and a local NGO are
          not equivalents; expand the named-actor lists and subtypes to see
          the differences.
        </p>
      </header>
      <div className="mt-6">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
          <ActorTabs />
        </Suspense>
      </div>
      <div className="mt-7">
        <ActorTreemap />
      </div>
      <div className="mt-7">
        <ActorStageMatrix />
      </div>
      <div className="mt-7">
        <ActorRegister />
      </div>
      <div className="mt-7">
        <ReportedUpdates />
      </div>
      <div className="mt-7">
        <WaterRepairs />
      </div>
      <div className="mt-7">
        <ServiceOperators />
      </div>
      <div className="mt-8">
        <Takeaways
          changed="Official institutions specialised into the programmed chain; international actors moved into governance cells; community energy rotated from physical substitution to humanitarian absorption."
          unchanged="Municipal power: zero traced finance, procurement or oversight roles in both years, with traced presence thinning 19 → 12. The tier that knows the ground best remained structurally distant from allocation decisions."
          matters="Role clarity without resource transfer reproduces the 2024 cost distribution: whoever stands downstream of the missing function pays for it - in labour, savings, care capacity and risk."
        />
      </div>
    </div>
  );
}
