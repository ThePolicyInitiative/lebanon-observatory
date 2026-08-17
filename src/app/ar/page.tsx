import type { Metadata } from "next";
import Link from "next/link";
import { AR } from "@/lib/i18n";
import { kpis, roleRecords, stageCounts, STAGES, finance } from "@/lib/data";
import { LAYER_META, STATUS_LABELS } from "@/lib/colors";
import { GOV_PATHS } from "@/lib/geo";

export const metadata: Metadata = {
  title: AR.meta.title,
  description: AR.meta.description,
};

/** Arabic actor-layer names, matched to the shared layer ids. */
const LAYER_AR: Record<string, string> = {
  official: "المؤسسات الرسمية",
  ngo_international: "المنظمات الدولية وغير الحكومية",
  municipal: "البلديات واتحاداتها",
  community: "المجتمع المحلي والأهالي",
};

/** Arabic names for the four physical rebuilding stages (6-9). */
const CHAIN_AR: Record<number, string> = {
  6: "رفع الأنقاض",
  7: "معالجة الركام والتخلص منه",
  8: "إعادة الإعمار والخدمات",
  9: "الإيواء والعودة",
};

const STATUS_AR: Record<string, string> = {
  underway: "نشاط مرصود",
  procurement: "شراء مباشَر",
  formal_mandate: "تفويض قانوني",
  not_verified: "غير مُتحقَّق منه",
};

const KPI_AR: Record<string, string> = {
  "kpi-total-cost": "الكلفة الإجمالية المقدّرة للحرب",
  "kpi-damage": "الأضرار المباشرة",
  "kpi-losses": "الخسائر الاقتصادية",
  "kpi-needs": "احتياجات التعافي وإعادة الإعمار",
  "kpi-public-need": "احتياجات القطاع العام",
  "kpi-private-need": "احتياجات القطاع الخاص",
  "kpi-leap-framework": "إطار مشروع LEAP",
  "kpi-leap-loan": "القرض الأولي المُقر",
  "kpi-leap-gap": "الفجوة ضمن الإطار",
  "kpi-disbursed": "المبلغ المدفوع فعلياً",
  "kpi-disbursed-pct": "نسبة الدفع من القرض",
};

