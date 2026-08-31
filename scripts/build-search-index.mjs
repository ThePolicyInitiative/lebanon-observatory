import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Builds public/search-index.json: one small file that lets a reader who
 * knows a town, an actor, a stage or an indicator find the page that
 * carries it, in either language.
 *
 * Everything here is derived from the data files and from a curated table
 * of the site's own pages - never from built HTML - so the index can be
 * rebuilt at any time with `node scripts/build-search-index.mjs` and no
 * build step. tests/search-index.test.ts regenerates it and compares, so a
 * data revision that is not followed by a rebuild fails there.
 *
 * Both languages live in ONE index. A query in Arabic and the same query
 * in English reach the same target, and the page prints whichever label
 * belongs to the reader's side.
 *
 * Node cannot import the site's TypeScript, so four small things are
 * mirrored here rather than imported: the anchor scheme in
 * src/app/(en)/actors/actor-anchor.ts, the Arabic stage and layer names in
 * src/lib/vocab.ts, the regional names in the same module, and the date
 * wording of src/lib/format.ts. The test asserts each mirror still agrees
 * with the module it mirrors, which is what keeps a mirror from silently
 * drifting into a second opinion. Anything a data file already holds -
 * the Arabic name of a town, for one - is read from that file instead of
 * being mirrored, because a mirror of data is a second opinion waiting to
 * happen.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "search-index.json");

const readJson = (...p) => JSON.parse(readFileSync(join(ROOT, ...p), "utf8"));
const readSource = (...p) => {
  try {
    return readFileSync(join(ROOT, ...p), "utf8");
  } catch {
    return "";
  }
};

/* ------------------------------------------------------------------ */
/* Mirrors of the TypeScript modules (see the note above)              */
/* ------------------------------------------------------------------ */

/** Mirror of actorAnchor() in src/app/(en)/actors/actor-anchor.ts. */
export function actorAnchor(base) {
  const slug = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `actor-${slug}`;
}

/** Mirror of actorBase() in src/lib/actor-names.ts. */
export function actorBase(actorName) {
  return actorName.split(":")[0].trim();
}

/** Mirror of actorPeople() in src/lib/actor-names.ts. */
export function actorPeople(actorName) {
  return actorName.split(":").slice(1).join(":").trim();
}

/** Mirror of STAGES_AR in src/lib/vocab.ts, in stageNo order. */
export const STAGES_AR = [
  "التنسيق",
  "التمويل والتعويضات",
  "تقييم الأضرار والاحتياجات",
  "السلامة والوصول",
  "الشراء والتعاقد",
  "رفع الأنقاض",
  "معالجة الركام والتخلص منه",
  "إعادة الإعمار والخدمات",
  "الإيواء والعودة",
  "الإغاثة والحماية",
  "سبل العيش والتعافي المجتمعي",
  "الرقابة والمساءلة",
];

/** Mirror of LAYER_META (colors.ts) and LAYER_AR (vocab.ts), in that order. */
export const LAYER_LABELS = [
  { id: "official", en: "Official institutions", ar: "المؤسسات الرسمية" },
  {
    id: "ngo_international",
    en: "NGOs & international agencies",
    ar: "المنظمات الدولية وغير الحكومية",
  },
  {
    id: "municipal",
    en: "Municipalities & local authorities",
    ar: "البلديات والسلطات المحلية",
  },
  { id: "community", en: "Community initiatives", ar: "مبادرات المجتمع المحلي" },
];

/** Mirror of REGION_EN / REGION_AR in src/lib/vocab.ts. */
export const REGIONS = {
  south_nabatieh: { en: "South and Nabatieh", ar: "الجنوب والنبطية" },
  beirut_mount_lebanon: { en: "Beirut and Mount Lebanon", ar: "بيروت وجبل لبنان" },
  bekaa_baalbek_hermel: { en: "Bekaa and Baalbek-Hermel", ar: "البقاع وبعلبك-الهرمل" },
  camps_migrant: { en: "Camps and migrant communities", ar: "المخيمات ومجتمعات المهاجرين" },
  national_multi: { en: "National or multi-region", ar: "وطني أو متعدد المناطق" },
  named_localities: { en: "Named affected localities", ar: "بلدات متضررة مسمّاة" },
};

