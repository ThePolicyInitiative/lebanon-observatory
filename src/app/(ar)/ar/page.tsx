import type { Metadata } from "next";
import Link from "next/link";
import { AR, localeAlternates } from "@/lib/i18n";
import { AR_COUNT, arabicCount } from "@/lib/vocab";
import { AIM, IMPORTANCE, finding } from "@/lib/framework";
import { GOV_PATHS, VIEW_H, VIEW_W } from "@/lib/geo";
import InstitutionalStructures from "@/components/InstitutionalStructures";
import ThreeStreams from "@/components/ThreeStreams";
import NewsTeaser from "@/components/news/NewsTeaser";
import SeeMore from "@/components/SeeMore";
import {
  Body,
  FigureTile,
  LayerCard,
  Onward,
  ScaleStrip,
  SectionHeading,
  SectionTitle,
} from "@/components/HomeNarrative";

export const metadata: Metadata = {
  alternates: localeAlternates("/", "ar"),
  // Absolute: the Arabic home IS the site name, and the layout's template
  // would otherwise append the same name to itself.
  title: { absolute: AR.meta.title },
  description:
    "منصة ترسم وتتتبّع وتقارن كيف نظّم لبنان التعافي وإعادة الإعمار بعد حربَي 2024 و2026 - الجهات التي تحرّكت والأفعال التي نفّذتها.",
};

/**
 * The Arabic home mirrors the English one section for section: aim, the
 * two layers, why the comparison matters, and the five findings. The
 * report's wording comes from framework.ts in both languages; only the
 * connective prose is written here.
 */
