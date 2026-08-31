import type { Metadata } from "next";
import Link from "next/link";
import NewsTeaser from "@/components/news/NewsTeaser";
import {
  Body,
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
 * The findings appear as teasers - one sentence each - because their full
 * text and depth live on /findings.
 */

/** The teaser prints only a finding's opening sentence; splitting on the
 *  first sentence break is safe because framework.ts writes no dotted
 *  abbreviations, and decimal points are never followed by a space. */
function firstSentence(text: string): string {
  const i = text.indexOf(". ");
  return i === -1 ? text : text.slice(0, i + 1);
}

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
              href="/actors"
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
            <Onward href="/actors">Meet the four actor groups</Onward>
          </LayerCard>
          <LayerCard title={actions.title} body={actions.body}>
            <Onward href="/actions#action-mix">
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

        {/* The five findings, teased: one opening sentence each. The full
            text and every finding's depth live on /findings, where the
            finding-* anchors moved. */}
        <section id="findings" aria-labelledby="findings-heading">
          <h2 id="findings-heading" className="text-h1 font-semibold text-navy">
            What the comparison shows
          </h2>
          <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
            Five findings hold across the tracking. Each opens here in a
            sentence and carries its full text and depth on the findings
            page.
          </p>

          <div className="mt-8 space-y-4">
            <article className="card">
              <SectionHeading index={1} title={needs.title} as="h3">
                <Body>{firstSentence(needs.body[0])}</Body>
                <Onward href="/findings#finding-needs">
                  The full finding: the damage estimates and the needs
                </Onward>
              </SectionHeading>
            </article>

            <article className="card">
              <SectionHeading index={2} title={frameworks.title} as="h3">
                <Body>{firstSentence(frameworks.body[0])}</Body>
                <Onward href="/findings#finding-frameworks">
                  The full finding: the money&apos;s path from framework to
                  disbursement
                </Onward>
              </SectionHeading>
            </article>

            <article className="card">
              <SectionHeading index={3} title={plan.title} as="h3">
                <Body>{firstSentence(plan.body[0])}</Body>
                <Onward href="/findings#finding-plan">
                  The full finding: the two command structures
                </Onward>
              </SectionHeading>
            </article>

            <article className="card">
              <SectionHeading index={4} title={community.title} as="h3">
                <Body>{firstSentence(community.body[0])}</Body>
                <Onward href="/findings#finding-community">
                  The full finding: the community share of the work
                </Onward>
              </SectionHeading>
            </article>

            <article className="card">
              <SectionHeading index={5} title={stages.title} as="h3">
                <Body>{firstSentence(stages.body[0])}</Body>
                <Onward href="/findings#finding-stages">
                  The full finding: where the work concentrated
                </Onward>
              </SectionHeading>
            </article>
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