/**
 * Arabic names for the localities in gazetteer.json, which carries only the
 * Latin rendering. They are not written here: they are read from the
 * `nameAr` in map-events.json, which is the same string localityName()
 * hands the Arabic map, so a town is written one way on the map and in the
 * search rather than two - a reader typing the town exactly as the map
 * prints it has to find it. A gazetteer locality with no Arabic name there
 * stops the build rather than shipping half-Arabic.
 */
export const LOCALITY_AR = Object.fromEntries(
  readJson("src", "data", "map-events.json")
    .localities.filter((l) => typeof l.nameAr === "string" && l.nameAr.trim())
    .map((l) => [l.name, l.nameAr.trim()]),
);

/** Mirror of AR_MONTHS and fmtDate() in src/lib/format.ts. */
const AR_MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
];

export function fmtDate(iso, locale = "en") {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  if (locale === "ar")
    return `${d.getUTCDate()} ${AR_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Track names on the delivery timeline, in both languages. */
const TRACKS = {
  conflict: { en: "Conflict", ar: "النزاع" },
  state: { en: "State action", ar: "إجراء رسمي" },
  data: { en: "Assessment", ar: "تقييم" },
  procurement: { en: "Procurement", ar: "شراء" },
  finance: { en: "Finance", ar: "تمويل" },
};

/* ------------------------------------------------------------------ */
/* The site's own pages                                                */
/* ------------------------------------------------------------------ */

const EN_PAGE = (route) =>
  route === "/" ? ["src", "app", "(en)", "page.tsx"] : ["src", "app", "(en)", route.slice(1), "page.tsx"];
const AR_PAGE = (route) =>
  route === "/"
    ? ["src", "app", "(ar)", "ar", "page.tsx"]
    : ["src", "app", "(ar)", "ar", route.slice(1), "page.tsx"];

const ABOUT_BODY = ["src", "app", "(en)", "about", "AboutBody.tsx"];
const ABOUT_COPY = ["src", "lib", "about-content.ts"];
const FRAMEWORK = ["src", "lib", "framework.ts"];

/**
 * A finding on the home page: the section id has to survive on both
 * sides, and the title written here has to still be the title in
 * src/lib/framework.ts - the wording's one home - or the anchor drops
 * with a warning instead of the index quietly diverging from the page.
 */
const findingAnchor = (id, page, titleSnippet) => ({
  id: `finding-${id}`,
  checks: [
    [page, `id="finding-${id}"`],
    [FRAMEWORK, titleSnippet],
  ],
});
const CHART = (name) => ["src", "components", "charts", `${name}.tsx`];
const REGIONAL_COMPOSITION = ["src", "components", "map", "RegionalComposition.tsx"];

/**
 * An anchor is written into the index only when the id it points at is
 * still in the source. `checks` lists every place that has to agree; the
 * default is `id="..."` in the page file itself, and the identity page
 * needs two, because its ids are assembled from a table.
 */
const aboutAnchor = (id) => ({
  id: `about-${id}`,
  checks: [
    [ABOUT_BODY, "id={`about-${s.id}`}"],
    [ABOUT_COPY, `id: "${id}"`],
  ],
});

/**
 * A chart carries its own id on the <figure> ChartFrame draws, so a section
 * that is nothing but a chart is reachable on both sides without the page
 * having to repeat the id. Two things have to hold: the page still renders
 * the chart, and the chart still carries the id.
 */
const chartAnchor = (id, component, pages) => ({
  id,
  checks: [...pages.map((p) => [p, `<${component}`]), [CHART(component), `id="${id}"`]],
});

/**
 * The three actors modules carry their own ids, and both locale pages render
 * the same components, so one check pair serves each side: the page still
 * mounts the component, and the component still carries the id.
 */
const ACTORS_MODULE = (file) => ["src", "app", "(en)", "who", `${file}.tsx`];
const actorAnchorFor = (id, component) => ({
  id,
  checks: [
    [EN_PAGE("/who"), `<${component}`],
    [AR_PAGE("/who"), `<${component}`],
    [ACTORS_MODULE(component), `id="${id}"`],
  ],
});

/*
 * The indicator board is gone: the report-driven home carries the aim,
 * the importance and the five findings, and the money figures live in
 * the finance page's own modules. Indicator hits therefore land on the
 * finance page, whose six-concept list and funnel print every one of
 * these figures with its date and scope.
 */

/** The milestone timeline, the one surface that prints timeline.json. */
const TIMELINE_ANCHOR = chartAnchor("delivery-timeline", "DeliveryTimeline", [
  EN_PAGE("/money"),
  AR_PAGE("/money"),
]);

/**
 * The eight routes the index covers - the ninth, the search page itself,
 * is deliberately not a target of its own search - with their one-line
 * descriptions and their main section headings, in both languages. Heading
 * text is the wording the page prints.
 *
 * It was nine until /map and /compare were dissolved. Neither was a
 * question: the map is how /who draws its answer, and the year is a
 * control rather than a destination, so their sections are sections of
 * /who and / now, and a reader searching for one lands on the page that
 * carries it rather than on a page whose whole subject was an axis.
 *
 * A heading is anchored on both sides or on neither: a reader dropped at
 * the top of a long page while the other language lands on the section is
 * the parity rule broken quietly. Where the two sides id the section
 * differently, or where one side has nothing but the chart the section is
 * made of, the anchor is named per side rather than dropped.
 */
const PAGES = [
  {
    route: "/",
    en: "Two wars, two responses",
    ar: "حربان، واستجابتان",
    enDesc:
      "The platform's aim, why the 2024-2026 comparison matters, and the five findings it supports.",
    arDesc:
      "هدف المنصة، ولماذا تهمّ مقارنة 2024-2026، والاستنتاجات الخمسة التي تسندها.",
    headings: [
      {
        en: "Two analytical layers",
        ar: "طبقتان تحليليتان",
        enAnchor: { id: "layers" },
        arAnchor: { id: "layers" },
      },
      {
        en: "Why the comparison matters",
        ar: "لماذا تهمّ المقارنة",
        enAnchor: { id: "why" },
        arAnchor: { id: "why" },
      },
      {
        en: "What the comparison shows",
        ar: "ما الذي تُظهره المقارنة",
        enAnchor: { id: "findings" },
        arAnchor: { id: "findings" },
      },
      /*
       * The five findings, individually reachable. Their titles live in
       * src/lib/framework.ts; the ids here are the per-finding sections
       * both home pages render, so the check is on the section id.
       */
      {
        en: "The 2024 war created needs far beyond the government's immediate financial capacity",
        ar: "حرب 2024 ولّدت احتياجات تتجاوز بكثير القدرة المالية الفورية للحكومة",
        enAnchor: findingAnchor("needs", EN_PAGE("/"), "The 2024 war created needs far beyond"),
        arAnchor: findingAnchor("needs", AR_PAGE("/"), "حرب 2024 ولّدت احتياجات"),
      },
      {
        en: "Announced financing frameworks were not money in hand",
        ar: "أطر التمويل المعلنة لم تكن مالاً في اليد",
        enAnchor: findingAnchor("frameworks", EN_PAGE("/"), "Announced financing frameworks were not money in hand"),
        arAnchor: findingAnchor("frameworks", AR_PAGE("/"), "أطر التمويل المعلنة لم تكن"),
      },
      {
        en: "The 2026 plan was a sound framework - the response stayed inadequate",
        ar: "خطة 2026 كانت إطاراً سليماً - لكن الاستجابة بقيت قاصرة",
        enAnchor: findingAnchor("plan", EN_PAGE("/"), "The 2026 plan was a sound framework"),
        arAnchor: findingAnchor("plan", AR_PAGE("/"), "خطة 2026 كانت إطاراً سليماً"),
      },
      {
        en: "Community initiatives carried a larger share of the 2026 response",
        ar: "مبادرات المجتمع المحلي حملت حصة أكبر من استجابة 2026",
        enAnchor: findingAnchor("community", EN_PAGE("/"), "Community initiatives carried a larger share"),
        arAnchor: findingAnchor("community", AR_PAGE("/"), "مبادرات المجتمع المحلي حملت حصة أكبر"),
      },
      {
        en: "Both responses stayed concentrated in the early stages of recovery",
        ar: "الاستجابتان بقيتا متركّزتين في المراحل المبكرة من التعافي",
        enAnchor: findingAnchor("stages", EN_PAGE("/"), "Both responses stayed concentrated in the early stages"),
        arAnchor: findingAnchor("stages", AR_PAGE("/"), "الاستجابتان بقيتا متركّزتين"),
      },
      {
        en: "Latest reporting",
        ar: "أحدث التغطية والمستجدات",
        enAnchor: { id: "latest-reporting" },
        arAnchor: { id: "latest-reporting" },
      },
    ],
  },
  {
    route: "/who",
    en: "Actor groups",
    ar: "مجموعات الجهات الفاعلة",
    enDesc:
      "The report's four actor groups - public officials and institutions; NGOs, international organisations and UN actors; municipal and local authorities; community initiatives - with the full register of who did what and the map of where the traced activity sits.",
    arDesc:
      "المجموعات الأربع في إطار التقرير - المؤسسات الرسمية والمنظمات الدولية وغير الحكومية والبلديات ومبادرات المجتمع المحلي - مع السجل الكامل لمن فعل ماذا وخريطة موقع النشاط المرصود.",
    headings: [
      {
        en: "The four groups",
        ar: "المجموعات الأربع",
        enAnchor: {
          id: "groups",
          checks: [
            [EN_PAGE("/who"), "<GroupCards"],
            [["src", "app", "(en)", "who", "GroupCards.tsx"], '"groups"'],
          ],
        },
        arAnchor: {
          id: "ar-groups",
          checks: [
            [AR_PAGE("/who"), "<GroupCards"],
            [["src", "app", "(en)", "who", "GroupCards.tsx"], '"ar-groups"'],
          ],
        },
      },
      {
        en: "Each group, one at a time",
        ar: "كل مجموعة على حدة",
        enAnchor: { id: "group-profiles" },
        arAnchor: { id: "ar-group-profiles" },
      },
      {
        en: "Who carries the work",
        ar: "من يحمل العمل",
        enAnchor: { id: "who-carries-the-work" },
        arAnchor: { id: "ar-who-carries-the-work" },
      },
      {
        en: "Which groups held each stage of the response",
        ar: "أي المجموعات شغلت كل مرحلة من مراحل الاستجابة",
        enAnchor: { id: "stages-held" },
        arAnchor: { id: "ar-stages-held" },
      },
      {
        en: "What shifted between the two wars",
        ar: "ما الذي تبدّل بين الحربين",
        enAnchor: { id: "what-shifted" },
        arAnchor: { id: "ar-what-shifted" },
      },
      {
        en: "What kind of work was traced",
        ar: "أي نوع من العمل رُصد",
        enAnchor: {
          id: "action-mix",
          checks: [
            [EN_PAGE("/who"), "<CategoryMix"],
            [["src", "app", "(en)", "who", "CategoryMix.tsx"], '"action-mix"'],
          ],
        },
        arAnchor: {
          id: "ar-action-mix",
          checks: [
            [AR_PAGE("/who"), "<CategoryMix"],
            [["src", "app", "(en)", "who", "CategoryMix.tsx"], '"ar-action-mix"'],
          ],
        },
      },
      {
        en: "Who did what - the full register",
        ar: "من فعل ماذا - السجل الكامل",
        enAnchor: actorAnchorFor("actor-register", "ActorRegister"),
        arAnchor: actorAnchorFor("actor-register", "ActorRegister"),
      },
      {
        en: "Every traced actor against every stage of the response",
        ar: "كل جهة مرصودة مقابل كل مرحلة من مراحل الاستجابة",
        enAnchor: actorAnchorFor("actor-matrix", "ActorStageMatrix"),
        arAnchor: actorAnchorFor("actor-matrix", "ActorStageMatrix"),
      },
      /*
       * The map was its own route, and so its own entry here. It is not a
       * question a reader arrives with - it is how this page draws its
       * answer to "who is doing what", so its two sections are sections of
       * this page now rather than a separate target.
       */
      {
        en: "Where the traced activity sits",
        ar: "أين يقع النشاط المرصود",
        enAnchor: { id: "where-traced", checks: [[EN_PAGE("/who"), 'id="where-traced"']] },
        arAnchor: {
          id: "ar-where-traced",
          checks: [[AR_PAGE("/who"), 'id="ar-where-traced"']],
        },
      },
      {
        en: "Place mentions, grouping by grouping",
        ar: "الإشارات إلى الأماكن، تجمّعاً بتجمّع",
        // RegionalComposition sits under components/map rather than
        // components/charts, so chartAnchor's path would miss it.
        enAnchor: {
          id: "regional-composition",
          checks: [
            [EN_PAGE("/who"), "<RegionalComposition"],
            [REGIONAL_COMPOSITION, 'id="regional-composition"'],
          ],
        },
        arAnchor: {
          id: "regional-composition",
          checks: [
            [AR_PAGE("/who"), "<RegionalComposition"],
            [REGIONAL_COMPOSITION, 'id="regional-composition"'],
          ],
        },
      },
      {
        en: "Why there is no national damage layer",
        ar: "لماذا لا توجد طبقة أضرار وطنية",
        enAnchor: {
          id: "no-national-layer",
          checks: [[EN_PAGE("/who"), 'id="no-national-layer"']],
        },
        arAnchor: {
          id: "ar-no-national-layer",
          checks: [[AR_PAGE("/who"), 'id="ar-no-national-layer"']],
        },
      },
    ],
  },
  {
    route: "/destroyed",
    en: "The damage assessments - kept honest",
    ar: "تقديرات الأضرار",
    enDesc:
      "Four non-additive tracks for 2024 and two bounded zones for 2026, each with its method, scope and date - never merged, never averaged.",
    arDesc:
      "أربعة مسارات لا تُجمع لعام 2024 ومنطقتان مقيَّمتان في 2026، لكل تقدير منهجيته ونطاقه وتاريخه - بلا جمع ولا متوسط.",
    headings: [
      {
        en: "2024: four non-additive tracks bracket the destruction",
        ar: "2024: أربعة مسارات غير قابلة للجمع تحصر الدمار",
        enAnchor: { id: "tracks-2024" },
        arAnchor: { id: "ar-tracks" },
      },
      {
        en: "2026: two bounded assessment zones - not a national picture",
        ar: "2026: منطقتان مقيَّمتان فقط - لا صورة وطنية",
        enAnchor: { id: "zones-2026" },
        arAnchor: { id: "ar-zones" },
      },
      {
        en: "Municipality-reported damage by district",
        ar: "الأضرار المبلَّغة بلدياً بحسب القضاء",
        enAnchor: { id: "district-survey" },
        arAnchor: chartAnchor("district-damage-2024", "DistrictDamageChart", [
          AR_PAGE("/destroyed"),
        ]),
      },
      {
        en: "Sector damage, losses and needs",
        ar: "الأضرار والخسائر والاحتياجات بحسب القطاع",
        enAnchor: { id: "sector-chart" },
        arAnchor: chartAnchor("sector-estimates", "SectorDamageChart", [
          AR_PAGE("/destroyed"),
        ]),
      },
      {
        en: "Services and networks, as operators reported them",
        ar: "الخدمات والشبكات، كما أبلغت عنها المؤسسات المشغّلة",
        enAnchor: { id: "services-networks" },
        arAnchor: { id: "ar-services" },
      },
    ],
  },
  {
    route: "/money",
    en: "Finance and delivery",
    ar: "التمويل مقابل الإنجاز",
    enDesc:
      "Need, framework, commitment, disbursement and works are different objects; the funnel, the packages and the procurement status keep them apart.",
    arDesc:
      "الاحتياج والإطار والالتزام والدفع والأشغال أشياء مختلفة؛ المسار والحزم وحالة الشراء تُبقيها متمايزة.",
    headings: [
      {
        en: "Inside the initial US$250 million",
        ar: "داخل الـ250 مليون دولار الأولى",
        enAnchor: { id: "leap-components" },
        arAnchor: { id: "ar-leap" },
      },
      {
        en: "Procurement packages and their actual status",
        ar: "حزم الشراء وحالتها الفعلية",
        enAnchor: { id: "procurement-packages" },
        arAnchor: { id: "ar-procurement" },
      },
      {
        en: "Money that moved on parallel tracks - not reconstruction financing",
        ar: "مال تحرّك على مسارات موازية - وليس تمويل إعادة إعمار",
        enAnchor: { id: "adjacent-flows" },
        arAnchor: { id: "ar-adjacent" },
      },
    ],
  },
  {
    route: "/reported",
    en: "Live news and official updates",
    ar: "مستجدات مباشرة",
    enDesc:
      "An automated feed from Lebanese, international, humanitarian and official publishers, kept outside every count on the site.",
    arDesc:
      "تجميع آلي من ناشرين لبنانيين ودوليين وإنسانيين ورسميين، يبقى خارج كل عدّ في الموقع.",
    headings: [
      {
        en: "Latest published",
        ar: "آخر ما نُشر",
        enAnchor: { id: "news-explorer" },
        arAnchor: { id: "ar-news-explorer" },
      },
    ],
  },
  {
    route: "/entries",
    en: "Who did what, and where",
    ar: "مستكشف المدخلات",
    enDesc:
      "Every traced entry, one row per actor and function, filterable by year, group, stage, status and comparability.",
    arDesc:
      "كل مدخل متتبَّع، صف لكل جهة ووظيفة، قابلاً للترشيح بالسنة والمجموعة والمرحلة والحالة ودرجة القابلية للمقارنة.",
    headings: [],
  },
  {
    route: "/methodology",
    en: "How this tracking was built",
    ar: "كيف بُني هذا التتبّع",
    enDesc:
      "The eight steps behind the tracking, the actor framework of four groups, the action framework of four categories, and what the counts do and do not mean.",
    arDesc:
      "الخطوات الثماني وراء التتبّع، وإطار الجهات بأربع مجموعات، وإطار الأفعال بأربع فئات، وما تعنيه الأعداد وما لا تعنيه.",
    headings: [
      {
        en: "The eight steps",
        ar: "الخطوات الثماني",
        enAnchor: { id: "steps" },
        arAnchor: { id: "ar-steps" },
      },
      {
        en: "The actor framework: four groups",
        ar: "إطار الجهات: أربع مجموعات",
        enAnchor: { id: "actor-framework" },
        arAnchor: { id: "ar-actor-framework" },
      },
      {
        en: "The action framework: four categories",
        ar: "إطار الأفعال: أربع فئات",
        enAnchor: { id: "action-framework" },
        arAnchor: { id: "ar-action-framework" },
      },
      {
        en: "How the twelve tracked stages nest in the four categories",
        ar: "كيف تنتظم المراحل الاثنتا عشرة المتتبَّعة داخل الفئات الأربع",
        enAnchor: { id: "stage-mapping" },
        arAnchor: { id: "ar-stage-mapping" },
      },
      {
        en: "The implementation-status discipline",
        ar: "انضباط حالة التنفيذ",
        enAnchor: { id: "status-discipline" },
        arAnchor: { id: "ar-status-discipline" },
      },
      {
        en: "What the counts mean",
        ar: "ماذا تعني الأعداد",
        enAnchor: { id: "count-flag" },
        arAnchor: { id: "ar-count-flag" },
      },
    ],
  },
  {
    route: "/about",
    en: "About the observatory",
    ar: "عن المرصد",
    enDesc:
      "Who compiles the observatory, what the tracking covers, what it refuses to claim and how to reach it.",
    arDesc: "من يعدّ المرصد، وما الذي يغطيه التتبّع، وما الذي يرفض ادّعاءه، وكيف تصل إلينا.",
    headings: [
      { en: "What this is", ar: "ما هذا الموقع", enAnchor: aboutAnchor("what"), arAnchor: aboutAnchor("what") },
      { en: "Who compiled it", ar: "من أعدّه", enAnchor: aboutAnchor("who"), arAnchor: aboutAnchor("who") },
      {
        en: "What the tracking covers",
        ar: "ما الذي يغطيه التتبّع",
        enAnchor: aboutAnchor("covers"),
        arAnchor: aboutAnchor("covers"),
      },
      {
        en: "What it does not claim",
        ar: "ما الذي لا يدّعيه",
        enAnchor: aboutAnchor("limits"),
        arAnchor: aboutAnchor("limits"),
      },
      {
        en: "How updates work",
        ar: "كيف تجري التحديثات",
        enAnchor: aboutAnchor("updates"),
        arAnchor: aboutAnchor("updates"),
      },
      {
        en: "How to reach us",
        ar: "كيف تصل إلينا",
        enAnchor: {
          id: "about-contact",
          checks: [[ABOUT_BODY, 'id="about-contact"']],
        },
        arAnchor: {
          id: "about-contact",
          checks: [[ABOUT_BODY, 'id="about-contact"']],
        },
      },
    ],
  },
];

/** The Arabic twin of an English route. */
const arRoute = (route) => (route === "/" ? "/ar" : `/ar${route}`);

/**
 * True when every place an anchor has to appear still carries it. Warns and
 * returns false otherwise, and the target then falls back to the page
 * itself - a link that lands slightly high beats a link that lands nowhere.
 * `pageFile` is only the default place to look, so an anchor that names its
 * own `checks` passes null.
 */
function anchorLives(anchor, pageFile, warnings) {
  if (!anchor) return false;
  const checks = anchor.checks ?? [[pageFile, `id="${anchor.id}"`]];
  for (const [file, needle] of checks) {
    if (!readSource(...file).includes(needle)) {
      warnings.push(`#${anchor.id}: ${needle} is no longer in ${file.join("/")}`);
      return false;
    }
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* The index                                                           */
/* ------------------------------------------------------------------ */

