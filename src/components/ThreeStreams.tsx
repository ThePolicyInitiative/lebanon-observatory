import type { Locale } from "@/lib/vocab";

/**
 * The three institutionally separate streams running from 2 March 2026.
 * Confusing them is the most common analytical error in commentary on
 * this period, so the site states the separation explicitly.
 */
const STREAMS = [
  {
    n: 1,
    color: "var(--color-teal)",
    bg: "#E8F1F3",
    en: {
      title: "Recovery from the 2023–24 war",
      items: [
        "The LEAP programme (effective 26 Feb 2026)",
        "The compensation framework of January 2026",
        "Law 22/2025",
      ],
      verdict:
        "Legally scoped to the previous conflict, financed (partially) - the only stream with a project chain.",
      status: "Financed, procedural, unconverted",
    },
    ar: {
      title: "التعافي من حرب 2023-24",
      items: [
        "برنامج LEAP (نافذ في 26 شباط 2026)",
        "إطار التعويضات في كانون الثاني 2026",
        "القانون 22/2025",
      ],
      verdict:
        "نطاقه القانوني محصور بالحرب السابقة، ومموَّل جزئياً - وهو المسار الوحيد الذي له سلسلة مشروع.",
      status: "مموَّل، إجرائي، غير محوَّل",
    },
  },
  {
    n: 2,
    color: "var(--color-blue)",
    bg: "#EEF2F7",
    en: {
      title: "Emergency response to the 2026 war",
      items: [
        "The reactivated DRM / NEOR system",
        "MoSA's formalised humanitarian-coordination mandate",
        "The appeal-funded relief operation",
      ],
      verdict: "Fast, functional - and not a reconstruction system.",
      status: "Operational",
    },
    ar: {
      title: "الاستجابة الطارئة لحرب 2026",
      items: [
        "نظام إدارة الكوارث وغرفة العمليات الوطنية بعد إعادة تفعيله",
        "تفويض التنسيق الإنساني الذي رُسّم لوزارة الشؤون الاجتماعية",
        "عملية الإغاثة المموَّلة بالنداء",
      ],
      verdict: "سريع وفعّال - وليس نظام إعادة إعمار.",
      status: "عامل",
    },
  },
  {
    n: 3,
    color: "var(--color-rust)",
    bg: "#F7E9E5",
    en: {
      title: "Future reconstruction from the 2026 war",
      items: [
        "An analytical base under construction (two bounded assessments, a real-time database)",
        "No LEAP amendment",
        "No new compensation decision",
        "No dedicated financing identified",
      ],
      verdict:
        "As of the cut-off: no financed instrument of any kind. Households hit in March 2026 faced, structurally, exactly the 2024 vacuum - beside a functioning state programme legally unable to serve them.",
      status: "Empty",
    },
    ar: {
      title: "إعادة الإعمار المقبلة من حرب 2026",
      items: [
        "قاعدة تحليلية قيد البناء (تقييمان محدودان، وقاعدة معطيات آنية)",
        "لا تعديل على LEAP",
        "لا قرار تعويض جديد",
        "لا تمويل مخصَّص محدَّد",
      ],
      verdict:
        "حتى تاريخ التوقف: لا أداة تمويل من أي نوع. والأسر التي أُصيبت في آذار 2026 واجهت بنيوياً الفراغ نفسه الذي ساد في 2024 - إلى جانب برنامج حكومي عامل لا يستطيع قانوناً أن يخدمها.",
      status: "فارغ",
    },
  },
] as const;

const T = {
  en: {
    title: "Three streams that must not be merged",
    sub: "From 2 March 2026 Lebanon ran three institutionally separate streams. Most public confusion about “Lebanon's reconstruction” in mid-2026 stems from reading stream two's visible activity (meals, shelters, road clearing) or stream one's procedural milestones (tenders, disbursement) as if they belonged to stream three - which remained empty.",
    stream: (n: number) => `Stream ${n}`,
    caveat:
      "The firewall between the emergency chain and the project chain is not an oversight; it is the design - it protects the programme's legal scope and fiduciary perimeter, and its cost is deferred rather than avoided. Nothing in the design connects the emergency system's real-time knowledge of 2026 damage to any financed response to that damage, because none exists.",
  },
  ar: {
    title: "ثلاثة مسارات لا يجوز دمجها",
    sub: "منذ 2 آذار 2026 كان في لبنان ثلاثة مسارات منفصلة مؤسسياً. ومعظم الالتباس العام حول «إعادة إعمار لبنان» في منتصف 2026 سببه قراءة نشاط المسار الثاني الظاهر (وجبات، مراكز إيواء، فتح طرق) أو محطات المسار الأول الإجرائية (مناقصات، دفعات) وكأنها تخصّ المسار الثالث - الذي بقي فارغاً.",
    stream: (n: number) => `المسار ${n}`,
    caveat:
      "الجدار الفاصل بين سلسلة الطوارئ وسلسلة المشروع ليس سهواً، بل هو التصميم نفسه - يحمي النطاق القانوني للبرنامج ومحيطه المالي، وكلفته مؤجَّلة لا مُتفاداة. ولا شيء في التصميم يربط معرفة نظام الطوارئ الآنية بأضرار 2026 بأي استجابة مموَّلة لتلك الأضرار، لأن مثلها غير موجود.",
  },
} as const;

export default function ThreeStreams({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  return (
    <figure className="card">
      <figcaption>
        <h3 className="text-lead font-semibold text-navy">
          {tr.title}
        </h3>
        <p className="mt-1 text-body text-text-secondary">
          {tr.sub}
        </p>
      </figcaption>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {STREAMS.map((s) => {
          const c = s[locale];
          return (
            <section
              key={s.n}
              aria-label={`${tr.stream(s.n)}: ${c.title}`}
              className="flex flex-col rounded-md border border-border"
            >
              <header
                className="flex items-center justify-between gap-2 rounded-t-md px-3.5 py-2.5"
                style={{ background: s.bg }}
              >
                <h4 className="text-body font-semibold" style={{ color: s.color }}>
                  {tr.stream(s.n)} - {c.title}
                </h4>
              </header>
              <ul className="flex-1 space-y-1.5 px-3.5 pt-3 text-meta">
                {c.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: s.color }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="px-3.5 pt-2.5 text-meta leading-relaxed text-text-secondary">
                {c.verdict}
              </p>
              <p className="px-3.5 py-3">
                <span
                  className="rounded-sm border px-2 py-0.5 text-micro font-semibold uppercase tracking-wide"
                  style={{ color: s.color, borderColor: s.color }}
                >
                  {c.status}
                </span>
              </p>
            </section>
          );
        })}
      </div>
      <p className="mt-3 note-caution text-meta leading-relaxed text-text-secondary">
        {tr.caveat}
      </p>
    </figure>
  );
}
