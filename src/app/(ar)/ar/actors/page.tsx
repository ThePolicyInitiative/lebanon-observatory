import type { Metadata } from "next";
import { Suspense } from "react";
import { localeAlternates } from "@/lib/i18n";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import ActorRegister from "@/app/(en)/actors/ActorRegister";
import ActorTabs from "@/app/(en)/actors/ActorTabs";
import GroupCards from "@/app/(en)/actors/GroupCards";
import { AIM } from "@/lib/framework";

export const metadata: Metadata = {
  title: "من يفعل ماذا؟",
  description:
    "كل جهة رُصدت وهي تتحرك في استجابتي لبنان بعد الحربين، مصنّفة في مجموعات التقرير الأربع - من تضم كل مجموعة، وما رُصدت وهي تفعله في 2024 و2026، والسجل الكامل لمن فعل ماذا.",
  alternates: localeAlternates("/actors", "ar"),
};

/**
 * الصفحة تتبع إطار الجهات في التقرير: تفتح بتعريف المجموعات الأربع، ثم
 * تتعمّق مجموعةً مجموعة، ثم تقرأ المجموعات جنباً إلى جنب. مقارنات
 * المجموعات تُرسم على مقياس البيانات ولا تُرقَّم أبداً؛ وتفاصيل المجموعة
 * الواحدة تحتفظ بأعدادها. أما العمل نفسه - فئاتٍ ومراحل وخريطة أماكنه -
 * فبيته /ar/actions، وهذه الصفحة تكتفي بالإشارة إليه.
 */
export default function Page() {
  const actorFrame = AIM.ar.layers.find((l) => l.id === "actors")!;

  return (
    <ArabicPageShell
      title="من يفعل ماذا؟"
      art={{ src: "/brand/strata.svg", className: "h-24" }}
      lede={actorFrame.body}
      englishHref="/actors"
    >
      {/* إطار الجهات في التقرير، قبل أي شكل مبني عليه. */}
      <GroupCards locale="ar" />

      <section aria-labelledby="ar-group-profiles" className="mt-9">
        <h2 id="ar-group-profiles" className="text-h2 font-semibold text-navy">
          كل مجموعة على حدة
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          اختر مجموعة: من يحملها، وكيف بدت كل سنة، وأين اتّسع نشاطها
          المرصود أو ضاق بين الحربين.
        </p>
        <div className="mt-4">
          <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-white" />}>
            <ActorTabs locale="ar" />
          </Suspense>
        </div>
      </section>

      {/* أشكال الفئات والمراحل انتقلت إلى /ar/actions مع بقية طبقة
          الأفعال؛ هذا السطر يمنع القارئ من الضياع. */}
      <p className="mt-9 max-w-3xl text-body leading-relaxed text-text">
        كيف يتوزّع العمل نفسه - بحسب الفئة والمرحلة - على{" "}
        <a href="/ar/actions" className="font-medium text-blue underline-offset-2 hover:underline">
          صفحة الأفعال
        </a>
        .
      </p>

      <div className="mt-9">
        <ActorRegister locale="ar" />
      </div>

      {/* الخريطة قسم قائم بذاته الآن: تقرأ عبر الطبقتين معاً، فتقف
          بجانبهما لا داخل هذه الصفحة. */}
      <p className="mt-9 max-w-3xl text-body leading-relaxed text-text">
        أين جرى عمل كل مجموعة - على{" "}
        <a href="/ar/map" className="font-medium text-blue underline-offset-2 hover:underline">
          الخريطة
        </a>
        ؛ رشّحها بمجموعة الجهات لتتبّع مجموعة واحدة عبر البلاد.
      </p>

      {/* سطر واحد: البيت الوحيد لهذا الشرح هو صفحة الأضرار. */}
      <section id="ar-no-national-layer" className="card mt-8 max-w-3xl text-body leading-relaxed">
        <h2 className="text-h3 font-semibold text-navy">
          لماذا لا توجد طبقة أضرار وطنية
        </h2>
        <p className="mt-1 text-text">
          تقييمات 2026 تغطي منطقتين اثنتين ولا يمكن جمعها في مقياس وطني
          واحد - أرقام المناطق والشرح الكامل تحت الاستنتاج الأول على{" "}
          <a href="/ar/findings" className="underline underline-offset-2">
            صفحة الاستنتاجات
          </a>
          .
        </p>
      </section>

      <div className="mt-8">
        <Takeaways
          locale="ar"
          changed="اتّسعت المبادرات الأهلية نحو الإغاثة والتنسيق ودعم الإيواء، وترسّمت الجهة الرسمية في سلسلة مبرمجة للتمويل والشراء والرقابة حول خطة 2026."
          unchanged="الإنجاز. بقيت السنتان متركّزتين في العمل الذي يُعدّ للتعافي لا العمل الذي يُنهيه، وبقيت البلديات تحمل العمل من دون موازنات أو صلاحيات."
          matters="بنية أوضح بلا موارد تحرّك الأوراق لا التعافي: من يقف عند نهاية الوظيفة الغائبة - والأسر أولاً - يبقى هو من يدفع الثمن."
        />
      </div>
    </ArabicPageShell>
  );
}
