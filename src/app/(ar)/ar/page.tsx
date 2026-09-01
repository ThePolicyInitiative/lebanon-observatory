import type { Metadata } from "next";
import Link from "next/link";
import { AR, localeAlternates } from "@/lib/i18n";
import { AR_COUNT, arabicCount } from "@/lib/vocab";
import { AIM, IMPORTANCE, finding } from "@/lib/framework";
import NewsTeaser from "@/components/news/NewsTeaser";
import LatestReported from "@/components/LatestReported";
import {
  Body,
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
 * connective prose is written here. The findings appear as teasers - one
 * sentence each - because their full text and depth live on /ar/findings.
 */

/** The teaser prints only a finding's opening sentence; splitting on the
 *  first sentence break is safe because framework.ts writes no dotted
 *  abbreviations, and decimal points are never followed by a space. */
function firstSentence(text: string): string {
  const i = text.indexOf(". ");
  return i === -1 ? text : text.slice(0, i + 1);
}

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
      <section className="on-navy relative overflow-hidden border-b border-[#0b2a22] bg-navy bg-[linear-gradient(200deg,#103329_0%,#143f35_55%,#1a4f41_100%)]">
        {/* البلد مرسوماً ببلداته: نقطة لكل شكل عقاري، والليطاني بالكهرماني.
            يولَّد من طبقة الحدود الخاصة بالموقع عبر scripts/build-brand-art.mjs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          alt=""
          src="/brand/constellation.svg"
          className="pointer-events-none absolute -left-8 top-1/2 hidden h-[135%] w-auto -translate-y-1/2 select-none lg:block"
        />
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
              href="/ar/actors"
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
            <Onward locale="ar" href="/ar/actors">
              تعرّف إلى مجموعات الجهات الأربع
            </Onward>
          </LayerCard>
          <LayerCard locale="ar" title={actions.title} body={actions.body}>
            <Onward locale="ar" href="/ar/actions#ar-action-mix">
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

        {/* The five findings, teased: one opening sentence each. The full
            text and every finding's depth live on /ar/findings, where the
            finding-* anchors moved. */}
        <section id="findings" aria-labelledby="findings-heading">
          <h2 id="findings-heading" className="text-h1 font-semibold text-navy">
            ما الذي تُظهره المقارنة
          </h2>
          <p className="mt-2 max-w-3xl text-body leading-loose text-text-secondary">
            خمسة استنتاجات تثبت عبر هذا التتبّع. يُفتتح كل منها هنا بجملة،
            وله نصّه الكامل وعمقه في صفحة الاستنتاجات.
          </p>

          <div className="mt-8 space-y-4">
            <article className="card">
              <SectionHeading index={1} title={needs.title} as="h3">
                <Body locale="ar">{firstSentence(needs.body[0])}</Body>
                <Onward locale="ar" href="/ar/findings#finding-needs">
                  الاستنتاج كاملاً: تقديرات الأضرار والاحتياجات
                </Onward>
              </SectionHeading>
            </article>

            <article className="card">
              <SectionHeading index={2} title={frameworks.title} as="h3">
                <Body locale="ar">{firstSentence(frameworks.body[0])}</Body>
                <Onward locale="ar" href="/ar/findings#finding-frameworks">
                  الاستنتاج كاملاً: مسار المال من الإطار إلى الدفع
                </Onward>
              </SectionHeading>
            </article>

            <article className="card">
              <SectionHeading index={3} title={plan.title} as="h3">
                <Body locale="ar">{firstSentence(plan.body[0])}</Body>
                <Onward locale="ar" href="/ar/findings#finding-plan">
                  الاستنتاج كاملاً: بنيتا القيادة جنباً إلى جنب
                </Onward>
              </SectionHeading>
            </article>

            <article className="card">
              <SectionHeading index={4} title={community.title} as="h3">
                <Body locale="ar">{firstSentence(community.body[0])}</Body>
                <Onward locale="ar" href="/ar/findings#finding-community">
                  الاستنتاج كاملاً: دور المبادرات الأهلية
                </Onward>
              </SectionHeading>
            </article>

            <article className="card">
              <SectionHeading index={5} title={stages.title} as="h3">
                <Body locale="ar">{firstSentence(stages.body[0])}</Body>
                <Onward locale="ar" href="/ar/findings#finding-stages">
                  الاستنتاج كاملاً: تركّز العمل في المراحل المبكرة
                </Onward>
              </SectionHeading>
            </article>
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
            <LatestReported locale="ar" />
          </div>
          <div className="mt-8">
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

    </div>
  );
}
