import type { NewsArticle } from "@/lib/types";

/** Keyword tagging, relevance scoring and language handling for the
 * live-news pipeline. All input text is sanitized before reaching here. */

const RECONSTRUCTION_CORE = [
  "reconstruction", "rebuild", "rebuilding", "rubble", "debris", "compensation",
  "leap", "damage assessment", "recovery plan", "recovery needs", "cdr",
  "council for development and reconstruction", "procurement", "world bank",
  "إعمار", "اعمار", "أنقاض", "انقاض", "ركام", "تعويض", "إعادة الإعمار",
  "reconstruire", "décombres", "gravats", "indemnisation",
];

const RECONSTRUCTION_BROAD = [
  "recovery", "housing", "infrastructure", "shelter", "displacement", "displaced",
  "return", "municipal", "municipality", "public works", "electricity", "water",
  "ceasefire", "damage", "donor", "financing", "humanitarian",
  "نزوح", "إيواء", "بلدية", "بنية تحتية", "كهرباء", "مياه",
  "déplacés", "abri", "municipalité", "infrastructure", "logement",
];

const LEBANON_MARKERS = [
  "lebanon", "lebanese", "beirut", "nabatieh", "tyre", "sidon", "saida", "bekaa",
  "baalbek", "tripoli", "dahieh", "litani", "bint jbeil", "marjeyoun", "khiam",
  "لبنان", "اللبناني", "بيروت", "النبطية", "صور", "صيدا", "البقاع", "بعلبك",
  "الضاحية", "liban", "libanais", "beyrouth",
];

const LOCATION_TAGS: [string, string[]][] = [
  ["South and Nabatieh", ["south lebanon", "nabatieh", "tyre", "sour ", "bint jbeil", "bent jbeil", "marjeyoun", "khiam", "litani", "aitaroun", "kfar kila", "naqoura", "الجنوب", "النبطية", "صور", "بنت جبيل", "مرجعيون", "الخيام", "sud du liban"]],
  ["Beirut and Mount Lebanon", ["beirut", "dahieh", "southern suburbs", "baabda", "mount lebanon", "بيروت", "الضاحية", "بعبدا", "جبل لبنان", "beyrouth"]],
  ["Bekaa and Baalbek-Hermel", ["bekaa", "baalbek", "hermel", "zahle", "البقاع", "بعلبك", "الهرمل", "زحلة"]],
  ["North", ["tripoli", "akkar", "north lebanon", "طرابلس", "عكار", "الشمال"]],
  ["Camps and migrant communities", ["palestinian camp", "refugee camp", "unrwa", "migrant", "مخيم", "لاجئ"]],
];

const SECTOR_TAGS: [string, string[]][] = [
  ["Housing", ["housing", "homes", "apartment", "residential", "سكن", "منازل", "logement"]],
  ["Roads and transport", ["road", "bridge", "highway", "airport", "طريق", "جسر", "route"]],
  ["Electricity", ["electricity", "power", "edl", "grid", "كهرباء", "électricité"]],
  ["Water", ["water", "wastewater", "sanitation", "مياه", "eau"]],
  ["Debris and environment", ["rubble", "debris", "landfill", "quarry", "أنقاض", "ركام", "مطمر", "décombres", "gravats"]],
  ["Health", ["hospital", "health", "clinic", "مستشفى", "صحة", "santé", "hôpital"]],
  ["Education", ["school", "education", "university", "مدرسة", "تعليم", "école"]],
  ["Heritage and culture", ["heritage", "cultural", "antiquities", "تراث", "آثار", "patrimoine"]],
];

