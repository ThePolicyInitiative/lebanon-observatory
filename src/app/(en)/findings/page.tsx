import type { Metadata } from "next";
import Link from "next/link";
import FinanceFunnel from "@/components/charts/FinanceFunnel";
import DeliveryTimeline from "@/components/charts/DeliveryTimeline";
import FunctionSpeedChart from "@/components/charts/FunctionSpeedChart";
import DisbursementWaffle from "@/components/charts/DisbursementWaffle";
import LeapComponentsChart from "@/components/charts/LeapComponentsChart";
import MilestoneGantt from "@/components/charts/MilestoneGantt";
import SectorDamageChart from "@/components/charts/SectorDamageChart";
import WorstCadastersChart from "@/components/charts/WorstCadastersChart";
import DebrisTiles from "@/components/charts/DebrisTiles";
import DistrictDamageChart from "@/components/charts/DistrictDamageChart";
import LeapResultsBoard from "@/components/LeapResultsBoard";
import CompensationTracks from "@/components/CompensationTracks";
import ServiceImpact from "@/components/ServiceImpact";
import HumanToll from "@/components/HumanToll";
import DisplacementCycle from "@/components/DisplacementCycle";
import WaterRepairs from "@/components/WaterRepairs";
import ServiceOperators from "@/components/ServiceOperators";
import InstitutionalStructures from "@/components/InstitutionalStructures";
import ThreeStreams from "@/components/ThreeStreams";
import SeeMore from "@/components/SeeMore";
import Takeaways from "@/components/Takeaways";
import { FigureTile, Onward } from "@/components/HomeNarrative";
import { finding } from "@/lib/framework";
import { finance } from "@/lib/data";
import destruction from "@/data/destruction.json";
import { fmtUsd, fmtDate } from "@/lib/format";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/findings"),
  title: "The findings",
  description:
    "The five findings of the 2024-2026 comparison: needs beyond immediate capacity, financing frameworks that were not money in hand, a plan stronger than its delivery, a wider role for community initiatives, and work concentrated in the early stages of recovery.",
};

/** The six concepts public debate merges, kept apart under finding 2. */
const CONCEPTS = [
  {
    n: 1,
    label: "Assessed need",
    text: "US$11 billion for the 2023–24 conflict, assessed by the RDNA. A need is not a plan and not money.",
  },
  {
    n: 2,
    label: "Financing framework",
    text: "The US$1 billion LEAP scalable framework - an envelope into which financing can flow, three-quarters of it unfilled at the latest review.",
  },
  {
    n: 3,
    label: "Approved financing",
    text: "The US$250 million initial IBRD loan: approved June 2025, ratified December 2025, effective 26 February 2026.",
  },
  {
    n: 4,
    label: "Disbursement",
    text: "US$4.13 million - 1.65% of the loan - disbursed by 29 June 2026. Disbursement pays for preparation as well as works; it is not output.",
  },
  {
    n: 5,
    label: "Procurement",
    text: "Three consulting-services packages published between February and May 2026 showed no award at the 17 July portal check; a first set of small consulting awards then appeared on the portal between 23 July and 13 August, and the first works tender opened on 21 August 2026 - works contracts still at zero.",
  },
  {
    n: 6,
    label: "Completed output",
    text: "No publicly confirmed completed reconstruction output, no awarded works contract and no confirmed state compensation payment at the latest review.",
  },
];

const COMPARABILITY_BADGE: Record<string, { label: string; cls: string }> = {
  not_comparable: {
    label: "Not directly comparable",
    cls: "bg-[#F7E9E5] text-rust",
  },
  context_only: {
    label: "Context only",
    cls: "bg-[#EEF2F7] text-text-secondary",
  },
};

/**
 * The numbered heading that opens each finding. The id sits on the h2
 * itself, so the home teasers and older #finding-* links land on the
 * title; both language pages share the same five ids.
 */
function FindingHeading({
  index,
  id,
  title,
}: {
  index: number;
  id: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="flex items-center gap-2.5 font-sans text-micro font-bold uppercase tracking-widest text-teal">
        {String(index).padStart(2, "0")}
        <span aria-hidden className="h-px w-8 bg-amber" />
      </p>
      <h2 id={id} className="mt-2 text-h2 font-semibold text-navy">
        {title}
      </h2>
    </div>
  );
}

