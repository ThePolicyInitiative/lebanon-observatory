import { layerLabel, regionLabel, stageList, type Locale } from "@/lib/vocab";

/**
 * The Arabic rendering of every tag the classifier emits.
 *
 * This used to live inside a component that drew the coverage breakdowns as
 * plain bars, on the reasoning that the Arabic page could not afford the
 * chart library. That stopped being true when the Arabic page began mounting
 * the same explorer as the English one, and the component went unmounted -
 * while remaining the only home of the lookup four call sites needed. It
 * belongs here, beside the tagger whose output it translates.
 *
 * The keys are exactly the strings src/lib/news/tagging.ts emits. Stages,
 * regions and actor layers take their Arabic from the shared vocabulary in
 * src/lib/vocab.ts, so a name cannot drift between modules.
 */
const AR_LABEL: Record<string, string> = {
  // publisher kinds
  media: "إعلام",
  official: "جهة رسمية",
  un: "الأمم المتحدة",
  multilateral: "مؤسسة متعددة الأطراف",
  ngo: "منظمة غير حكومية",
  // languages
  ar: "العربية",
  en: "الإنجليزية",
  fr: "الفرنسية",
  other: "لغات أخرى",
  // sectors, as tagging.ts names them
  Housing: "السكن",
  "Roads and transport": "الطرق والنقل",
  Electricity: "الكهرباء",
  Water: "المياه",
  "Debris and environment": "الركام والبيئة",
  Health: "الصحة",
  Education: "التعليم",
  "Heritage and culture": "التراث والثقافة",
};

// The twelve chain stages: tagging.ts emits the English stage names
// verbatim, so the shared stage vocabulary covers them one for one.
stageList("en").forEach((stage, i) => {
  AR_LABEL[stage] = stageList("ar")[i];
});

// Regional groupings from locations.json: the tag strings equal the English
// region labels, so both halves come from regionLabel. There is no northern
// grouping - neither war reached those governorates - so the tagger emits no
// northern tag and none is translated here.
for (const id of [
  "south_nabatieh",
  "beirut_mount_lebanon",
  "bekaa_baalbek_hermel",
  "camps_migrant",
]) {
  AR_LABEL[regionLabel(id, "en")] = regionLabel(id, "ar");
}

// Actor layers, likewise tagged with their English labels.
for (const id of ["official", "ngo_international", "municipal", "community"]) {
  AR_LABEL[layerLabel(id, "en")] = layerLabel(id, "ar");
}

/**
 * One lookup for every module that prints a classifier tag: English shows
 * the tag as emitted, Arabic shows its dictionary rendering. Values that are
 * not tags - publisher names, score bands - pass through unchanged.
 */
export function newsTagLabel(value: string, locale: Locale): string {
  return locale === "ar" ? (AR_LABEL[value] ?? value) : value;
}
