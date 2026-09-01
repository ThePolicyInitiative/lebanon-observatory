import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import { localeAlternates } from "@/lib/i18n";
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

  return (
    <ArabicPageShell
      title="أين جرت الأفعال المرصودة"
      art={{ src: "/brand/south.svg", className: "h-48" }}
      lede="كل فعل مرصود، موضوعاً حيث جرى. رشّح بالسنة أو مجموعة الجهات أو مرحلة الاستجابة أو الحالة لتتبّع شريحة واحدة من العمل عبر البلاد."
      englishHref="/map"
    >
      <section aria-labelledby="ar-where-traced" className="mt-8">
        <h2 id="ar-where-traced" className="sr-only">
          الخريطة
        </h2>
        <div className="mt-3">
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
