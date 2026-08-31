import Link from "next/link";
import { roleRecords, stageCounts, finance } from "@/lib/data";
import { stageLabel, statusLabel, type Locale } from "@/lib/vocab";
import { YEAR_COLORS } from "@/lib/colors";
import StateChip from "./StateChip";

/**
 * The reconstruction pulse: what the sources show on the physical
 * rebuilding chain itself - rubble, debris, works, shelter and return -
 * with the honest status mix and the procurement pipeline beside it.
 * One component for both languages: the layout and the figures are
 * shared, only the words switch with `locale`.
 */

const CHAIN_STAGE_NOS = [6, 7, 8, 9]; // Rubble clearance → Shelter and return
const STATUS_ORDER = ["underway", "procurement", "formal_mandate", "not_verified"];
/*
 * The status tints that used to live here painted procurement in the NGO
 * teal and formal mandate in the official navy - two of the four actor
 * layer colours, encoding something that is not an actor layer - and
 * hand-typed a green belonging to no token. StateChip draws them as ink
 * instead. See the state ramp in globals.css.
 */

/** The procurement portal's status wording, rendered in Arabic. */
const STATUS_AT_CHECK_AR: Record<string, string> = {
  "Under evaluation": "قيد التقييم",
  "No award displayed": "لم يُعرض أي إرساء",
};

const T = {
  en: {
    title: "Reconstruction on the ground",
    lede:
      "The physical rebuilding chain - rubble clearance, debris treatment, reconstruction works, shelter and return - as the tracking actually shows it: who is present, at what status, and what the procurement pipeline has produced.",
    presence: "Traced presence, 2024 → 2026",
    statusHeading: (n: number) => `Status of the ${n} chain entries, 2026`,
    statusHonesty:
      "Traced activity is not completed output: the tracking contains no confirmed completed reconstruction outputs by 31 August 2026, and “not confirmed” marks presence the reporting cannot grade - never assumed zero, never assumed done.",
    pipeline: "The procurement pipeline",
    packages: "LEAP packages tracked",
    zeroContracts:
      "Works contracts awarded by 31 August 2026: zero. Procurement under way is a process milestone, not reconstruction.",
    financeLink: "Finance & delivery →",
    mapLink: "Where work is traced →",
  },
  ar: {
    title: "إعادة الإعمار على الأرض",
    lede:
      "سلسلة إعادة البناء المادية - رفع الأنقاض، معالجة الركام، أعمال إعادة الإعمار، الإيواء والعودة - كما يُظهرها التتبّع: من هو حاضر، وبأي وضع، وما الذي أنتجته سلسلة الشراء.",
    presence: "الحضور المرصود، 2024 ← 2026",
    statusHeading: (n: number) => `أوضاع مدخلات السلسلة الـ${n}، 2026`,
    statusHonesty:
      "النشاط المرصود ليس إنجازاً مكتملاً: فالتتبّع لا يتضمن أي مخرجات إعادة إعمار مكتملة مؤكَّدة حتى 31 آب 2026، و“غير مؤكَّد” يعلّم حضوراً لا يستطيع الإبلاغ تصنيفه - لا يُفترض أنه صفر أبداً، ولا يُفترض أنه أُنجز أبداً.",
    pipeline: "مسار الشراء",
    packages: "حزم LEAP المتتبَّعة",
    zeroContracts:
      "عقود الأشغال المُرساة حتى 31 آب 2026: صفر. الشراء الجاري مرحلة إجرائية، لا إعادة إعمار.",
    financeLink: "التمويل والإنجاز ←",
    mapLink: "أين رُصد العمل ←",
  },
} as const;

export default function ReconstructionPulse({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const ar = locale === "ar";
  const base = ar ? "/ar" : "";

  const chainTotals = CHAIN_STAGE_NOS.map((n) => {
    const i = n - 1;
    const sum = (year: "2024" | "2026") =>
      Object.values(stageCounts[year]).reduce((a, layer) => a + layer[i], 0);
    return { stage: stageLabel(n, locale), y24: sum("2024"), y26: sum("2026") };
  });
  const maxChain = Math.max(...chainTotals.flatMap((c) => [c.y24, c.y26]));

  const statusMix = STATUS_ORDER.map((status) => ({
    status,
    label: statusLabel(status, locale),
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
      <div
        className={`card ${
          ar
            ? "border-r-4 border-r-navy"
            : "border-l-4 border-l-navy"
        }`}
      >
        <h2
          id="recon-pulse"
          className="text-h2 font-semibold text-navy"
        >
          {t.title}
        </h2>
        <p
          className={`mt-2 max-w-3xl text-body text-text-secondary ${
            ar ? "leading-loose" : "leading-relaxed"
          }`}
        >
          {t.lede}
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          {/* Traced presence on the physical chain */}
          <div>
            <h3
              className={`text-meta font-bold text-text-secondary ${
                ar ? "" : "uppercase tracking-wide"
              }`}
            >
              {t.presence}
            </h3>
            <ul className="mt-3 space-y-3">
              {chainTotals.map((c) => (
                <li key={c.stage}>
                  <p className="text-meta font-medium text-text">
                    {c.stage}
                  </p>
                  {[
                    { year: "2024", v: c.y24, color: "#58779B" },
                    { year: "2026", v: c.y26, color: YEAR_COLORS.y2026 },
                  ].map((row) => (
                    <div key={row.year} className="mt-1 flex items-center gap-2">
                      <span className="w-9 text-micro tabular-nums text-text-secondary">
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
                      <span className="text-meta font-semibold tabular-nums">{row.v}</span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </div>

          {/* Status honesty */}
          <div>
            <h3
              className={`text-meta font-bold text-text-secondary ${
                ar ? "" : "uppercase tracking-wide"
              }`}
            >
              {t.statusHeading(chainRecords2026)}
            </h3>
            <ul className="mt-3 space-y-2">
              {statusMix.map((s) => (
                <li key={s.status} className="flex items-center justify-between gap-2">
                  <StateChip status={s.status} locale={locale} />
                  <span className="tabular-nums text-body font-semibold text-navy">
                    {s.count}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-meta leading-relaxed text-text-secondary">
              {t.statusHonesty}
            </p>
          </div>

          {/* Procurement pipeline */}
          <div>
            <h3
              className={`text-meta font-bold text-text-secondary ${
                ar ? "" : "uppercase tracking-wide"
              }`}
            >
              {t.pipeline}
            </h3>
            <p className="mt-3 text-h1 font-bold tabular-nums tracking-tight text-navy">
              {packages.length}
              <span className="ms-2 align-middle text-meta font-medium text-text-secondary">
                {t.packages}
              </span>
            </p>
            <ul className="mt-2 space-y-1.5 text-meta leading-relaxed text-text-secondary">
              {packages.slice(0, 3).map((p) => {
                const label = ar ? p.labelAr ?? p.label : p.label;
                const status = ar
                  ? STATUS_AT_CHECK_AR[p.statusAtCheck] ?? p.statusAtCheck
                  : p.statusAtCheck;
                return (
                  <li key={p.id}>
                    <span className="font-medium text-text">
                      {label.split(" - ")[1] ?? label}
                    </span>{" "}
                    - {status}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 rounded-sm bg-[#F7E9E5] px-2.5 py-1.5 text-meta font-medium text-rust">
              {t.zeroContracts}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-body">
              <Link
                href={`${base}/money`}
                className="font-medium text-blue underline-offset-2 hover:underline"
              >
                {t.financeLink}
              </Link>
              <Link
                href={`${base}/map`}
                className="font-medium text-blue underline-offset-2 hover:underline"
              >
                {t.mapLink}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