/**
 * The findings chapter of the report: the five findings in report order,
 * each opening with its full worded text from framework.ts and carrying
 * its depth right here - the damage assessments under finding 1, the
 * money's path under finding 2, the command structures under finding 3.
 * The old /destroyed and /money pages folded into this one; their section
 * ids survive so deep links keep landing.
 */
export default function FindingsPage() {
  const needs = finding("needs", "en");
  const frameworks = finding("frameworks", "en");
  const plan = finding("plan", "en");
  const community = finding("community", "en");
  const stages = finding("stages", "en");

  return (
    <PageShell
      title="The findings"
      art={{ src: "/brand/country.svg", className: "h-48" }}
      lede={
        <>
          Five findings come out of reading the two responses through the
          actor and action layers. Each carries its full text and its depth
          here: the damage estimates behind the US$11 billion benchmark, the
          money&apos;s path from framework to disbursement, and the two
          command structures side by side.
        </>
      }
      point="Damage estimates are never summed or averaged, announced financing is not disbursed financing, and nothing here is presented as completed output."
    >
      <div className="mt-10 space-y-16">
        {/* ------------------------------------------------------------ */}
        {/* Finding 1: needs beyond capacity, with the damage depth       */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-needs">
          <FindingHeading index={1} id="finding-needs" title={needs.title} />
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {needs.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {needs.body[1]}
          </p>

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

          <p className="mt-5 max-w-3xl text-body leading-relaxed text-text-secondary">
            Of the roughly US$11 billion in needs, the assessment expected the
            public sector to mobilise about US$3-5 billion and the private
            sector a further US$6-8 billion. The estimates under those figures
            follow, each presented with its method, scope, unit and
            comparability - never averaged, summed or merged. No single building count exists for the 2024 war, and no
            national assessment existed for the 2026 war at the latest review;
            the plurality gave the response its fastest early figures while
            delaying the single baseline every compensation system needs.
          </p>

          {/* Four 2024 tracks */}
          <section aria-labelledby="tracks-2024" className="mt-7">
            <h3 id="tracks-2024" className="text-h3 font-semibold text-navy">
              2024: four non-additive tracks bracket the destruction
            </h3>
            <p className="mt-2 max-w-3xl text-body text-text-secondary">
              The spread between the tracks reflects method (satellite radar
              versus optical imagery versus municipal declaration), scope (four
              versus six governorates), unit (buildings versus dwellings) and
              timing - not error.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {destruction.tracks2024.map((t) => (
                <article
                  key={t.id}
                  className="flex flex-col card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-body font-semibold leading-snug text-navy">
                      {t.label}
                    </h4>
                    <span
                      className={`shrink-0 rounded-sm px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide ${COMPARABILITY_BADGE[t.comparability].cls}`}
                    >
                      {COMPARABILITY_BADGE[t.comparability].label}
                    </span>
                  </div>
                  <p className="mt-2 text-h3 font-semibold tabular-nums text-navy">
                    {t.headline}
                  </p>
                  <p className="mt-2 flex-1 text-meta leading-relaxed text-text">
                    {t.detail}
                  </p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-border pt-2.5 text-micro text-text-secondary">
                    <div>
                      <dt className="font-semibold">Method</dt>
                      <dd>{t.method}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Scope</dt>
                      <dd>{t.scope}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Unit</dt>
                      <dd>{t.unit}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            <div className="mt-4 card">
              <h4 className="text-body font-semibold text-navy">
                2024 debris
              </h4>
              <p className="mt-1 text-h3 font-semibold tabular-nums text-navy">
                {destruction.debris2024.headline}
              </p>
              <p className="mt-1.5 max-w-3xl text-meta leading-relaxed">
                {destruction.debris2024.detail}
              </p>
            </div>
          </section>

          {/* District-level municipal survey */}
          <section aria-labelledby="district-survey" className="mt-8">
            <h3 id="district-survey" className="sr-only">
              Municipality-reported damage by district
            </h3>
            <DistrictDamageChart />
          </section>

          {/* Sector chart */}
          <section aria-labelledby="sector-chart" className="mt-8">
            <h3 id="sector-chart" className="text-h3 font-semibold text-navy">
              Sector damage, losses and needs
            </h3>
            <p className="mt-2 max-w-3xl text-body text-text-secondary">
              The structural signature is the same everywhere: damage that public
              budgets must repair is the smaller number; losses that only economic
              recovery can restore are the larger one.
            </p>
            <div className="mt-5">
              <SectorDamageChart />
            </div>
          </section>

          {/* 2026 zones */}
          <section aria-labelledby="zones-2026" className="mt-8">
            <h3 id="zones-2026" className="text-h3 font-semibold text-navy">
              2026: two bounded assessment zones - not a national picture
            </h3>
            <p className="mt-2 max-w-3xl text-body text-text-secondary">
              Within their zones, the 2026 numbers describe destruction
              approaching 2024&apos;s southern intensity in one-third the time.
              The two products use different confirmation methods and must not
              share a legend; neither is cumulative with any 2024 figure.
            </p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {destruction.zones2026.map((z) => (
                <article
                  key={z.id}
                  className="flex flex-col rounded-md border border-border bg-white"
                >
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg px-4 py-2.5">
                    <h4 className="text-body font-semibold text-navy">
                      {z.label}
                    </h4>
                    <div className="flex gap-1.5">
                      <span className="rounded-sm bg-[#E8F1F3] px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-teal">
                        {z.checkedBy}
                      </span>
                      <span className={`rounded-sm px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide ${COMPARABILITY_BADGE[z.comparability].cls}`}>
                        {COMPARABILITY_BADGE[z.comparability].label}
                      </span>
                    </div>
                  </header>
                  <div className="flex-1 space-y-2.5 p-4 text-meta leading-relaxed">
                    <p className="text-h3 font-semibold tabular-nums text-navy">
                      {z.assessedDamage}
                    </p>
                    <p>
                      <span className="font-semibold">Buildings: </span>
                      {z.buildings}
                    </p>
                    <p>
                      <span className="font-semibold">Debris: </span>
                      {z.debris}
                    </p>
                    {/* The four cadaster values are charted directly below, so
                        the card carries the point they make rather than the
                        numbers a second time. */}
                    {z.worstCadasters.length > 0 ? (
                      <p className="text-meta text-text-secondary">
                        Its worst-hit cadasters, charted below, are the same border
                        communities levelled in 2024 - repetition converts
                        reconstruction from a stock problem (rebuild X) into a flow
                        problem (rebuild under recurrence risk).
                      </p>
                    ) : null}
                    <p className="text-meta text-text-secondary">
                      <span className="font-semibold">Method: </span>
                      {z.method}
                    </p>
                    <p className="text-meta text-text-secondary">
                      <span className="font-semibold">Comparability: </span>
                      {z.comparabilityNote}
                    </p>
                  </div>
                  <p className="border-t border-dashed border-border px-4 py-2.5 text-micro text-text-secondary">
                    Published {fmtDate(z.published)} (UNDP &amp; CNRS-L)
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6">
              <WorstCadastersChart />
            </div>

            <div className="mt-6">
              <DebrisTiles />
            </div>

            <div className="mt-7">
              <HumanToll />
            </div>

            <ul className="mt-4 space-y-2">
              {destruction.zones2026Notes.map((n) => (
                <li
                  key={n.slice(0, 30)}
                  className="border-l-2 border-amber bg-white p-3 pl-4 text-meta leading-relaxed"
                >
                  {n}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-md border border-dashed border-border bg-white p-4">
              <p className="text-meta leading-relaxed text-text-secondary">
                <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 text-micro font-semibold uppercase tracking-wide">
                  Context only
                </span>{" "}
                {destruction.presidentialEstimate.detail}
              </p>
            </div>
          </section>

          <div className="mt-8">
            <SeeMore label="the shelter-and-return cycle, run twice">
              <DisplacementCycle />
            </SeeMore>
          </div>

          {/* Services and networks: the operator-reported account in one place,
              with the two long registers folded behind the dated sector figures. */}
          <section aria-labelledby="services-networks" className="mt-8">
            <h3 id="services-networks" className="text-h3 font-semibold text-navy">
              Services and networks, as operators reported them
            </h3>
            <p className="mt-2 max-w-3xl text-body text-text-secondary">
              What stopped and what came back under the 2026 war, in the operating
              institutions&apos; own published figures. The dated sector status
              leads; the two long operator registers open below it.
            </p>
            <div className="mt-5">
              <ServiceImpact />
            </div>
            <SeeMore label="the water office's repairs, line by line">
              <WaterRepairs />
            </SeeMore>
            <SeeMore label="the networks, operator by operator">
              <ServiceOperators />
            </SeeMore>
          </section>

          <p className="mt-8 text-body">
            <Link href="/actors" className="font-medium text-blue underline-offset-2 hover:underline">
              See who was traced acting, and where →
            </Link>
          </p>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Finding 2: frameworks were not money, with the finance depth  */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-frameworks">
          <FindingHeading
            index={2}
            id="finding-frameworks"
            title={frameworks.title}
          />
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {frameworks.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {frameworks.body[1]}
          </p>

          <p className="mt-5 max-w-3xl text-body leading-relaxed text-text-secondary">
            The money&apos;s path keeps six concepts apart - need, framework,
            approval, disbursement, procurement, completed output - because
            merging them is how &ldquo;reconstruction is happening&rdquo; and
            &ldquo;reconstruction has not begun&rdquo; are both sincerely
            said.
          </p>

          {/* Six concepts - the announced/approved/disbursed discipline */}
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CONCEPTS.map((c) => (
              <li key={c.n} className="card">
                <p className="text-micro font-bold uppercase tracking-widest text-teal">
                  {c.n}. {c.label}
                </p>
                <p className="mt-1.5 text-body leading-relaxed">{c.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-7">
            <FinanceFunnel />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <DisbursementWaffle />
            <MilestoneGantt />
          </div>

          <div className="mt-6">
            <LeapComponentsChart />
          </div>

          <div className="mt-6">
            <SeeMore label="the LEAP results board - what was promised by when">
              <LeapResultsBoard />
            </SeeMore>
          </div>

          {/* LEAP components, folded: the chart above carries the shape */}
          <SeeMore label="inside the initial US$250 million, component by component">
            <section aria-labelledby="leap-components" className="card">
              <h3
                id="leap-components"
                className="text-h3 font-semibold text-navy"
              >
                Inside the initial US$250 million
              </h3>
              <p className="mt-1 text-body text-text-secondary">
                Appraisal allocations. The reconstruction-works subcomponent
                deliberately received nothing initially - works need preparation
                first - leaving the US$750 million framework gap to partners.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-meta tabular-nums">
                  <caption className="sr-only">LEAP component allocations</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-left font-semibold text-navy">Component</th>
                      <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-right font-semibold text-navy">Initial financing</th>
                      <th scope="col" className="border-b-2 border-border px-2 py-1.5 text-right font-semibold text-navy">Appraised (full framework)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.leapComponents.map((c) => (
                      <tr key={c.label} className="odd:bg-bg">
                        <td className="border-b border-border px-2 py-1.5">
                          {c.label}
                          {"note" in c && c.note ? (
                            <span className="block text-micro text-text-secondary">{c.note}</span>
                          ) : null}
                        </td>
                        <td className="border-b border-border px-2 py-1.5 text-right">
                          {c.initialUsd > 0 ? fmtUsd(c.initialUsd) : "-"}
                        </td>
                        <td className="border-b border-border px-2 py-1.5 text-right">{fmtUsd(c.appraisedUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </SeeMore>

          {/* Procurement packages, folded */}
          <SeeMore label="the three procurement packages and their portal status">
            <section aria-labelledby="procurement-packages">
              <h3
                id="procurement-packages"
                className="text-h3 font-semibold text-navy"
              >
                Procurement packages and their actual status
              </h3>
              <p className="mt-1 max-w-3xl text-body text-text-secondary">
                Statuses as displayed on the CDR procurement portal at the 17 July
                2026 check. Extensions and evaluation periods are normal under Bank
                rules and abnormal against Lebanese need. The sharpest signal is
                reflexive: the Third-Party Monitoring Agent queued in the same slow
                pipeline it exists to watch. Portal notices published after that
                check - a first set of small consulting awards and the first works
                tender - are gathered on the{" "}
                <a href="/reported" className="underline underline-offset-2">
                  live-reporting page
                </a>{" "}
                until they are read into the tracking.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {finance.procurementPackages.map((p) => (
                  <article key={p.id} className="card">
                    <h4 className="text-body font-semibold leading-snug text-navy">
                      {p.label}
                    </h4>
                    <dl className="mt-2 space-y-1 text-meta text-text-secondary">
                      <div className="flex gap-1.5">
                        <dt className="font-semibold">Published:</dt>
                        <dd>{fmtDate(p.published)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="font-semibold">Deadline:</dt>
                        {/* Only #1082 is reported as extended; the flag lives in
                            finance.json so the other two stop claiming it. */}
                        <dd>
                          {fmtDate(p.deadline)}
                          {"extended" in p && p.extended ? " (extended)" : ""}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 inline-block rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-micro font-semibold text-[#8a6200]">
                      {p.statusAtCheck}
                    </p>
                  </article>
                ))}
              </div>
              <div className="mt-4 card text-body">
                <p>
                  <span className="font-semibold text-navy">
                    Reform targets quantify the mountain:
                  </span>{" "}
                  baseline{" "}
                  <strong className="tabular-nums">{finance.procurementBaselines.worksContractWeeksBaseline} weeks</strong>{" "}
                  from notice to signed works contract against a{" "}
                  <strong className="tabular-nums">{finance.procurementBaselines.worksContractWeeksTarget}-week</strong>{" "}
                  target;{" "}
                  <strong className="tabular-nums">{finance.procurementBaselines.consultancyWeeksBaseline} weeks</strong>{" "}
                  for consultancies against{" "}
                  <strong className="tabular-nums">{finance.procurementBaselines.consultancyWeeksTarget}</strong>.
                </p>
              </div>
            </section>
          </SeeMore>

          {/* Adjacent flows, folded */}
          <SeeMore label="the parallel money tracks outside reconstruction financing">
            <section aria-labelledby="adjacent-flows" className="card">
              <h3
                id="adjacent-flows"
                className="text-h3 font-semibold text-navy"
              >
                Money that moved on parallel tracks - not reconstruction financing
              </h3>
              <p className="mt-1 max-w-3xl text-body text-text-secondary">
                These flows are real money for other purposes and must not be
                conflated with the reconstruction programme.
              </p>
              <ul className="mt-4 space-y-2.5">
                {finance.adjacentFlows.map((f) => (
                  <li key={f.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-2.5 text-body last:border-b-0">
                    <span>
                      <span className="font-medium">{f.label}.</span>{" "}
                      <span className="text-text-secondary">{f.note}</span>
                    </span>
                    <span className="tabular-nums font-semibold text-navy">
                      {"display" in f && f.display ? f.display : fmtUsd(f.amountUsd)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </SeeMore>

          {/* Compensation tracks */}
          <div className="mt-7">
            <CompensationTracks />
          </div>

          {/* Timeline */}
          <div className="mt-7">
            <DeliveryTimeline />
          </div>

          {/* Speed of functions */}
          <div className="mt-7">
            <FunctionSpeedChart />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Finding 3: a sound plan, an inadequate response               */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-plan">
          <FindingHeading index={3} id="finding-plan" title={plan.title} />
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {plan.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {plan.body[1]}
          </p>
          <SeeMore label="the two command structures, side by side">
            <InstitutionalStructures />
            <div className="mt-8">
              <ThreeStreams />
            </div>
          </SeeMore>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Finding 4: the community share. This finding reads the actor  */}
        {/* groups against each other, so it carries no counts anywhere:  */}
        {/* the wording ranks, the figures live nowhere.                  */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-community">
          <FindingHeading
            index={4}
            id="finding-community"
            title={community.title}
          />
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {community.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {community.body[1]}
          </p>
          <Onward href="/actors?layer=community">
            The community group, on the actors page
          </Onward>
          <Onward href="/reported">
            What residents&apos; initiatives are reporting
          </Onward>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Finding 5: both responses stayed in the early stages          */}
        {/* ------------------------------------------------------------ */}
        <section aria-labelledby="finding-stages">
          <FindingHeading index={5} id="finding-stages" title={stages.title} />
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {stages.body[0]}
          </p>
          <p className="mt-3 max-w-3xl text-body leading-relaxed text-text">
            {stages.body[1]}
          </p>
          <Onward href="/actions#action-mix">
            What kind of work was traced, category by category
          </Onward>
        </section>
      </div>

      <div className="mt-16">
        <Takeaways
          changed="Both wars were measured and framed better over time: 2026 was assessed within weeks, in joint products with a Lebanese scientific institution that state their own limits, and by 26 February 2026 the financing framework was real plumbing - an effective US$250 million loan, a disbursement account and three procurement packages - none of which existed in 2024."
          unchanged="Conversion. Neither war has one authoritative building count, the Bekaa and Baalbek-Hermel were never assessed in 2026, US$4.13 million of the loan - 1.65% - had been disbursed by 29 June 2026, and no completed reconstruction output was publicly confirmed at the latest review."
          matters="Programmes fund what is measured, so unassessed areas enter any future financing instrument late and weakly. And until a first works award, a first state compensation payment and a first confirmed output appear, the framework's headline describes capacity, not recovery - households live at the bottom of the funnel."
        />
      </div>
    </PageShell>
  );
}
