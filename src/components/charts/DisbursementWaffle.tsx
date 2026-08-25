"use client";

import ChartFrame from "./ChartFrame";
import type { Locale } from "@/lib/vocab";

/**
 * Waffle of the approved LEAP loan: 100 cells of US$2.5 million each.
 * The disbursed share (1.65% at 29 June 2026) fills less than two cells.
 */
const T = {
  en: {
    title: "US$250 million approved. US$4.13 million disbursed.",
    sub: "Each square is US$2.5 million of the approved World Bank loan. Squares in rust are what had actually been disbursed by 29 June 2026 - 1.65%.",
    caveat:
      "Committed finance is not disbursed finance, and disbursement is not completed output: the disbursed amount itself is not data of works on the ground. Figures from the LEAP Implementation Status and Results Report (seq. 4).",
    description:
      "Waffle chart of 100 squares representing the US$250 million approved loan; 1.65 squares are filled, representing the US$4.13 million disbursed by 29 June 2026.",
    grid: "100 squares; 1.65 filled, representing 1.65% disbursed",
    legendDisbursed: "disbursed - US$4.13M (1.65%)",
    legendUndisbursed: "undisbursed - US$245.87M",
  },
  ar: {
    title: "250 مليون دولار مُقرّة. 4.13 مليون دولار مدفوعة.",
    sub: "كل مربع يعادل 2.5 مليون دولار من قرض البنك الدولي المُقرّ. المربعات الخمرية هي ما دُفع فعلياً حتى 29 حزيران 2026 - أي 1.65%.",
    caveat:
      "التمويل الملتزَم به ليس تمويلاً مدفوعاً، والدفع ليس إنجازاً مكتملاً: المبلغ المدفوع نفسه ليس معطى عن أشغال على الأرض. الأرقام من تقرير حالة التنفيذ والنتائج لمشروع LEAP (الرقم 4).",
    description:
      "رسم مربعات من 100 خانة تمثّل القرض المُقر البالغ 250 مليون دولار؛ 1.65 خانة ممتلئة تمثّل 4.13 مليون دولار مدفوعة حتى 29 حزيران 2026.",
    grid: "100 مربع؛ 1.65 منها ممتلئ، أي 1.65% مدفوعة",
    legendDisbursed: "المدفوع - 4.13 مليون دولار (1.65%)",
    legendUndisbursed: "غير المدفوع - 245.87 مليون دولار",
  },
} as const;

export default function DisbursementWaffle({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  const cells = Array.from({ length: 100 }, (_, i) => i);
  const disbursedPct = 1.65;

  return (
    <ChartFrame
      id="disbursement-waffle"
      title={tr.title}
      subtitle={tr.sub}
      caveat={tr.caveat}
      description={tr.description}
      table={{
        caption: "Approved versus disbursed LEAP financing, 29 June 2026.",
        headers: ["Measure", "US$", "Share of loan"],
        rows: [
          ["Approved loan (IBRD-98410)", "250,000,000", "100%"],
          ["Disbursed", "4,130,000", "1.65%"],
          ["Undisbursed", "245,880,000", "98.35%"],
        ],
      }}
    >
      <div>
        <div
          role="img"
          aria-label={tr.grid}
          className="grid max-w-md grid-cols-20 gap-[3px]"
          style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}
        >
          {cells.map((i) => {
            const fillShare = Math.max(0, Math.min(1, disbursedPct - i));
            return (
              <div
                key={i}
                aria-hidden
                className="aspect-square rounded-[2px]"
                style={
                  fillShare >= 1
                    ? { background: "#BD5A46" }
                    : fillShare > 0
                      ? {
                          background: `linear-gradient(90deg, #BD5A46 ${fillShare * 100}%, #E3E9EF ${fillShare * 100}%)`,
                        }
                      : { background: "#E3E9EF" }
                }
              />
            );
          })}
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[color:var(--color-text-secondary)]">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: "#BD5A46" }} />
            {tr.legendDisbursed}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[2px]" style={{ background: "#E3E9EF" }} />
            {tr.legendUndisbursed}
          </span>
        </p>
      </div>
    </ChartFrame>
  );
}
