import ops from "@/data/service-operators.json";
import type { Locale } from "@/lib/vocab";
import { UI, YEAR_COLORS } from "@/lib/colors";

const T = {
  en: {
    title: "The networks, operator by operator",
    badge: "Operator-reported · not in the tracking",
    reaches: "Reaches the area",
    where: "Where:",
    when: "When:",
    howToRead: "How to read these accounts",
    seeMore: "See more ▸",
    seeLess: "See less ▾",
  },
  ar: {
    title: "الشبكات، مؤسسة بمؤسسة",
    badge: "بحسب المشغّل · خارج التتبّع",
    reaches: "تصل إلى المنطقة",
    where: "أين:",
    when: "متى:",
    howToRead: "كيف تُقرأ هذه الروايات",
    seeMore: "تفاصيل أكثر ◂",
    seeLess: "إخفاء التفاصيل ▾",
  },
} as const;

const SERVICE_AR: Record<string, string> = {
  Electricity: "الكهرباء",
  Telecommunications: "الاتصالات",
  "Irrigation and hydropower": "الري والطاقة المائية",
  "Roads and bridges": "الطرق والجسور",
};

/**
 * The public service operators on their own networks. Same quarantine as
 * everything else web-sourced: none of it enters the counts. It earns its
 * place by being specific - a named substation, one 66 kV line, a single
 * replacement tower - where the assessments only reach the sector.
 */

/**
 * Long passages open from a "See more". The first sentence always stays on
 * the card: what collapses is the elaboration, never the point itself.
 * Sentence split ignores decimals - "US$1.38 billion" must not break.
 */
function Expandable({ text, className = "", labels }: { text: string; className?: string; labels: { more: string; less: string } }) {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z(])/);
  if (parts.length < 2 || text.length < 190) {
    return <p className={className}>{text}</p>;
  }
  const [head, ...rest] = parts;
  // The group name is written out, never interpolated: Tailwind scans the
  // source statically and would emit no rule for a computed class.
  return (
    <details className="group/exp">
      <summary
        className={`cursor-pointer list-none [&::-webkit-details-marker]:hidden ${className}`}
      >
        {head}{" "}
        <span className="whitespace-nowrap font-semibold text-blue underline-offset-2 hover:underline">
          <span className="group-open/exp:hidden">{labels.more}</span>
          <span className="hidden group-open/exp:inline">{labels.less}</span>
        </span>
      </summary>
      <p className={`mt-1 ${className}`}>{rest.join(" ")}</p>
    </details>
  );
}

const SERVICE_TONE: Record<string, string> = {
  Electricity: UI.amber,
  Telecommunications: UI.teal,
  "Irrigation and hydropower": YEAR_COLORS.y2026,
  "Roads and bridges": UI.magenta,
};

