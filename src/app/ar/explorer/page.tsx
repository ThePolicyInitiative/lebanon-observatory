import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import { roleRecords, actors } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import { layers, stageLabel, statusList, comparabilityLabel } from "@/lib/vocab";

export const metadata: Metadata = { title: AR.pages.explorer.title };

export default function Page() {
  const ar = layers("ar");

  const byStatus = statusList("ar")
    .map(([key, label]) => ({
      key,
      label,
      n: roleRecords.filter((r) => r.implementationStatus === key).length,
    }))
    .filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n);
  const maxStatus = Math.max(...byStatus.map((s) => s.n));

  const byComparability = ["direct", "qualified", "not_comparable", "context_only"]
    .map((key) => ({
      key,
      label: comparabilityLabel(key, "ar"),
      n: roleRecords.filter((r) => r.comparability === key).length,
    }))
    .filter((c) => c.n > 0);

  const byStage = Array.from({ length: 12 }, (_, i) => ({
    no: i + 1,
    label: stageLabel(i + 1, "ar"),
    n: roleRecords.filter((r) => r.stageNo === i + 1).length,
  }));
  const maxStage = Math.max(...byStage.map((s) => s.n));

  return (
    <ArabicPageShell
      title={AR.pages.explorer.title}
      lede={AR.pages.explorer.lede}
      point={AR.pages.explorer.point}
      englishHref="/explorer"
      figures={[
        { value: String(roleRecords.length), label: "مدخل متتبَّع" },
        { value: String(actors.length), label: "جهة فاعلة مسمّاة" },
        { value: "12", label: "مرحلة في سلسلة القيمة" },
        { value: "2", label: "سنتان تحت المقارنة" },
      ]}
    >
      {/* What the entries look like, by every axis the explorer filters on */}
      <section aria-labelledby="ar-status" className="mt-10">
        <h2 id="ar-status" className="text-xl font-semibold text-[color:var(--color-navy)]">
          المدخلات بحسب حالة التنفيذ
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
          الحالة تصف ما يدعمه الإبلاغ عن المدخل، لا مدى تقدّمه. التفويض القانوني ليس
          إنجازاً، والشراء المباشَر ليس بناءً.
        </p>
        <ul className="mt-4 space-y-1.5">
          {byStatus.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-[12.5px]">
              <span className="w-36 shrink-0 truncate">{s.label}</span>
              <span
                aria-hidden
                className="h-2.5 rounded-sm bg-[color:var(--color-navy)]"
                style={{ width: `${Math.max(3, (s.n / maxStatus) * 60)}%`, opacity: 0.8 }}
              />
              <span className="tabular-nums font-semibold">{s.n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ar-layer-stage" className="mt-10">
        <h2 id="ar-layer-stage" className="text-xl font-semibold text-[color:var(--color-navy)]">
          المدخلات بحسب الطبقة والمرحلة
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              بحسب طبقة الجهات
            </h3>
            <ul className="mt-2 space-y-1.5">
              {ar
                .map((l) => ({ ...l, n: roleRecords.filter((r) => r.actorLayer === l.id).length }))
                .sort((a, b) => b.n - a.n)
                .map((l) => {
                  const max = Math.max(
                    ...ar.map((x) => roleRecords.filter((r) => r.actorLayer === x.id).length),
                  );
                  return (
                    <li key={l.id} className="flex items-center gap-2 text-[12.5px]">
                      <span className="w-40 shrink-0 truncate">{l.label}</span>
                      <span
                        aria-hidden
                        className="h-2.5 rounded-sm"
                        style={{ width: `${Math.max(3, (l.n / max) * 50)}%`, background: l.color, opacity: 0.85 }}
                      />
                      <span className="tabular-nums font-semibold">{l.n}</span>
                    </li>
                  );
                })}
            </ul>
          </div>
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              بحسب مرحلة سلسلة القيمة
            </h3>
            <ul className="mt-2 space-y-1.5">
              {byStage.map((s) => (
                <li key={s.no} className="flex items-center gap-2 text-[12px]">
                  <span className="w-6 shrink-0 tabular-nums text-[color:var(--color-text-secondary)]">
                    {s.no}
                  </span>
                  <span className="w-36 shrink-0 truncate">{s.label}</span>
                  <span
                    aria-hidden
                    className="h-2 rounded-sm bg-[color:var(--color-teal)]"
                    style={{ width: `${Math.max(3, (s.n / maxStage) * 45)}%`, opacity: 0.75 }}
                  />
                  <span className="tabular-nums font-semibold">{s.n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="ar-comparability" className="mt-10">
        <h2 id="ar-comparability" className="text-xl font-semibold text-[color:var(--color-navy)]">
          المدخلات بحسب القابلية للمقارنة
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {byComparability.map((c) => (
            <li key={c.key} className="card px-3 py-2">
              <p className="figure-number text-lg text-[color:var(--color-navy)]">{c.n}</p>
              <p className="mt-0.5 text-[11.5px] text-[color:var(--color-text-secondary)]">
                {c.label}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 note-caution text-[12.5px] leading-relaxed text-[color:var(--color-text-secondary)]">
          المستكشف التفاعلي - بحث حر وترشيح على كل هذه المحاور معاً وفتح المدخل
          الواحد - متاح في الصفحة الإنجليزية، ونصّ كل مدخل فيها بلغته الأصلية.
        </p>
      </section>

      <div className="mt-10">
        <Takeaways
          locale="ar"
          changed="عدد المدخلات ارتفع بين السنتين واتّسعت الطبقة الرسمية داخلها."
          unchanged="أغلب المدخلات تبقى حضوراً متتبَّعاً أو تفويضاً، لا إنجازاً مكتملاً."
          matters="ما يُعدّ هنا هو ما يقوله الإبلاغ، لا ما جرى على الأرض. والفارق بينهما هو موضوع هذا الموقع."
        />
      </div>
    </ArabicPageShell>
  );
}
