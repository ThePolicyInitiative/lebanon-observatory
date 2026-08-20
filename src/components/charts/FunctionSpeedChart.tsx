"use client";

import { useMemo, useRef } from "react";
import type { Locale } from "@/lib/vocab";
import type { EChartsOption, ECharts } from "echarts";
import EChart from "./EChart";
import ChartFrame from "./ChartFrame";

/**
 * Speed is an architecture, not a temperament: fast functions have
 * standing assets and rehearsed routines; slow ones stack novel
 * institutions, external rules and serial gates.
 */
const ITEMS: {
  label: string;
  labelAr: string;
  days: number;
  display: string;
  displayAr: string;
  emergency: boolean;
  note: string;
  noteAr: string;
}[] = [
  {
    label: "Emergency operations room activation (2 Mar 2026)",
    labelAr: "تفعيل غرفة العمليات الطارئة (2 آذار 2026)",
    days: 0.2,
    display: "hours",
    displayAr: "ساعات",
    emergency: true,
    note: "The same unit, the same director as 2024 - rehearsed institutional memory.",
    noteAr: "الوحدة نفسها والمدير نفسه منذ 2024 - ذاكرة مؤسسية مُجرَّبة.",
  },
  {
    label: "Registration of 667,000 displaced (2026)",
    labelAr: "تسجيل 667,000 نازح (2026)",
    days: 8,
    display: "8 days",
    displayAr: "8 أيام",
    emergency: true,
    note: "MoSA's single-channel humanitarian routing.",
    noteAr: "توجيه إنساني بقناة واحدة عبر وزارة الشؤون الاجتماعية.",
  },
  {
    label: "344 schools converted to shelters (2026)",
    labelAr: "تحويل 344 مدرسة إلى مراكز إيواء (2026)",
    days: 9,
    display: "9 days",
    displayAr: "9 أيام",
    emergency: true,
    note: "Assets the state already owned; systems the humanitarian sector already ran.",
    noteAr: "أصول تملكها الدولة أصلاً، وأنظمة يديرها القطاع الإنساني أصلاً.",
  },
  {
    label: "Municipal damage survey of 135 areas (Dec 2024)",
    labelAr: "مسح بلدي للأضرار في 135 منطقة (كانون الأول 2024)",
    days: 10,
    display: "10 days",
    displayAr: "10 أيام",
    emergency: true,
    note: "The response's fastest national damage assessments - run entirely on municipal knowledge.",
    noteAr: "أسرع تقييم أضرار وطني في الاستجابة - قام كلياً على المعرفة البلدية.",
  },
  {
    label: "Assessment request → RDNA publication",
    labelAr: "من طلب التقييم إلى نشر RDNA",
    days: 80,
    display: "≈11 weeks",
    displayAr: "نحو 11 أسبوعاً",
    emergency: false,
    note: "17 Dec 2024 → 7 Mar 2025.",
    noteAr: "17 كانون الأول 2024 ← 7 آذار 2025.",
  },
  {
    label: "Works contract cycle, design target",
    labelAr: "دورة عقد الأشغال، الهدف التصميمي",
    days: 84,
    display: "12 weeks",
    displayAr: "12 أسبوعاً",
    emergency: false,
    note: "The reform target the design commits to.",
    noteAr: "الهدف الإصلاحي الذي يلتزم به التصميم.",
  },
  {
    label: "Works contract cycle, baseline",
    labelAr: "دورة عقد الأشغال، خط الأساس",
    days: 392,
    display: "56 weeks",
    displayAr: "56 أسبوعاً",
    emergency: false,
    note: "The system's honest self-description of notice-to-signature time.",
    noteAr: "وصف النظام الصريح لنفسه: الزمن من الإعلان إلى التوقيع.",
  },
  {
    label: "Assessment request → programme effectiveness",
    labelAr: "من طلب التقييم إلى نفاذ البرنامج",
    days: 437,
    display: "≈14 months",
    displayAr: "نحو 14 شهراً",
    emergency: false,
    note: "17 Dec 2024 → 26 Feb 2026, including four months of parliamentary scheduling.",
    noteAr: "17 كانون الأول 2024 ← 26 شباط 2026، منها أربعة أشهر في جدولة مجلس النواب.",
  },
  {
    label: "Assessment request → first disbursement",
    labelAr: "من طلب التقييم إلى أول دفعة",
    days: 512,
    display: "≈17 months",
    displayAr: "نحو 17 شهراً",
    emergency: false,
    note: "17 Dec 2024 → 13 May 2026.",
    noteAr: "17 كانون الأول 2024 ← 13 أيار 2026.",
  },
];

