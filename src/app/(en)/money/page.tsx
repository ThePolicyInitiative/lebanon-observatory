import type { Metadata } from "next";
import FinanceFunnel from "@/components/charts/FinanceFunnel";
import DeliveryTimeline from "@/components/charts/DeliveryTimeline";
import FunctionSpeedChart from "@/components/charts/FunctionSpeedChart";
import DisbursementWaffle from "@/components/charts/DisbursementWaffle";
import LeapComponentsChart from "@/components/charts/LeapComponentsChart";
import MilestoneGantt from "@/components/charts/MilestoneGantt";
import LeapResultsBoard from "@/components/LeapResultsBoard";
import CompensationTracks from "@/components/CompensationTracks";
import Takeaways from "@/components/Takeaways";
import { finance } from "@/lib/data";
import { fmtUsd, fmtDate } from "@/lib/format";
import { localeAlternates } from "@/lib/i18n";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  alternates: localeAlternates("/money"),
  title: "Finance and delivery",
  description:
    "Assessed need, financing framework, approved financing, disbursement, procurement and completed output in Lebanon's reconstruction, 2024–2026 - kept strictly separate.",
};

const CONCEPTS = [
  {
    n: 1,
    label: "Assessed need",
    text: "US$11 billion for the 2023–24 conflict, assessed by the RDNA. A need is not a plan and not money.",
  },
  {
    n: 2,
    label: "Financing framework",
    text: "The US$1 billion LEAP scalable framework - an envelope into which financing can flow, three-quarters of it unfilled at 31 August 2026.",
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
    text: "Three consulting-services packages published between February and May 2026; none showed an award at the 17 July portal check.",
  },
  {
    n: 6,
    label: "Completed output",
    text: "No publicly confirmed completed reconstruction output, no awarded works contract and no confirmed state compensation payment by 31 August 2026.",
  },
];

export default function FinancePage() {
  return (
    <PageShell
      title="Finance and delivery"
      lede={
        <>
          Six concepts that public debate routinely merges, kept separate here
          because merging them is how &ldquo;reconstruction is happening&rdquo;
          and &ldquo;reconstruction has not begun&rdquo; are both sincerely
          said.
        </>
      }
    >

      {/* Six concepts */}
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
        <LeapResultsBoard />
      </div>

      {/* LEAP components */}
      <section aria-labelledby="leap-components" className="mt-7 card">
        <h2
          id="leap-components"
          className="text-h2 font-semibold text-navy"
        >
          Inside the initial US$250 million
        </h2>
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

      {/* Procurement packages */}
      <section aria-labelledby="procurement-packages" className="mt-7">
        <h2
          id="procurement-packages"
          className="text-h2 font-semibold text-navy"
        >
          Procurement packages and their actual status
        </h2>
        <p className="mt-1 max-w-3xl text-body text-text-secondary">
          Statuses as displayed on the CDR procurement portal at the 17 July
          2026 check. Extensions and evaluation periods are normal under Bank
          rules and abnormal against Lebanese need. The sharpest signal is
          reflexive: the Third-Party Monitoring Agent queued in the same slow
          pipeline it exists to watch.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {finance.procurementPackages.map((p) => (
            <article key={p.id} className="card">
              <h3 className="text-body font-semibold leading-snug text-navy">
                {p.label}
              </h3>
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

      {/* Adjacent flows */}
      <section aria-labelledby="adjacent-flows" className="mt-7 card">
        <h2
          id="adjacent-flows"
          className="text-h2 font-semibold text-navy"
        >
          Money that moved on parallel tracks - not reconstruction financing
        </h2>
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

      {/* Core statement */}
      <section className="mt-7 rounded-md border-l-4 border-navy bg-white p-6">
        <blockquote className="editorial-quote max-w-4xl text-h3 leading-relaxed text-navy">
          Institutional architecture advanced faster than money and physical
          delivery. Procurement under way is a process milestone, not data
          of completed reconstruction.
        </blockquote>
      </section>

      <div className="mt-8">
        <Takeaways
          changed="Lebanon acquired a financing instrument - an account, rules and a pipeline into which additional money can flow - where 2024 had a number and a hope. The political conversions of 2025 moved at institutional speed once a full government existed."
          unchanged="The denominator: even fully funded, the framework addresses roughly the public third of one war. The private two-thirds of needs and the whole of the 2026 war remained without any financed instrument, and completed confirmed output stood at zero."
          matters="Every safeguard that protects money slows it, and households experience only the funnel's bottom. Financing credibility now depends on visible conversion - first works award, first compensation payment, first confirmed output - each of which is specific, owned and checkable."
        />
      </div>
    </PageShell>
  );
}
