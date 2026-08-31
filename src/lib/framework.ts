import type { Locale } from "./vocab";

/**
 * The analytical frame of the platform, in both languages, in one module.
 *
 * The platform maps, tracks and compares Lebanon's post-war recovery and
 * reconstruction responses after the 2024 and 2026 wars through two
 * analytical layers - actors and actions. Everything a page says about
 * that frame (what the four actor groups are, what the four action
 * categories cover, how the work was compiled, what the comparison found)
 * is worded here and only here, so the two language sides cannot drift
 * and no page restates another page's framing in slightly different
 * words.
 *
 * Wording rules that bind this file: the site's banned vocabulary applies
 * (entries, tracking and traced - never their research-apparatus
 * synonyms), figures comparing actor groups with each other are never
 * printed, and every English string has an Arabic twin of equal depth.
 */

/* ------------------------------------------------------------------ */
/* Aim and importance                                                  */
/* ------------------------------------------------------------------ */

export const AIM = {
  en: {
    title: "Two wars, two responses",
    lede:
      "This platform maps, tracks and compares how Lebanon organised recovery and reconstruction after the 2024 war and after the 2026 war. It identifies who acted in each response, traces what they did, and reads both periods through two layers: the actors involved and the actions they carried out.",
    layers: [
      {
        id: "actors",
        title: "The actor layer",
        body: "Everyone traced in either response, sorted into four groups - public officials and institutions; NGOs, international organisations and UN actors; municipal and local authorities; and community initiatives.",
      },
      {
        id: "actions",
        title: "The action layer",
        body: "Everything those actors were traced doing, sorted into four categories - financial actions, damage assessment and management, relief and community recovery, and reconstruction and implementation - with the implementation stage noted wherever public reporting allows.",
      },
    ],
  },
  ar: {
    title: "حربان، واستجابتان",
    lede:
      "ترسم هذه المنصة خريطة استجابة لبنان للتعافي وإعادة الإعمار بعد حرب 2024 وبعد حرب 2026، وتتتبّعها وتقارن بينهما. تحدّد الجهات التي تحرّكت في كل استجابة، وترصد ما قامت به، وتقرأ الفترتين عبر طبقتين تحليليتين: الجهات الفاعلة والأفعال التي نفّذتها.",
    layers: [
      {
        id: "actors",
        title: "طبقة الجهات",
        body: "كل جهة رُصدت في أي من الاستجابتين، مصنّفة في أربع مجموعات - المسؤولون الرسميون والمؤسسات الرسمية؛ المنظمات غير الحكومية والمنظمات الدولية ووكالات الأمم المتحدة؛ البلديات والسلطات المحلية؛ ومبادرات المجتمع المحلي.",
      },
      {
        id: "actions",
        title: "طبقة الأفعال",
        body: "كل ما رُصدت هذه الجهات وهي تقوم به، مصنّفاً في أربع فئات - الإجراءات المالية، وتقييم الأضرار وإدارتها، والإغاثة والتعافي المجتمعي، وإعادة الإعمار والتنفيذ - مع تدوين مرحلة التنفيذ حيثما سمح ما نُشر علناً.",
      },
    ],
  },
} as const;

export const IMPORTANCE = {
  en: {
    title: "Why the comparison matters",
    body: [
      "Comparing the two responses shows how responsibility shifted among public authorities, international organisations, NGOs, municipalities and community initiatives - and whether the presence of a government response plan in 2026 produced a more coordinated, more structured intervention than the ad-hoc response of 2024.",
      "Because each actor is linked to specific actions, places, dates and stages of recovery, the comparison surfaces gaps, overlaps, delays and changes in institutional leadership. It shows how far each response leaned on formal institutions rather than community effort, and it keeps announced plans, financial commitments, assessments, procurement processes and completed work strictly apart.",
    ],
  },
  ar: {
    title: "لماذا تهمّ المقارنة",
    body: [
      "تُظهر مقارنة الاستجابتين كيف انتقلت المسؤوليات بين السلطات العامة والمنظمات الدولية والمنظمات غير الحكومية والبلديات ومبادرات المجتمع المحلي - وما إذا كان وجود خطة حكومية للاستجابة في 2026 قد أنتج تدخّلاً أكثر تنسيقاً وتنظيماً من الاستجابة الظرفية في 2024.",
      "ولأن كل جهة مربوطة بأفعال وأماكن وتواريخ ومراحل تعافٍ محددة، تكشف المقارنة الثغرات والتداخلات والتأخير وتبدّل القيادة المؤسسية. وتُظهر إلى أي حدّ اتكأت كل استجابة على المؤسسات الرسمية لا على الجهد الأهلي، وتُبقي الخطط المعلنة والالتزامات المالية والتقييمات ومسارات الشراء والأعمال المكتملة منفصلة بعضها عن بعض بصرامة.",
    ],
  },
} as const;

