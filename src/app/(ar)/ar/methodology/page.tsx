import type { Metadata } from "next";
import Link from "next/link";
import ArabicPageShell from "../ArabicPageShell";
import StateChip from "@/components/StateChip";
import { localeAlternates } from "@/lib/i18n";
import { METHOD_INTRO } from "@/lib/framework";
import { AR_COUNT, arabicCount, cautionCounts, stageLabel } from "@/lib/vocab";
import { slimRecords } from "@/lib/map-records";
import {
  ActionCategoryCards,
  ActorGroupCards,
  MethodSteps,
  StageNesting,
} from "@/app/(en)/methodology/MethodSections";

export const metadata: Metadata = {
  title: "كيف بُني هذا التتبّع",
  description:
    "كيف جُمع التتبّع الذي يقوم عليه هذا المرصد: ثماني خطوات من المواد المنشورة علناً إلى التثبّت اليدوي، وأربع مجموعات للجهات وأربع فئات للأفعال، والانضباط الذي يُبقي المال المعلن منفصلاً عن العمل المنجز.",
  alternates: localeAlternates("/methodology", "ar"),
};

/**
 * The statuses entries actually carry, in ladder order, tallied live so
 * the two language sides cannot cite different figures. Whole-tracking
 * counts, never split by group.
 */
const STATUS_ORDER = ["formal_mandate", "underway", "procurement", "not_verified"] as const;

const STATUS_GLOSS: Record<(typeof STATUS_ORDER)[number], string> = {
  formal_mandate:
    "إسناد قانوني أو مؤسسي للمسؤولية. يقول من يجب أن يتحرّك، لا أن شيئاً جرى على الأرض.",
  underway: "نشاط رُصد فيما نُشر علناً، من دون أي ادعاء عن مداه أو اكتماله.",
  procurement: "خطوة مناقصة أو تعاقد بدأت. إجراء، لا أشغال.",
  not_verified:
    "إبلاغ علني لم تستطع المراجعة حسمه أكثر. لا يُفترض صفراً ولا يُفترض إنجازاً.",
};

function statusTally(): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of slimRecords) {
    m.set(r.implementationStatus, (m.get(r.implementationStatus) ?? 0) + 1);
  }
  return m;
}

/**
 * The Arabic methodology page runs the same sections in the same order as
 * the English one: the eight steps, the two frameworks, the stage
 * nesting with its three disclosed seams, the status discipline and the
 * count flag - the same modules over the same wording tables, so neither
 * side can say something the other does not.
 */