export default function ArabicPage() {
  const [actors, actions] = AIM.ar.layers;
  const needs = finding("needs", "ar");
  const frameworks = finding("frameworks", "ar");
  const plan = finding("plan", "ar");
  const community = finding("community", "ar");
  const stages = finding("stages", "ar");

  return (
    <div dir="rtl" lang="ar" className="text-right">
      {/* Hero */}
      <section className="on-navy relative overflow-hidden border-b border-[#0e2542] bg-navy bg-[linear-gradient(200deg,#122e50_0%,#173b63_55%,#1c4a7c_100%)]">
        <svg
          aria-hidden
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="pointer-events-none absolute -left-8 top-1/2 hidden h-[135%] -translate-y-1/2 lg:block"
        >
          {GOV_PATHS.map((p) => (
            <path
              key={p.name}
              d={p.d}
              fill="#FFFFFF"
              fillOpacity={0.03}
              stroke="#FFFFFF"
              strokeOpacity={0.14}
              strokeWidth={1.2}
            />
          ))}
        </svg>
        <div className="relative mx-auto max-w-[1360px] px-4 py-8 sm:px-6 sm:py-16">
          <p className="text-meta font-semibold tracking-widest text-amber">
            {AR.hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl text-h1 font-bold leading-tight text-white sm:text-display">
            {AIM.ar.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lead leading-loose text-white/85">
            {AIM.ar.lede}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="#findings"
              className="inline-flex min-h-11 items-center rounded-md bg-amber px-5 text-body font-semibold text-[#2a1e00] transition-colors duration-150 hover:bg-[#e8ab1a]"
            >
              ما الذي تُظهره المقارنة
            </Link>
            <Link
              href="/ar/who"
              className="inline-flex min-h-11 items-center rounded-md border border-white/60 px-5 text-body font-semibold text-white transition-colors duration-150 hover:bg-white/10"
            >
              استكشف طبقة الجهات
            </Link>
            <Link
              href="/ar/methodology"
              className="inline-flex min-h-11 items-center rounded-md border border-white/25 px-5 text-body font-semibold text-white/80 transition-colors duration-150 hover:border-white/60 hover:text-white"
            >
              كيف بُني هذا العمل
            </Link>
          </div>
        </div>
      </section>

      {/* The two analytical layers */}
      <section
        id="layers"
        aria-labelledby="layers-heading"
        className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6"
      >
        <SectionTitle id="layers-heading">طبقتان تحليليتان</SectionTitle>
        <p className="mt-2 max-w-3xl text-body leading-loose text-text-secondary">
          كل صفحة في المنصة تقرأ الاستجابتين بالعدستين نفسيهما: من تحرّك، وما
          الذي كان عليه هذا التحرّك.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <LayerCard locale="ar" title={actors.title} body={actors.body}>
            <Onward locale="ar" href="/ar/who">
              تعرّف إلى مجموعات الجهات الأربع
            </Onward>
          </LayerCard>
          <LayerCard locale="ar" title={actions.title} body={actions.body}>
            <Onward locale="ar" href="/ar/who#action-mix">
              اطّلع على ما فعلته كل استجابة، فئةً فئة
            </Onward>
            <p className="mt-2 text-meta leading-loose text-text-secondary">
              الفئات الأربع وفئاتها الفرعية معرَّفة في{" "}
              <Link
                href="/ar/methodology"
                className="font-medium text-blue underline-offset-2 hover:underline"
              >
                صفحة المنهجية
              </Link>
              .
            </p>
          </LayerCard>
        </div>
      </section>

      {/* Whole-tracking totals: they size the work, they compare nothing. */}
      <ScaleStrip label="حجم التتبّع">
        <p className="text-body leading-loose text-text">
          <span className="font-semibold text-navy">
            {arabicCount(235, AR_COUNT.actorTraced)}
          </span>{" "}
          <span className="text-text-secondary">
            - {arabicCount(105, AR_COUNT.actor)} في استجابة 2024 و
            {arabicCount(130, AR_COUNT.actor)} في استجابة 2026
          </span>
        </p>
        <p className="text-body leading-loose text-text">
          <span className="font-semibold text-navy">
            {arabicCount(771, AR_COUNT.entryTraced)}
          </span>
        </p>
        <p className="text-meta leading-loose text-text-secondary">
          التتبّع حتى 31 آب 2026
        </p>
      </ScaleStrip>

      <div className="mx-auto max-w-[1360px] space-y-16 px-4 py-12 sm:px-6">
        {/* Why the comparison matters */}
        <section id="why" aria-labelledby="why-heading">
          <div className="prose-measure">
            <SectionTitle id="why-heading">{IMPORTANCE.ar.title}</SectionTitle>
            <Body locale="ar">{IMPORTANCE.ar.body[0]}</Body>
            <Body locale="ar">{IMPORTANCE.ar.body[1]}</Body>
          </div>
        </section>

        {/* The five findings */}
        <section id="findings" aria-labelledby="findings-heading">
          <h2 id="findings-heading" className="text-h1 font-semibold text-navy">
            ما الذي تُظهره المقارنة
          </h2>
          <p className="mt-2 max-w-3xl text-body leading-loose text-text-secondary">
            خمس نتائج تثبت عبر هذا التتبّع، وتحيل كل واحدة منها إلى الصفحة التي
            تحمل تفصيلها الكامل.
          </p>

          <div className="mt-10 space-y-16">
            <section id="finding-needs" aria-label={needs.title}>
              <SectionHeading index={1} title={needs.title} as="h3">
                <Body locale="ar">{needs.body[0]}</Body>
                <Body locale="ar">{needs.body[1]}</Body>
              </SectionHeading>
              <div
                role="group"
                aria-label="الأرقام الرئيسية الثلاثة لتقييم 2024"
                className="mt-6 grid max-w-4xl gap-4 sm:grid-cols-3"
              >
                <FigureTile locale="ar" value="6.8 مليارات دولار" label="أضرار مادية" />
                <FigureTile locale="ar" value="7.2 مليارات دولار" label="خسائر اقتصادية" />
                <FigureTile
                  locale="ar"
                  value="نحو 11 مليار دولار"
                  label="احتياجات التعافي وإعادة الإعمار"
                />
              </div>
              <Onward locale="ar" href="/ar/destroyed">
                الدمار منطقةً منطقة
              </Onward>
              <Onward locale="ar" href="/ar/money">
                التمويل الذي تلا التقييم
              </Onward>
            </section>

            <section id="finding-frameworks" aria-label={frameworks.title}>
              <SectionHeading index={2} title={frameworks.title} as="h3">
                <Body locale="ar">{frameworks.body[0]}</Body>
                <Body locale="ar">{frameworks.body[1]}</Body>
              </SectionHeading>
              <Onward locale="ar" href="/ar/money">
                إلى أي مدى تحرّك المال فعلاً
              </Onward>
            </section>

            <section id="finding-plan" aria-label={plan.title}>
              <SectionHeading index={3} title={plan.title} as="h3">
                <Body locale="ar">{plan.body[0]}</Body>
                <Body locale="ar">{plan.body[1]}</Body>
              </SectionHeading>
              <SeeMore locale="ar" label="بنيتا القيادة في السنتين، جنباً إلى جنب">
                <InstitutionalStructures locale="ar" />
                <div className="mt-8">
                  <ThreeStreams locale="ar" />
                </div>
              </SeeMore>
            </section>

            {/* This finding reads the actor groups against each other, so
                it carries no counts anywhere: the wording ranks, the
                figures live nowhere. */}
            <section id="finding-community" aria-label={community.title}>
              <SectionHeading index={4} title={community.title} as="h3">
                <Body locale="ar">{community.body[0]}</Body>
                <Body locale="ar">{community.body[1]}</Body>
              </SectionHeading>
              <Onward locale="ar" href="/ar/who">
                أين وقفت كل مجموعة من الجهات
              </Onward>
            </section>

            <section id="finding-stages" aria-label={stages.title}>
              <SectionHeading index={5} title={stages.title} as="h3">
                <Body locale="ar">{stages.body[0]}</Body>
                <Body locale="ar">{stages.body[1]}</Body>
              </SectionHeading>
              <Onward locale="ar" href="/ar/who#action-mix">
                أي نوع من العمل رُصد، فئةً فئة
              </Onward>
            </section>
          </div>
        </section>

        {/* Latest reporting */}
        <section id="latest-reporting" aria-labelledby="latest-heading">
          <SectionTitle id="latest-heading">أحدث التغطية والمستجدات</SectionTitle>
          <p className="mt-2 max-w-3xl text-body leading-loose text-text-secondary">
            تغطية من ناشرين عالميين ولبنانيين وإنسانيين ورسميين مختارين، تُجمع
            فور ظهورها. تسبق هذه الموادُّ التتبّعَ وتبقى خارج كل عدّ.
          </p>
          <div className="mt-6">
            <NewsTeaser locale="ar" />
          </div>
        </section>

        {/* The report's central line */}
        <section
          aria-label="الخلاصة المركزية للمقارنة"
          className="rounded-md border-r-4 border-navy bg-white p-6"
        >
          <blockquote className="editorial-quote max-w-4xl text-h3 leading-loose text-navy">
            استجابة 2026 كانت أفضل تصميماً لا أفضل إنجازاً: إطار أقوى، وتمويل
            شحيح، ومجتمعات محلية تحمل من العمل حصة أكبر مما حملته في 2024.
          </blockquote>
        </section>
      </div>

      {/* Cross-locale notice */}
      <section className="mx-auto max-w-[1360px] px-4 pb-16 sm:px-6">
        <p className="rounded-md border-r-4 border-amber bg-white p-4 text-body leading-loose text-text-secondary">
          {AR.notice}{" "}
          <Link
            href="/"
            lang="en"
            dir="ltr"
            className="font-semibold text-blue underline-offset-2 hover:underline"
          >
            {AR.nav.english}
          </Link>
        </p>
      </section>
    </div>
  );
}