const STAGE_TAGS: [string, string[]][] = [
  ["Strategy and coordination", ["cabinet", "government plan", "coordination", "strategy", "مجلس الوزراء", "خطة"]],
  ["Finance and compensation", ["loan", "financing", "compensation", "donor", "grant", "funding", "قرض", "تمويل", "تعويض", "prêt", "financement"]],
  ["Damage and needs assessment", ["damage assessment", "assessment", "rdna", "satellite", "تقييم الأضرار", "évaluation"]],
  ["Safety and access", ["unexploded", "ordnance", "mine action", "demining", "ألغام", "ذخائر", "déminage"]],
  ["Procurement and contracting", ["tender", "procurement", "contract", "bid", "مناقصة", "عقد", "appel d'offres"]],
  ["Rubble clearance", ["rubble removal", "clearing rubble", "debris removal", "رفع الأنقاض", "إزالة الركام"]],
  ["Debris treatment and disposal", ["landfill", "recycling", "disposal", "quarry", "مطمر", "تدوير"]],
  ["Reconstruction and services", ["reconstruction", "rebuild", "restore", "rehabilitation", "إعمار", "ترميم", "reconstruire"]],
  ["Shelter and return", ["shelter", "displaced return", "return home", "إيواء", "عودة النازحين", "abri"]],
  ["Relief and protection", ["relief", "aid", "humanitarian", "food assistance", "cash assistance", "إغاثة", "مساعدات", "aide humanitaire"]],
  ["Livelihoods and community recovery", ["livelihood", "jobs", "farmers", "agriculture", "سبل العيش", "مزارع", "moyens de subsistance"]],
  ["Oversight and accountability", ["transparency", "accountability", "audit", "grievance", "monitoring", "شفافية", "محاسبة", "surveillance"]],
];

const LAYER_TAGS: [string, string[]][] = [
  ["Official institutions", ["ministry", "government", "cabinet", "president", "parliament", "army", "cdr", "municipal council", "وزارة", "حكومة", "الجيش", "ministère", "gouvernement"]],
  ["NGOs & international agencies", ["united nations", " un ", "undp", "unicef", "unhcr", "world bank", "ngo", "red cross", "ocha", "wfp", "الأمم المتحدة", "البنك الدولي", "banque mondiale"]],
  ["Municipalities & local authorities", ["municipality", "municipalities", "mayor", "union of municipalities", "بلدية", "بلديات", "municipalité"]],
  ["Community initiatives", ["volunteer", "community", "residents", "diaspora", "grassroots", "متطوع", "أهالي", "bénévole"]],
];

const ARABIC_RANGE = /[؀-ۿ]/;

export function detectLanguage(hint: string | null, text: string): NewsArticle["language"] {
  const h = (hint || "").toLowerCase();
  if (h.startsWith("en") || h === "english") return "en";
  if (h.startsWith("ar") || h === "arabic") return "ar";
  if (h.startsWith("fr") || h === "french") return "fr";
  if (ARABIC_RANGE.test(text)) return "ar";
  if (h) return "other";
  return "en";
}

export function isLebanonPrimary(text: string): boolean {
  const t = text.toLowerCase();
  return LEBANON_MARKERS.some((m) => t.includes(m));
}

export function scoreRelevance(text: string): number {
  const t = ` ${text.toLowerCase()} `;
  let score = 0;
  if (LEBANON_MARKERS.some((m) => t.includes(m))) score += 30;
  if (RECONSTRUCTION_CORE.some((k) => t.includes(k))) score += 50;
  const broadHits = RECONSTRUCTION_BROAD.filter((k) => t.includes(k)).length;
  score += Math.min(20, broadHits * 5);
  return Math.min(100, score);
}

function collect(tags: [string, string[]][], text: string): string[] {
  const t = ` ${text.toLowerCase()} `;
  return tags.filter(([, kws]) => kws.some((k) => t.includes(k))).map(([label]) => label);
}

export function tagArticle(text: string): {
  locations: string[];
  sectors: string[];
  valueChainStages: string[];
  actorLayers: string[];
} {
  return {
    locations: collect(LOCATION_TAGS, text),
    sectors: collect(SECTOR_TAGS, text),
    valueChainStages: collect(STAGE_TAGS, text),
    actorLayers: collect(LAYER_TAGS, text),
  };
}

export function classifySourceType(domain: string): NewsArticle["sourceType"] {
  const d = domain.toLowerCase();
  if (/(^|\.)gov\.lb$|presidency\.gov|pcm\.gov|europa\.eu|lebarmy/.test(d)) return "official";
  if (/worldbank|imf\.org|afd\.fr|kfw/.test(d)) return "multilateral";
  if (/un\.org|undp|unicef|unhcr|wfp|unocha|reliefweb|unrwa|who\.int|iom\.int|unhabitat|fao\.org|unesco/.test(d)) return "un";
  if (/nrc\.no|mercycorps|oxfam|savethechildren|care\.org|drc\.ngo|icrc|redcross|hotosm|actionaid|islamic-relief/.test(d)) return "ngo";
  return "media";
}

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeText(raw: string | null | undefined, maxLen = 500): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