/* ------------------------------------------------------------------ */
/* The actor framework: four groups                                    */
/* ------------------------------------------------------------------ */

export type ActorGroupDef = {
  /** Matches the actorLayer ids the tracking carries. */
  id: "official" | "ngo_international" | "municipal" | "community";
  name: string;
  included: string;
  roles: string;
};

export const ACTOR_GROUPS: Record<Locale, ActorGroupDef[]> = {
  en: [
    {
      id: "official",
      name: "Public officials and institutions",
      included:
        "Central government institutions, ministries, ministerial committees, public agencies and emergency-management bodies.",
      roles:
        "National coordination, damage assessment, financing decisions, debris management, service restoration and procurement.",
    },
    {
      id: "ngo_international",
      name: "NGOs, international organisations and UN actors",
      included:
        "UN agencies, international financial institutions, NGOs, research institutions and technical-support organisations.",
      roles:
        "Humanitarian coordination, assessments, relief, shelter, healthcare, financing and technical assistance.",
    },
    {
      id: "municipal",
      name: "Municipal and local authorities",
      included:
        "Municipalities, unions of municipalities, governorate administrations and qaimaqams.",
      roles:
        "Local damage reporting, rubble clearance, and communication with national and international actors.",
    },
    {
      id: "community",
      name: "Community initiatives",
      included:
        "Households, volunteers, neighbourhood committees, informal relief networks, affected residents and equipment owners.",
      roles:
        "Relief distribution, fundraising, shelter support, damage reporting, rubble clearance and household recovery.",
    },
  ],
  ar: [
    {
      id: "official",
      name: "المسؤولون الرسميون والمؤسسات الرسمية",
      included:
        "مؤسسات الحكومة المركزية، والوزارات، واللجان الوزارية، والهيئات العامة، وأجهزة إدارة الطوارئ.",
      roles:
        "التنسيق الوطني، وتقييم الأضرار، وقرارات التمويل، وإدارة الركام، واستعادة الخدمات، والشراء العام.",
    },
    {
      id: "ngo_international",
      name: "المنظمات غير الحكومية والدولية ووكالات الأمم المتحدة",
      included:
        "وكالات الأمم المتحدة، والمؤسسات المالية الدولية، والمنظمات غير الحكومية، ومؤسسات البحث، ومنظمات الدعم التقني.",
      roles:
        "التنسيق الإنساني، والتقييمات، والإغاثة، والإيواء، والرعاية الصحية، والتمويل، والمساعدة التقنية.",
    },
    {
      id: "municipal",
      name: "البلديات والسلطات المحلية",
      included:
        "البلديات، واتحادات البلديات، وإدارات المحافظات، والقائمقامون.",
      roles:
        "الإبلاغ المحلي عن الأضرار، ورفع الأنقاض، والتواصل مع الجهات الوطنية والدولية.",
    },
    {
      id: "community",
      name: "مبادرات المجتمع المحلي",
      included:
        "الأسر، والمتطوّعون، ولجان الأحياء، وشبكات الإغاثة غير الرسمية، والسكان المتضررون، وأصحاب المعدات.",
      roles:
        "توزيع الإغاثة، وجمع التبرعات، ودعم الإيواء، والإبلاغ عن الأضرار، ورفع الأنقاض، وتعافي الأسر.",
    },
  ],
};

export function actorGroup(id: string, locale: Locale): ActorGroupDef | undefined {
  return ACTOR_GROUPS[locale].find((g) => g.id === id);
}

/* ------------------------------------------------------------------ */
/* The action framework: four categories, eleven subcategories         */
/* ------------------------------------------------------------------ */

export type ActionCategoryId = "financial" | "damage" | "relief" | "reconstruction";

export type ActionCategoryDef = {
  id: ActionCategoryId;
  name: string;
  subcategories: { name: string; scope: string }[];
};

