/**
 * The writing step of the open-web pipeline: given an opened page, a
 * model drafts either a reported-layer row or an archive item, in both
 * languages, under the site's own rules - or declines. Claude by
 * preference (an Anthropic key), or a free OpenRouter model as the
 * no-cost alternative.
 *
 * Nothing the model returns is trusted: `news-rules.mjs` re-checks every
 * field mechanically, and the full test suite still gates the commit. The
 * model also never controls a URL - `sourceUrl`, `url`, `id` and
 * `openedDirectly` are set by the pipeline from what it actually fetched.
 *
 * Raw HTTPS on `scripts/watch/http.mjs` rather than the Anthropic SDK,
 * for the reason docs/automation.md gives every outbound call here: the
 * SDK rides on undici's fetch, which the network this project is
 * developed behind blocks, while plain node:https goes through.
 */

import { get } from "./http.mjs";

export const MODEL = "claude-opus-5";
const API_URL = "https://api.anthropic.com/v1/messages";

/*
 * The free alternative: OpenRouter's no-cost models, behind the same
 * validators and the same test gate. A free model produces more drafts
 * the checks refuse - those queue for a human instead of publishing - but
 * nothing weaker ever reaches the site. Free-tier accounts carry a small
 * daily request cap (about 50 at the time of writing), which the run caps
 * in news-ingest.mjs already fit under. The free lineup rotates, so a
 * vanished model falls back to OpenRouter's own free auto-router.
 */
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_FREE_MODEL = "z-ai/glm-5.2:free";
export const FALLBACK_FREE_MODEL = "openrouter/free";

/**
 * Which writer the pipeline runs under, if any. CI passes one of the
 * keys as a secret; a paid Anthropic key wins over a free OpenRouter one.
 *
 * @param {Record<string, string | undefined>} [env]
 */
export function apiAuth(env = process.env) {
  if (env.ANTHROPIC_API_KEY)
    return { provider: "anthropic", headers: { "x-api-key": env.ANTHROPIC_API_KEY } };
  if (env.ANTHROPIC_AUTH_TOKEN)
    return {
      provider: "anthropic",
      headers: {
        authorization: `Bearer ${env.ANTHROPIC_AUTH_TOKEN}`,
        "anthropic-beta": "oauth-2025-04-20",
      },
    };
  if (env.OPENROUTER_API_KEY)
    return {
      provider: "openrouter",
      headers: { authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
      model: env.OPENROUTER_MODEL || DEFAULT_FREE_MODEL,
    };
  return null;
}

/*
 * The response schema. `output_config.format` makes the model's answer
 * arrive as exactly this JSON - no fence-stripping, no "here is the row".
 */
const nullable = (inner) => ({ anyOf: [{ type: "null" }, inner] });
const str = { type: "string" };

const UPDATE_SCHEMA = {
  type: "object",
  properties: {
    dateReported: nullable(str),
    actor: str,
    actorAr: str,
    layer: { type: "string", enum: ["official", "municipal", "ngo_international", "community"] },
    action: str,
    actionAr: str,
    place: str,
    placeAr: str,
    kind: str,
    sourceName: str,
    sourceKind: { type: "string", enum: ["press", "institutional", "social"] },
    dateText: nullable(str),
    dateTextAr: nullable(str),
    southOfLitani: { type: "boolean" },
    caution: str,
    cautionAr: str,
    detail: str,
    detailAr: str,
  },
  required: [
    "dateReported", "actor", "actorAr", "layer", "action", "actionAr", "place", "placeAr",
    "kind", "sourceName", "sourceKind", "dateText", "dateTextAr", "southOfLitani",
    "caution", "cautionAr", "detail", "detailAr",
  ],
  additionalProperties: false,
};

const ARCHIVE_SCHEMA = {
  type: "object",
  properties: {
    year: { type: "integer", enum: [2024, 2025, 2026] },
    kind: { type: "string", enum: ["news", "research", "official", "assessment", "rights"] },
    language: { type: "string", enum: ["en", "ar", "fr", "en/ar"] },
    publisher: str,
    title: str,
    date: str,
    focus: str,
    focusAr: str,
  },
  required: ["year", "kind", "language", "publisher", "title", "date", "focus", "focusAr"],
  additionalProperties: false,
};

export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["update", "archive", "skip"] },
    reason: str,
    update: nullable(UPDATE_SCHEMA),
    archive: nullable(ARCHIVE_SCHEMA),
  },
  required: ["decision", "reason", "update", "archive"],
  additionalProperties: false,
};

