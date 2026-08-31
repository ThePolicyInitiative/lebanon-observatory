import { describe, expect, it } from "vitest";
import { BANNED as VOCAB_BANNED, AR_BANNED as VOCAB_AR } from "./vocab-patterns";
import {
  BANNED, AR_BANNED, extractPublisherLink, htmlTitle, htmlToText, nearestRows,
  nextArchiveId, relevant, updateKey, validateArchive, validateUpdate,
} from "../scripts/watch/news-rules.mjs";
import { contentKey } from "../scripts/watch/content-key.mjs";
import {
  CONTRACT, DEFAULT_FREE_MODEL, RESPONSE_SCHEMA, SYSTEM, apiAuth, extractJson,
} from "../scripts/watch/claude-writer.mjs";

/**
 * The open-web pipeline, offline: everything a machine-gathered row is
 * refused for must be refused here, before the vitest gate ever sees it.
 * A row the validators pass and the suite rejects is a pipeline bug.
 */

const goodUpdate = () => ({
  dateReported: "2026-08-20",
  actor: "Union of Tyre municipalities",
  actorAr: "اتحاد بلديات صور",
  layer: "municipal",
  action:
    "Annahar reporting says the union of municipalities in the Tyre district has begun clearing rubble from three coastal villages, with equipment lent by the disaster management unit and daily runs to the Ras al-Ain disposal site.",
  actionAr:
    "تفيد تغطية النهار بأن اتحاد بلديات صور بدأ رفع الركام من ثلاث قرى ساحلية بمعدات أعارتها وحدة إدارة الكوارث، مع نقل يومي إلى موقع رأس العين للطمر.",
  place: "Tyre district (Ras al-Ain)",
  placeAr: "قضاء صور (رأس العين)",
  kind: "Municipal",
  sourceName: "Annahar",
  sourceUrl: "https://example.org/tyre-rubble",
  sourceKind: "press",
  dateText: null,
  dateTextAr: null,
  southOfLitani: true,
  openedDirectly: true,
  caution: "Press reporting; the volumes cleared are the union's own statements.",
  cautionAr: "تغطية صحافية، والكميات المرفوعة تصريحات الاتحاد نفسه.",
  detail: "",
  detailAr: "",
});

const goodArchive = () => ({
  id: "c500",
  year: 2026,
  kind: "news",
  language: "en",
  publisher: "The Example Times",
  title: "Documents show the reconstruction files nobody verified",
  date: "2026-08-18",
  focus: "How rebuilding money moved between the state and municipal tracks, and which towns saw work begin.",
  focusAr: "كيف انتقلت أموال إعادة الإعمار بين مساري الدولة والبلديات، وأي بلدات شهدت بداية الأعمال.",
  url: "https://example.org/analysis",
});

describe("the update validator", () => {
  it("passes a well-formed bilingual row", () => {
    expect(validateUpdate(goodUpdate(), { today: "2026-08-31" })).toEqual([]);
  });

  it("refuses the banned vocabulary in either language", () => {
    const en = { ...goodUpdate(), action: goodUpdate().action.replace("reporting says", "documented that") };
    expect(validateUpdate(en).join(" ")).toContain("banned word");
    const ar = { ...goodUpdate(), actionAr: goodUpdate().actionAr + " بحسب سجلات البلدية." };
    expect(validateUpdate(ar).join(" ")).toContain("banned word");
  });

  it("refuses em and en dashes", () => {
    const row = { ...goodUpdate(), caution: "Press reporting — figures are the union's own." };
    expect(validateUpdate(row).join(" ")).toContain("dash");
  });

  it("refuses copy that frames a date as the limit of the information", () => {
    const row = { ...goodUpdate(), detail: "As of 20 August the union counts three villages.", detailAr: "حتى تاريخ 20 آب أحصى الاتحاد ثلاث قرى." };
    expect(validateUpdate(row).join(" ")).toContain("limit of the information");
  });

  it("refuses URLs inside prose", () => {
    const row = { ...goodUpdate(), detail: "More at https://example.org/x.", detailAr: "المزيد في الموقع." };
    expect(validateUpdate(row).join(" ")).toContain("URL");
  });

  it("holds the enums and the date shape", () => {
    expect(validateUpdate({ ...goodUpdate(), layer: "state" }).join(" ")).toContain("layer");
    expect(validateUpdate({ ...goodUpdate(), sourceKind: "blog" }).join(" ")).toContain("sourceKind");
    expect(validateUpdate({ ...goodUpdate(), dateReported: "20-08-2026" }).join(" ")).toContain("dateReported");
    expect(
      validateUpdate({ ...goodUpdate(), dateReported: "2026-12-01" }, { today: "2026-08-31" }).join(" "),
    ).toContain("future");
  });

  it("requires the two languages to carry the same optional fields", () => {
    const row = { ...goodUpdate(), dateText: "late August", dateTextAr: null };
    expect(validateUpdate(row).join(" ")).toContain("dateText");
  });

  it("requires a substantial caution on every machine-gathered row", () => {
    const row = { ...goodUpdate(), caution: "Press only." };
    expect(validateUpdate(row).join(" ")).toContain("caution");
  });

  it("refuses a repeat of an actor and action already carried", () => {
    const existing = new Set([updateKey(goodUpdate())]);
    expect(validateUpdate(goodUpdate(), { existingKeys: existing }).join(" ")).toContain("repeats");
  });
});