export default function Page() {
  const tally = statusTally();
  const total = slimRecords.length;

  return (
    <ArabicPageShell
      title="كيف بُني هذا التتبّع"
      art={{ src: "/brand/governorates.svg", className: "h-48" }}
      lede={METHOD_INTRO.ar}
      englishHref="/methodology"
      figures={[
        { value: String(total), label: "مدخلاً متتبَّعاً" },
        { value: "235", label: "جهة مرصودة: 105 في 2024 و130 في 2026" },
      ]}
    >
      <section aria-labelledby="ar-steps" className="mt-9">
        <h2 id="ar-steps" className="text-h2 font-semibold text-navy">
          الخطوات الثماني
        </h2>
        <MethodSteps locale="ar" />
      </section>

      <section aria-labelledby="ar-actor-framework" className="mt-9">
        <h2 id="ar-actor-framework" className="text-h2 font-semibold text-navy">
          إطار الجهات: أربع مجموعات
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          كل جهة في التتبّع تنتمي إلى مجموعة واحدة بالضبط من هذه المجموعات
          الأربع. ولكل مجموعة لون هوية واحد في الموقع كله - فالمربّع الصغير
          هنا هو اللون نفسه الذي يميّز المجموعة في كل رسم وعلى الخريطة.
        </p>
        <ActorGroupCards locale="ar" />
      </section>

      <section aria-labelledby="ar-action-framework" className="mt-9">
        <h2 id="ar-action-framework" className="text-h2 font-semibold text-navy">
          إطار الأفعال: أربع فئات
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          كل نشاط مرصود يُصنَّف في واحدة من أربع فئات، وداخلها في واحدة من
          إحدى عشرة فئة فرعية تسمّي نوع العمل.
        </p>
        <ActionCategoryCards locale="ar" />
      </section>

      <section aria-labelledby="ar-stage-mapping" className="mt-9">
        <h2 id="ar-stage-mapping" className="text-h2 font-semibold text-navy">
          كيف تنتظم المراحل الاثنتا عشرة المتتبَّعة داخل الفئات الأربع
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          التتبّع أسبق من إطار الفئات الأربع، وهو يرصد العمل بتفصيل أدق:
          اثنتا عشرة مرحلة عملياتية من مراحل الاستجابة. وهذه المراحل تنتظم
          داخل الفئات ولا تحلّ محلّها. والرقم بجانب كل مرحلة هو موقعها
          الثابت في ترتيب مراحل التتبّع، من 1 إلى 12.
        </p>
        <StageNesting locale="ar" />
        <p className="mt-4 max-w-3xl note-caution text-meta leading-relaxed text-text-secondary">
          ثلاثة من هذه المواضع اجتهادات تحريرية يُفصح عنها هنا بدل تمويهها.
          فمرحلة «{stageLabel(2, "ar")}» تمتد على الفئتين الفرعيتين
          الماليتين معاً - التمويل من جهة والتعويضات من جهة أخرى - وتقع في
          الفئة المالية مرحلةً واحدة. ومرحلة «{stageLabel(4, "ar")}» تقع مع تقييم الأضرار
          وإدارتها لأن عملها المرصود هو الوصول إلى المناطق المتضررة
          وتأمينها: فتح الطرق، والاستجابة الأولى، وإزالة المخاطر. أما
          «{stageLabel(12, "ar")}» فتقع مع الاستراتيجية والتنسيق لأنها عمل
          على المسؤولية المؤسسية، لا على الأشغال المادية.
        </p>
      </section>

      <section aria-labelledby="ar-status-discipline" className="mt-9">
        <h2 id="ar-status-discipline" className="text-h2 font-semibold text-navy">
          انضباط حالة التنفيذ
        </h2>
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
          حيثما سمح ما نُشر علناً، يحمل المدخل حالة تنفيذ، والانضباط فيها
          صارم: التمويل المعلن لا يُعرض أبداً تمويلاً مُقرّاً أو مدفوعاً،
          وخطوة الشراء لا تُعرض أبداً عملاً منجزاً، ولا مدخل في التتبّع كله
          موسوم بإنجاز مكتمل - فهذه الحالة ترد صفر مرة. وعبر{" "}
          {arabicCount(total, AR_COUNT.entry)} لا ترد إلا أربع حالات.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((k) => (
            <li key={k} className="card">
              <StateChip status={k} locale="ar" />
              <p className="figure-number mt-2 text-h2 text-navy">
                {tally.get(k) ?? 0}
              </p>
              <p className="mt-1 text-meta leading-relaxed text-text-secondary">
                {STATUS_GLOSS[k]}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ar-count-flag" className="mt-9">
        <h2 id="ar-count-flag" className="text-h2 font-semibold text-navy">
          ماذا تعني الأعداد
        </h2>
        <p className="mt-2 max-w-3xl note-caution text-meta leading-relaxed text-text-secondary">
          {cautionCounts("ar")}
        </p>
        <p className="mt-3 max-w-3xl text-body leading-relaxed text-text-secondary">
          عدّان يجريان في الموقع وليسا العدّ نفسه. فالتتبّع على مستوى المدخل
          يضم {arabicCount(total, AR_COUNT.entryTraced)} - 357 لسنة 2024
          و414 لسنة 2026 - وقد تحمل الجهة الواحدة عدة مدخلات داخل المرحلة
          الواحدة. أما مصفوفتا المراحل فتعدّان حضور الجهة في المرحلة: مجموع
          مصفوفة 2024 هو 343 مدخلاً، ومجموع مصفوفة 2026 كما أُدخلت هنا 360،
          بينما تذكر إعادة احتساب على مستوى التقرير 363 - فرق ثلاثة مدخلات
          يُفصح عنه هنا وفي تحفّظات الرسوم بدل أن يُموَّه.
        </p>
      </section>

      <p className="mt-9 flex flex-wrap gap-x-5 gap-y-1 text-body">
        <Link
          href="/ar/entries"
          className="font-medium text-blue underline-offset-2 hover:underline"
        >
          كل مدخل متتبَّع، صفاً صفاً ←
        </Link>
      </p>
    </ArabicPageShell>
  );
}
