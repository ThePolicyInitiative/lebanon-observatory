/**
 * The identity copy: who runs the observatory, what its tracking covers,
 * what it refuses to claim, how to reach it, and how often it moves.
 *
 * It lives here rather than beside the Arabic page copy because both
 * halves of the site read it - the two About pages and the footer strip
 * that carries the same two dates on every page. One home means the
 * cut-off and the revision date cannot drift between languages.
 *
 * Deliberately not a method note: no transformation rules, no field
 * definitions, no listing of where the underlying text came from. Scope
 * and limits only.
 */

/** The content cut-off. Nothing dated after it enters any figure. */
export const CONTENT_CUT_OFF = "2026-07-31";

/**
 * The last content release. Kept in step with CONTENT_UPDATED in
 * src/app/sitemap.ts by hand: the crawler date and the reader-facing date
 * are the same fact, and a footer that ages while the sitemap moves is
 * worse than no date at all.
 */
export const ANALYSIS_REVISED = "2026-08-25";

/**
 * The observatory's contact address, or null while there is none.
 *
 * It is null rather than a plausible-looking placeholder on purpose: a
 * site that publishes a live mailto nobody reads is worse than one that
 * says plainly it has no channel open yet. Set it here and it appears on
 * the About page and in the footer, in both languages.
 */
export const CONTACT_EMAIL: string | null = null;

type Figure = { value: string; label: string };
type Section = { id: string; heading: string; body?: string[]; points?: string[] };

type AboutCopy = {
  metaTitle: string;
  metaDesc: string;
  title: string;
  lede: string;
  point: string;
  figures: Figure[];
  sections: Section[];
  contact: { heading: string; body: string; note: string; none: string };
  crossLink: string;
};

