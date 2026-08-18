import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import destruction from "@/data/destruction.json";
import districtDamage from "@/data/district-damage.json";
import humanToll from "@/data/human-toll.json";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";

export const metadata: Metadata = { title: AR.pages.damage.title };

const COMPARABILITY_AR: Record<string, string> = {
  not_comparable: "غير قابل للمقارنة مباشرة",
  context_only: "للسياق فقط",
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
      <section aria-labelledby="ar-tracks" className="mt-10">
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
            <article key={t.id} className="flex flex-col card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug text-[color:var(--color-navy)]">
                  {t.labelAr}
                </h3>
                <span className="shrink-0 rounded-sm bg-[#F7E9E5] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-rust)]">
                  {COMPARABILITY_AR[t.comparability] ?? t.comparability}
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
        <div className="mt-4 card p-4">
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
      <section aria-labelledby="ar-districts" className="mt-10">
        <h2 id="ar-districts" className="text-xl font-semibold text-[color:var(--color-navy)]">
          المسح البلدي، قضاءً بقضاء
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          {districtDamage.totals.housingUnits.toLocaleString("en-US")} وحدة سكنية أبلغت
          عنها البلديات، منها{" "}
          {districtDamage.namedDistrictSubtotal.toLocaleString("en-US")} في الأقضية
          المسمّاة أدناه.
        </p>
        <ul className="mt-4 space-y-1.5">
          {districtDamage.districts.map((d) => {
            const max = Math.max(...districtDamage.districts.map((x) => x.units));
            return (
              <li key={d.name} className="flex items-center gap-2 text-[12.5px]">
                <span className="w-28 shrink-0 truncate">{d.name}</span>
                <span
                  aria-hidden
                  className="h-2.5 rounded-sm bg-[color:var(--color-navy)]"
                  style={{ width: `${Math.max(3, (d.units / max) * 60)}%`, opacity: 0.8 }}
                />
                <span className="tabular-nums font-semibold">
                  {d.units.toLocaleString("en-US")}
                </span>
                <span className="text-[11px] text-[color:var(--color-text-secondary)]">
                  {d.completeShare}% دمار كلي
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 2026 zones */}
      <section aria-labelledby="ar-zones" className="mt-10">
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
            <article key={z.id} className="flex flex-col card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[color:var(--color-navy)]">
                  {z.labelAr}
                </h3>
                <div className="flex gap-1.5">
                  <span className="rounded-sm bg-[#E8F1F3] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-teal)]">
                    {z.checkedByAr}
                  </span>
                  <span className="rounded-sm bg-[#F7E9E5] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-rust)]">
                    {COMPARABILITY_AR[z.comparability] ?? z.comparability}
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
                      {c.name}
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
      </section>

      {/* Human toll */}
      <section aria-labelledby="ar-toll" className="mt-10">
        <h2 id="ar-toll" className="text-xl font-semibold text-[color:var(--color-navy)]">
          الكلفة البشرية
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          حربان في لوحتين منفصلتين، لكل منهما تاريخه ومصدره. الأرقام هنا كما وردت عن
          الجهة التي أعلنتها.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {humanToll.war2026.items.map((i) => (
            <div key={i.label} className="card p-3.5">
              <p className="figure-number text-xl text-[color:var(--color-navy)]">{i.value}</p>
              <p className="mt-1 text-[12.5px] font-semibold text-[color:var(--color-text)]">
                {i.label}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--color-text-secondary)]">
                {i.reporter}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          لوحة 2026 محدَّثة حتى {humanToll.war2026.asOf}. تسميات المؤشرات وتفاصيلها
          بالإنجليزية في الصفحة الإنجليزية.
        </p>
      </section>

      <div className="mt-10">
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