export default function ArabicPage() {
  const chain = [6, 7, 8, 9].map((n) => {
    const i = n - 1;
    const sum = (year: "2024" | "2026") =>
      Object.values(stageCounts[year]).reduce((a, layer) => a + layer[i], 0);
    return { stage: CHAIN_AR[n] ?? STAGES[i], y24: sum("2024"), y26: sum("2026") };
  });
  const maxChain = Math.max(...chain.flatMap((c) => [c.y24, c.y26]));

  const statusMix = ["underway", "procurement", "formal_mandate", "not_verified"]
    .map((status) => ({
      status,
      label: STATUS_AR[status] ?? STATUS_LABELS[status] ?? status,
      count: roleRecords.filter(
        (r) =>
          r.year === 2026 &&
          [6, 7, 8, 9].includes(r.stageNo) &&
          r.implementationStatus === status,
      ).length,
    }))
    .filter((s) => s.count > 0);

  const layerTotals = LAYER_META.map((l) => ({
    id: l.id,
    color: l.color,
    label: LAYER_AR[l.id] ?? l.label,
    y24: stageCounts["2024"][l.id].reduce((a, b) => a + b, 0),
    y26: stageCounts["2026"][l.id].reduce((a, b) => a + b, 0),
  }));
  const maxLayer = Math.max(...layerTotals.flatMap((t) => [t.y24, t.y26]));

  return (
    <div dir="rtl" lang="ar" className="text-right">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#0e2542] bg-[color:var(--color-navy)] bg-[linear-gradient(200deg,#122e50_0%,#173b63_55%,#1c4a7c_100%)]">
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
        <div className="relative mx-auto max-w-[1360px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-semibold tracking-widest text-[color:var(--color-amber)]">
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
              className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--color-amber)] px-5 text-sm font-semibold text-[#2a1e00] hover:bg-[#e8ab1a]"
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
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/20 pt-6 sm:grid-cols-4">
            {AR.glance.map(([n, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block text-2xl font-semibold tabular-nums text-white">
                    {n}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-white/65">
                    {label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Reconstruction pulse */}
      <section className="mx-auto max-w-[1360px] px-4 pt-12 sm:px-6">
        <div className="card border-r-4 border-r-[color:var(--color-navy)] p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[color:var(--color-navy)] sm:text-2xl">
            {AR.pulse.title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-loose text-[color:var(--color-text-secondary)]">
            {AR.pulse.lede}
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="text-[13px] font-bold text-[color:var(--color-text-secondary)]">
                {AR.pulse.presence}
              </h3>
              <ul className="mt-3 space-y-3">
                {chain.map((c) => (
                  <li key={c.stage}>
                    <p className="text-[13px] font-medium">{c.stage}</p>
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
                        <span className="text-[12px] font-semibold tabular-nums">
                          {row.v}
                        </span>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[color:var(--color-text-secondary)]">
                {AR.pulse.statuses}
              </h3>
              <ul className="mt-3 space-y-2">
                {statusMix.map((s) => (
                  <li key={s.status} className="flex items-center justify-between gap-2">
                    <span className="rounded-sm bg-[#EEF2F7] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-navy)]">
                      {s.label}
                    </span>
                    <span className="tabular-nums text-sm font-semibold text-[color:var(--color-navy)]">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[color:var(--color-text-secondary)]">
                {AR.pulse.pipeline}
              </h3>
              <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-[color:var(--color-navy)]">
                {finance.procurementPackages.length}
                <span className="mr-2 align-middle text-sm font-medium text-[color:var(--color-text-secondary)]">
                  {AR.pulse.packages}
                </span>
              </p>
              <p className="mt-3 rounded-sm bg-[#F7E9E5] px-2.5 py-1.5 text-xs font-medium leading-relaxed text-[color:var(--color-rust)]">
                {AR.pulse.zeroContracts}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Layer shift */}
      <section className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6">
        <h2 className="text-xl font-semibold text-[color:var(--color-navy)] sm:text-2xl">
          من ربح ومن خسر موقعه، 2024 ← 2026
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {layerTotals.map((t) => {
            const delta = t.y26 - t.y24;
            return (
              <div
                key={t.id}
                className="card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-navy)]">
                    <span
                      aria-hidden
                      className="h-3 w-3 rounded-sm"
                      style={{ background: t.color }}
                    />
                    {t.label}
                  </span>
                  <span
                    className="rounded-sm px-1.5 py-0.5 text-xs font-bold tabular-nums"
                    style={{
                      background: delta >= 0 ? "#E8F1EC" : "#F7E9E5",
                      color: delta >= 0 ? "#1F6B4E" : "#BD5A46",
                    }}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta}
                  </span>
                </div>
                {[
                  { year: "2024", v: t.y24, color: "#58779B" },
                  { year: "2026", v: t.y26, color: "#2F8F6B" },
                ].map((row) => (
                  <div key={row.year} className="mt-1.5 flex items-center gap-2">
                    <span className="w-9 text-[11px] tabular-nums text-[color:var(--color-text-secondary)]">
                      {row.year}
                    </span>
                    <span
                      aria-hidden
                      className="h-2.5 rounded-sm"
                      style={{
                        width: `${Math.max(3, (row.v / maxLayer) * 80)}%`,
                        background: row.color,
                      }}
                    />
                    <span className="text-[12px] font-semibold tabular-nums">{row.v}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* KPIs */}
      <section className="mx-auto max-w-[1360px] px-4 pb-12 sm:px-6">
        <h2 className="text-xl font-semibold text-[color:var(--color-navy)] sm:text-2xl">
          {AR.kpis.title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-loose text-[color:var(--color-text-secondary)]">
          {AR.kpis.lede}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <article
              key={kpi.id}
              className="card p-4"
            >
              <h3 className="text-[13px] font-medium leading-snug text-[color:var(--color-text-secondary)]">
                {KPI_AR[kpi.id] ?? kpi.label}
              </h3>
              <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-[color:var(--color-navy)]">
                {kpi.display}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Cross-locale notice */}
      <section className="mx-auto max-w-[1360px] px-4 pb-16 sm:px-6">
        <p className="rounded-md border-r-4 border-[color:var(--color-amber)] bg-white p-4 text-sm leading-loose text-[color:var(--color-text-secondary)]">
          {AR.notice}{" "}
          <Link
            href="/"
            lang="en"
            dir="ltr"
            className="font-semibold text-[color:var(--color-blue)] underline-offset-2 hover:underline"
          >
            {AR.nav.english}
          </Link>
        </p>
      </section>
    </div>
  );
}