/**
 * One entry a search can land on. Keys are short because every one of them
 * is paid for several hundred times over:
 *   k  kind        t/ta  label, English then Arabic
 *   c/ca context line     x/xa  text that is searched but not printed
 *   h  English href       ha    Arabic href, only when it is not /ar + h
 */
function item(k, t, ta, h, extra = {}) {
  const out = { k, t, ta, h };
  for (const key of ["c", "ca", "x", "xa", "ha"]) {
    const v = extra[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim();
  }
  if (out.ha === arRoute(h)) delete out.ha;
  return out;
}

export function buildIndex() {
  const warnings = [];
  const items = [];

  /* Pages and their sections. */
  for (const page of PAGES) {
    items.push(
      item("page", page.en, page.ar, page.route, {
        c: page.enDesc,
        ca: page.arDesc,
      }),
    );
    for (const h of page.headings) {
      const enOk = anchorLives(h.enAnchor, EN_PAGE(page.route), warnings);
      const arOk = anchorLives(h.arAnchor, AR_PAGE(page.route), warnings);
      items.push(
        item(
          "page",
          h.en,
          h.ar,
          enOk ? `${page.route}#${h.enAnchor.id}` : page.route,
          {
            c: page.en,
            ca: page.ar,
            ha: arOk ? `${arRoute(page.route)}#${h.arAnchor.id}` : arRoute(page.route),
          },
        ),
      );
    }
  }

  /* Actors. actors.json carries one entry per actor and year; the register
     groups by the body itself, so the index does too and names the years
     the tracking holds it in. */
  const actors = readJson("src", "data", "actors.json");
  const names = readJson("src", "data", "actor-names-ar.json");
  const byBase = new Map();
  for (const a of actors) {
    const base = actorBase(a.name);
    const entry = byBase.get(base) ?? {
      base,
      layer: a.layer,
      years: new Set(),
      people: new Set(),
      subtypes: new Set(),
    };
    entry.years.add(a.year);
    const person = actorPeople(a.name);
    if (person) entry.people.add(person);
    if (a.subtype) entry.subtypes.add(a.subtype);
    byBase.set(base, entry);
  }

  const layerOf = (id) => LAYER_LABELS.find((l) => l.id === id);
  const yearsEn = (years) => [...years].sort().join(" and ");
  const yearsAr = (years) => [...years].sort().join(" و");

  for (const entry of [...byBase.values()].sort((a, b) => a.base.localeCompare(b.base, "en"))) {
    const ar = names.actors[entry.base];
    if (!ar) throw new Error(`No Arabic name for the actor "${entry.base}"`);
    const layer = layerOf(entry.layer);
    if (!layer) throw new Error(`Unknown layer "${entry.layer}" on "${entry.base}"`);
    const people = [...entry.people];
    const subtypes = [...entry.subtypes];
    items.push(
      item("actor", entry.base, ar, `/who#${actorAnchor(entry.base)}`, {
        c: `${layer.en} · ${yearsEn(entry.years)}`,
        ca: `${layer.ar} · ${yearsAr(entry.years)}`,
        x: [...subtypes, ...people].join(" · "),
        xa: [
          ...subtypes.map((s) => names.subtypes[s] ?? s),
          ...people.map((p) => names.people[p] ?? p),
        ].join(" · "),
      }),
    );
  }

  /* Places: the regional groupings first, then the named localities.
     The governorate keys the groupings are joined on - the OCHA French
     transliterations - are not written into the index: no reader has seen
     them on this site, and they exist in one language only, so as a hidden
     search handle they would work for an English query and fail for its
     Arabic twin. */
  const locations = readJson("src", "data", "locations.json");
  for (const region of locations.regions) {
    const label = REGIONS[region.id];
    if (!label) throw new Error(`No name for the grouping "${region.id}"`);
    items.push(
      item("place", label.en, label.ar, "/who", {
        c: "Regional grouping",
        ca: "تجمّع إقليمي",
      }),
    );
  }

  const gazetteer = readJson("src", "data", "gazetteer.json");
  for (const locality of gazetteer.localities) {
    const ar = LOCALITY_AR[locality.name];
    if (!ar)
      throw new Error(
        `No nameAr in map-events.json for the locality "${locality.name}"`,
      );
    const region = REGIONS[locality.region];
    if (!region) throw new Error(`No name for the grouping "${locality.region}"`);
    items.push(
      item("place", locality.name, ar, "/who", { c: region.en, ca: region.ar }),
    );
  }

  /*
   * The twelve stages of the value chain. They used to point at /compare,
   * which contrasted them across the two years; the two surfaces that
   * actually draw a stage - the stage composition chart and the actor-by-
   * stage matrix - are both on /who, so that is where a reader searching a
   * stage name should land.
   */
  const stages = readJson("src", "data", "stage-counts.json").stages;
  if (stages.length !== STAGES_AR.length)
    throw new Error(`The Arabic stage names are stale: ${stages.length} stages, ${STAGES_AR.length} names`);
  stages.forEach((stage, i) => {
    items.push(
      item("stage", stage, STAGES_AR[i], "/who", {
        c: `Stage ${i + 1} of ${stages.length}`,
        ca: `المرحلة ${i + 1} من ${stages.length}`,
      }),
    );
  });

  /* The four actor layers. */
  for (const layer of LAYER_LABELS) {
    items.push(
      item("layer", layer.en, layer.ar, "/who", {
        c: "Actor group",
        ca: "مجموعة جهات فاعلة",
      }),
    );
  }

  /* The indicators. The context line reprints the figure with its date;
     the target is the finance page, where the six-concept list and the
     funnel print these same figures - the home page's indicator board
     was retired with the report-driven rebuild. */
  const kpis = readJson("src", "data", "kpis.json");
  const kpiEn = "/money";
  const kpiAr = "/ar/money";
  for (const kpi of kpis) {
    items.push(
      item("indicator", kpi.label, kpi.labelAr, kpiEn, {
        c: `${kpi.display} · ${kpi.referencePeriod}`,
        ca: `${kpi.displayAr} · ${kpi.referencePeriodAr}`,
        x: `${kpi.definition} ${kpi.geographicScope}`,
        xa: `${kpi.definitionAr} ${kpi.geographicScopeAr}`,
        ha: kpiAr,
      }),
    );
  }

  /* The milestones on the delivery timeline - the one surface that prints
     timeline.json, on both finance pages. Each date is written the way the
     rest of that language's pages write it, rather than raw ISO on both
     sides: the Arabic side was the only Arabic surface printing 2024-09-23
     where every other one writes 23 أيلول 2024. */
  const timeline = readJson("src", "data", "timeline.json");
  const timelineOk = anchorLives(TIMELINE_ANCHOR, null, warnings);
  const timelineHref = timelineOk ? `/money#${TIMELINE_ANCHOR.id}` : "/money";
  for (const event of timeline) {
    const track = TRACKS[event.track];
    if (!track) throw new Error(`Unknown track "${event.track}" on ${event.id}`);
    items.push(
      item("milestone", event.label, event.labelAr, timelineHref, {
        c: `${fmtDate(event.date)} · ${track.en}`,
        ca: `${fmtDate(event.date, "ar")} · ${track.ar}`,
        // The ISO date stays searchable on both sides without being
        // printed, so the reader who types 2026-02-26 still lands on it.
        x: `${event.date} ${event.detail}`,
        xa: `${event.date} ${event.detailAr}`,
      }),
    );
  }

  const counts = {};
  for (const it of items) counts[it.k] = (counts[it.k] ?? 0) + 1;

  return {
    index: {
      // Read by anyone who opens this file directly, so it describes what
      // the file IS. How it gets built is a fact about this repository,
      // not about the data, and stays here in the source.
      note: "Every target the site's own search can reach, in both languages. The live news feed and the full text of each traced entry are searched on their own pages, not here.",
      counts,
      items,
    },
    warnings: [...new Set(warnings)],
  };
}

/* ------------------------------------------------------------------ */

function main() {
  const { index, warnings } = buildIndex();
  mkdirSync(dirname(OUT), { recursive: true });
  const json = `${JSON.stringify(index)}\n`;
  writeFileSync(OUT, json, "utf8");
  for (const w of warnings) console.warn(`anchor dropped - ${w}`);
  const kb = (Buffer.byteLength(json, "utf8") / 1024).toFixed(1);
  console.log(`public/search-index.json  ${index.items.length} items  ${kb} KB`);
  console.log(
    Object.entries(index.counts)
      .map(([k, n]) => `  ${k}: ${n}`)
      .join("\n"),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