/*
 * The rules the site holds its own copy to, stated once and cached across
 * the run's calls. Kept in one exported constant so the offline tests can
 * assert the prompt carries the rules the validators enforce.
 */
export const SYSTEM = `You draft entries for the Lebanon Reconstruction Observatory, a bilingual policy site tracking who is rebuilding Lebanon after the 2024 and 2026 wars. You are given one news page that has been fetched and its text extracted. Decide what it supports, and draft it under the site's rules. The reported layer you write into is kept strictly separate from the site's confirmed analysis: nothing you write enters any count, matrix or map, and you never state a figure as the site's own.

DECISION
- "update": the page reports one identifiable actor taking, funding, announcing or blocking a concrete reconstruction-related action in Lebanon (repair, rubble removal, compensation, tender, assessment, shelter, return of residents, service restoration). One actor, one action.
- "archive": the page is long-form coverage, research, an official statement, an assessment or rights reporting on the wars and rebuilding, worth keeping as history, but not one actor-action.
- "skip": not about Lebanon's post-war rebuilding; or too thin to support a row; or the EXISTING ROWS provided already carry the same actor and action (a genuinely new development by the same actor is not a repeat).

HOUSE RULES, all fields, both languages
- English and Arabic carry the same substance at the same depth. Never leave the Arabic thinner.
- Attribute everything to the publication: "X reporting says...", "coverage by X describes...", Arabic "تفيد تغطية..."، "بحسب...". Money and quantity figures stay the publisher's claims, described as announced or reported, never as disbursed or done unless the page itself distinguishes that.
- FORBIDDEN WORDS, never use in any field, any language: dataset(s), record(s), recorded, document(s), documented, documentation, evidence, dossier(s), file(s), source(s), user(s), verify, verified, unverified, verification; Arabic: أدلة، موثقة، يوثق، سجلات، وثائق، ملفات، مصادر، مصدر، تحقق. Write instead: reporting, coverage, published material, the original publication, confirmed, checked; Arabic: ما نُشر علناً، المواد المنشورة، المنشور الأصلي، مؤكد، التثبت.
- No em or en dashes anywhere; use hyphens or commas.
- Never frame a date as the limit of what is known: no "as of", no cut-off language. Say "at the end of June" or "by late June" style phrasing instead.
- No URLs inside prose fields.

UPDATE FIELDS
- actor / actorAr: who acted, specific ("Council of the South", not "the state").
- layer: official (state bodies, army, ministries, national funds), municipal (municipalities, unions of municipalities), ngo_international (UN bodies, international organisations and NGOs, foreign donors), community (residents, diaspora, local initiatives, religious and private local actors).
- action / actionAr: 2-4 sentences. What was done or announced, where, with the publisher named inside the text, and the page's key figures carried as its claims.
- place / placeAr: named towns or regions, e.g. "South Lebanon (Bint Jbeil, Aitaroun)".
- kind: a short reader label like "State / official", "Municipal", "Community / residents", "UN / international", "Private sector", "Compensation / plans", "Debris / disposal". Reuse an existing label when one fits.
- sourceName: the publisher's masthead name. sourceKind: press (news outlets), institutional (governments, UN, banks, NGOs' own publications), social (self-published posts).
- dateReported: the page's own publication date YYYY-MM-DD if stated, else null. dateText / dateTextAr: timing in words only when the page gives one and dateReported is null; else null. Never invent a date.
- southOfLitani: true only if the action is in the area between the Litani river and the Blue Line.
- caution / cautionAr: one sentence on what this reporting cannot support, always present. Examples of the register: "Press reporting; the funding figures are announced program amounts, not disbursements." / "A podium proposal at a business forum; nothing has been established yet."
- detail / detailAr: a further sentence if the page supports one, else empty strings.

ARCHIVE FIELDS
- publisher and title: verbatim from the page, in its own language (these two fields are exempt from the forbidden-words rule; everything else is not).
- year: the piece's publication year; date: its publication date YYYY-MM-DD.
- kind: news, research, official, assessment or rights. language: en, ar, fr, or "en/ar".
- focus / focusAr: one to two sentences, the observatory's own description of what the piece covers. House rules apply in full.

Judge only from the page text given. If the text contradicts or does not support the feed title, trust the text. If the page is a paywall stub, a listing page, or mostly unrelated, skip it.`;

/*
 * Anthropic's endpoint enforces RESPONSE_SCHEMA itself. The free models
 * cannot be relied on for that, so they get the shape spelled out - and
 * whatever comes back still faces extractJson and the news-rules
 * validators, which is where the real gate has been all along.
 */
