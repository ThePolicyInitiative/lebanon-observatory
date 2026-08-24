import type { Metadata } from "next";
import Link from "next/link";
import { AR, localeAlternates } from "@/lib/i18n";
import destruction from "@/data/destruction.json";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import DistrictDamageChart from "@/components/charts/DistrictDamageChart";
import SectorDamageChart from "@/components/charts/SectorDamageChart";
import WorstCadastersChart from "@/components/charts/WorstCadastersChart";
import DebrisTiles from "@/components/charts/DebrisTiles";
import ServiceImpact from "@/components/ServiceImpact";
import HumanToll from "@/components/HumanToll";
import { comparabilityLabel } from "@/lib/vocab";
import { fmtDate } from "@/lib/format";

export const metadata: Metadata = {
  title: AR.pages.damage.title,
  description: AR.pages.damage.desc,
  alternates: localeAlternates("/damage", "ar"),
};

export default function Page() {
  return (
    <ArabicPageShell
      title={AR.pages.damage.title}
      lede={AR.pages.damage.lede}
      point={AR.pages.damage.point}
      englishHref="/damage"
      figures={[
        { value: "4", label: "مسارات غير قابلة للجمع تحصر دمار 2024" },
        { value: "11,095", label: "مبنى مدمَّر كلياً جنوب الليطاني في تقييم 2026" },
        { value: "1.384 مليار $", label: "أضرار مباشرة في الأبنية جنوب الليطاني" },
        { value: "3.1 مليون م³", label: "ركام جنوب الليطاني" },
      ]}
    >
      {/* 2024: four non-additive tracks */}
      <section aria-labelledby="ar-tracks" className="mt-7">
        <h2 id="ar-tracks" className="text-xl font-semibold text-[color:var(--color-navy)]">
          2024: أربعة مسارات غير قابلة للجمع تحصر الدمار
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          الفارق بين المسارات ناتج عن المنهجية (رادار مقابل صور بصرية مقابل إفادة
          بلدية)، والنطاق (أربع محافظات مقابل ست)، والوحدة (مبانٍ مقابل مساكن)،
          والتوقيت - لا عن خطأ.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {destruction.tracks2024.map((t) => (
            <article key={t.id} className="flex flex-col card p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug text-[color:var(--color-navy)]">
                  {t.labelAr}
                </h3>
                <span className="shrink-0 rounded-sm bg-[#F7E9E5] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-rust)]">
                  {comparabilityLabel(t.comparability, "ar")}
                </span>
              </div>
              <p className="mt-2 figure-number text-lg text-[color:var(--color-navy)]">
                {t.headlineAr}
              </p>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-[color:var(--color-text)]">
                {t.detailAr}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-dashed border-[color:var(--color-border)] pt-2.5 text-[11px] text-[color:var(--color-text-secondary)]">
                <div>
                  <dt className="font-semibold">المنهجية</dt>
                  <dd>{t.methodAr}</dd>
                </div>
                <div>
                  <dt className="font-semibold">النطاق</dt>
                  <dd>{t.scopeAr}</dd>
                </div>
                <div>
                  <dt className="font-semibold">الوحدة</dt>
                  <dd>{t.unitAr}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="mt-4 card p-3.5">
          <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">ركام 2024</h3>
          <p className="mt-1 figure-number text-lg text-[color:var(--color-navy)]">
            {destruction.debris2024.headlineAr}
          </p>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed">
            {destruction.debris2024.detailAr}
          </p>
        </div>
      </section>

      {/* The municipal survey, district by district */}
      <div className="mt-7">
        <DistrictDamageChart locale="ar" />
      </div>

      <div className="mt-7">
        <SectorDamageChart locale="ar" />
      </div>

      {/* 2026 zones */}
      <section aria-labelledby="ar-zones" className="mt-7">
        <h2 id="ar-zones" className="text-xl font-semibold text-[color:var(--color-navy)]">
          2026: منطقتان مقيَّمتان فقط - لا صورة وطنية
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          داخل حدودهما، تصف أرقام 2026 دماراً يقارب شدّة الجنوب في 2024 خلال ثلث
          المدة. المنتجان يستخدمان منهجيتَي تدقيق مختلفتين ولا يجوز أن يتقاسما مفتاح
          قراءة واحداً، ولا يُجمع أي منهما مع رقم من 2024.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {destruction.zones2026.map((z) => (
            <article key={z.id} className="flex flex-col card p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                  {z.labelAr}
                </h3>
                <div className="flex gap-1.5">
                  <span className="rounded-sm bg-[#E8F1F3] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-teal)]">
                    {z.checkedByAr}
                  </span>
                  <span className="rounded-sm bg-[#F7E9E5] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-rust)]">
                    {comparabilityLabel(z.comparability, "ar")}
                  </span>
                </div>
              </div>
              <p className="mt-2 figure-number text-lg text-[color:var(--color-navy)]">
                {z.assessedDamageAr}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed">
                <span className="font-semibold">الأبنية: </span>
                {z.buildingsAr}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed">
                <span className="font-semibold">الركام: </span>
                {z.debrisAr}
              </p>
              {z.worstCadasters.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {z.worstCadasters.map((c) => (
                    <li key={c.name} className="chip bg-[color:var(--color-bg)]">
                      {c.nameAr ?? c.name}
                      <span className="ms-1 tabular-nums font-bold">
                        {c.destroyed.toLocaleString("en-US")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="font-semibold">المنهجية: </span>
                {z.methodAr}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
                <span className="font-semibold">القابلية للمقارنة: </span>
                {z.comparabilityNoteAr}
              </p>
              <p className="mt-2 border-t border-dashed border-[color:var(--color-border)] pt-2.5 text-[11px] text-[color:var(--color-text-secondary)]">
                نُشر في {fmtDate(z.published, "ar")} (البرنامج الإنمائي والمجلس
                الوطني للبحوث العلمية في لبنان)
              </p>
            </article>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {destruction.zones2026NotesAr.map((n) => (
            <li
              key={n.slice(0, 24)}
              className="note-caution text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]"
            >
              {n}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-md border border-dashed border-[color:var(--color-border)] bg-white p-4">
          <p className="text-[13px] leading-relaxed text-[color:var(--color-text-secondary)]">
            <span className="rounded-sm bg-[#EEF2F7] px-1.5 py-0.5 text-[10px] font-semibold">
              {comparabilityLabel("context_only", "ar")}
            </span>{" "}
            {destruction.presidentialEstimate.detailAr}
          </p>
        </div>
      </section>

      <div className="mt-7">
        <WorstCadastersChart locale="ar" />
      </div>

      <div className="mt-7">
        <DebrisTiles locale="ar" />
      </div>

      <div className="mt-7">
        <ServiceImpact locale="ar" />
      </div>

      <div className="mt-7">
        <HumanToll locale="ar" />
      </div>

      <p className="mt-8 text-sm">
        <Link
          href="/ar/map"
          className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
        >
          اطّلع على أين تركّز النشاط المرصود ←
        </Link>{" "}
        ·{" "}
        <Link
          href="/ar/finance"
          className="font-medium text-[color:var(--color-blue)] underline-offset-2 hover:underline"
        >
          اطّلع على التمويل الذي أعقب المعطيات ←
        </Link>
      </p>

      <div className="mt-7">
        <Takeaways
          locale="ar"
          changed="صار لعام 2026 تقييمان بمستوى المبنى، وهو ما لم يتوفر بهذه الدقة في 2024."
          unchanged="ما زال لا يوجد رقم وطني واحد، ولا مرجع موحّد تُبنى عليه التعويضات."
          matters="تعدّد التقديرات ليس تفصيلاً منهجياً: هو ما أخّر إرساء خط أساس واحد يحتاجه أي نظام تعويض."
        />
      </div>
    </ArabicPageShell>
  );
}
