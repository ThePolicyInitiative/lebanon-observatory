import type { Metadata } from "next";
import Link from "next/link";
import InstitutionalStructures from "@/components/InstitutionalStructures";
import ThreeStreams from "@/components/ThreeStreams";
import NewsTeaser from "@/components/news/NewsTeaser";
import SeeMore from "@/components/SeeMore";
import {
  Body,
  FigureTile,
  LayerCard,
  Onward,
  ScaleStrip,
  SectionHeading,
  SectionTitle,
} from "@/components/HomeNarrative";
import { AIM, IMPORTANCE, finding } from "@/lib/framework";
import { GOV_PATHS, VIEW_H, VIEW_W } from "@/lib/geo";
import { localeAlternates } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: localeAlternates("/"),
  title: "Lebanon Reconstruction Observatory",
  description:
    "Mapping, tracking and comparing how Lebanon organised recovery and reconstruction after the 2024 and 2026 wars - the actors involved and the actions they carried out.",
};

/**
 * The home page follows the report: aim, the two layers, why the
 * comparison matters, and the five findings. Everything the report worded
 * comes from framework.ts; only the connective prose is written here.
 */
export default function HomePage() {
  const [actors, actions] = AIM.en.layers;
  const needs = finding("needs", "en");
  const frameworks = finding("frameworks", "en");
  const plan = finding("plan", "en");
  const community = finding("community", "en");
  const stages = finding("stages", "en");

  return (
    <div>
      {/* Hero */}
      <section className="on-navy relative overflow-hidden border-b border-[#0e2542] bg-navy bg-[linear-gradient(160deg,#122e50_0%,#173b63_55%,#1c4a7c_100%)]">
        <svg
          aria-hidden
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="pointer-events-none absolute -right-8 top-1/2 hidden h-[135%] -translate-y-1/2 lg:block"
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
          <p className="text-meta font-semibold uppercase tracking-widest text-amber">
            Lebanon Reconstruction Observatory
          </p>
          <h1 className="mt-3 max-w-4xl text-h1 font-bold leading-tight text-white sm:text-display">
            {AIM.en.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lead leading-relaxed text-white/85">
            {AIM.en.lede}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="#findings"
              className="inline-flex min-h-11 items-center rounded-md bg-amber px-5 text-body font-semibold text-[#2a1e00] transition-colors duration-150 hover:bg-[#e8ab1a]"
            >
              What the comparison shows
            </Link>
            <Link
              href="/who"
              className="inline-flex min-h-11 items-center rounded-md border border-white/60 px-5 text-body font-semibold text-white transition-colors duration-150 hover:bg-white/10"
            >
              Explore the actor layer
            </Link>
            <Link
              href="/methodology"
              className="inline-flex min-h-11 items-center rounded-md border border-white/25 px-5 text-body font-semibold text-white/80 transition-colors duration-150 hover:border-white/60 hover:text-white"
            >
              How it was built
            </Link>
          </div>
        </div>
      </section>

      {/* The two analytical layers */}
      <section
        id="layers"
        aria-labelledby="layers-heading"
        className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6"
      >
        <SectionTitle id="layers-heading">Two analytical layers</SectionTitle>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          Every page of the platform reads the two responses through the same
          pair of lenses: who moved, and what the movement was.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <LayerCard title={actors.title} body={actors.body}>
            <Onward href="/who">Meet the four actor groups</Onward>
          </LayerCard>
          <LayerCard title={actions.title} body={actions.body}>
            <Onward href="/who#action-mix">
              See what each response did, category by category
            </Onward>
            <p className="mt-2 text-meta leading-relaxed text-text-secondary">
              The four categories and their subcategories are defined on the{" "}
              <Link
                href="/methodology"
                className="font-medium text-blue underline-offset-2 hover:underline"
              >
                methodology page
              </Link>
              .
            </p>
          </LayerCard>
        </div>
      </section>

      {/* Whole-tracking totals: they size the work, they compare nothing. */}
      <ScaleStrip label="The scale of the tracking">
        <p className="text-body leading-relaxed text-text">
          <span className="font-semibold text-navy">235 actors traced</span>{" "}
          <span className="text-text-secondary">
            - 105 in the 2024 response, 130 in the 2026 response
          </span>
        </p>
        <p className="text-body leading-relaxed text-text">
          <span className="font-semibold text-navy">771 traced activity entries</span>
        </p>
        <p className="text-meta text-text-secondary">Tracking through 31 August 2026</p>
      </ScaleStrip>

      <div className="mx-auto max-w-[1360px] space-y-16 px-4 py-12 sm:px-6">
        {/* Why the comparison matters */}
        <section id="why" aria-labelledby="why-heading">
          <div className="prose-measure">
            <SectionTitle id="why-heading">{IMPORTANCE.en.title}</SectionTitle>
            <Body>{IMPORTANCE.en.body[0]}</Body>
            <Body>{IMPORTANCE.en.body[1]}</Body>
          </div>
        </section>

        {/* The five findings */}
        <section id="findings" aria-labelledby="findings-heading">
          <h2 id="findings-heading" className="text-h1 font-semibold text-navy">
            What the comparison shows
          </h2>
          <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
            Five findings hold across the tracking. Each one leads onward to
            the page that carries its full detail.
          </p>

          <div className="mt-10 space-y-16">
            <section id="finding-needs" aria-label={needs.title}>
              <SectionHeading index={1} title={needs.title} as="h3">
                <Body>{needs.body[0]}</Body>
                <Body>{needs.body[1]}</Body>
              </SectionHeading>
              <div
                role="group"
                aria-label="The three headline figures of the 2024 assessment"
                className="mt-6 grid max-w-4xl gap-4 sm:grid-cols-3"
              >
                <FigureTile value="US$6.8 billion" label="Physical damage" />
                <FigureTile value="US$7.2 billion" label="Economic losses" />
                <FigureTile
                  value="~US$11 billion"
                  label="Recovery and reconstruction needs"
                />
              </div>
              <Onward href="/destroyed">The damage, area by area</Onward>
              <Onward href="/money">The financing that followed</Onward>
            </section>

            <section id="finding-frameworks" aria-label={frameworks.title}>
              <SectionHeading index={2} title={frameworks.title} as="h3">
                <Body>{frameworks.body[0]}</Body>
                <Body>{frameworks.body[1]}</Body>
              </SectionHeading>
              <Onward href="/money">How far the money actually moved</Onward>
            </section>

            <section id="finding-plan" aria-label={plan.title}>
              <SectionHeading index={3} title={plan.title} as="h3">
                <Body>{plan.body[0]}</Body>
                <Body>{plan.body[1]}</Body>
              </SectionHeading>
              <SeeMore label="the two command structures, side by side">
                <InstitutionalStructures />
                <div className="mt-8">
                  <ThreeStreams />
                </div>
              </SeeMore>
            </section>

            {/* This finding reads the actor groups against each other, so
                it carries no counts anywhere: the wording ranks, the
                figures live nowhere. */}
            <section id="finding-community" aria-label={community.title}>
              <SectionHeading index={4} title={community.title} as="h3">
                <Body>{community.body[0]}</Body>
                <Body>{community.body[1]}</Body>
              </SectionHeading>
              <Onward href="/who">Where each actor group stood</Onward>
            </section>

            <section id="finding-stages" aria-label={stages.title}>
              <SectionHeading index={5} title={stages.title} as="h3">
                <Body>{stages.body[0]}</Body>
                <Body>{stages.body[1]}</Body>
              </SectionHeading>
              <Onward href="/who#action-mix">
                What kind of work was traced, category by category
              </Onward>
            </section>
          </div>
        </section>

        {/* Latest reporting */}
        <section id="latest-reporting" aria-labelledby="latest-heading">
          <SectionTitle id="latest-heading">Latest reporting</SectionTitle>
          <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
            Coverage from selected global, Lebanese, humanitarian and official
            publishers, gathered as it appears. It runs ahead of the tracking
            and stays outside every count.
          </p>
          <div className="mt-6">
            <NewsTeaser />
          </div>
        </section>

        {/* The report's central line */}
        <section
          aria-label="The central line of the comparison"
          className="rounded-md border-l-4 border-navy bg-white p-6"
        >
          <blockquote className="editorial-quote max-w-4xl text-h3 leading-relaxed text-navy">
            The 2026 response was better designed and no better delivered: a
            stronger frame, thin financing, and communities carrying a larger
            share of the work than they had in 2024.
          </blockquote>
        </section>
      </div>
    </div>
  );
}
