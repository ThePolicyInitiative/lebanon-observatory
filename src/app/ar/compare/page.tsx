import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import { roleRecords } from "@/lib/data";
import stageCounts from "@/data/stage-counts.json";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import { layers, stageLabel } from "@/lib/vocab";

export const metadata: Metadata = { title: AR.pages.compare.title };

type Counts = Record<string, number[]>;

export default function Page() {
  const y24 = roleRecords.filter((r) => r.year === 2024).length;
  const y26 = roleRecords.filter((r) => r.year === 2026).length;
  const c24 = stageCounts.counts["2024"] as Counts;
  const c26 = stageCounts.counts["2026"] as Counts;
  const ar = layers("ar");

  /** Layer totals across the twelve stages, and the change between years. */
  const byLayer = ar.map((l) => {
    const a = (c24[l.id] ?? []).reduce((x, y) => x + y, 0);
    const b = (c26[l.id] ?? []).reduce((x, y) => x + y, 0);
    return { ...l, y24: a, y26: b, change: b - a };
  });

  /** The twelve stages, both years, all layers summed. */
  const byStage = Array.from({ length: 12 }, (_, i) => {
    const a = ar.reduce((s, l) => s + (c24[l.id]?.[i] ?? 0), 0);
    const b = ar.reduce((s, l) => s + (c26[l.id]?.[i] ?? 0), 0);
    return { no: i + 1, label: stageLabel(i + 1, "ar"), y24: a, y26: b, change: b - a };
  });
  const maxStage = Math.max(...byStage.flatMap((s) => [s.y24, s.y26]));

  return (
    <ArabicPageShell
      title={AR.pages.compare.title}
      lede={AR.pages.compare.lede}
      point={AR.pages.compare.point}
      englishHref="/compare"
      figures={[
        { value: String(y24), label: "مدخل متتبَّع في 2024" },
        { value: String(y26), label: "مدخل متتبَّع في 2026" },
        { value: String(byLayer.find((l) => l.id === "community")?.y26 ?? 0), label: "منها للمجتمع المحلي في 2026" },
        { value: String(byLayer.find((l) => l.id === "municipal")?.y26 ?? 0), label: "منها للبلديات في 2026" },
      ]}
    >
      {/* By actor layer */}
      <section aria-labelledby="ar-layers" className="mt-10">
        <h2 id="ar-layers" className="text-xl font-semibold text-[color:var(--color-navy)]">
          الحضور المرصود بحسب طبقة الجهات
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          العدّ يقيس حضور جهة في مرحلة، لا إنفاقاً ولا إنجازاً ولا عدد مستفيدين. كما
          أن معطيات 2026 تسمّي بعض الجهات الأهلية والتطوعية بتفصيل أدق مما فعلت
          معطيات 2024.
        </p>
        <ul className="mt-4 space-y-2">
          {byLayer.map((l) => {
            const max = Math.max(...byLayer.flatMap((x) => [x.y24, x.y26]));
            return (
              <li key={l.id} className="card p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[color:var(--color-navy)]">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                    {l.label}
                  </span>
                  <span
                    className={`rounded-sm px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                      l.change > 0
                        ? "bg-[#E8F1EC] text-[#1F6B4E]"
                        : l.change < 0
                          ? "bg-[#F7E9E5] text-[color:var(--color-rust)]"
                          : "bg-[#F2F2EF] text-[color:var(--color-text-secondary)]"
                    }`}
                  >
                    {l.change > 0 ? `+${l.change}` : l.change}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {[
                    { year: "2024", v: l.y24, color: "#58779B" },
                    { year: "2026", v: l.y26, color: "#2F8F6B" },
                  ].map((row) => (
                    <div key={row.year} className="flex items-center gap-2 text-[11.5px]">
                      <span className="w-10 shrink-0 tabular-nums text-[color:var(--color-text-secondary)]">
                        {row.year}
                      </span>
                      <span
                        aria-hidden
                        className="h-2.5 rounded-sm"
                        style={{ width: `${Math.max(2, (row.v / max) * 70)}%`, background: row.color, opacity: 0.85 }}
                      />
                      <span className="tabular-nums font-semibold">{row.v}</span>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* By value-chain stage */}
      <section aria-labelledby="ar-stages" className="mt-10">
        <h2 id="ar-stages" className="text-xl font-semibold text-[color:var(--color-navy)]">
          الحضور المرصود بحسب مرحلة سلسلة القيمة
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          المراحل الاثنتا عشرة، بمجموع الطبقات الأربع، في السنتين.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[560px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-[color:var(--color-border)]">
                <th scope="col" className="py-2 pe-3 text-right font-semibold text-[color:var(--color-navy)]">
                  المرحلة
                </th>
                <th scope="col" className="py-2 pe-3 text-right font-semibold text-[color:var(--color-navy)]">
                  2024
                </th>
                <th scope="col" className="py-2 pe-3 text-right font-semibold text-[color:var(--color-navy)]">
                  2026
                </th>
                <th scope="col" className="py-2 text-right font-semibold text-[color:var(--color-navy)]">
                  الفارق
                </th>
              </tr>
            </thead>
            <tbody>
              {byStage.map((s) => (
                <tr key={s.no} className="border-b border-[#EDF0F4]">
                  <td className="py-1.5 pe-3">
                    <span className="tabular-nums text-[color:var(--color-text-secondary)]">
                      {s.no}.
                    </span>{" "}
                    {s.label}
                  </td>
                  <td className="py-1.5 pe-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="inline-block h-2 rounded-sm bg-[#58779B]"
                        style={{ width: `${Math.max(3, (s.y24 / maxStage) * 60)}px`, opacity: 0.85 }}
                      />
                      <span className="tabular-nums">{s.y24}</span>
                    </span>
                  </td>
                  <td className="py-1.5 pe-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="inline-block h-2 rounded-sm bg-[#2F8F6B]"
                        style={{ width: `${Math.max(3, (s.y26 / maxStage) * 60)}px`, opacity: 0.85 }}
                      />
                      <span className="tabular-nums">{s.y26}</span>
                    </span>
                  </td>
                  <td
                    className={`py-1.5 tabular-nums font-semibold ${
                      s.change > 0
                        ? "text-[#1F6B4E]"
                        : s.change < 0
                          ? "text-[color:var(--color-rust)]"
                          : "text-[color:var(--color-text-secondary)]"
                    }`}
                  >
                    {s.change > 0 ? `+${s.change}` : s.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 note-caution text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          هذه أعداد حضور، لا مقاييس أداء. ارتفاع العدد في مرحلة يعني أن جهات أكثر
          رُصدت فيها، لا أن ما أُنجز فيها أكثر.
        </p>
      </section>

      <div className="mt-10">
        <Takeaways
          locale="ar"
          changed={`الحضور الرسمي اتّسع بين السنتين، ومجموع المدخلات ارتفع من ${y24} إلى ${y26}.`}
          unchanged="مراحل البناء المادي بقيت الأقل حضوراً، ولم تتبدّل مواقع البلديات."
          matters="اتّساع البنية المؤسسية سبق الإنجاز المادي، وهذه المقارنة تُظهر الفجوة بينهما."
        />
      </div>
    </ArabicPageShell>
  );
}