export default function ServiceOperators({ locale = "en" }: { locale?: Locale } = {}) {
  const t = T[locale];
  const ar = locale === "ar";
  const labels = { more: t.seeMore, less: t.seeLess };
  return (
    <section
      aria-labelledby="service-operators"
      className="rounded-md border border-dashed border-border bg-[#FBFCFD] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="service-operators"
          className="text-xl font-semibold text-navy"
        >
          {t.title}
        </h2>
        <span
          className={`rounded-sm bg-[#FAF3E3] px-2 py-0.5 text-[10px] font-bold text-[#8a6200] ${
            ar ? "" : "uppercase tracking-wide"
          }`}
        >
          {t.badge}
        </span>
      </div>
      <p className="mt-2 prose-measure text-sm leading-relaxed text-text-secondary">
        {ar
          ? "الكهرباء والاتصالات والري والطرق، كما يصف المشغّلون أنفسهم إعادتها إلى الخدمة. الدقة هنا هي نفسها في منشورات مؤسسة المياه، والوضع نفسه: غير مؤكَّد، وخارج كل أعداد هذا الموقع. وهي هنا لأن هذه الروايات تسمّي المحطة والخط والجسر والتاريخ، بينما يتوقف كل تقييم عند حدود القطاع."
          : "Electricity, telecoms, irrigation and roads, as the operators themselves describe restoring them. This is the same granularity as the water utility's own posts and the same standing: unconfirmed, and in none of this site's counts. It is here because these accounts name the substation, the line, the bridge and the date, where every assessment stops at the sector."}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ops.operators.map((o) => (
          <article key={o.id} className="card">
            <p className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span
                className="rounded-sm px-1.5 py-0.5 font-semibold text-white"
                style={{ background: SERVICE_TONE[o.service] ?? "#58779B" }}
              >
                {ar ? (o.serviceAr ?? SERVICE_AR[o.service] ?? o.service) : o.service}
              </span>
              {o.inArea ? (
                <span className="rounded-sm bg-[#E8F1EC] px-1.5 py-0.5 font-semibold text-[#1F6B4E]">
                  {t.reaches}
                </span>
              ) : null}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-navy">
              {ar ? (o.nameAr ?? o.name) : o.name}
            </h3>
            <p className="mt-0.5 text-[13px] font-medium italic text-text-secondary">
              {ar ? (o.headlineAr ?? o.headline) : o.headline}
            </p>

            <ul className="mt-3 space-y-3">
              {o.items.map((i) => {
                const figure: string | null = ar ? (i.figureAr ?? i.figure) : i.figure;
                return (
                <li key={i.what.slice(0, 40)} className="panel-sunken p-2.5">
                  <Expandable
                    labels={labels}
                    text={ar ? (i.whatAr ?? i.what) : i.what}
                    className="text-[12.5px] leading-relaxed text-text"
                  />
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-secondary">
                    {figure ? (
                      <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 font-semibold tabular-nums text-navy">
                        {figure}
                      </span>
                    ) : null}
                    <span>
                      <span className="font-semibold">{t.where}</span>{" "}
                      {ar ? (i.whereAr ?? i.where) : i.where}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-secondary">
                    <span className="font-semibold">{t.when}</span>{" "}
                    {ar ? (i.dateAr ?? i.date) : i.date}
                  </p>
                </li>
                );
              })}
            </ul>

            <div className="note-caution mt-3">
              <Expandable
                labels={labels}
                text={ar ? (o.constraintAr ?? o.constraint) : o.constraint}
                className="text-[11.5px] leading-relaxed text-text-secondary"
              />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-dashed border-border pt-1.5 text-[11px]">
              <a
                href={o.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue underline-offset-2 hover:underline"
              >
                {o.sourceName} ↗
              </a>
            </p>
          </article>
        ))}
      </div>

      {/* The finding two ministries state independently */}
      <div className="mt-4 rounded-md border-2 border-rust bg-[#FBF3F0] p-4">
        <h3 className="text-sm font-bold text-rust">
          {ar ? ops.crossCutting.titleAr : ops.crossCutting.title}
        </h3>
        <p className="mt-1.5 prose-measure text-[13px] leading-relaxed text-text">
          {ar ? ops.crossCutting.textAr : ops.crossCutting.text}
        </p>
        <p className="mt-2 text-[11px]">
          <a
            href={ops.crossCutting.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue underline-offset-2 hover:underline"
          >
            {ops.crossCutting.sourceName} ↗
          </a>
        </p>
      </div>

      {/* The date every timeline on this page runs into */}
      <div className="mt-4 rounded-md border-2 border-navy bg-[#EEF2F7] p-4">
        <h3 className="text-sm font-bold text-navy">
          {ar ? ops.horizon.titleAr : ops.horizon.title}
        </h3>
        <p className="mt-1.5 prose-measure text-[13px] leading-relaxed text-text">
          {ar ? ops.horizon.textAr : ops.horizon.text}
        </p>
        <p className="mt-2 text-[11px]">
          <a
            href={ops.horizon.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue underline-offset-2 hover:underline"
          >
            {ops.horizon.sourceName} ↗
          </a>
        </p>
      </div>

      <details className="mt-4 rounded-md border border-dashed border-border bg-white p-3">
        <summary className="cursor-pointer text-[12px] font-bold text-navy">
          {t.howToRead} ({ops.caveats.length})
        </summary>
        <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-text-secondary">
          {(ar ? ops.caveatsAr : ops.caveats).map((c) => (
            <li key={c.slice(0, 30)} className="flex gap-2">
              <span
                aria-hidden
                className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rust"
              />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
