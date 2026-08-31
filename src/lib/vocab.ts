import { LAYER_META, STATUS_LABELS, COMPARABILITY_LABELS } from "./colors";
import { STAGES, STAGE_SHORT } from "./data-client";

/**
 * The vocabulary every chart, table and filter is built from, in both
 * languages. Keeping it in one place is what lets the Arabic side render the
 * same modules as the English one rather than a summary of them: the keys
 * never change, only the words.
 */

export type Locale = "en" | "ar";

const LAYER_AR: Record<string, { label: string; short: string }> = {
  official: { label: "المؤسسات الرسمية", short: "رسمية" },
  ngo_international: { label: "المنظمات الدولية وغير الحكومية", short: "دولية / غير حكومية" },
  municipal: { label: "البلديات والسلطات المحلية", short: "بلدية" },
  community: { label: "مبادرات المجتمع المحلي", short: "أهلية" },
};

/** The twelve value-chain stages, in stageNo order. */
const STAGES_AR = [
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

const STAGE_SHORT_AR = [
  "تنسيق",
  "تمويل",
  "تقييم",
  "سلامة",
  "شراء",
  "أنقاض",
  "ركام",
  "أشغال",
  "إيواء",
  "إغاثة",
  "سبل عيش",
  "رقابة",
];

const STATUS_AR: Record<string, string> = {
  formal_mandate: "تفويض قانوني",
  announced: "مُعلَن",
  planned: "مُخطَّط",
  financing_committed: "تمويل ملتزَم به",
  financing_disbursed: "تمويل مدفوع",
  procurement: "شراء مباشَر",
  underway: "نشاط مرصود",
  completed: "إنجاز مكتمل",
  not_verified: "غير مؤكَّد",
};

const COMPARABILITY_AR: Record<string, string> = {
  direct: "قابل للمقارنة مباشرة",
  qualified: "قابل للمقارنة بتحفّظ",
  not_comparable: "غير قابل للمقارنة مباشرة",
  context_only: "للسياق فقط",
};

/**
 * Regional groupings from locations.json, one Arabic rendering each.
 * Three components once carried their own copies and the same region
 * ended up with three different Arabic names; this is now the only
 * dictionary.
 */
const REGION_EN: Record<string, string> = {
  south_nabatieh: "South and Nabatieh",
  beirut_mount_lebanon: "Beirut and Mount Lebanon",
  bekaa_baalbek_hermel: "Bekaa and Baalbek-Hermel",
  camps_migrant: "Camps and migrant communities",
  national_multi: "National or multi-region",
  named_localities: "Named affected localities",
};

const REGION_AR: Record<string, string> = {
  south_nabatieh: "الجنوب والنبطية",
  beirut_mount_lebanon: "بيروت وجبل لبنان",
  bekaa_baalbek_hermel: "البقاع وبعلبك-الهرمل",
  camps_migrant: "المخيمات ومجتمعات المهاجرين",
  national_multi: "وطني أو متعدد المناطق",
  named_localities: "بلدات متضررة مسمّاة",
};

export function regionLabel(id: string, locale: Locale): string {
  return (locale === "ar" ? REGION_AR[id] : REGION_EN[id]) ?? id;
}

/**
 * The nine governorates, named in both languages.
 *
 * The boundary layer's own `shapeName` is French throughout - Liban-Nord,
 * Mont-Liban, Beyrouth, Béqaa, Nabatîyé, Aakkâr - and both maps printed
 * it raw wherever a governorate had no grouping in locations.json to
 * supply a label. That is exactly the two northern ones, so an Arabic
 * reader hovering the north was shown "Liban-Nord", and an English reader
 * was shown it too.
 *
 * Keyed on the shapeName because that is what the layer carries. The
 * English forms are the COD adm1_name spellings the town layer uses, for
 * the same reason DISTRICT_COD_NAME prefers them at the district level:
 * the COD spelling is the one the rest of the site says. Keserwan-Jbeil
 * is the exception, having no COD form to borrow - the older COD town
 * layer still folds it into Mount Lebanon.
 *
 * This is a name for a place, not a grouping for the tracking. The north
 * deliberately has no entry in locations.json, because neither war
 * reached those governorates and nothing traced is attributed there; that
 * stays true. Being able to say where the cursor is, is not an
 * attribution.
 */
const GOVERNORATE: Record<string, { en: string; ar: string }> = {
  "Baalbek-Hermel": { en: "Baalbek-El Hermel", ar: "بعلبك-الهرمل" },
  Beyrouth: { en: "Beirut", ar: "بيروت" },
  "Liban-Nord": { en: "North", ar: "الشمال" },
  "Mont-Liban": { en: "Mount Lebanon", ar: "جبل لبنان" },
  "Liban-Sud": { en: "South", ar: "الجنوب" },
  Nabatîyé: { en: "El Nabatieh", ar: "النبطية" },
  Béqaa: { en: "Bekaa", ar: "البقاع" },
  Aakkâr: { en: "Akkar", ar: "عكار" },
  "Keserwan-Jbeil": { en: "Keserwan-Jbeil", ar: "كسروان-جبيل" },
};

/**
 * What to print for a governorate the tracking has no grouping for.
 *
 * Falls back to the raw shapeName only if the boundary layer ever gains a
 * name this table does not carry, which a test forbids - so in practice
 * the fallback is unreachable and exists so a data revision degrades to a
 * French name rather than to an empty string.
 */
export function governorateLabel(shapeName: string, locale: Locale): string {
  const g = GOVERNORATE[shapeName];
  return g ? g[locale] : shapeName;
}

export const GOVERNORATE_NAMES = Object.keys(GOVERNORATE);

/** Actor layers with their labels in the requested language. */
export function layers(locale: Locale) {
  return LAYER_META.map((l) =>
    locale === "ar"
      ? { ...l, label: LAYER_AR[l.id]?.label ?? l.label, short: LAYER_AR[l.id]?.short ?? l.short }
      : l,
  );
}

export function layerLabel(id: string, locale: Locale): string {
  if (locale === "ar") return LAYER_AR[id]?.label ?? id;
  return LAYER_META.find((l) => l.id === id)?.label ?? id;
}

/** Stage name by its 1-based number, as the entries carry it. */
export function stageLabel(stageNo: number, locale: Locale): string {
  const i = stageNo - 1;
  return (locale === "ar" ? STAGES_AR[i] : STAGES[i]) ?? String(stageNo);
}

export function stageList(locale: Locale): string[] {
  return locale === "ar" ? STAGES_AR : STAGES;
}

/**
 * The stages the two heat maps draw: all of them except coordination,
 * which is index 0.
 *
 * Coordination is the stage nearly every actor touches - convening, routing,
 * linking - so its column is dense for reasons that have nothing to do
 * with where work sits along the chain. The figures answered "who
 * coordinates" when that is the one thing they are not for.
 *
 * It is dropped for that reason and no other. The scale is unchanged:
 * both year panels share one ramp whose top is 2026 community relief at
 * 55, with or without coordination, and the change map's widest swing is 35
 * either way. An earlier version of this comment said removing the column
 * freed the ramp - it does not, and that was written without measuring.
 *
 * Held here rather than in either chart so the two cannot disagree about
 * which stages they are showing. The stage is not hidden from the
 * tracking: the register, the explorer and the stage profile all still
 * carry it. This is a choice about two figures' scales.
 */
export const HEATMAP_STAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export function stageShortList(locale: Locale): string[] {
  return locale === "ar" ? STAGE_SHORT_AR : STAGE_SHORT;
}

export function statusLabel(key: string, locale: Locale): string {
  return (locale === "ar" ? STATUS_AR[key] : STATUS_LABELS[key]) ?? key;
}

export function statusList(locale: Locale): [string, string][] {
  return Object.keys(STATUS_LABELS).map((k) => [k, statusLabel(k, locale)]);
}

export function comparabilityLabel(key: string, locale: Locale): string {
  return (locale === "ar" ? COMPARABILITY_AR[key] : COMPARABILITY_LABELS[key]) ?? key;
}

/**
 * The two standing cautions. They are printed under many figures, so they
 * live here beside the rest of the shared wording rather than in the
 * data module, where only the English half could ever have lived.
 */
export function cautionCounts(locale: Locale): string {
  return locale === "ar"
    ? "الأعداد تقيس حضور جهة في مرحلة كما رُصد. وهي لا تقيس الإنفاق ولا الفاعلية ولا عدد المستفيدين ولا التغطية الجغرافية ولا الإنجاز المكتمل. كما أن معطيات 2026 تسمّي بعض الجهات الأهلية والتطوّعية بتفصيل أدق مما فعلت معطيات 2024."
    : "Counts measure traced actor-stage presence. They do not measure expenditure, effectiveness, beneficiaries, geographic coverage or completed output. The 2026 data also identifies some community and volunteer actors more granularly than the 2024 data.";
}

export function cautionMap(locale: Locale): string {
  return locale === "ar"
    ? "الجغرافيا تُظهر أين رُصد النشاط، لا أين كان الدمار أو الحاجة أكبر. والتجمّعات الإقليمية تختلف في المساحة والسكان وكثافة الإبلاغ؛ وغياب علامة يعني غياب معطى، لا غياب دمار أبداً."
    : "Geography shows where activity was traced, not where damage or need was greatest. Regional groupings differ in size, population and reporting intensity; absence of a marker means absence of data, never absence of damage.";
}

/* ------------------------------------------------------------------ */
/* Arabic count agreement                                              */
/* ------------------------------------------------------------------ */

/**
 * Arabic does not pluralise the way English does, and the site kept
 * writing it as though it did.
 *
 * The rule has four shapes, not two. One takes the bare noun. Two takes
 * the dual, which carries the twoness itself, so the numeral is dropped.
 * Three to ten takes the plural. Eleven and up takes the singular again,
 * in the accusative - and that accusative alif is a written letter, so
 * getting it wrong is visible in undiacritised text rather than merely
 * heard.
 *
 * Nearly every interpolated count on the Arabic side was written in the
 * 11-and-up form and used at every value: "3 مدخلاً" for three entries,
 * where the language wants "3 مدخلات", and "2 مدخلاً" for two, where it
 * wants "مدخلان" and no numeral at all. Map clusters are the worst of it,
 * since a cluster exists only when two or more pins merge, so the one
 * range the form is never right for is the only range it ever sees.
 *
 * The rule was already implemented correctly five times, by hand, in five
 * separate components - and three of those files get it right in one
 * string and wrong in another a dozen lines away. That is what a missing
 * shared function looks like, so this is it.
 *
 * Only the noun forms live here, never the numeral. Every count on this
 * site renders as a Western digit in both languages, deliberately, so no
 * numeral is ever spelled out and the reverse gender agreement that
 * governs spelled-out numerals never arises.
 */
export type ArCountForms = {
  /** "لا مدخلات" - falls back to the plural form when not given. */
  zero?: string;
  /** The bare noun: "مدخل واحد". Printed without the numeral. */
  one: string;
  /** The dual: "مدخلان". Printed without the numeral. */
  two: string;
  /** The plural, printed after the digit: 3-10. */
  few: string;
  /** The accusative singular, printed after the digit: 11 and up. */
  many: string;
};

export function arabicCount(n: number, f: ArCountForms): string {
  if (n === 0) return f.zero ?? `${n} ${f.few}`;
  if (n === 1) return f.one;
  if (n === 2) return f.two;
  return n <= 10 ? `${n} ${f.few}` : `${n} ${f.many}`;
}

/**
 * The nouns the site counts, so one noun cannot acquire two plurals in
 * two components - the same reason the region and layer names are tabled
 * above rather than written where they are used.
 *
 * Where a count is followed by an adjective the adjective travels inside
 * the form, because it has to agree with the noun that just changed:
 * "مدخلات مرصودة" and not "مدخلات" + "مرصوداً".
 */
export const AR_COUNT = {
  entry: { one: "مدخل واحد", two: "مدخلان", few: "مدخلات", many: "مدخلاً", zero: "لا مدخلات" },
  entryTraced: {
    one: "مدخل مرصود واحد",
    two: "مدخلان مرصودان",
    few: "مدخلات مرصودة",
    many: "مدخلاً مرصوداً",
    zero: "لا مدخلات مرصودة",
  },
  entryMatching: {
    one: "مدخل واحد مطابق",
    two: "مدخلان مطابقان",
    few: "مدخلات مطابقة",
    many: "مدخلاً مطابقاً",
    zero: "لا مدخلات مطابقة",
  },
  actor: { one: "جهة واحدة", two: "جهتان", few: "جهات", many: "جهة" },
  actorTraced: {
    one: "جهة مرصودة واحدة",
    two: "جهتان مرصودتان",
    few: "جهات مرصودة",
    many: "جهة مرصودة",
  },
  stage: { one: "مرحلة واحدة", two: "مرحلتان", few: "مراحل", many: "مرحلة" },
  mention: { one: "إشارة واحدة", two: "إشارتان", few: "إشارات", many: "إشارة" },
  mentionTraced: {
    one: "إشارة مرصودة واحدة",
    two: "إشارتان مرصودتان",
    few: "إشارات مرصودة",
    many: "إشارة مرصودة",
  },
  piece: { one: "مادة واحدة", two: "مادتان", few: "موادّ", many: "مادة" },
  pin: { one: "دبّوس واحد", two: "دبّوسان", few: "دبابيس", many: "دبّوساً" },
  place: { one: "مكان واحد", two: "مكانان", few: "أماكن", many: "مكاناً" },
  activityTraced: {
    one: "نشاط مرصود واحد",
    two: "نشاطان مرصودان",
    few: "أنشطة مرصودة",
    many: "نشاطاً مرصوداً",
  },
  result: { one: "نتيجة واحدة", two: "نتيجتان", few: "نتائج", many: "نتيجة" },
  outlet: {
    one: "وسيلة أخرى واحدة",
    two: "وسيلتان أُخريان",
    few: "وسائل أخرى",
    many: "وسيلة أخرى",
  },
  million: { one: "مليون", two: "مليونان", few: "ملايين", many: "مليون" },
} as const satisfies Record<string, ArCountForms>;
