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
  "الاستراتيجية والتنسيق",
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
  "استراتيجية",
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
