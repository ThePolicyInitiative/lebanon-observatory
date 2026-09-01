import type { Metadata } from "next";
import Link from "next/link";
import { AR, localeAlternates } from "@/lib/i18n";
import ArabicPageShell from "../ArabicPageShell";
import Takeaways from "@/components/Takeaways";
import ChangeHeatmap from "@/components/charts/ChangeHeatmap";
import StageCompositionChart from "@/components/charts/StageCompositionChart";
import ActorStageMatrix from "@/app/(en)/actors/ActorStageMatrix";
import CategoryMix from "@/app/(en)/actions/CategoryMix";
import SeeMore from "@/components/SeeMore";

export const metadata: Metadata = {
  title: AR.pages.actions.title,
  description: AR.pages.actions.desc,
  alternates: localeAlternates("/actions", "ar"),
};

/**
 * طبقة الأفعال: العمل نفسه، مقروءاً بمعزل عمّن قام به.
 *
 * تفتح الصفحة على فئات الأفعال الأربع في التقرير، ثم تقرأ المراحل
 * الاثنتي عشرة داخلها - أي المجموعات شغلت كل مرحلة، وما الذي تبدّل بين
 * الحربين. أعداد الفئات والمراحل تُجمع عبر المجموعات الأربع معاً، ولهذا
 * يجوز طبعها هنا بينما لا تُطبع مجاميع المجموعة الواحدة في أي مكان.
 */
export default function Page() {
  return (
    <ArabicPageShell
      title={AR.pages.actions.title}
      art={{ src: "/brand/stages.svg", className: "h-9" }}
      lede={AR.pages.actions.lede}
      point={AR.pages.actions.point}
      englishHref="/actions"
      figures={[
        { value: "4", label: "فئات أفعال" },
        { value: "11", label: "فئة فرعية تفصل مراحل الاستجابة وأشكالها" },
        { value: "12", label: "مرحلة استجابة تُتتبَّع" },
        { value: "771", label: "مدخلاً مرصوداً خلفها" },
      ]}
    >
      {/* إطار الأفعال في التقرير، قبل أي شكل مبني عليه. */}
      <CategoryMix locale="ar" />
      <p className="mt-3 max-w-3xl text-meta leading-relaxed text-text-secondary">
        ما تغطيه كل فئة من الفئات الأربع كاملاً - الفئات الفرعية الإحدى
        عشرة ونطاق كل منها - مبسوط تحت{" "}
        <Link
          href="/ar/methodology#ar-action-framework"
          className="font-medium text-blue underline-offset-2 hover:underline"
        >
          إطار الأفعال
        </Link>{" "}
        على صفحة المنهجية.
      </p>

      <section aria-labelledby="ar-stages-held" className="mt-9">
        <h2 id="ar-stages-held" className="text-h2 font-semibold text-navy">
          أي المجموعات شغلت كل مرحلة من مراحل الاستجابة
        </h2>
        <div className="mt-4">
          <StageCompositionChart locale="ar" showCaveat={false} />
        </div>
      </section>

      <section aria-labelledby="ar-what-shifted" className="mt-9">
        <h2 id="ar-what-shifted" className="text-h2 font-semibold text-navy">
          ما الذي تبدّل بين الحربين
        </h2>
        {/* الشبكة الوحيدة القابلة للتجوال بلوحة المفاتيح على الصفحة؛
            وتنبيه الأعداد الدائم يُطبع هنا مرة واحدة تحتها. */}
        <div className="mt-4">
          <ChangeHeatmap locale="ar" />
        </div>
        <SeeMore label="كل جهة مرصودة مقابل كل مرحلة من مراحل الاستجابة" locale="ar">
          <ActorStageMatrix locale="ar" />
        </SeeMore>
      </section>

      <section aria-labelledby="ar-status" className="mt-9">
        <h2 id="ar-status" className="text-h2 font-semibold text-navy">
          المعلَن ليس منجَزاً
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text">
          كل مدخل على هذه الصفحة محكوم بقاعدة واحدة: المعلَن ليس موافَقاً
          عليه، والموافَق عليه ليس مدفوعاً. وإطلاق الشراء ليس عملاً
          منتهياً، ولا شيء في تتبّع أي من السنتين معلَّم كمنجَز مكتمل.
          أما كيف تُقدَّر حالة كل مرحلة فمبسوط تحت{" "}
          <Link
            href="/ar/methodology#ar-status-discipline"
            className="font-medium text-blue underline-offset-2 hover:underline"
          >
            انضباط الحالة
          </Link>{" "}
          على صفحة المنهجية.
        </p>
      </section>

      <div className="mt-8">
        <Takeaways
          locale="ar"
          changed="تركيبة العمل نفسها. أضافت 2026 سلسلة مبرمجة من الإجراءات المالية - أطراً ونداءات وشراءً ورقابة - حول خطة الحكومة، وهو نوع من العمل لم تكد استجابة 2024 ترصده."
          unchanged="موقع العمل. تتركّز السنتان في المراحل المبكرة التي تُعدّ للتعافي - تقييماً وتخطيطاً وحشداً للمال - بينما تبقى مراحل التنفيذ رقيقة في التتبّع."
          matters="قد تبدو الاستجابة نشطة على الورق وتبقى الشوارع بلا إعمار: ما لم ينزل العمل المرصود في السلسلة من الإعلان إلى الإنجاز، تبقى الفئات التي تمسّ الأسر مباشرة هي الأرقّ."
        />
      </div>
    </ArabicPageShell>
  );
}