export const ACTION_CATEGORIES: Record<Locale, ActionCategoryDef[]> = {
  en: [
    {
      id: "financial",
      name: "Financial actions",
      subcategories: [
        {
          name: "Financing",
          scope: "Grants, loans, budget allocations, emergency funds and donor appeals.",
        },
        {
          name: "Compensation",
          scope: "Financial assistance to affected households, property owners and farmers.",
        },
      ],
    },
    {
      id: "damage",
      name: "Damage assessment and management",
      subcategories: [
        {
          name: "Damage and needs assessment",
          scope: "Identifying, registering, measuring and mapping physical damage and economic losses.",
        },
        {
          name: "Rubble clearance",
          scope: "Opening roads, clearing affected sites and removing rubble from damaged areas.",
        },
        {
          name: "Debris treatment and disposal",
          scope: "Transporting and disposing of debris while addressing environmental and public-health risks.",
        },
      ],
    },
    {
      id: "relief",
      name: "Relief and community recovery",
      subcategories: [
        {
          name: "Relief",
          scope: "Distribution of food, medicine and other immediate humanitarian assistance.",
        },
        {
          name: "Shelter",
          scope: "Emergency accommodation, temporary housing and support to displaced or returning households.",
        },
        {
          name: "Community recovery",
          scope: "Household repairs, local fundraising, volunteer work and other locally organised recovery.",
        },
      ],
    },
    {
      id: "reconstruction",
      name: "Reconstruction and implementation",
      subcategories: [
        {
          name: "Reconstruction and public-service restoration",
          scope: "Repairing and reconstructing homes, buildings, bridges, and water, electricity and internet networks.",
        },
        {
          name: "Procurement and contracting",
          scope: "Preparing and launching tenders, awarding contracts, and the steps that move a plan into implementation.",
        },
        {
          name: "Strategy and coordination",
          scope: "Recovery plans, institutional responsibilities, coordination among actors, and links to national and international response structures.",
        },
      ],
    },
  ],
  ar: [
    {
      id: "financial",
      name: "الإجراءات المالية",
      subcategories: [
        {
          name: "التمويل",
          scope: "المنح والقروض ومخصصات الموازنة وصناديق الطوارئ ونداءات المانحين.",
        },
        {
          name: "التعويضات",
          scope: "المساعدة المالية للأسر المتضررة ومالكي العقارات والمزارعين.",
        },
      ],
    },
    {
      id: "damage",
      name: "تقييم الأضرار وإدارتها",
      subcategories: [
        {
          name: "تقييم الأضرار والاحتياجات",
          scope: "تحديد الأضرار المادية والخسائر الاقتصادية وتسجيلها وقياسها ورسم خرائطها.",
        },
        {
          name: "رفع الأنقاض",
          scope: "فتح الطرق وتنظيف المواقع المتضررة وإزالة الأنقاض من المناطق المدمّرة.",
        },
        {
          name: "معالجة الركام والتخلص منه",
          scope: "نقل الركام والتخلص منه مع معالجة المخاطر البيئية ومخاطر الصحة العامة.",
        },
      ],
    },
    {
      id: "relief",
      name: "الإغاثة والتعافي المجتمعي",
      subcategories: [
        {
          name: "الإغاثة",
          scope: "توزيع الغذاء والدواء وسائر أشكال المساعدة الإنسانية الفورية.",
        },
        {
          name: "الإيواء",
          scope: "الإيواء الطارئ والسكن المؤقت ودعم الأسر النازحة أو العائدة.",
        },
        {
          name: "التعافي المجتمعي",
          scope: "إصلاحات المنازل، وجمع التبرعات محلياً، والعمل التطوعي، وسائر أنشطة التعافي المنظمة محلياً.",
        },
      ],
    },
    {
      id: "reconstruction",
      name: "إعادة الإعمار والتنفيذ",
      subcategories: [
        {
          name: "إعادة الإعمار واستعادة الخدمات العامة",
          scope: "إصلاح المنازل والمباني والجسور وشبكات المياه والكهرباء والإنترنت وإعادة بنائها.",
        },
        {
          name: "الشراء والتعاقد",
          scope: "إعداد المناقصات وإطلاقها، وإرساء العقود، والخطوات التي تنقل الخطة إلى التنفيذ.",
        },
        {
          name: "الاستراتيجية والتنسيق",
          scope: "خطط التعافي، والمسؤوليات المؤسسية، والتنسيق بين الجهات، والربط ببنى الاستجابة الوطنية والدولية.",
        },
      ],
    },
  ],
};

