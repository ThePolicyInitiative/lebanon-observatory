import type { ActorLayer } from "@/lib/types";

/**
 * The per-group analytical narrative for the actors page, in both
 * languages. Every reader-facing string is an { en, ar } pair so the two
 * sides of the site carry the same analysis at the same depth: the keys
 * never change, only the words.
 *
 * Group comparisons on this site are worded without figures: a group's
 * totals and its share of any stage are never printed, here or anywhere
 * else. The gains and losses bullets therefore rank and describe rather
 * than count - "widened", "narrowed", "held steady" - but each still
 * opens with the name of the stage it is about, because the figures
 * suite anchors on that shape. The counts that survive are event-level
 * facts (the 135-area municipal survey, the Saida school), which are not
 * group comparisons, and the standing rules hold: counts are traced
 * activity, never performance, and commitment is not disbursement is not
 * completed output.
 */

export type Bi = { en: string; ar: string };

export type TabContent = {
  profile2024: Bi;
  profile2026: Bi;
  directChange: Bi;
  gains: Bi[];
  losses: Bi[];
  mandateVsAction: Bi;
  financeRole: Bi;
  procurementRole: Bi;
  implementationRole: Bi;
  coreFinding?: Bi;
  sourceIds: string[];
};

export const CONTENT: Record<ActorLayer, TabContent> = {
  official: {
    profile2024: {
      en: "The 2024 state was strong exactly where mandates require least money and weak exactly where reconstruction happens: broad in coordination, clearly present in assessment, and thin in procurement, debris treatment and oversight. Every downstream function had a legal public owner; in practice its traced performers were private, communal or international.",
      ar: "كانت دولة 2024 قوية تحديداً حيث تتطلّب التفويضات أقل قدر من المال، وضعيفة تحديداً حيث تجري إعادة الإعمار: حضور واسع في التنسيق، وحضور واضح في التقييم، وحضور رقيق في الشراء ومعالجة الركام والرقابة. كل وظيفة لاحقة في السلسلة كان لها مالك عام قانوني؛ وعملياً كان مؤدّوها المرصودون جهات خاصة أو أهلية أو دولية.",
    },
    profile2026: {
      en: "The 2026 state concentrated in programmed reconstruction rather than expanding uniformly: coordination held steady, the procurement and oversight cells that were thin or empty before gained sustained official activity for the first time, and the state thinned as an emergency-finance crowd - one financed project chain replaced a scatter of emergency-finance appearances.",
      ar: "تركّزت دولة 2026 في إعادة الإعمار المبرمجة بدل التوسّع المتجانس: ثبت التنسيق على حاله، واكتسبت خانتا الشراء والرقابة، اللتان كانتا رقيقتين أو فارغتين من قبل، نشاطاً رسمياً متواصلاً للمرة الأولى، وانحسرت الدولة بوصفها حشداً لتمويل الطوارئ - سلسلة مشروع مموَّلة واحدة حلّت محل ظهورات متناثرة في تمويل الطوارئ.",
    },
    directChange: {
      en: "Greater role specialisation rather than uniform state expansion: the official row changed least in size while changing most in kind.",
      ar: "تخصّص أكبر في الأدوار لا توسّع متجانس للدولة: الصف الرسمي تغيّر الأقل في الحجم بينما تغيّر الأكثر في النوع.",
    },
    gains: [
      {
        en: "Reconstruction and services: the clearest official widening, as programmed works gained named public owners",
        ar: "إعادة الإعمار والخدمات: أوضح اتساع رسمي، إذ اكتسبت الأشغال المبرمجة مالكين عامّين مسمّين",
      },
      {
        en: "Procurement and contracting: slightly wider, anchored to the formal project",
        ar: "الشراء والتعاقد: اتساع طفيف، مشدود إلى المشروع الرسمي",
      },
      {
        en: "Oversight and accountability: slightly wider, with new watchdog cells around the financed chain",
        ar: "الرقابة والمساءلة: اتساع طفيف، مع خانات رقابية جديدة حول السلسلة الممولة",
      },
      {
        en: "Coordination: held steady - with an empowered executive behind it",
        ar: "التنسيق: ثابت على حاله - ومن خلفه سلطة تنفيذية ممكَّنة",
      },
    ],
    losses: [
      {
        en: "Finance and compensation: narrowed sharply - a single project chain replaced the emergency-finance crowd",
        ar: "التمويل والتعويضات: ضاق ضيقاً حاداً - سلسلة مشروع واحدة حلّت محل حشد تمويل الطوارئ",
      },
      {
        en: "Shelter and return: narrower, with humanitarian routing formalised through MoSA",
        ar: "الإيواء والعودة: أضيق، مع ترسيم المسار الإنساني عبر وزارة الشؤون الاجتماعية",
      },
      {
        en: "Livelihoods and community recovery: almost no official activity left",
        ar: "سبل العيش والتعافي المجتمعي: لم يبقَ فيه نشاط رسمي يُذكر",
      },
      {
        en: "Relief and protection: held level while the humanitarian load moved to partners",
        ar: "الإغاثة والحماية: ثبتت على حالها بينما انتقل الحمل الإنساني إلى الشركاء",
      },
    ],
    mandateVsAction: {
      en: "In both years the state held an owner on paper for every stage. What changed was activation: 2024 mandates were claims on budget lines that a caretaker government with a collapsed treasury could not exercise beyond coordination; 2026 re-funded and re-traced a subset of the same mandates rather than inventing new ones.",
      ar: "في السنتين كان للدولة مالك على الورق لكل مرحلة. ما تغيّر هو التفعيل: تفويضات 2024 كانت مطالبات على بنود موازنة لم تستطع حكومة تصريف أعمال بخزينة منهارة أن تمارسها بما يتجاوز التنسيق؛ أما 2026 فأعادت تمويل ورصد جزء من التفويضات نفسها بدل اختراع تفويضات جديدة.",
    },
    financeRole: {
      en: "Borrower and fiscal manager of the LEAP loan (Ministry of Finance); cabinet approved the January 2026 compensation framework - with no confirmed payment at the latest review.",
      ar: "المقترض والمدير المالي لقرض LEAP (وزارة المالية)؛ ومجلس الوزراء أقرّ إطار التعويضات في كانون الثاني 2026 - من دون أي دفعة مؤكَّدة عند آخر مراجعة.",
    },
    procurementRole: {
      en: "CDR runs LEAP procurement under World Bank rules with a published portal; the Council for the South continued legacy tendering outside the project perimeter.",
      ar: "مجلس الإنماء والإعمار يدير شراء LEAP بقواعد البنك الدولي وببوابة منشورة؛ ومجلس الجنوب واصل مناقصات موروثة خارج محيط المشروع.",
    },
    implementationRole: {
      en: "Ministry of Public Works holds execution leadership; ministry campaigns and utilities performed emergency repair with unpublished quantities; programme works remained unawarded.",
      ar: "وزارة الأشغال العامة تمسك بقيادة التنفيذ؛ وحملات وزارية ومرافق عامة أدّت إصلاحات طارئة بكميات غير منشورة؛ وبقيت أشغال البرنامج بلا إرساء.",
    },
    sourceIds: ["S-TRACKING", "S2", "S20", "S1", "S37"],
  },
  ngo_international: {
    profile2024: {
      en: "International organisations supplied the response's data and much of its delivery capacity: leading in assessment, strong in humanitarian finance and relief, and absent from procurement and oversight. Agencies stood in for the state's operational functions and not at all for its political ones.",
      ar: "وفّرت المنظمات الدولية معطيات الاستجابة وجانباً كبيراً من قدرتها على الإنجاز: تقدّمت في التقييم، وحضرت بقوة في التمويل الإنساني والإغاثة، وغابت عن الشراء والرقابة. أحلّت الوكالات نفسها محل وظائف الدولة التشغيلية، ولم تحلّ إطلاقاً محل وظائفها السياسية.",
    },
    profile2026: {
      en: "International involvement shifted from assessment and humanitarian support toward operational governance around the formal project, including procurement rules, disclosure, safeguards, supervision, grievance handling and third-party monitoring - their first traced activity in the procurement and oversight cells across the two years.",
      ar: "انتقل الانخراط الدولي من التقييم والدعم الإنساني نحو حوكمة تشغيلية حول المشروع الرسمي، تشمل قواعد الشراء والإفصاح والضمانات والإشراف ومعالجة الشكاوى ورقابة الطرف الثالث - وهو أول نشاط مرصود لها في خانتي الشراء والرقابة عبر السنتين.",
    },
    directChange: {
      en: "Traced breadth grew moderately while placement changed decisively: less assessment activity (the function partially repatriated to CNRS-L), more governance activity around the financed chain.",
      ar: "اتّسع النطاق المرصود اتساعاً معتدلاً بينما تبدّل الموقع تبدّلاً حاسماً: نشاط أقل في التقييم (أُعيدت الوظيفة جزئياً إلى المجلس الوطني للبحوث العلمية)، ونشاط أكبر في الحوكمة حول السلسلة الممولة.",
    },
    gains: [
      {
        en: "Coordination: the widest international gain, into the plan's coordination cells",
        ar: "التنسيق: أوسع مكسب دولي، نحو خانات التنسيق في الخطة",
      },
      {
        en: "Shelter and return: wider through the second displacement",
        ar: "الإيواء والعودة: أوسع عبر موجة النزوح الثانية",
      },
      {
        en: "Relief and protection: wider as the humanitarian load grew",
        ar: "الإغاثة والحماية: أوسع مع تعاظم الحمل الإنساني",
      },
      {
        en: "Oversight and accountability: a first appearance across the two years",
        ar: "الرقابة والمساءلة: ظهور أول عبر السنتين",
      },
      {
        en: "Procurement and contracting: a first, narrow foothold",
        ar: "الشراء والتعاقد: موطئ قدم أول وضيّق",
      },
    ],
    losses: [
      {
        en: "Damage and needs assessment: narrower - a genuine capacity transfer to Lebanese institutions, not a withdrawal",
        ar: "تقييم الأضرار والاحتياجات: أضيق - نقل حقيقي للقدرة إلى مؤسسات لبنانية، لا انسحاب",
      },
      {
        en: "Finance and compensation: slightly narrower as humanitarian finance consolidated",
        ar: "التمويل والتعويضات: أضيق قليلاً مع تجميع التمويل الإنساني",
      },
    ],
    mandateVsAction: {
      en: "International actors do not hold Lebanese legal mandates; their authority in 2026 was contractual and procedural - the price of lendability. Eligibility criteria, procurement thresholds and results frameworks now shape what 'reconstruction' means in practice.",
      ar: "لا تمسك الجهات الدولية بتفويضات قانونية لبنانية؛ فسلطتها في 2026 كانت تعاقدية وإجرائية - ثمن القابلية للإقراض. معايير الأهلية وعتبات الشراء وأطر النتائج هي التي تصوغ اليوم معنى «إعادة الإعمار» عملياً.",
    },
    financeRole: {
      en: "The World Bank became the reconstruction stream's rule-setter as well as funder; the humanitarian appeal (42% funded at 6 July) and bilateral packages ran on parallel tracks that must not be conflated with reconstruction financing.",
      ar: "أصبح البنك الدولي واضع قواعد مسار إعادة الإعمار ومموّله معاً؛ وجرى النداء الإنساني (ممول بنسبة 42% في 6 تموز) والحزم الثنائية على مسارات موازية يجب ألا تُخلط بتمويل إعادة الإعمار.",
    },
    procurementRole: {
      en: "World Bank procurement law governs LEAP packages; the Third-Party Monitoring Agent - an external accountability actor - was itself under procurement at the latest review.",
      ar: "قانون الشراء لدى البنك الدولي يحكم حزم LEAP؛ وجهة رقابة الطرف الثالث - وهي جهة مساءلة خارجية - كانت هي نفسها قيد الشراء عند آخر مراجعة.",
    },
    implementationRole: {
      en: "Agencies delivered relief, shelter support and WASH at scale in both years; they did not and could not resolve compensation policy, property rights or municipal finance.",
      ar: "قدّمت الوكالات الإغاثة ودعم الإيواء وخدمات المياه والصرف الصحي على نطاق واسع في السنتين؛ ولم تحسم، ولم يكن بوسعها أن تحسم، سياسة التعويضات أو حقوق الملكية أو مالية البلديات.",
    },
    sourceIds: ["S-TRACKING", "S2", "S40", "S5", "S6"],
  },
  municipal: {
    profile2024: {
      en: "Municipalities were the system's sensors and shock absorbers, and its least resourced tier: they traced damage, ran or hosted shelters, reopened local access and marshalled volunteers - and the ten-day municipal survey of 135 areas produced the response's fastest national damage assessments. Yet the tracking shows no systematic municipal role in finance, direct reconstruction, livelihoods or oversight.",
      ar: "كانت البلديات حسّاسات النظام وممتصّات صدماته، ومستواه الأفقر موارد: رصدت الأضرار، وأدارت مراكز إيواء أو استضافتها، وأعادت فتح الطرق المحلية، وحشدت المتطوّعين - والمسح البلدي الذي غطّى 135 منطقة في عشرة أيام أنتج أسرع تقييمات وطنية للأضرار في الاستجابة كلها. ومع ذلك لا يُظهر التتبّع أي دور بلدي منهجي في التمويل أو إعادة الإعمار المباشرة أو سبل العيش أو الرقابة.",
    },
    profile2026: {
      en: "Municipalities were repositioned rather than empowered: from frontline improvisers to intake-and-certification nodes in longer chains. Their traced activity narrowed, concentrating in reporting, shelter support and local clearance. Formal appearances in the new architecture are as data providers, certifiers, consultation subjects and grievance interfaces - never as budget holders, procurers or sequencers.",
      ar: "أُعيد تموضع البلديات ولم تُمكَّن: من مرتجلي الخط الأمامي إلى نقاط استقبال وإفادة في سلاسل أطول. ضاق نشاطها المرصود وتركّز في الإبلاغ ودعم الإيواء والإزالة المحلية. وظهورها الرسمي في البنية الجديدة هو ظهور مزوِّد معطيات وجهة إفادة وطرف يُستشار وواجهة شكاوى - لا حائز موازنة ولا مشترٍ ولا مقرِّر تسلسل أبداً.",
    },
    directChange: {
      en: "Traced municipal activity narrowed with no compensating gain anywhere in the row. Formalisation moved authority up while leaving labour down: every new procedure that runs 'through' municipalities extracts work without conferring resources.",
      ar: "ضاق النشاط البلدي المرصود من دون أي مكسب معوِّض في أي موضع من الصف. الترسيم نقل السلطة إلى أعلى وترك العمل في الأسفل: كل إجراء جديد يمرّ «عبر» البلديات ينتزع عملاً من دون أن يمنح موارد.",
    },
    gains: [
      {
        en: "Shelter and return: the one functional widening, as the shelter-and-relief interface grew",
        ar: "الإيواء والعودة: الاتساع الوظيفي الوحيد، مع نموّ واجهة الإيواء والإغاثة",
      },
    ],
    losses: [
      {
        en: "Coordination: narrower reporting and liaison",
        ar: "التنسيق: إبلاغ وتواصل أضيق",
      },
      {
        en: "Damage and needs assessment: narrower once the survey function moved upward",
        ar: "تقييم الأضرار والاحتياجات: أضيق بعدما انتقلت وظيفة المسح إلى أعلى",
      },
      {
        en: "Safety and access: local clearance and enabling narrowed",
        ar: "السلامة والوصول: ضاقت الإزالة المحلية وأعمال التمكين",
      },
    ],
    mandateVsAction: {
      en: "Municipalities held local knowledge, resident contact, damage-reporting and access-facilitation functions in both years - and in neither year did they hold reconstruction budgets, procurement authority, contractor-selection power or oversight authority. Procedural consultation is not decentralisation.",
      ar: "أمسكت البلديات في السنتين بوظائف المعرفة المحلية والتواصل مع الأهالي والإبلاغ عن الأضرار وتيسير الوصول - ولم تمسك في أي من السنتين بموازنات إعادة إعمار ولا سلطة شراء ولا صلاحية اختيار المقاولين ولا سلطة رقابة. الاستشارة الإجرائية ليست لامركزية.",
    },
    financeRole: {
      en: "None traced in either year. Municipal revenues collapsed with the currency; no reconstruction budget line, guaranteed envelope or procurement support scheme was created between the wars.",
      ar: "لا شيء مرصود في أي من السنتين. إيرادات البلديات انهارت مع العملة؛ ولم يُنشأ بين الحربين أي بند موازنة لإعادة الإعمار ولا غلاف مضمون ولا نظام دعم للشراء.",
    },
    procurementRole: {
      en: "None traced in either year - with the exception of the Union of Municipalities of the Southern Suburbs, which ran a cabinet-assigned rubble tender in 2024 outside any standing municipal mandate.",
      ar: "لا شيء مرصود في أي من السنتين - باستثناء اتحاد بلديات الضاحية الجنوبية الذي أدار في 2024 مناقصة أنقاض كلّفه بها مجلس الوزراء خارج أي تفويض بلدي قائم.",
    },
    implementationRole: {
      en: "Reported clearance across sixteen-plus localities in 2026, shelter hosting through both displacement waves, utility liaison - labour without authority.",
      ar: "إزالة معلَنة في أكثر من ست عشرة بلدة في 2026، واستضافة إيواء عبر موجتي النزوح، وتنسيق مع المرافق العامة - عمل بلا سلطة.",
    },
    coreFinding: {
      en: "Municipalities remained essential as frontline sensors, resident-contact points and access facilitators, but they did not receive proportional reconstruction budgets, contractor-selection power or oversight authority.",
      ar: "بقيت البلديات أساسية بوصفها حسّاسات الخط الأمامي ونقاط التواصل مع الأهالي وميسّرات الوصول، لكنها لم تنل موازنات إعادة إعمار متناسبة ولا صلاحية اختيار المقاولين ولا سلطة رقابة.",
    },
    sourceIds: ["S-TRACKING", "S19", "S10", "S8"],
  },
  community: {
    profile2024: {
      en: "The community bloc - residents, NGOs, professional bodies, volunteers and parallel networks - was the widest single block of traced activity in 2024 and performed the functions of a reconstruction ministry with none of its resources: households cleared and repaired at their own expense, villages financed collective solutions, professionals contributed system inputs, and the parallel track distributed the only compensation actually flowing.",
      ar: "الكتلة الأهلية - الأهالي والجمعيات والهيئات المهنية والمتطوّعون والشبكات الموازية - كانت أوسع كتلة واحدة من النشاط المرصود في 2024، وأدّت وظائف وزارة لإعادة الإعمار من دون أي من مواردها: الأسر أزالت ورمّمت على نفقتها، والقرى موّلت حلولاً جماعية، والمهنيون قدّموا مدخلات للنظام، والمسار الموازي وزّع التعويض الوحيد المتدفق فعلاً.",
    },
    profile2026: {
      en: "The bloc widened further and rotated: traced activity surged in coordination, relief and shelter while collapsing in finance, rubble, debris and physical reconstruction. Its composition shifted from professional-technical to civic-operational - from supplying missing expertise to supplying missing labour.",
      ar: "اتّسعت الكتلة أكثر ودارت وجهتها: قفز النشاط المرصود في التنسيق والإغاثة والإيواء بينما انهار في التمويل والأنقاض والركام وإعادة الإعمار المادية. وتحوّل تكوينها من مهني-تقني إلى مدني-تشغيلي - من سدّ نقص الخبرة إلى سدّ نقص العمل.",
    },
    directChange: {
      en: "Community action expanded sharply in humanitarian and social-recovery functions but contracted in finance, rubble management and physical reconstruction. It absorbed pressure without acquiring public-works authority.",
      ar: "اتّسع العمل الأهلي اتساعاً حاداً في الوظائف الإنسانية ووظائف التعافي الاجتماعي لكنه انكمش في التمويل وإدارة الأنقاض وإعادة الإعمار المادية. امتصّ الضغط من دون أن يكتسب سلطة أشغال عامة.",
    },
    gains: [
      {
        en: "Relief and protection: the sharpest surge anywhere in the tracking",
        ar: "الإغاثة والحماية: أحدّ قفزة في التتبّع كله",
      },
      {
        en: "Coordination: from marginal to widespread",
        ar: "التنسيق: من الهامش إلى الانتشار",
      },
      {
        en: "Shelter and return: wider as displaced households were hosted and returned",
        ar: "الإيواء والعودة: أوسع مع استضافة الأسر النازحة وعودتها",
      },
      {
        en: "Livelihoods and community recovery: held roughly level",
        ar: "سبل العيش والتعافي المجتمعي: ثبت تقريباً على حاله",
      },
    ],
    losses: [
      {
        en: "Finance and compensation: collapsed - household finance exhausted by a second displacement in eighteen months",
        ar: "التمويل والتعويضات: انهار - مالية الأسر استُنفدت بنزوح ثانٍ خلال ثمانية عشر شهراً",
      },
      {
        en: "Rubble clearance: nearly withdrawn",
        ar: "رفع الأنقاض: انسحاب شبه كامل",
      },
      {
        en: "Debris treatment and disposal: nearly withdrawn",
        ar: "معالجة الركام والتخلص منه: انسحاب شبه كامل",
      },
      {
        en: "Reconstruction and services: narrower as physical work professionalised into contractor channels",
        ar: "إعادة الإعمار والخدمات: أضيق مع انتقال العمل المادي إلى قنوات المقاولين",
      },
    ],
    mandateVsAction: {
      en: "Community delivery does not imply formal authority, stable finance, equal geographic reach or public accountability. In both wars the bloc was the system's shock absorber; in 2026 it absorbed a social shock because the financial one had already spent it. Part of the traced surge also reflects finer-grained 2026 entries.",
      ar: "الإنجاز الأهلي لا يعني سلطة رسمية ولا تمويلاً مستقراً ولا امتداداً جغرافياً متكافئاً ولا مساءلة عامة. في الحربين كانت الكتلة ممتصّ صدمات النظام؛ وفي 2026 امتصّت صدمة اجتماعية لأن الصدمة المالية كانت قد استنفدتها. وجزء من القفزة المرصودة يعكس أيضاً مدخلات 2026 الأدق تفصيلاً.",
    },
    financeRole: {
      en: "Contracted sharply: savings, remittances and diaspora finance were depleted; reported parallel-track cash appears in the 2026 entry as continued relevance rather than measured flows.",
      ar: "انكمش انكماشاً حاداً: نضبت المدّخرات والتحويلات وتمويل الاغتراب؛ والنقد المعلَن في المسار الموازي يظهر في مدخلات 2026 بوصفه استمراراً في الحضور لا تدفقات مقيسة.",
    },
    procurementRole: {
      en: "None - physical work professionalised into contractor and ministry channels that the bloc does not control.",
      ar: "لا شيء - انتقل العمل المادي إلى قنوات مهنية لدى المقاولين والوزارات لا تتحكم بها الكتلة.",
    },
    implementationRole: {
      en: "Shelter management (one Saida school hosted about 650 families), volunteer clearance campaigns in Nabatieh, damage-reporting initiatives and participatory workshops - load-bearing functions a programmed system would staff and budget, performed unpaid.",
      ar: "إدارة الإيواء (مدرسة واحدة في صيدا استضافت نحو 650 عائلة)، وحملات إزالة تطوّعية في النبطية، ومبادرات إبلاغ عن الأضرار وورش تشاركية - وظائف حاملة للأثقال كان نظام مبرمج سيوظّف لها ويرصد لها موازنة، وقد أُدّيت بلا أجر.",
    },
    coreFinding: {
      en: "Community delivery widened where the official response was thinnest, and it absorbed the social shock of 2026 without acquiring public-works authority, stable finance or public accountability.",
      ar: "اتّسع الإنجاز الأهلي حيث كانت الاستجابة الرسمية في أرقّ حالاتها، وامتصّ الصدمة الاجتماعية لعام 2026 من دون أن يكتسب سلطة أشغال عامة ولا تمويلاً مستقراً ولا مساءلة عامة.",
    },
    sourceIds: ["S-TRACKING", "S58", "S59", "S21", "S9"],
  },
};