export const CONTRACT = `Answer with ONE JSON object only - no code fences, no commentary before or after. Its exact shape:

{
  "decision": "update" | "archive" | "skip",
  "reason": "one sentence",
  "update": null, or (only when decision is "update") an object with exactly these keys:
    dateReported (string "YYYY-MM-DD" or null), actor, actorAr,
    layer ("official" | "municipal" | "ngo_international" | "community"),
    action, actionAr, place, placeAr, kind, sourceName,
    sourceKind ("press" | "institutional" | "social"),
    dateText (string or null), dateTextAr (string or null),
    southOfLitani (true or false), caution, cautionAr, detail, detailAr,
  "archive": null, or (only when decision is "archive") an object with exactly these keys:
    year (2024 | 2025 | 2026), kind ("news" | "research" | "official" | "assessment" | "rights"),
    language ("en" | "ar" | "fr" | "en/ar"), publisher, title,
    date ("YYYY-MM-DD"), focus, focusAr
}

Never add keys. Never include a URL field; the pipeline sets those itself.`;

/** The JSON object in a model's reply, fences and prose stripped. */
export function extractJson(text) {
  const unfenced = String(text).replace(/```(?:json)?/gi, " ");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in the reply");
  return JSON.parse(unfenced.slice(start, end + 1));
}

async function draftWithAnthropic(auth, user) {
  const body = JSON.stringify({
    model: MODEL,
    max_tokens: 16000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema: RESPONSE_SCHEMA } },
  });

  const res = await get(API_URL, {
    method: "POST",
    accept: "application/json",
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
      "anthropic-version": "2023-06-01",
      ...auth.headers,
    },
    body,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.text().slice(0, 300)}`);

  const message = res.json();
  if (message.stop_reason === "refusal")
    return { decision: "skip", reason: `the model declined (${message.stop_details?.category ?? "refusal"})`, update: null, archive: null };
  if (message.stop_reason === "max_tokens") throw new Error("response truncated at max_tokens");

  const text = (message.content ?? []).find((b) => b.type === "text")?.text;
  if (!text) throw new Error("no text block in the response");
  return JSON.parse(text);
}

async function draftWithOpenRouter(auth, user, model) {
  const body = JSON.stringify({
    model,
    max_tokens: 8000,
    messages: [
      { role: "system", content: `${SYSTEM}\n\n${CONTRACT}` },
      { role: "user", content: user },
    ],
  });

  const res = await get(OPENROUTER_URL, {
    method: "POST",
    accept: "application/json",
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
      // OpenRouter's attribution headers; nothing secret in either.
      "http-referer": "https://github.com",
      "x-title": "Lebanon Reconstruction Observatory sweep",
      ...auth.headers,
    },
    body,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.text().slice(0, 300)}`);

  const choice = res.json().choices?.[0];
  if (!choice?.message?.content) throw new Error("no reply in the response");
  if (choice.finish_reason === "length") throw new Error("response truncated at max_tokens");
  return extractJson(choice.message.content);
}

/**
 * One writing call. Returns the parsed decision object, or a synthetic
 * skip when the model itself declines. Throws on transport errors, bad
 * status, truncation and unparseable replies - the pipeline queues the
 * lead and moves on.
 *
 * The free lineup rotates: when the configured OpenRouter model has
 * vanished, the run drops to the free auto-router once and stays there,
 * rather than failing every remaining lead on a dead model id.
 */
export async function draftRow({ lead, pageTitle, pageText, nearest, today, auth }) {
  const user = [
    `TODAY: ${today}`,
    `FEED ITEM: ${JSON.stringify({ title: lead.title, publisher: lead.publisher || null, feedDate: lead.date || null, feed: lead.feed })}`,
    `PAGE TITLE: ${pageTitle || "(none)"}`,
    nearest.length
      ? `EXISTING ROWS NEAREST THIS PAGE (skip only a real repeat of one of these):\n${JSON.stringify(nearest, null, 1)}`
      : "EXISTING ROWS NEAREST THIS PAGE: none",
    `PAGE TEXT:\n${pageText}`,
  ].join("\n\n");

  if (auth.provider !== "openrouter") return draftWithAnthropic(auth, user);

  try {
    return await draftWithOpenRouter(auth, user, auth.model);
  } catch (err) {
    const gone = /API (400|404)/.test(String(err?.message)) && auth.model !== FALLBACK_FREE_MODEL;
    if (!gone) throw err;
    auth.model = FALLBACK_FREE_MODEL;
    return draftWithOpenRouter(auth, user, auth.model);
  }
}