export function actionCategory(id: ActionCategoryId, locale: Locale): ActionCategoryDef {
  const c = ACTION_CATEGORIES[locale].find((x) => x.id === id);
  if (!c) throw new Error(`unknown action category: ${id}`);
  return c;
}

/**
 * Where each of the twelve operational stages sits in the four action
 * categories, by stageNo (1-based, the order stage-counts.json fixes).
 *
 * The tracking predates the four-category frame and traces work at a
 * finer grain, so the stages nest inside the categories rather than
 * replace them. Three seams are editorial calls, disclosed on the
 * methodology page rather than smoothed over: the "Finance and
 * compensation" stage spans both financial subcategories; "Safety and
 * access" (road reopening, first response, hazard clearance) sits with
 * damage management because its traced work is about reaching and
 * securing damaged areas; and "Oversight and accountability" sits with
 * strategy and coordination because it is work on institutional
 * responsibility, not physical works.
 */
export const STAGE_CATEGORY: readonly ActionCategoryId[] = [
  "reconstruction", // 1 Coordination
  "financial", // 2 Finance and compensation
  "damage", // 3 Damage and needs assessment
  "damage", // 4 Safety and access
  "reconstruction", // 5 Procurement and contracting
  "damage", // 6 Rubble clearance
  "damage", // 7 Debris treatment and disposal
  "reconstruction", // 8 Reconstruction and services
  "relief", // 9 Shelter and return
  "relief", // 10 Relief and protection
  "relief", // 11 Livelihoods and community recovery
  "reconstruction", // 12 Oversight and accountability
] as const;

export function stageCategoryId(stageNo: number): ActionCategoryId {
  const id = STAGE_CATEGORY[stageNo - 1];
  if (!id) throw new Error(`stageNo out of range: ${stageNo}`);
  return id;
}

/** Category display order, shared by every module that lists them. */
export const CATEGORY_ORDER: readonly ActionCategoryId[] = [
  "financial",
  "damage",
  "relief",
  "reconstruction",
] as const;

/* ------------------------------------------------------------------ */
/* Methodology: eight steps                                            */
/* ------------------------------------------------------------------ */

export type MethodStep = { title: string; body: string };

export const METHOD_INTRO = {
  en: "The tracking was compiled in eight steps from publicly available Arabic- and English-language material, combining automated collection, AI-assisted research, model-based classification and manual confirmation. Nothing enters it on a model's word alone.",
  ar: "جُمع هذا التتبّع في ثماني خطوات من مواد منشورة علناً بالعربية والإنجليزية، جامعاً بين الجمع الآلي والبحث المدعوم بالذكاء الاصطناعي والتصنيف المستند إلى النماذج والتثبّت اليدوي. لا شيء يدخل التتبّع بكلمة نموذجٍ وحدها.",
} as const;