describe("the archive validator", () => {
  it("passes a well-formed item, with title and publisher quoted verbatim", () => {
    // The title deliberately carries banned words: a third party's own
    // headline is quotation, exactly as vocabulary.test.ts exempts it.
    expect(validateArchive(goodArchive(), { today: "2026-08-31" })).toEqual([]);
  });

  it("holds the observatory's own focus lines to the vocabulary", () => {
    const item = { ...goodArchive(), focus: "A dossier of the rebuilding records kept by the state." };
    expect(validateArchive(item).join(" ")).toContain("banned word");
  });

  it("holds the enums, the year and the link", () => {
    expect(validateArchive({ ...goodArchive(), kind: "opinion" }).join(" ")).toContain("kind");
    expect(validateArchive({ ...goodArchive(), language: "de" }).join(" ")).toContain("language");
    expect(validateArchive({ ...goodArchive(), year: 2025 }).join(" ")).toContain("disagrees");
    expect(validateArchive({ ...goodArchive(), url: "http://example.org/x" }).join(" ")).toContain("https");
    expect(
      validateArchive(goodArchive(), { existingUrls: new Set([goodArchive().url]) }).join(" "),
    ).toContain("already archived");
  });
});

describe("reading a fetched page", () => {
  it("reduces markup to prose and decodes entities", () => {
    const text = htmlToText(
      "<html><head><script>var x=1;</script><style>p{}</style><title>T</title></head>" +
        "<body><p>Rubble &amp; repair</p><div>in &#x644;&#x628;&#x646;&#x627;&#x646;</div></body></html>",
    );
    expect(text).toContain("Rubble & repair");
    expect(text).toContain("لبنان");
    expect(text).not.toContain("var x");
    expect(text).not.toContain("<p>");
  });

  it("reads the page title", () => {
    expect(htmlTitle("<title>Rebuilding the south | Outlet</title>")).toBe("Rebuilding the south | Outlet");
  });

  it("keeps the sweep's relevance gate: country and theme, or nothing", () => {
    expect(relevant("Municipalities in south Lebanon begin rubble removal")).toBe(true);
    expect(relevant("إعادة إعمار قرى الجنوب في لبنان")).toBe(true);
    expect(relevant("Lebanon wins a football match")).toBe(false);
    expect(relevant("Reconstruction financing in the Balkans")).toBe(false);
  });

  it("resolves a Google page only when it names exactly one outside address", () => {
    const one =
      '<a href="https://www.google.com/policies">x</a> <a href="https://outlet.example/story">y</a>';
    expect(extractPublisherLink(one)).toBe("https://outlet.example/story");
    const two = one + ' <a href="https://other.example/else">z</a>';
    expect(extractPublisherLink(two)).toBeNull();
  });
});

