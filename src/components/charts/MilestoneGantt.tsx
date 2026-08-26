"use client";

import ChartFrame from "./ChartFrame";
import type { Locale } from "@/lib/vocab";
import { UI, YEAR_COLORS } from "@/lib/colors";

/**
 * The road from cabinet request to 1.65% disbursed: elapsed days between
 * each LEAP milestone, drawn to scale.
 */
const MILESTONES: { date: string; label: string; labelAr: string }[] = [
  { date: "2024-12-17", label: "Cabinet requests RDNA", labelAr: "مجلس الوزراء يطلب تقييم RDNA" },
  { date: "2025-06-24", label: "Board approves US$250M loan", labelAr: "المجلس يقرّ قرض 250 مليون دولار" },
  { date: "2025-08-25", label: "Loan agreement signed", labelAr: "توقيع اتفاقية القرض" },
  { date: "2025-12-19", label: "Parliamentary ratification", labelAr: "الإبرام في مجلس النواب" },
  { date: "2026-02-26", label: "LEAP effective", labelAr: "نفاذ مشروع LEAP" },
  { date: "2026-05-13", label: "First disbursement", labelAr: "أول دفعة" },
  { date: "2026-06-29", label: "US$4.13M disbursed (1.65%)", labelAr: "دفع 4.13 مليون دولار (1.65%)" },
];

const SEGMENT_COLORS = [YEAR_COLORS.y2024, "#6E8AA8", "#8496AF", "#9AA9BD", "#B0BCCB", UI.rust];

function days(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

const T = {
  en: {
    days: (n: number) => `How long the money took: ${n} days, step by step`,
    sub: "The full official path of the LEAP reconstruction loan, drawn to scale. It starts on 17 December 2024, when the cabinet asked the World Bank to assess the damage, and ends on 29 June 2026, by which point US$4.13 million of the US$250 million loan - 1.65% - had actually been paid out. Each coloured segment is the wait between two official steps, and every step - approval, signing, ratification, effectiveness - consumed months while destruction accumulated.",
    caveat: "Milestone dates from the tracked timeline; the 2026 war began on 2 March 2026, four days after LEAP became effective. Elapsed time measures institutional sequence, not fault: each step has its own legal prerequisites.",
    days_: (n: number) => `${n} days`,
    bar: (n: number) => `Proportional bar of ${n} days across six milestone intervals`,
  },
  ar: {
    days: (n: number) => `كم استغرق المال: ${n} يوماً، خطوةً خطوة`,
    sub: "المسار الرسمي الكامل لقرض LEAP لإعادة الإعمار، مرسوماً بالمقياس. يبدأ في 17 كانون الأول 2024 حين طلب مجلس الوزراء من البنك الدولي تقييم الأضرار، وينتهي في 29 حزيران 2026 وقد دُفع فعلياً 4.13 ملايين دولار من قرض الـ250 مليوناً، أي 1.65%. كل مقطع ملوَّن هو الانتظار بين خطوتين رسميتين، وكل خطوة - الإقرار والتوقيع والإبرام والنفاذ - استهلكت شهوراً بينما كان الدمار يتراكم.",
    caveat: "تواريخ المحطات من الجدول الزمني المتتبَّع؛ وحرب 2026 بدأت في 2 آذار 2026، أي بعد أربعة أيام من نفاذ LEAP. الزمن المنقضي يقيس التسلسل المؤسسي لا الخطأ: لكل خطوة شروطها القانونية المسبقة.",
    days_: (n: number) => `${n} يوماً`,
    bar: (n: number) => `شريط متناسب يمثّل ${n} يوماً موزّعة على ستة فواصل بين المحطات`,
  },
} as const;

export default function MilestoneGantt({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  const name = (m: (typeof MILESTONES)[number]) => (locale === "ar" ? m.labelAr : m.label);
  const segments = MILESTONES.slice(0, -1).map((m, i) => ({
    from: m,
    to: MILESTONES[i + 1],
    days: days(m.date, MILESTONES[i + 1].date),
  }));
  const totalDays = days(MILESTONES[0].date, MILESTONES[MILESTONES.length - 1].date);

  return (
    <ChartFrame
      id="milestone-gantt"
      title={tr.days(totalDays)}
      subtitle={tr.sub}
      caveat={tr.caveat}
      description={`${segments.map((s) => `${name(s.from)} → ${name(s.to)}: ${tr.days_(s.days)}`).join("; ")}. ${tr.days_(totalDays)}.`}
      table={{
        caption: "Elapsed days between LEAP milestones.",
        headers: ["From", "To", "Date reached", "Days elapsed"],
        rows: segments.map((s) => [name(s.from), name(s.to), s.to.date, s.days]),
      }}
    >
      <div>
        <div
          className="flex h-9 w-full overflow-hidden rounded-md"
          role="img"
          aria-label={tr.bar(totalDays)}
        >
          {segments.map((s, i) => (
            <div
              key={s.to.date}
              className="flex items-center justify-center text-[10px] font-semibold text-white"
              style={{
                width: `${(s.days / totalDays) * 100}%`,
                background: SEGMENT_COLORS[i],
              }}
              title={`${name(s.from)} → ${name(s.to)}: ${tr.days_(s.days)}`}
            >
              {s.days >= 40 ? s.days : ""}
            </div>
          ))}
        </div>
        <ol className="mt-3 space-y-1 text-xs leading-relaxed text-[color:var(--color-text-secondary)]">
          {segments.map((s, i) => (
            <li key={s.to.date} className="flex items-baseline gap-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 translate-y-px rounded-[2px]"
                style={{ background: SEGMENT_COLORS[i] }}
              />
              <span>
                <strong className="text-[color:var(--color-navy)]">{tr.days_(s.days)}</strong>{" "}
                - {name(s.from)} → {name(s.to)}{" "}
                <span className="tabular-nums">({s.to.date})</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </ChartFrame>
  );
}