export const METHOD_STEPS: Record<Locale, MethodStep[]> = {
  en: [
    {
      title: "Build the actor framework",
      body: "Everyone traced in either response was sorted into four groups: public officials and institutions; NGOs, international organisations and UN actors; municipal and local authorities; and community initiatives. The frame lets the two periods be compared without assuming the same actors took part, or played the same roles, in both years.",
    },
    {
      title: "Build the action framework",
      body: "Traced activities were sorted into four categories - financial actions, damage assessment and management, relief and community recovery, and reconstruction and implementation - each divided into subcategories that separate the stages and forms of post-war response. Wherever public reporting allows, the implementation stage is noted too, so announced funding is never presented as approved or disbursed funding, and a procurement process is never presented as a completed intervention.",
    },
    {
      title: "Set the search scope and gather material",
      body: "The search covered publicly available Arabic- and English-language material connected to the 2024 and 2026 wars: official publications, institutional reports, humanitarian assessments, academic and policy research, media coverage, procurement notices, municipal updates, public-service announcements, Facebook posts and community-level reporting. Python-based tools collected and processed the pages. Duplicates, unrelated material, general commentary and items too thin to classify reliably were excluded.",
    },
    {
      title: "Widen coverage with AI-assisted research",
      body: "AI-assisted research surfaced additional institutions, search terms, name variants, Arabic and English terminology and publication channels the first sweep might have missed. Its results were treated strictly as leads: an entry joined the tracking only after the underlying public material was located and confirmed to carry enough detail for extraction and classification.",
    },
    {
      title: "Classify actors and actions",
      body: "A large language model assigned each actor to a group and each traced activity to a category and subcategory. Classification followed what the activity itself describes, not the actor's usual role - so the same actor can appear under different subcategories where the material traces different interventions.",
    },
    {
      title: "Review with a second model as judge",
      body: "A separate LLM-as-a-judge pass compared the first model's labels against the underlying material and the framework, and flagged labels that were inconsistent, ambiguous, weakly supported or incompatible with the traced activity. Its judgment was not treated as final: flagged entries went to human review.",
    },
    {
      title: "Confirm by hand",
      body: "The team reviewed the model output, starting with entries the judge flagged or the models labelled with low confidence. Each reviewed entry was compared with the original publication; actor and place names were checked, category labels were tested against the framework, and anything inaccurate or unsupported was corrected. This is the final quality gate before consolidation.",
    },
    {
      title: "Consolidate the tracking",
      body: "Approved entries were merged into structured tracking for 2024 and for 2026, keeping each period's actors and activities distinct while allowing comparison by actor group, action category, subcategory, place, date and implementation stage.",
    },
  ],
  ar: [
    {
      title: "بناء إطار الجهات",
      body: "صُنّفت كل جهة رُصدت في أي من الاستجابتين في أربع مجموعات: المسؤولون الرسميون والمؤسسات الرسمية؛ المنظمات غير الحكومية والدولية ووكالات الأمم المتحدة؛ البلديات والسلطات المحلية؛ ومبادرات المجتمع المحلي. يتيح هذا الإطار مقارنة الفترتين من دون افتراض أن الجهات نفسها شاركت في السنتين أو أدّت الأدوار نفسها.",
    },
    {
      title: "بناء إطار الأفعال",
      body: "صُنّفت الأنشطة المرصودة في أربع فئات - الإجراءات المالية، وتقييم الأضرار وإدارتها، والإغاثة والتعافي المجتمعي، وإعادة الإعمار والتنفيذ - وتنقسم كل فئة إلى فئات فرعية تفصل بين مراحل الاستجابة وأشكالها. وحيثما سمح ما نُشر علناً، دُوّنت مرحلة التنفيذ أيضاً، كي لا يُعرض تمويل معلن كتمويل مُقرّ أو مدفوع، ولا مسار شراء كتدخّل مكتمل.",
    },
    {
      title: "تحديد نطاق البحث وجمع المواد",
      body: "غطّى البحث المواد المنشورة علناً بالعربية والإنجليزية والمتصلة بحربَي 2024 و2026: المنشورات الرسمية، وتقارير المؤسسات، والتقييمات الإنسانية، والبحوث الأكاديمية والسياساتية، والتغطية الإعلامية، وإعلانات الشراء، ومستجدات البلديات، والإعلانات العامة، ومنشورات فيسبوك، والتقارير الأهلية. جمعت أدوات مبنية على بايثون الصفحات وعالجتها. واستُبعد المكرر وغير المتصل والتعليق العام وكل مادة أقلّ من أن تُصنَّف تصنيفاً يُعتمد عليه.",
    },
    {
      title: "توسيع التغطية بالبحث المدعوم بالذكاء الاصطناعي",
      body: "كشف البحث المدعوم بالذكاء الاصطناعي عن مؤسسات إضافية وعبارات بحث وصيغ أسماء ومصطلحات عربية وإنجليزية وقنوات نشر ربما فاتت المسح الأول. وعوملت نتائجه كخيوط بحث لا أكثر: لا يدخل أي مدخل في التتبّع إلا بعد العثور على المادة العلنية الأصلية والتثبّت من أنها تحمل تفصيلاً يكفي للاستخراج والتصنيف.",
    },
    {
      title: "تصنيف الجهات والأفعال",
      body: "أسند نموذج لغوي كبير كل جهة إلى مجموعة، وكل نشاط مرصود إلى فئة وفئة فرعية. واتّبع التصنيف ما يصفه النشاط نفسه لا الدور المعتاد للجهة - فقد تظهر الجهة الواحدة تحت فئات فرعية مختلفة حين ترصد المواد تدخلات مختلفة.",
    },
    {
      title: "المراجعة بنموذج ثانٍ حَكَماً",
      body: "قارنت جولة مستقلة، يعمل فيها نموذج لغوي حَكَماً، تصنيفات النموذج الأول بالمواد الأصلية وبالإطار، وأشّرت على التصنيفات المتضاربة أو الملتبسة أو الضعيفة الإسناد أو غير المتوافقة مع النشاط المرصود. ولم يُعامل حُكم النموذج كحُكم نهائي: أُحيلت المدخلات المؤشَّر عليها إلى مراجعة بشرية.",
    },
    {
      title: "التثبّت اليدوي",
      body: "راجع الفريق مخرجات النماذج، بادئاً بالمدخلات التي أشّر عليها الحَكَم أو التي صنّفتها النماذج بثقة منخفضة. وقورن كل مدخل مُراجع بالمنشور الأصلي؛ فدُقّقت أسماء الجهات والأماكن، واختُبرت تسميات الفئات على الإطار، وصُحّح كل ما كان مغلوطاً أو بلا إسناد. هذه هي بوابة الجودة الأخيرة قبل التجميع.",
    },
    {
      title: "تجميع التتبّع",
      body: "جُمعت المدخلات المعتمدة في تتبّع منظّم لسنة 2024 وآخر لسنة 2026، يحفظ لكل فترة جهاتها وأنشطتها على حدة، ويتيح في الوقت نفسه المقارنة بحسب مجموعة الجهات وفئة الفعل والفئة الفرعية والمكان والتاريخ ومرحلة التنفيذ.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Findings: five                                                      */
/* ------------------------------------------------------------------ */

export type Finding = {
  id: string;
  title: string;
  body: string[];
};

/**
 * Finding 4 compares the actor groups with each other, and group
 * comparisons on this site are worded without figures: shapes may scale,
 * prose may rank, numbers are not printed. The other four findings carry
 * money figures and stage patterns, which are not group comparisons.
 */
export const FINDINGS: Record<Locale, Finding[]> = {
  en: [
    {
      id: "needs",
      title: "The 2024 war created needs far beyond the government's immediate financial capacity",
      body: [
        "The World Bank-led assessment after the 2024 war put physical damage at US$6.8 billion, economic losses at US$7.2 billion, and recovery and reconstruction needs at roughly US$11 billion - of which the public sector would need to mobilise about US$3-5 billion and the private sector a further US$6-8 billion.",
        "Those figures set the scale of the financing challenge and serve as the benchmark for every funding framework, commitment and compensation measure that followed. They do not mean the financing was ever secured or disbursed.",
      ],
    },
    {
      id: "frameworks",
      title: "Announced financing frameworks were not money in hand",
      body: [
        "The Lebanon Emergency Assistance Project (LEAP) is tracked separately because its headline value is not money available for reconstruction. It established a potential US$1 billion financing framework, beginning with an initial US$250 million loan - potential capacity, not an amount approved, disbursed or spent.",
        "The tracking therefore keeps four things apart at every step: the framework's total value, approved financing, actual disbursement, and completed reconstruction.",
      ],
    },
    {
      id: "plan",
      title: "The 2026 plan was a sound framework - the response stayed inadequate",
      body: [
        "After the 2026 war the government adopted a formal plan that strengthened the institutional design of the response: responsibilities, coordination mechanisms and recovery priorities were defined more clearly than in 2024.",
        "The improvement did not translate into delivery. Limited financing kept the state from meeting needs on the ground, leaving a clear gap between the quality of the plan and the effectiveness of the response: a stronger frame, a weak result.",
      ],
    },
    {
      id: "community",
      title: "Community initiatives carried a larger share of the 2026 response",
      body: [
        "Households, volunteers, neighbourhood committees, informal relief networks, equipment owners and repair teams took on a wider range of responsibilities after the 2026 war than after 2024 - relief distribution, shelter support, fundraising, rubble clearance, damage reporting and household repairs.",
        "That expansion shows how quickly affected communities can mobilise. It also reads as a symptom: community initiatives stepped in where government-led compensation, reconstruction and service restoration stayed delayed or insufficient.",
      ],
    },
    {
      id: "stages",
      title: "Both responses stayed concentrated in the early stages of recovery",
      body: [
        "In both periods, most traced activity sits in damage assessment, needs identification, relief, rubble clearance, coordination and planning - the work that prepares recovery rather than delivers it.",
        "That groundwork did not consistently progress into compensation, contracting, service restoration or completed reconstruction. Lebanon's post-war response remained stronger at assessing, planning and relieving than at financed implementation and finished recovery.",
      ],
    },
  ],
  ar: [
    {
      id: "needs",
      title: "حرب 2024 ولّدت احتياجات تتجاوز بكثير القدرة المالية الفورية للحكومة",
      body: [
        "قدّر التقييم الذي قاده البنك الدولي بعد حرب 2024 الأضرار المادية بـ6.8 مليارات دولار، والخسائر الاقتصادية بـ7.2 مليارات دولار، واحتياجات التعافي وإعادة الإعمار بنحو 11 مليار دولار - يحتاج القطاع العام إلى تعبئة نحو 3 إلى 5 مليارات دولار منها، والقطاع الخاص إلى 6 إلى 8 مليارات إضافية.",
        "ترسم هذه الأرقام حجم تحدّي التمويل، وهي المرجع الذي تُقاس عليه كل أطر التمويل والالتزامات وإجراءات التعويض اللاحقة. لكنها لا تعني أن التمويل المطلوب أُمِّن يوماً أو دُفع.",
      ],
    },
    {
      id: "frameworks",
      title: "أطر التمويل المعلنة لم تكن مالاً في اليد",
      body: [
        "يُتتبَّع مشروع المساعدة الطارئة للبنان (LEAP) على حدة لأن قيمته المعلنة ليست مالاً متاحاً لإعادة الإعمار. أنشأ المشروع إطار تمويل محتملاً بمليار دولار، يبدأ بقرض أولي بقيمة 250 مليون دولار - وهي قدرة محتملة، لا مبلغ أُقرّ أو دُفع أو أُنفق.",
        "لذلك يُبقي التتبّع أربعة أشياء منفصلة في كل خطوة: القيمة الإجمالية للإطار، والتمويل المُقرّ، والدفع الفعلي، وإعادة الإعمار المكتملة.",
      ],
    },
    {
      id: "plan",
      title: "خطة 2026 كانت إطاراً سليماً - لكن الاستجابة بقيت قاصرة",
      body: [
        "بعد حرب 2026 اعتمدت الحكومة خطة رسمية عزّزت التصميم المؤسسي للاستجابة: حُدّدت المسؤوليات وآليات التنسيق وأولويات التعافي بوضوح يفوق ما كان في 2024.",
        "غير أن هذا التحسّن لم يُترجم إنجازاً. فقد حال التمويل المحدود دون تلبية الدولة الاحتياجات على الأرض، فانفتحت فجوة واضحة بين جودة الخطة وفاعلية الاستجابة: إطار أقوى، ونتيجة ضعيفة.",
      ],
    },
    {
      id: "community",
      title: "مبادرات المجتمع المحلي حملت حصة أكبر من استجابة 2026",
      body: [
        "تولّت الأسر والمتطوّعون ولجان الأحياء وشبكات الإغاثة غير الرسمية وأصحاب المعدات وفرق الإصلاح نطاقاً من المسؤوليات بعد حرب 2026 أوسع مما تولّته بعد 2024 - توزيع الإغاثة، ودعم الإيواء، وجمع التبرعات، ورفع الأنقاض، والإبلاغ عن الأضرار، وإصلاحات المنازل.",
        "يُظهر هذا التوسّع سرعة قدرة المجتمعات المتضررة على التحرّك. لكنه يُقرأ أيضاً عارضاً على خللٍ أعمق: فقد سدّت المبادرات الأهلية مكان التعويضات وإعادة الإعمار واستعادة الخدمات التي تأخّرت بقيادة الحكومة أو جاءت أدنى من الحاجة.",
      ],
    },
    {
      id: "stages",
      title: "الاستجابتان بقيتا متركّزتين في المراحل المبكرة من التعافي",
      body: [
        "في الفترتين كلتيهما، يقع معظم النشاط المرصود في تقييم الأضرار وتحديد الاحتياجات والإغاثة ورفع الأنقاض والتنسيق والتخطيط - أي العمل الذي يُعدّ للتعافي لا العمل الذي يُنجزه.",
        "هذا التمهيد لم يتقدّم باطّراد نحو التعويضات أو التعاقد أو استعادة الخدمات أو إعادة إعمار مكتملة. فبقيت استجابة لبنان لما بعد الحرب أقوى في التقييم والتخطيط والإغاثة منها في التنفيذ المموَّل والتعافي المكتمل.",
      ],
    },
  ],
};

export function finding(id: string, locale: Locale): Finding {
  const f = FINDINGS[locale].find((x) => x.id === id);
  if (!f) throw new Error(`unknown finding: ${id}`);
  return f;
}
