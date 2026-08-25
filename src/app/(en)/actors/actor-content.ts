import type { ActorLayer } from "@/lib/types";

/**
 * The per-layer analytical narrative for the actors page, in both
 * languages. Every reader-facing string is an { en, ar } pair so the two
 * sides of the site carry the same analysis at the same depth: the keys
 * never change, only the words. The English strings are the canonical
 * narrative and stay verbatim; the Arabic follows the site's analytical
 * rules - counts are traced presence, never performance, and commitment
 * is not disbursement is not completed output.
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
      en: "The 2024 state was strong exactly where mandates require least money and weak exactly where reconstruction happens: 24 of 54 traced actors in strategy and coordination and 11 of 37 in assessment, but only 4 of 8 in procurement, 2 of 12 in debris treatment and 3 of 8 in oversight. Every downstream function had a legal public owner; in practice its traced performers were private, communal or international.",
      ar: "كانت دولة 2024 قوية تحديداً حيث تتطلّب التفويضات أقل قدر من المال، وضعيفة تحديداً حيث تجري إعادة الإعمار: 24 من 54 جهة مرصودة في الاستراتيجية والتنسيق، و11 من 37 في التقييم، مقابل 4 فقط من 8 في الشراء، و2 من 12 في معالجة الركام، و3 من 8 في الرقابة. كل وظيفة لاحقة في السلسلة كان لها مالك عام قانوني؛ وعملياً كان مؤدّوها المرصودون جهات خاصة أو أهلية أو دولية.",
    },
    profile2026: {
      en: "The 2026 state concentrated in programmed reconstruction rather than expanding uniformly: steady in strategy (24 → 24), newly present in procurement and oversight cells that were thin or empty before, and thinner as an emergency-finance crowd - one financed project chain replaced fifteen scattered emergency-finance presences.",
      ar: "تركّزت دولة 2026 في إعادة الإعمار المبرمجة بدل التوسّع المتجانس: ثبات في الاستراتيجية (24 ← 24)، وحضور جديد في خانات الشراء والرقابة التي كانت رقيقة أو فارغة من قبل، وانحسار بوصفها حشداً لتمويل الطوارئ - سلسلة مشروع مموَّلة واحدة حلّت محل خمسة عشر حضوراً متناثراً في تمويل الطوارئ.",
    },
    directChange: {
      en: "Greater role specialisation rather than uniform state expansion: the official row changed least in total while changing most in kind.",
      ar: "تخصّص أكبر في الأدوار لا توسّع متجانس للدولة: الصف الرسمي تغيّر الأقل في المجموع بينما تغيّر الأكثر في النوع.",
    },
    gains: [
      {
        en: "Reconstruction and services: 8 → 13 traced actors",
        ar: "إعادة الإعمار والخدمات: 8 ← 13 جهة مرصودة",
      },
      {
        en: "Procurement and contracting: 4 → 5",
        ar: "الشراء والتعاقد: 4 ← 5",
      },
      {
        en: "Oversight and accountability: 3 → 4",
        ar: "الرقابة والمساءلة: 3 ← 4",
      },
      {
        en: "Strategy held steady at 24 - with an empowered executive behind it",
        ar: "الاستراتيجية ثابتة عند 24 - ومن خلفها سلطة تنفيذية ممكَّنة",
      },
    ],
    losses: [
      {
        en: "Finance and compensation: 15 → 7 (a project chain replaced an emergency-finance crowd)",
        ar: "التمويل والتعويضات: 15 ← 7 (سلسلة مشروع حلّت محل حشد تمويل الطوارئ)",
      },
      {
        en: "Shelter and return: 6 → 3 (humanitarian routing formalised through MoSA)",
        ar: "الإيواء والعودة: 6 ← 3 (رُسّم المسار الإنساني عبر وزارة الشؤون الاجتماعية)",
      },
      {
        en: "Livelihoods presence: 4 → 1",
        ar: "حضور سبل العيش: 4 ← 1",
      },
      {
        en: "Relief presence held at 4 while the humanitarian load moved to partners",
        ar: "حضور الإغاثة ثابت عند 4 بينما انتقل الحمل الإنساني إلى الشركاء",
      },
    ],
    mandateVsAction: {
      en: "In both years the state held an owner on paper for every stage. What changed was activation: 2024 mandates were claims on budget lines that a caretaker government with a collapsed treasury could not exercise beyond coordination; 2026 re-funded and re-traced a subset of the same mandates rather than inventing new ones.",
      ar: "في السنتين كان للدولة مالك على الورق لكل مرحلة. ما تغيّر هو التفعيل: تفويضات 2024 كانت مطالبات على بنود موازنة لم تستطع حكومة تصريف أعمال بخزينة منهارة أن تمارسها بما يتجاوز التنسيق؛ أما 2026 فأعادت تمويل ورصد جزء من التفويضات نفسها بدل اختراع تفويضات جديدة.",
    },
    financeRole: {
      en: "Borrower and fiscal manager of the LEAP loan (Ministry of Finance); cabinet approved the January 2026 compensation framework - with no confirmed payment by the cut-off.",
      ar: "المقترض والمدير المالي لقرض LEAP (وزارة المالية)؛ ومجلس الوزراء أقرّ إطار التعويضات في كانون الثاني 2026 - من دون أي دفعة مؤكَّدة حتى تاريخ التوقف.",
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
      en: "International organisations supplied the response's data and much of its delivery capacity: dominant in assessment (13 of 37 traced actors), strong in humanitarian finance (12) and relief (11), and absent from procurement and oversight. Agencies stood in for the state's operational functions and not at all for its political ones.",
      ar: "وفّرت المنظمات الدولية معطيات الاستجابة وجانباً كبيراً من قدرتها على الإنجاز: هيمنة في التقييم (13 من 37 جهة مرصودة)، وقوة في التمويل الإنساني (12) والإغاثة (11)، وغياب عن الشراء والرقابة. أحلّت الوكالات نفسها بامتياز محل وظائف الدولة التشغيلية، ولم تحلّ إطلاقاً محل وظائفها السياسية.",
    },
    profile2026: {
      en: "International involvement shifted from assessment and humanitarian support toward operational governance around the formal project, including procurement rules, disclosure, safeguards, supervision, grievance handling and third-party monitoring - first-ever traced presence in procurement and oversight cells.",
      ar: "انتقل الانخراط الدولي من التقييم والدعم الإنساني نحو حوكمة تشغيلية حول المشروع الرسمي، تشمل قواعد الشراء والإفصاح والضمانات والإشراف ومعالجة الشكاوى ورقابة الطرف الثالث - أول حضور مرصود على الإطلاق في خانتي الشراء والرقابة.",
    },
    directChange: {
      en: "Traced breadth grew moderately while placement changed decisively: fewer assessment presences (the function partially repatriated to CNRS-L), more governance presences around the financed chain.",
      ar: "اتّسع النطاق المرصود اتساعاً معتدلاً بينما تبدّل الموقع تبدّلاً حاسماً: حضور أقل في التقييم (أُعيدت الوظيفة جزئياً إلى المجلس الوطني للبحوث العلمية)، وحضور أكبر في الحوكمة حول السلسلة الممولة.",
    },
    gains: [
      {
        en: "Strategy and coordination: +8 (15 → 23)",
        ar: "الاستراتيجية والتنسيق: +8 (15 ← 23)",
      },
      {
        en: "Shelter and return: +4 (7 → 11)",
        ar: "الإيواء والعودة: +4 (7 ← 11)",
      },
      {
        en: "Relief and protection: +5 (11 → 16)",
        ar: "الإغاثة والحماية: +5 (11 ← 16)",
      },
      {
        en: "Oversight and accountability: +3 (0 → 3)",
        ar: "الرقابة والمساءلة: +3 (0 ← 3)",
      },
      {
        en: "Procurement and contracting: +1 (0 → 1)",
        ar: "الشراء والتعاقد: +1 (0 ← 1)",
      },
    ],
    losses: [
      {
        en: "Damage and needs assessment: −7 (13 → 6) - a genuine capacity transfer to Lebanese institutions, not a withdrawal",
        ar: "تقييم الأضرار والاحتياجات: −7 (13 ← 6) - نقل حقيقي للقدرة إلى مؤسسات لبنانية، لا انسحاب",
      },
      {
        en: "Finance presence: −2 (12 → 10), as humanitarian finance consolidated",
        ar: "حضور التمويل: −2 (12 ← 10) مع تجميع التمويل الإنساني",
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
      en: "World Bank procurement law governs LEAP packages; the Third-Party Monitoring Agent - an external accountability actor - was itself under procurement at the cut-off.",
      ar: "قانون الشراء لدى البنك الدولي يحكم حزم LEAP؛ وجهة رقابة الطرف الثالث - وهي جهة مساءلة خارجية - كانت هي نفسها قيد الشراء عند تاريخ التوقف.",
    },
    implementationRole: {
      en: "Agencies delivered relief, shelter support and WASH at scale in both years; they did not and could not resolve compensation policy, property rights or municipal finance.",
      ar: "قدّمت الوكالات الإغاثة ودعم الإيواء وخدمات المياه والصرف الصحي على نطاق واسع في السنتين؛ ولم تحسم، ولم يكن بوسعها أن تحسم، سياسة التعويضات أو حقوق الملكية أو مالية البلديات.",
    },
    sourceIds: ["S-TRACKING", "S2", "S40", "S5", "S6"],
  },
  municipal: {
    profile2024: {
      en: "Municipalities were the system's sensors and shock absorbers, and its least resourced tier: they traced damage, ran or hosted shelters, reopened local access and marshalled volunteers - and the ten-day municipal survey of 135 areas produced the response's fastest national damage assessments. Yet the tracking shows 19 actor-stage entries with zero systematic roles in finance, direct reconstruction, livelihoods or oversight.",
      ar: "كانت البلديات حسّاسات النظام وممتصّات صدماته، وطبقته الأفقر موارد: رصدت الأضرار، وأدارت مراكز إيواء أو استضافتها، وأعادت فتح الطرق المحلية، وحشدت المتطوّعين - والمسح البلدي الذي غطّى 135 منطقة في عشرة أيام أنتج أسرع تقييمات وطنية للأضرار في الاستجابة كلها. ومع ذلك يُظهر التتبّع 19 مدخل جهة-مرحلة مع صفر أدوار منهجية في التمويل أو إعادة الإعمار المباشرة أو سبل العيش أو الرقابة.",
    },
    profile2026: {
      en: "Municipalities were repositioned rather than empowered: from frontline improvisers to intake-and-certification nodes in longer chains. Their traced presence thinned to 12 entries, concentrated in reporting, shelter support and local clearance. Formal appearances in the new architecture are as data providers, certifiers, consultation subjects and grievance interfaces - never as budget holders, procurers or sequencers.",
      ar: "أُعيد تموضع البلديات ولم تُمكَّن: من مرتجلي الخط الأمامي إلى نقاط استقبال وإفادة في سلاسل أطول. انحسر حضورها المرصود إلى 12 مدخلاً، متركّزاً في الإبلاغ ودعم الإيواء والإزالة المحلية. وظهورها الرسمي في البنية الجديدة هو ظهور مزوِّد معطيات وجهة إفادة وطرف يُستشار وواجهة شكاوى - لا حائز موازنة ولا مشترٍ ولا مقرِّر تسلسل أبداً.",
    },
    directChange: {
      en: "Traced presence fell 19 → 12 with no compensating gain anywhere in the row. Formalisation moved authority up while leaving labour down: every new procedure that runs 'through' municipalities extracts work without conferring resources.",
      ar: "هبط الحضور المرصود 19 ← 12 من دون أي مكسب معوِّض في أي موضع من الصف. الترسيم نقل السلطة إلى أعلى وترك العمل في الأسفل: كل إجراء جديد يمرّ «عبر» البلديات ينتزع عملاً من دون أن يمنح موارد.",
    },
    gains: [
      {
        en: "Shelter and relief interface: 3 → 4 - the only functional gain",
        ar: "واجهة الإيواء والإغاثة: 3 ← 4 - المكسب الوظيفي الوحيد",
      },
    ],
    losses: [
      {
        en: "Coordination and reporting: 6 → 3",
        ar: "التنسيق والإبلاغ: 6 ← 3",
      },
      {
        en: "Damage assessment: 4 → 2",
        ar: "تقييم الأضرار: 4 ← 2",
      },
      {
        en: "Local clearance and enabling: 6 → 3",
        ar: "الإزالة المحلية والتمكين: 6 ← 3",
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
      en: "The community bloc - residents, NGOs, professional bodies, volunteers and parallel networks, 145 of 343 entries - performed the functions of a reconstruction ministry with none of its resources: households cleared and repaired at their own expense, villages financed collective solutions, professionals contributed system inputs, and the parallel track distributed the only compensation actually flowing.",
      ar: "الكتلة الأهلية - الأهالي والجمعيات والهيئات المهنية والمتطوّعون والشبكات الموازية، 145 من 343 مدخلاً - أدّت وظائف وزارة لإعادة الإعمار من دون أي من مواردها: الأسر أزالت ورمّمت على نفقتها، والقرى موّلت حلولاً جماعية، والمهنيون قدّموا مدخلات للنظام، والمسار الموازي وزّع التعويض الوحيد المتدفق فعلاً.",
    },
    profile2026: {
      en: "The bloc's entry grew to 172 entries and rotated: traced presence surged in coordination (9 → 34), relief (20 → 55) and shelter (18 → 25) while collapsing in finance (15 → 4), rubble (11 → 2), debris (7 → 2) and physical reconstruction (18 → 13). Its composition shifted from professional-technical to civic-operational - from supplying missing expertise to supplying missing labour.",
      ar: "نمت مدخلات الكتلة إلى 172 مدخلاً ودارت وجهتها: قفز الحضور المرصود في التنسيق (9 ← 34) والإغاثة (20 ← 55) والإيواء (18 ← 25) بينما انهار في التمويل (15 ← 4) والأنقاض (11 ← 2) والركام (7 ← 2) وإعادة الإعمار المادية (18 ← 13). وتحوّل تكوينها من مهني-تقني إلى مدني-تشغيلي - من سدّ نقص الخبرة إلى سدّ نقص العمل.",
    },
    directChange: {
      en: "Community action expanded sharply in humanitarian and social-recovery functions but contracted in finance, rubble management and physical reconstruction. It absorbed pressure without acquiring public-works authority.",
      ar: "اتّسع العمل الأهلي اتساعاً حاداً في الوظائف الإنسانية ووظائف التعافي الاجتماعي لكنه انكمش في التمويل وإدارة الأنقاض وإعادة الإعمار المادية. امتصّ الضغط من دون أن يكتسب سلطة أشغال عامة.",
    },
    gains: [
      {
        en: "Relief and protection: +35 (20 → 55)",
        ar: "الإغاثة والحماية: +35 (20 ← 55)",
      },
      {
        en: "Strategy and coordination: +25 (9 → 34)",
        ar: "الاستراتيجية والتنسيق: +25 (9 ← 34)",
      },
      {
        en: "Shelter and return: +7 (18 → 25)",
        ar: "الإيواء والعودة: +7 (18 ← 25)",
      },
      {
        en: "Livelihoods and community recovery: +1 (22 → 23)",
        ar: "سبل العيش والتعافي المجتمعي: +1 (22 ← 23)",
      },
    ],
    losses: [
      {
        en: "Finance and compensation: −11 (15 → 4) - household finance exhausted by a second displacement in eighteen months",
        ar: "التمويل والتعويضات: −11 (15 ← 4) - مالية الأسر استُنفدت بنزوح ثانٍ خلال ثمانية عشر شهراً",
      },
      {
        en: "Rubble clearance: −9 (11 → 2)",
        ar: "رفع الأنقاض: −9 (11 ← 2)",
      },
      {
        en: "Debris treatment: −5 (7 → 2)",
        ar: "معالجة الركام: −5 (7 ← 2)",
      },
      {
        en: "Reconstruction and services: −5 (18 → 13)",
        ar: "إعادة الإعمار والخدمات: −5 (18 ← 13)",
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
      en: "Shelter management (one Saida school hosted about 650 families), volunteer clearance campaigns in Nabatieh, entries initiatives and participatory workshops - load-bearing functions a programmed system would staff and budget, performed unpaid.",
      ar: "إدارة الإيواء (مدرسة واحدة في صيدا استضافت نحو 650 عائلة)، وحملات إزالة تطوّعية في النبطية، ومبادرات تتبّع وورش تشاركية - وظائف حاملة للأثقال كان نظام مبرمج سيوظّف لها ويرصد لها موازنة، وقد أُدّيت بلا أجر.",
    },
    coreFinding: {
      en: "Community action expanded sharply in humanitarian and social-recovery functions but contracted in finance, rubble management and physical reconstruction. It absorbed pressure without acquiring public-works authority.",
      ar: "اتّسع العمل الأهلي اتساعاً حاداً في الوظائف الإنسانية ووظائف التعافي الاجتماعي لكنه انكمش في التمويل وإدارة الأنقاض وإعادة الإعمار المادية. امتصّ الضغط من دون أن يكتسب سلطة أشغال عامة.",
    },
    sourceIds: ["S-TRACKING", "S58", "S59", "S21", "S9"],
  },
};

/** The three diverging-change figures, one per layer that carries one. */
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
      en: "Change in traced NGO and international-agency presence per stage. Gains cluster in governance and humanitarian stages; the assessment contraction reflects repatriation to Lebanese institutions.",
      ar: "التغيّر في الحضور المرصود للمنظمات غير الحكومية والوكالات الدولية في كل مرحلة. تتجمّع المكاسب في مراحل الحوكمة والمراحل الإنسانية؛ وانكماش التقييم يعكس إعادة الوظيفة إلى مؤسسات لبنانية.",
    },
    description: {
      en: "Diverging bar chart of change in traced international presence: strategy and coordination up 8, relief up 5, shelter up 4, oversight up 3, procurement up 1, assessment down 7.",
      ar: "مخطط أشرطة متباعد للتغيّر في الحضور الدولي المرصود: الاستراتيجية والتنسيق +8، والإغاثة +5، والإيواء +4، والرقابة +3، والشراء +1، والتقييم −7.",
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
      en: "Diverging bar chart of change in traced community presence: relief up 35, coordination up 25, shelter up 7, livelihoods up 1; finance down 11, rubble down 9, debris down 5, reconstruction down 5.",
      ar: "مخطط أشرطة متباعد للتغيّر في الحضور الأهلي المرصود: الإغاثة +35، والتنسيق +25، والإيواء +7، وسبل العيش +1؛ والتمويل −11، والأنقاض −9، والركام −5، وإعادة الإعمار −5.",
    },
  },
  official: {
    id: "official-shift",
    title: {
      en: "Official-institution change by stage, 2026 minus 2024",
      ar: "تغيّر المؤسسات الرسمية بحسب المرحلة، 2026 ناقص 2024",
    },
    subtitle: {
      en: "Reconstruction and services rose 8 → 13; procurement 4 → 5; oversight 3 → 4; finance narrowed 15 → 7.",
      ar: "إعادة الإعمار والخدمات صعدت 8 ← 13؛ والشراء 4 ← 5؛ والرقابة 3 ← 4؛ والتمويل ضاق 15 ← 7.",
    },
    description: {
      en: "Diverging bar chart of change in traced official-institution presence per value-chain stage.",
      ar: "مخطط أشرطة متباعد للتغيّر في الحضور المرصود للمؤسسات الرسمية في كل مرحلة من سلسلة القيمة.",
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
