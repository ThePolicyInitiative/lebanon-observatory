import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AR, localeAlternates } from "@/lib/i18n";
import { regionLabel } from "@/lib/vocab";
import { kpis, locations } from "@/lib/data";
import { GOV_PATHS } from "@/lib/geo";
import InstitutionalStructures from "@/components/InstitutionalStructures";
import InstitutionalShiftDiagram from "@/components/charts/InstitutionalShiftDiagram";
import KpiCard from "@/components/KpiCard";
import ReconstructionPulse from "@/components/ReconstructionPulse";
import YearHeatmaps from "@/components/charts/YearHeatmaps";
import NewsTeaser from "@/components/news/NewsTeaser";
import { Body, GlanceFigures, Onward, SectionHeading } from "@/components/HomeNarrative";

/** Below the fold and carrying the full data text for its drawer. */
const ChangeHeatmap = dynamic(() => import("@/components/charts/ChangeHeatmap"), {
  loading: () => <div className="h-96 animate-pulse rounded-md bg-white" />,
});

export const metadata: Metadata = {
  alternates: localeAlternates("/", "ar"),
  // Absolute: the Arabic home IS the site name, and the layout's template
  // would otherwise append the same name to itself.
  title: { absolute: AR.meta.title },
  description: AR.meta.description,
};