export const ABOUT: Record<"en" | "ar", AboutCopy> = {
  en: {
    metaTitle: "About the observatory",
    metaDesc:
      "Who compiles the Lebanon Reconstruction Observatory, what its tracking of 771 traced entries covers across 2024 and 2026, what it refuses to claim, and how to reach it.",
    title: "About the observatory",
    lede:
      "The Lebanon Reconstruction Observatory follows one question across two wars: between 2024 and 2026, what changed in who actually rebuilds Lebanon, and what did not. It traces the reconstruction chain from strategy and finance, through rubble clearance and procurement, to shelter and return - and shows where each actor was present at each stage.",
    point:
      "This page states who runs the observatory, what the tracking covers, what it refuses to claim and how to reach us. It is not a method note, and it does not restate the analysis the pages themselves carry.",
    figures: [
      { value: "771", label: "traced entries, 2024 and 2026 together" },
      { value: "4", label: "actor layers, from state institutions to households" },
      { value: "12", label: "stages of the reconstruction chain" },
      { value: "31 Jul 2026", label: "cut-off - nothing later enters a figure" },
    ],
    sections: [
      {
        id: "what",
        heading: "What this is",
        body: [
          "The observatory is a standing comparison of two moments in Lebanon's reconstruction system: the emergency response that filled the vacuum after the 2024 war, and the more formal project structure standing by mid-2026. It is independent policy analysis. It is not a relief operation, an official register or a compensation channel, and it cannot act on an individual case.",
          "The question it answers is narrow on purpose. For each stage of the reconstruction chain, in each of the two years, it asks which actors were traced as present and in what capacity - finance, procurement, implementation or oversight. The map, the finance pages and the damage assessments all exist to keep that one comparison honest.",
        ],
      },
      {
        id: "who",
        heading: "Who compiled it",
        body: [
          "The observatory is compiled and maintained independently, outside any government, donor or implementing body. No part of it is commissioned, funded or cleared by an actor that appears inside the tracking - which is the only reason a count of official presence can be published here without a conflict of interest.",
          "Corrections are the fastest way to improve it. If a figure, an actor name or a stage assignment looks wrong, say so - naming the page and the figure - and it will be checked against the underlying entries, then corrected in the next revision or explained.",
        ],
      },
      {
        id: "covers",
        heading: "What the tracking covers",
        body: [
          "Two years stand side by side: 2024 and 2026. Between them the tracking holds 771 traced entries, one per actor and function within a stage, so a single actor can carry several entries inside the same stage.",
          "Actors sit in four layers - official institutions, NGOs and international agencies, municipalities and local authorities, and community initiatives. Each entry is placed on one of twelve chain stages, running from strategy and coordination, finance and compensation, damage and needs assessment, safety and access, and procurement, through rubble clearance, debris treatment and reconstruction works, to shelter and return, relief, livelihoods and oversight.",
          "The cut-off is 31 July 2026. Nothing dated after it enters a count, a chart or the comparison. The live updates page keeps gathering later coverage, and that coverage stays entirely outside the tracking: it enters none of the figures on any other page.",
          "Both languages carry the same thing. The Arabic pages are not a summary of the English ones - every page, chart, filter and entry runs in Arabic at the same depth, and the figures are read from one place, so a number cannot say one thing in Arabic and another in English.",
        ],
      },
      {
        id: "limits",
        heading: "What it does not claim",
        points: [
          "Presence is not performance. A traced entry means an actor was reported as present in a stage in a year. It says nothing about money spent, work finished or people reached.",
          "Commitment is not disbursement, and disbursement is not completed output. The finance pages hold the three apart, because collapsing them is the most common way reconstruction reporting overstates itself.",
          "Nothing is ever marked completed. Where a completed output was not publicly confirmed by 31 July 2026, the tracking says exactly that and stops there.",
          "Damage estimates are never merged. The four 2024 tracks are not additive with one another, and no 2026 assessment is ever combined with a 2024 figure: method, scope, unit and timing differ, and those differences are themselves part of the finding.",
          "An absent mark is an absent figure, not absent damage and not absent work. Places and stages with no entry are the places reporting did not reach.",
          "The counts follow what the reporting says, not what happened on the ground. The distance between the two is the subject of this site, not a defect in it.",
        ],
      },
      {
        id: "updates",
        heading: "How updates work",
        body: [
          "The tracking is revised in releases rather than continuously. A release re-reads the underlying entries, refreshes every affected page in both languages together, and moves the revision date shown in the footer of every page.",
          "The cut-off moves only when a further period is taken in full, on the same terms as the two years already held. Until then it stays at 31 July 2026, even as later coverage accumulates on the live updates page: a cut-off that drifts quietly would break the comparison between the two years, which is the whole point of the site.",
          "Where a figure changes because the underlying entries changed, the change is carried into both languages in the same revision. There is no partial release in one language.",
        ],
      },
    ],
    contact: {
      heading: "How to reach us",
      body: "Questions, corrections and challenges to any figure go to one address:",
      note: "Write naming the page and the figure in question. Press enquiries should give the deadline in the first line.",
      none: "No contact address is open yet. Until one is, corrections cannot be sent to the observatory directly - so treat every figure as checkable against the page that carries it and the caveat printed beside it.",
    },
    crossLink: "Read this page in Arabic",
  },

  ar: {
    metaTitle: "عن المرصد",
    metaDesc:
      "من يُعِدّ مرصد إعادة إعمار لبنان، وما الذي يغطيه تتبّعه البالغ 771 مدخلاً متتبَّعاً عبر 2024 و2026، وما الذي يرفض ادّعاءه، وكيف تصل إليه.",
    title: "عن المرصد",
    lede:
      "يلاحق مرصد إعادة إعمار لبنان سؤالاً واحداً عبر حربين: بين 2024 و2026، ما الذي تغيّر فعلاً في من يعيد بناء لبنان، وما الذي لم يتغيّر. يتتبّع المرصد سلسلة إعادة الإعمار من الاستراتيجية والتمويل، مروراً برفع الأنقاض والشراء، وصولاً إلى الإيواء والعودة - ويبيّن أين كانت كل جهة حاضرة في كل مرحلة.",
    point:
      "هذه الصفحة تقول من يدير المرصد، وما الذي يغطيه التتبّع، وما الذي يرفض ادّعاءه، وكيف تصل إلينا. ليست ملاحظة منهجية، ولا تعيد سرد التحليل الذي تحمله الصفحات نفسها.",
    figures: [
      { value: "771", label: "مدخل متتبَّع، 2024 و2026 معاً" },
      { value: "4", label: "طبقات فاعلة، من المؤسسات الرسمية إلى الأهالي" },
      { value: "12", label: "مرحلة في سلسلة إعادة الإعمار" },
      { value: "31 تموز 2026", label: "تاريخ التوقف - لا يدخل ما بعده في أي رقم" },
    ],
    sections: [
      {
        id: "what",
        heading: "ما هذا الموقع",
        body: [
          "المرصد مقارنة دائمة بين لحظتين في نظام إعادة إعمار لبنان: استجابة الطوارئ التي ملأت الفراغ بعد حرب 2024، وبنية المشروع الأكثر رسمية التي قامت بحلول منتصف 2026. هو تحليل سياسات مستقل. ليس عملية إغاثة، ولا لائحة رسمية، ولا قناة لتقديم طلبات التعويض، ولا يمكنه التصرّف في أي حالة فردية.",
          "والسؤال الذي يجيب عنه ضيّق عن قصد: في كل مرحلة من سلسلة إعادة الإعمار، وفي كل من السنتين، أي الجهات رُصد حضورها وبأي صفة - تمويلاً أو شراءً أو تنفيذاً أو رقابة. والخريطة وصفحات التمويل وتقديرات الأضرار كلها موجودة لتُبقي تلك المقارنة الواحدة أمينة.",
        ],
      },
      {
        id: "who",
        heading: "من أعدّه",
        body: [
          "يُعَدّ المرصد ويُحدَّث باستقلال، خارج أي حكومة أو جهة مانحة أو جهة منفّذة. ولا جزء منه مكلَّف به أو ممول أو مُجاز من جهة تظهر داخل التتبّع نفسه - وهذا وحده ما يتيح نشر عدّ للحضور الرسمي بلا تضارب مصالح.",
          "والتصويبات أسرع طريق إلى تحسينه. إذا بدا رقم أو اسم جهة أو إسناد مرحلة خاطئاً، فقُل ذلك - مسمّياً الصفحة والرقم - ليُراجَع في مقابل المدخلات الأساسية، فيُصوَّب في المراجعة التالية أو يُشرَح.",
        ],
      },
      {
        id: "covers",
        heading: "ما الذي يغطيه التتبّع",
        body: [
          "سنتان جنباً إلى جنب: 2024 و2026. وبينهما يحمل التتبّع 771 مدخلاً متتبَّعاً، مدخلاً واحداً لكل جهة ووظيفة داخل مرحلة، فقد تحمل الجهة الواحدة عدة مدخلات في المرحلة نفسها.",
          "وتتوزّع الجهات على أربع طبقات: المؤسسات الرسمية، والمنظمات الدولية وغير الحكومية، والبلديات والسلطات المحلية، ومبادرات المجتمع المحلي. ويُسنَد كل مدخل إلى واحدة من اثنتي عشرة مرحلة، من الاستراتيجية والتنسيق، والتمويل والتعويضات، وتقييم الأضرار والاحتياجات، والسلامة والوصول، والشراء والتعاقد، مروراً برفع الأنقاض ومعالجة الركام وأشغال إعادة الإعمار، وصولاً إلى الإيواء والعودة، والإغاثة، وسبل العيش، والرقابة.",
          "تاريخ التوقف هو 31 تموز 2026. ولا يدخل ما بعده في عدّ ولا رسم ولا مقارنة. وصفحة المستجدات تواصل تجميع تغطية لاحقة تبقى كلياً خارج التتبّع: لا تدخل في أي رقم في أي صفحة أخرى.",
          "واللغتان تحملان الشيء نفسه. الصفحات العربية ليست تلخيصاً للإنجليزية - كل صفحة ورسم ومرشّح ومدخل يعمل بالعربية بالعمق نفسه، والأرقام تُقرأ من مكان واحد، فلا يمكن لرقم أن يقول شيئاً بالعربية وشيئاً آخر بالإنجليزية.",
        ],
      },
      {
        id: "limits",
        heading: "ما الذي لا يدّعيه",
        points: [
          "الحضور ليس أداءً. المدخل المتتبَّع يعني أن جهة أُبلغ عن حضورها في مرحلة في سنة. ولا يقول شيئاً عن مال أُنفق أو عمل أُنجز أو ناس بلغهم الأثر.",
          "الالتزام ليس دفعاً، والدفع ليس ناتجاً مكتملاً. صفحات التمويل تفصل الثلاثة عمداً، لأن دمجها أشيع طريقة يبالغ بها الإبلاغ عن إعادة الإعمار في وصف نفسه.",
          "لا شيء يُوسم أبداً بأنه مكتمل. وحيث لم يُعلَن ناتج مكتمل ومؤكَّد حتى 31 تموز 2026، يقول التتبّع ذلك بالضبط ويتوقف عنده.",
          "تقديرات الأضرار لا تُدمج أبداً. مسارات 2024 الأربعة لا تُجمع بعضها إلى بعض، ولا يُضمّ أي تقييم من 2026 إلى رقم من 2024: المنهجية والنطاق والوحدة والتوقيت تختلف، وهذا الاختلاف نفسه جزء من الخلاصة.",
          "غياب العلامة غياب رقم، لا غياب ضرر ولا غياب عمل. فالأماكن والمراحل بلا مدخلات هي ما لم يبلغه الإبلاغ.",
          "والأعداد تتبع ما يقوله الإبلاغ، لا ما جرى على الأرض. والمسافة بينهما هي موضوع هذا الموقع، لا خلل فيه.",
        ],
      },
      {
        id: "updates",
        heading: "كيف تجري التحديثات",
        body: [
          "يُراجَع التتبّع على شكل إصدارات لا بشكل متواصل. والإصدار يعيد قراءة المدخلات الأساسية، ويحدّث كل صفحة متأثرة باللغتين معاً، ويحرّك تاريخ المراجعة الظاهر أسفل كل صفحة.",
          "ولا يتحرّك تاريخ التوقف إلا حين تُؤخذ فترة إضافية كاملة، بالشروط نفسها التي أُخذت بها السنتان. وحتى ذلك يبقى عند 31 تموز 2026، ولو تراكمت تغطية لاحقة على صفحة المستجدات: فتاريخ توقف ينزلق بصمت يكسر المقارنة بين السنتين، وهي كل غرض الموقع.",
          "وحين يتغيّر رقم لأن المدخلات الأساسية تغيّرت، يُنقل التغيير إلى اللغتين في المراجعة نفسها. ولا إصدار جزئي بلغة واحدة.",
        ],
      },
    ],
    contact: {
      heading: "كيف تصل إلينا",
      body: "الأسئلة والتصويبات والاعتراضات على أي رقم تذهب إلى عنوان واحد:",
      note: "اكتب ذاكراً الصفحة والرقم موضع السؤال. وطلبات الصحافة تذكر المهلة في السطر الأول.",
      none: "لا عنوان تواصل مفتوح بعد. وإلى أن يتوفّر، لا سبيل لإرسال التصويبات إلى المرصد مباشرة - فليُقرأ كل رقم مقابل الصفحة التي تحمله والتحفّظ المطبوع إلى جانبه.",
    },
    crossLink: "افتح هذه الصفحة بالإنجليزية",
  },
};