const T = {
  en: {
    title: "Relief moves in days; procedure moves in quarters; reconstruction moves in years",
    sub: "Elapsed time of traced conversions, 2024–2026. Blue: emergency functions running on standing assets and rehearsed routines. Rust: programme functions stacking novel institutions, external rules and serial gates.",
    emergency: "Emergency functions",
    programme: "Programme functions",
    axis: "Elapsed days (linear scale - the disparity is the finding)",
    caveat:
      "'Slow' is measured against Lebanese need and the design's own targets, not an international norm. Each interval is individually defensible; their sum is not, and no institution is accountable for the sum - cost concentrated downward, control dispersed upward.",
    description:
      "Horizontal bars comparing elapsed days: emergency-room activation in hours, displaced registration in 8 days, shelter conversion in 9 days and the municipal survey in 10 days, against 11 weeks to the RDNA, a 56-week baseline works-contract cycle, 14 months to programme effectiveness and 17 months to first disbursement.",
    alt: "Bar chart contrasting the speed of emergency functions with programme functions",
  },
  ar: {
    title: "الإغاثة تتحرك بالأيام، والإجراء بالفصول، وإعادة الإعمار بالسنوات",
    sub: "الزمن المنقضي للتحوّلات المرصودة، 2024-2026. الأزرق: وظائف طوارئ تعمل على أصول قائمة وروتين مُجرَّب. الخمري: وظائف برنامجية تكدّس مؤسسات جديدة وقواعد خارجية وبوابات متتالية.",
    emergency: "وظائف الطوارئ",
    programme: "الوظائف البرنامجية",
    axis: "الأيام المنقضية (مقياس خطي - والتفاوت نفسه هو الخلاصة)",
    caveat:
      "«البطء» هنا مقيس بالاحتياج اللبناني وبأهداف التصميم نفسه، لا بمعيار دولي. كل فاصل زمني قابل للتبرير وحده، لكن مجموعها ليس كذلك، ولا مؤسسة مسؤولة عن المجموع - الكلفة تتركّز نزولاً والسيطرة تتوزّع صعوداً.",
    description:
      "أعمدة أفقية تقارن الأيام المنقضية: تفعيل غرفة الطوارئ خلال ساعات، وتسجيل النازحين في 8 أيام، وتحويل المدارس إلى إيواء في 9 أيام، والمسح البلدي في 10 أيام، مقابل 11 أسبوعاً حتى تقييم RDNA، و56 أسبوعاً خط أساس لدورة عقد الأشغال، و14 شهراً حتى نفاذ البرنامج، و17 شهراً حتى أول دفعة.",
    alt: "رسم أعمدة يقابل سرعة وظائف الطوارئ بسرعة الوظائف البرنامجية",
  },
} as const;

export default function FunctionSpeedChart({ locale = "en" }: { locale?: Locale } = {}) {
  const tr = T[locale];
  const chartRef = useRef<ECharts | null>(null);

  const ar = locale === "ar";
  const option = useMemo<EChartsOption>(() => {
    const rows = [...ITEMS].reverse();
    const name = (i: (typeof ITEMS)[number]) => (ar ? i.labelAr : i.label);
    const shown = (i: (typeof ITEMS)[number]) => (ar ? i.displayAr : i.display);
    return {
      grid: ar
        ? { left: 80, right: 250, top: 30, bottom: 40 }
        : { left: 250, right: 80, top: 30, bottom: 40 },
      legend: {
        top: 0,
        data: [tr.emergency, tr.programme],
        textStyle: { fontSize: 11 },
      },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const params = p as unknown as { dataIndex: number; seriesName: string };
          const item = rows[params.dataIndex];
          return `<strong>${name(item)}</strong><br/>${shown(item)}<br/><span style="font-size:11px;max-width:280px;display:inline-block;white-space:normal">${ar ? item.noteAr : item.note}</span>`;
        },
      },
      xAxis: {
        type: "value",
        inverse: ar,
        name: tr.axis,
        nameLocation: "middle",
        nameGap: 26,
        nameTextStyle: { fontSize: 11 },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#EDF0F4" } },
      },
      yAxis: {
        type: "category",
        position: ar ? "right" : "left",
        data: rows.map(name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: { fontSize: 10.5, width: 240, overflow: "break" },
      },
      series: [
        {
          name: tr.emergency,
          type: "bar",
          stack: "t",
          barMaxWidth: 13,
          data: rows.map((i) => (i.emergency ? { value: i.days } : { value: null })),
          itemStyle: { color: "#2E74B5", borderRadius: 2 },
          label: {
            show: true,
            position: ar ? "left" : "right",
            fontSize: 10.5,
            color: "#263645",
            formatter: (p) => (rows[p.dataIndex].emergency ? shown(rows[p.dataIndex]) : ""),
          },
        },
        {
          name: tr.programme,
          type: "bar",
          stack: "t",
          barMaxWidth: 13,
          data: rows.map((i) => (i.emergency ? { value: null } : { value: i.days })),
          itemStyle: { color: "#BD5A46", borderRadius: 2 },
          label: {
            show: true,
            position: ar ? "left" : "right",
            fontSize: 10.5,
            color: "#263645",
            formatter: (p) => (rows[p.dataIndex].emergency ? "" : shown(rows[p.dataIndex])),
          },
        },
      ],
    };
  }, [ar, tr]);

  return (
    <ChartFrame
      id="function-speed"
      title={tr.title}
      subtitle={tr.sub}
      caveat={tr.caveat}
      sourceIds={["S4", "S2", "S20", "S47", "S1", "S45", "S19"]}
      chartRef={chartRef}
      description={tr.description}
      table={{
        caption: tr.axis,
        headers: ["Conversion", "Elapsed", "Category", "Note"],
        rows: ITEMS.map((i) => [
          ar ? i.labelAr : i.label,
          ar ? i.displayAr : i.display,
          i.emergency ? tr.emergency : tr.programme,
          ar ? i.noteAr : i.note,
        ]),
      }}
    >
      <EChart
        option={option}
        height={420}
        ariaLabel={tr.alt}
        onInit={(c) => {
          chartRef.current = c;
        }}
      />
    </ChartFrame>
  );
}
