import Link from "next/link";
import { roleRecords, stageCounts, STAGES, finance } from "@/lib/data";
import { STATUS_LABELS } from "@/lib/colors";

/**
 * The reconstruction pulse: what the sources show on the physical
 * rebuilding chain itself - rubble, debris, works, shelter and return -
 * with the honest status mix and the procurement pipeline beside it.
 */

const CHAIN_STAGE_NOS = [6, 7, 8, 9]; // Rubble clearance → Shelter and return
const STATUS_ORDER = ["underway", "procurement", "formal_mandate", "not_verified"];
const STATUS_CHIP: Record<string, string> = {
  underway: "bg-[#E8F1EC] text-[#1F6B4E]",
  procurement: "bg-[#E8F1F3] text-[color:var(--color-teal)]",
  formal_mandate: "bg-[#EEF2F7] text-[color:var(--color-navy)]",
  not_verified: "bg-[#F2F2EF] text-[color:var(--color-text-secondary)]",
};

export default function ReconstructionPulse() {
  const chainTotals = CHAIN_STAGE_NOS.map((n) => {
    const i = n - 1;
    const sum = (year: "2024" | "2026") =>
      Object.values(stageCounts[year]).reduce((a, layer) => a + layer[i], 0);
    return { stage: STAGES[i], y24: sum("2024"), y26: sum("2026") };
  });
  const maxChain = Math.max(...chainTotals.flatMap((c) => [c.y24, c.y26]));

  const statusMix = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    count: roleRecords.filter(
      (r) =>
        r.year === 2026 &&
        CHAIN_STAGE_NOS.includes(r.stageNo) &&
        r.implementationStatus === status,
    ).length,
  })).filter((s) => s.count > 0);
  const chainRecords2026 = statusMix.reduce((a, s) => a + s.count, 0);

  const packages = finance.procurementPackages;

  return (
    <section
      aria-labelledby="recon-pulse"
      className="mx-auto max-w-[1360px] px-4 pt-12 sm:px-6"
    >
      <div className="card border-l-4 border-l-[color:var(--color-navy)] p-5 sm:p-6">
        <h2
          id="recon-pulse"
          className="text-xl font-semibold text-[color:var(--color-navy)] sm:text-2xl"
        >
          Reconstruction on the ground
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          The physical rebuilding chain - rubble clearance, debris treatment,
          reconstruction works, shelter and return - as the tracking actually
          shows it: who is present, at what status, and what the procurement
          pipeline has produced.
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          {/* Traced presence on the physical chain */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              Traced presence, 2024 → 2026
            </h3>
            <ul className="mt-3 space-y-3">
              {chainTotals.map((c) => (
                <li key={c.stage}>
                  <p className="text-[13px] font-medium text-[color:var(--color-text)]">
                    {c.stage}
                  </p>
                  {[
                    { year: "2024", v: c.y24, color: "#58779B" },
                    { year: "2026", v: c.y26, color: "#2F8F6B" },
                  ].map((row) => (
                    <div key={row.year} className="mt-1 flex items-center gap-2">
                      <span className="w-9 text-[11px] tabular-nums text-[color:var(--color-text-secondary)]">
                        {row.year}
                      </span>
                      <span
                        aria-hidden
                        className="h-2.5 rounded-sm"
                        style={{
                          width: `${Math.max(3, (row.v / maxChain) * 78)}%`,
                          background: row.color,
                        }}
                      />
                      <span className="text-[12px] font-semibold tabular-nums">{row.v}</span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </div>

          {/* Status honesty */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              Status of the {chainRecords2026} chain entries, 2026
            </h3>
            <ul className="mt-3 space-y-2">
              {statusMix.map((s) => (
                <li key={s.status} className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[s.status] ?? ""}`}
                  >
                    {s.label}
                  </span>
                  <span className="tabular-nums text-sm font-semibold text-[color:var(--color-navy)]">
                    {s.count}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
              Traced activity is not completed output: the tracking contains
              no confirmed completed reconstruction outputs by the cut-off, and
              &ldquo;not confirmed&rdquo; marks presence the reporting cannot
              grade - never assumed zero, never assumed done.
            </p>
          </div>

          {/* Procurement pipeline */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              The procurement pipeline
            </h3>
            <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-[color:var(--color-navy)]">
              {packages.length}
              <span className="ml-2 align-middle text-sm font-medium text-[color:var(--color-text-secondary)]">
                LEAP packages tracked
              </span>
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
              {packages.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <span className="font-medium text-[color:var(--color-text)]">
                    {p.label.split(" - ")[1] ?? p.label}
                  </span>{" "}
                  - {p.statusAtCheck}
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-sm bg-[#F7E9E5] px-2.5 py-1.5 text-xs font-medium text-[color:var(--color-rust)]">
              Works contracts awarded by the cut-off: zero. Procurement under
              way is a process milestone, not reconstruction.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                href="/finance"
                className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
              >
                Finance &amp; delivery →
              </Link>
              <Link
                href="/map"
                className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
              >
                Where work is traced →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