/**
 * The footer's identity and currency strip. Two dates only, both of them
 * facts the site can stand behind: how far the tracking reaches, and when
 * the analysis last moved. No list of individual edits, because no such
 * list is kept.
 */
export const ABOUT_FOOTER = {
  en: {
    heading: "The observatory",
    identity:
      "Independent tracking of who rebuilds Lebanon, 2024 and 2026 - compiled outside government, donor and implementing bodies.",
    aboutLink: "About and contact",
    updatedLabel: "Last updated",
    tracking: (d: string) => `Tracking through ${d}`,
    revised: (d: string) => `Analysis last revised ${d}`,
    note: "Later coverage sits on the live updates page and enters none of these figures.",
  },
  ar: {
    heading: "المرصد",
    identity:
      "تتبّع مستقل لمن يعيد بناء لبنان، 2024 و2026 - يُعَدّ خارج الحكومة والجهات المانحة والجهات المنفّذة.",
    aboutLink: "عن المرصد والتواصل",
    updatedLabel: "آخر تحديث",
    tracking: (d: string) => `التتبّع حتى ${d}`,
    revised: (d: string) => `آخر مراجعة للتحليل ${d}`,
    note: "التغطية اللاحقة تبقى على صفحة المستجدات ولا تدخل في أي من هذه الأرقام.",
  },
} as const;