export default function ArabicPage() {
  const regionRows = locations.regions
    .filter((r) => r.id !== "national_multi" && r.id !== "named_localities")
    .map((r) => {
      const key = r.id as keyof (typeof locations.mentions)["2024"];
      const sum = (m: Record<string, number> | undefined) =>
        m ? Object.values(m).reduce((a, b) => a + b, 0) : 0;
      return {
        label: regionLabel(r.id, "ar"),
        t24: sum(locations.mentions["2024"][key]),
        t26: sum(locations.mentions["2026"][key]),
      };
    });

  return (
    <div dir="rtl" lang="ar" className="text-right">
      {/* Hero */}
      <section className="on-navy relative overflow-hidden border-b border-[#0e2542] bg-navy bg-[linear-gradient(200deg,#122e50_0%,#173b63_55%,#1c4a7c_100%)]">
        <svg
          aria-hidden
          viewBox="0 0 620 860"
          className="pointer-events-none absolute -left-8 top-1/2 hidden h-[135%] -translate-y-1/2 lg:block"
        >
          {GOV_PATHS.map((p) => (
            <path
              key={p.name}
              d={p.d}
              fill="#FFFFFF"
              fillOpacity={0.03}
              stroke="#FFFFFF"
              strokeOpacity={0.14}
              strokeWidth={1.2}
            />
          ))}
        </svg>
        <div className="relative mx-auto max-w-[1360px] px-4 py-8 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold tracking-widest text-amber">
            {AR.hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            {AR.hero.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-loose text-white/85 sm:text-lg">
            {AR.hero.lede}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/ar/map"
              className="inline-flex min-h-11 items-center rounded-md bg-amber px-5 text-sm font-semibold text-[#2a1e00] hover:bg-[#e8ab1a]"
            >
              {AR.hero.ctaMap}
            </Link>
            <Link
              href="/ar/compare"
              className="inline-flex min-h-11 items-center rounded-md border border-white/60 px-5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {AR.hero.ctaCompare}
            </Link>
            <Link
              href="/ar/news"
              className="inline-flex min-h-11 items-center rounded-md border border-white/25 px-5 text-sm font-semibold text-white/80 hover:border-white/60 hover:text-white"
            >
              {AR.hero.ctaNews}
            </Link>
          </div>
          <GlanceFigures items={AR.glance} />
          <p className="mt-3 max-w-3xl text-[11px] leading-relaxed text-white/55">
            {AR.glanceNote}
          </p>
        </div>
      </section>

      {/* Reconstruction pulse - the same module the English home renders */}
      <ReconstructionPulse locale="ar" />

      {/* KPIs. The per-layer shift that used to sit here is section 4's
          subject and has no counterpart on the English home, so it is not
          repeated ahead of it. */}
      <section
        aria-labelledby="ar-kpis"
        className="mx-auto max-w-[1360px] px-4 pb-12 pt-8 sm:px-6"
      >
        <h2
          id="ar-kpis"
          className="text-xl font-semibold text-navy sm:text-2xl"
        >
          {AR.kpis.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-loose text-text-secondary">
          {AR.kpis.lede}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} locale="ar" />
          ))}
        </div>
      </section>

      {/* The narrative sequence, in the same seven steps as the English side */}
      <div className="mx-auto max-w-[1360px] space-y-16 px-4 pb-16 sm:px-6">
        <section id="emergency-2024" aria-label={AR.home.emergency.title}>
          <SectionHeading index={AR.home.emergency.n} title={AR.home.emergency.title}>
            <Body locale="ar">{AR.home.emergency.body}</Body>
          </SectionHeading>
        </section>

        <section id="implementation-middle" aria-label={AR.home.middle.title}>
          <SectionHeading index={AR.home.middle.n} title={AR.home.middle.title}>
            <Body locale="ar">{AR.home.middle.body}</Body>
          </SectionHeading>
        </section>

        <section id="structures" aria-label={AR.home.structures.title}>
          <SectionHeading index={AR.home.structures.n} title={AR.home.structures.title}>
            <Body locale="ar">{AR.home.structures.body}</Body>
          </SectionHeading>
          <div className="mt-6">
            <InstitutionalStructures locale="ar" />
          </div>
          <div className="mt-8">
            <InstitutionalShiftDiagram locale="ar" />
          </div>
        </section>

        <section id="role-shift" aria-label={AR.home.roles.title}>
          <SectionHeading index={AR.home.roles.n} title={AR.home.roles.title}>
            <Body locale="ar">{AR.home.roles.body}</Body>
          </SectionHeading>
          <div className="mt-6 space-y-6">
            {/* The standing counts caution prints once per page, on the
                first figure below; the repeat here is suppressed. */}
            <YearHeatmaps locale="ar" />
            <ChangeHeatmap locale="ar" showCaveat={false} />
          </div>
          <Onward locale="ar" href="/ar/actors">{AR.home.roles.link}</Onward>
        </section>

        <section id="finance-delivery" aria-label={AR.home.finance.title}>
          <SectionHeading index={AR.home.finance.n} title={AR.home.finance.title}>
            <Body locale="ar">{AR.home.finance.body}</Body>
          </SectionHeading>
          <Onward locale="ar" href="/ar/finance">{AR.home.finance.link}</Onward>
        </section>

        <section id="geography" aria-label={AR.home.geography.title}>
          <SectionHeading index={AR.home.geography.n} title={AR.home.geography.title}>
            <Body locale="ar">{AR.home.geography.body}</Body>
          </SectionHeading>
          <div className="mt-6 overflow-x-auto card p-3.5">
            <table className="min-w-full border-collapse text-sm tabular-nums">
              <caption className="pb-2 text-start text-xs text-text-secondary">
                {AR.home.geography.tableCaption}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-start font-semibold text-navy">
                    {AR.home.geography.region}
                  </th>
                  <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-end font-semibold text-navy">2024</th>
                  <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-end font-semibold text-navy">2026</th>
                </tr>
              </thead>
              <tbody>
                {regionRows.map((r) => (
                  <tr key={r.label} className="odd:bg-bg">
                    <td className="border-b border-border px-2 py-1.5">{r.label}</td>
                    <td className="border-b border-border px-2 py-1.5 text-end">{r.t24}</td>
                    <td className="border-b border-border px-2 py-1.5 text-end">{r.t26}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link
              href="/ar/map"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              {AR.home.geography.openMap} ←
            </Link>
            <Link
              href="/ar/damage"
              className="font-medium text-blue underline-offset-2 hover:underline"
            >
              {AR.home.geography.openDamage} ←
            </Link>
          </p>
        </section>

        <section id="latest-news" aria-label={AR.home.news.title}>
          <SectionHeading index={AR.home.news.n} title={AR.home.news.title}>
            <Body locale="ar">{AR.home.news.body}</Body>
          </SectionHeading>
          <div className="mt-6">
            <NewsTeaser locale="ar" />
          </div>
        </section>

        <section
          aria-label={AR.home.conclusion.slice(0, 40)}
          className="rounded-md border-r-4 border-navy bg-white p-6"
        >
          <blockquote className="editorial-quote max-w-4xl text-lg leading-loose text-navy">
            {AR.home.conclusion}
          </blockquote>
        </section>
      </div>

      {/* Cross-locale notice */}
      <section className="mx-auto max-w-[1360px] px-4 pb-16 sm:px-6">
        <p className="rounded-md border-r-4 border-amber bg-white p-4 text-sm leading-loose text-text-secondary">
          {AR.notice}{" "}
          <Link
            href="/"
            lang="en"
            dir="ltr"
            className="font-semibold text-blue underline-offset-2 hover:underline"
          >
            {AR.nav.english}
          </Link>
        </p>
      </section>
    </div>
  );
}