describe("agreement with the guard suites", () => {
  /**
   * The vocabulary regexes are the very objects vocab-patterns exports -
   * imported, not copied - so this pipeline and the vocabulary scan can
   * never disagree about a word. (The search-index script once carried a
   * copy, and drifted.)
   */
  it("judges vocabulary with the same regexes the vocabulary scan uses", () => {
    expect(BANNED).toBe(VOCAB_BANNED);
    expect(AR_BANNED).toBe(VOCAB_AR);
  });

  it("dedupes on the same key duplication.test.ts enforces", () => {
    expect(contentKey("The Army and the Council")).toBe("army council");
    expect(updateKey({ actor: "The Army", action: "cleared the rubble" })).toBe("army|cleared rubble");
  });
});

describe("the writer's contract", () => {
  it("tells the model the rules the validators then enforce", () => {
    for (const need of ["FORBIDDEN WORDS", "as of", "em or en dashes", "caution", "same depth", "سجلات"]) {
      expect(SYSTEM).toContain(need);
    }
  });

  it("constrains the response to the exact row shape", () => {
    expect(RESPONSE_SCHEMA.additionalProperties).toBe(false);
    expect(RESPONSE_SCHEMA.required).toEqual(["decision", "reason", "update", "archive"]);
    const update = RESPONSE_SCHEMA.properties.update.anyOf[1];
    expect(update.additionalProperties).toBe(false);
    // sourceUrl, id and openedDirectly are the pipeline's to set, never the model's.
    expect(update.properties.sourceUrl).toBeUndefined();
    expect(update.properties.openedDirectly).toBeUndefined();
    const archive = RESPONSE_SCHEMA.properties.archive.anyOf[1];
    expect(archive.properties.url).toBeUndefined();
    expect(archive.properties.id).toBeUndefined();
  });
});

describe("choosing a writer", () => {
  it("prefers a paid Anthropic key over a free OpenRouter one", () => {
    const auth = apiAuth({ ANTHROPIC_API_KEY: "a", OPENROUTER_API_KEY: "o" });
    expect(auth?.provider).toBe("anthropic");
    expect(auth?.headers["x-api-key"]).toBe("a");
  });

  it("runs on OpenRouter's free tier when that is the only key", () => {
    const auth = apiAuth({ OPENROUTER_API_KEY: "o" });
    expect(auth).toMatchObject({ provider: "openrouter", model: DEFAULT_FREE_MODEL });
    expect(auth?.headers.authorization).toBe("Bearer o");
    expect(apiAuth({ OPENROUTER_API_KEY: "o", OPENROUTER_MODEL: "x/y:free" })?.model).toBe("x/y:free");
  });

  it("reports no writer when no key is set", () => {
    expect(apiAuth({})).toBeNull();
  });
});

describe("reading a free model's reply", () => {
  it("takes the JSON object out of fences and prose", () => {
    expect(extractJson('```json\n{"decision":"skip","reason":"x"}\n```')).toEqual({
      decision: "skip",
      reason: "x",
    });
    expect(extractJson('Here is the row: {"decision":"skip"} - hope that helps')).toEqual({
      decision: "skip",
    });
  });

  it("refuses a reply with no JSON in it", () => {
    expect(() => extractJson("I could not read the page.")).toThrow("no JSON object");
  });

  it("spells the whole shape out for models without schema enforcement", () => {
    for (const need of ['"decision"', '"update"', '"archive"', "Never add keys", "no code fences"]) {
      expect(CONTRACT).toContain(need);
    }
  });
});

describe("archive ids", () => {
  it("takes max plus one, since ids are not contiguous", () => {
    expect(nextArchiveId([{ id: "c1" }, { id: "c296" }, { id: "c40" }])).toBe("c297");
  });
});

describe("nearest-row digests", () => {
  it("surfaces only rows sharing real content words with the page", () => {
    const updates = [
      { actor: "Council of the South", action: "compensation payments for damaged homes in Bint Jbeil resumed" },
      { actor: "A bakery cooperative", action: "reopened its ovens in Baalbek with diaspora funding" },
    ];
    const near = nearestRows("Council of the South resumes compensation for Bint Jbeil homes", updates);
    expect(near).toHaveLength(1);
    expect(near[0].actor).toBe("Council of the South");
  });
});