/** The three diverging-change figures, one per group that carries one. */
export const CHANGE_CHARTS: Record<
  "official" | "ngo_international" | "community",
  { id: string; title: Bi; subtitle: Bi; description: Bi }
> = {
  ngo_international: {
    id: "intl-shift",
    title: {
      en: "International governance shift, 2026 minus 2024",
      ar: "التحوّل الدولي نحو الحوكمة، 2026 ناقص 2024",
    },
    subtitle: {
      en: "Change in traced international activity at each stage of the response. Gains cluster in governance and humanitarian stages; the assessment contraction reflects repatriation to Lebanese institutions.",
      ar: "التغيّر في النشاط الدولي المرصود في كل مرحلة من مراحل الاستجابة. تتجمّع المكاسب في مراحل الحوكمة والمراحل الإنسانية؛ وانكماش التقييم يعكس إعادة الوظيفة إلى مؤسسات لبنانية.",
    },
    description: {
      en: "Diverging bar chart of change in traced international activity: coordination widened most, then relief and shelter; oversight and procurement appear for the first time; assessment is the one clear contraction.",
      ar: "مخطط أشرطة متباعد للتغيّر في النشاط الدولي المرصود: اتّسع التنسيق أكثر من سواه، تليه الإغاثة فالإيواء؛ وتظهر الرقابة والشراء للمرة الأولى؛ والتقييم هو الانكماش الواضح الوحيد.",
    },
  },
  community: {
    id: "community-shift",
    title: {
      en: "Community-role reallocation, 2026 minus 2024",
      ar: "إعادة توزيع الأدوار الأهلية، 2026 ناقص 2024",
    },
    subtitle: {
      en: "Expanded: relief, coordination, shelter. Contracted: finance, rubble, debris, reconstruction.",
      ar: "اتّسع: الإغاثة والتنسيق والإيواء. انكمش: التمويل والأنقاض والركام وإعادة الإعمار.",
    },
    description: {
      en: "Diverging bar chart of change in traced community activity: relief widened most, then coordination, then shelter; finance narrowed most, with rubble, debris and physical reconstruction close behind.",
      ar: "مخطط أشرطة متباعد للتغيّر في النشاط الأهلي المرصود: اتّسعت الإغاثة أكثر من سواها، ثم التنسيق فالإيواء؛ وضاق التمويل أكثر من سواه، وتليه الأنقاض والركام وإعادة الإعمار المادية.",
    },
  },
  official: {
    id: "official-shift",
    title: {
      en: "Official-institution change by stage, 2026 minus 2024",
      ar: "تغيّر المؤسسات الرسمية بحسب المرحلة، 2026 ناقص 2024",
    },
    subtitle: {
      en: "Reconstruction and services widened most; procurement and oversight edged wider; finance narrowed as one project chain replaced the emergency-finance crowd.",
      ar: "اتّسعت إعادة الإعمار والخدمات أكثر من سواها؛ واتّسع الشراء والرقابة قليلاً؛ وضاق التمويل مع حلول سلسلة مشروع واحدة محل حشد تمويل الطوارئ.",
    },
    description: {
      en: "Diverging bar chart of change in traced official activity at each stage of the response: works, procurement and oversight widened; finance, shelter and livelihoods narrowed.",
      ar: "مخطط أشرطة متباعد للتغيّر في النشاط الرسمي المرصود في كل مرحلة من مراحل الاستجابة: اتّسعت الأشغال والشراء والرقابة؛ وضاق التمويل والإيواء وسبل العيش.",
    },
  },
};

/** The governance-shift figure on the international tab. */
export const GOVERNANCE_SHIFT: {
  heading: Bi;
  before: Bi;
  afterIntro: Bi;
  chips: Bi[];
} = {
  heading: {
    en: "From assessment and humanitarian support to operational governance",
    ar: "من التقييم والدعم الإنساني إلى الحوكمة التشغيلية",
  },
  before: {
    en: "Assessment and humanitarian support beside the state",
    ar: "التقييم والدعم الإنساني إلى جانب الدولة",
  },
  afterIntro: {
    en: "Operational governance around the project:",
    ar: "حوكمة تشغيلية حول المشروع:",
  },
  chips: [
    { en: "Procurement", ar: "الشراء" },
    { en: "Disclosure", ar: "الإفصاح" },
    { en: "Safeguards", ar: "الضمانات" },
    { en: "Supervision", ar: "الإشراف" },
    { en: "Grievance mechanism", ar: "آلية الشكاوى" },
    { en: "Third-party monitoring", ar: "رقابة الطرف الثالث" },
  ],
};
