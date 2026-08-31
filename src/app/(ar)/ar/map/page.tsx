import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import { localeAlternates } from "@/lib/i18n";
import { locations } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";
import LebanonMap from "@/components/map/LebanonMap";
import RegionalComposition from "@/components/map/RegionalComposition";

export const metadata: Metadata = {
  title: "أين جرت الأفعال المرصودة",
  description:
    "خريطة استجابتَي لبنان بعد الحربين: كل فعل مرصود موضوعاً حيث جرى، قابلاً للترشيح بالسنة ومجموعة الجهات ومرحلة الاستجابة والحالة - ومعه التركيب الإقليمي.",
  alternates: localeAlternates("/map", "ar"),
};

/**
 * الخريطة قسماً قائماً بذاته. تقرأ عبر الطبقتين معاً - فعل مَن، وأي نوع
 * من الفعل - فتقف بجانبهما لا داخل أي منهما. القسم الداخلي يحتفظ بمعرّف
 * ar-where-traced الذي حملته الخريطة في بيوتها السابقة كي تظل الروابط
 * القديمة تصل.
 */
export default function Page() {
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;

  return (
    <ArabicPageShell
      title="أين جرت الأفعال المرصودة"
      lede="كل فعل مرصود، موضوعاً حيث جرى. رشّح بالسنة أو مجموعة الجهات أو مرحلة الاستجابة أو الحالة لتتبّع شريحة واحدة من العمل عبر البلاد."
      englishHref="/map"
    >
      <section aria-labelledby="ar-where-traced" className="mt-8">
        <h2 id="ar-where-traced" className="sr-only">
          الخريطة
        </h2>
        {/* أول ما يحتاجه القارئ من الخريطة هو ما تستطيع عرضه وما لا تستطيع. */}
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            [String(locations.regions.length), "تجمّعات إقليمية في الرصد"],
            [String(mappable), "منها يمكن وضعها على الخريطة"],
            [String(notMappable), "تُعرض على حدة - يتعذّر تحديد موقعها"],
          ].map(([value, label]) => (
            <div key={label} className="card">
              <dt className="figure-number text-h2 font-semibold text-navy">{value}</dt>
              <dd className="text-meta text-text-secondary">{label}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <Suspense fallback={<div className="h-[680px] animate-pulse rounded-md bg-white" />}>
            <LebanonMap locale="ar" />
          </Suspense>
        </div>
        <div className="mt-7">
          <RegionalComposition locale="ar" showCaveat={false} />
        </div>
      </section>
    </ArabicPageShell>
  );
}
