/**
 * What is watched, how each reading is checked, and where a reading is
 * allowed to write.
 *
 * The contract every source in here obeys:
 *
 *   discover()  finds the current document and says when it was issued
 *   read()      turns that document into numbers
 *   check()     refuses a reading that is internally inconsistent, or
 *               that moves in a direction the quantity cannot move
 *   plan()      names the exact JSON fields the reading owns
 *
 * `plan` is the boundary that makes automatic publication defensible.
 * Fields it names are machine-owned: a run overwrites them without
 * asking. Everything else - every sentence of analysis, every caveat,
 * every claim about what has not happened - is human-owned and is never
 * touched, because no reading of a table can tell you whether a sentence
 * about it is still true. When a number moves and a human-owned sentence
 * still carries the old one, `tests/money-figures.test.ts` fails, and a
 * failing test stops the publish. That is the intended behaviour, not a
 * gap: the pipeline would rather ship nothing than ship a page that
 * contradicts itself.
 *
 * A source with `tier: "alert"` has no extractor. It is watched for
 * change and reported, and it never writes anything.
 */

import { get } from "./http.mjs";
import { pdfToText } from "./pdf-text.mjs";

/** The World Bank project the site's finance figures come from. */
export const LEAP_PROJECT_ID = "P509428";
/** The loan row inside its ISR disbursement table. */
export const LEAP_LOAN_ID = "IBRD-98410";
/** Assessed need, the denominator for the funnel's share-of-need field. */
const ASSESSED_NEED_USD = 11_000_000_000;

/*
 * Version 3 of the document search, not version 2.
 *
 * v2 answers 200 for this project and returns four documents, all of them
 * from appraisal in early 2025: no Implementation Status and Results
 * Report is in its index, and a `docty` filter for one returns nothing at
 * all. v3, queried the same way, returns 29 documents including every
 * quarterly ISR. A watcher built on v2 would therefore have reported
 * "nothing has moved" indefinitely while the figures it watches went
 * stale - so the version here is load-bearing, not incidental.
 */
const WDS =
  "https://search.worldbank.org/api/v3/wds?format=json&rows=40&srt=docdt&order=desc" +
  "&fl=docdt,docna,docty,pdfurl,guid&projectid=";

/** The `docty` the World Bank files its status reports under. */
const ISR_DOCTY = "Implementation Status and Results Report";

/** The API returns a facet entry alongside the documents; it has no date. */
function documentsIn(payload) {
  return Object.values(payload.documents ?? {}).filter((d) => d && d.docdt);
}

/* ------------------------------------------------------------------ */
/* LEAP Implementation Status and Results Report                       */
/* ------------------------------------------------------------------ */

const MONTHS = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** "29-Jun-2026" as it appears in the ISR header, to ISO. */
export function isrDateToIso(s) {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const mm = MONTHS[m[2].toLowerCase()];
  if (!mm) return null;
  return `${m[3]}-${mm}-${m[1].padStart(2, "0")}`;
}

/**
 * The newest Implementation Status and Results Report for the project.
 *
 * Selected on `docty`, which is a controlled value, rather than on the
 * document title: the titles arrive wrapped with newlines and padding,
 * and the ISRs are titled "Disclosable Version of the ISR - ..." while
 * the type field says what they are in full.
 */
export async function discoverLeapIsr() {
  const res = await get(WDS + encodeURIComponent(LEAP_PROJECT_ID));
  if (!res.ok) throw new Error(`World Bank document search: HTTP ${res.status}`);
  const isrs = documentsIn(res.json()).filter(
    (d) => String(d.docty ?? "").trim().toLowerCase() === ISR_DOCTY.toLowerCase(),
  );
  if (!isrs.length) return null;
  isrs.sort((a, b) => String(b.docdt).localeCompare(String(a.docdt)));
  const top = isrs[0];
  return {
    url: String(top.pdfurl ?? "").replace(/^http:/, "https:"),
    issuedOn: String(top.docdt ?? "").slice(0, 10),
    guid: String(top.guid ?? ""),
  };
}

/**
 * The disbursement table, read by number pattern rather than by column.
 *
 * Extraction drops inter-word spacing, so the row arrives as one run:
 *
 *   IBRD-98410Effective250.00250.000.004.13245.880.00 1.65%
 *
 * Six two-decimal amounts in millions - original, revised, cancelled,
 * disbursed, undisbursed, historically disbursed - then the percentage.
 * Matching the count exactly is what makes this safe: a template change
 * that adds or drops a column yields a different count and is rejected
 * rather than silently mapped onto the wrong field.
 */
export function parseIsrDisbursement(text, loanId = LEAP_LOAN_ID) {
  const row = new RegExp(
    `${loanId}\\s*([A-Za-z]+)\\s*((?:\\d[\\d,]*\\.\\d{2}){2,10})\\s*([\\d.]+)\\s*%`,
  ).exec(text);
  if (!row) return null;

  const amounts = (row[2].match(/\d[\d,]*\.\d{2}/g) ?? []).map((n) =>
    Number(n.replace(/,/g, "")),
  );
  if (amounts.length !== 6) return null;
  const [original, revised, cancelled, disbursed, undisbursed, historical] = amounts;

  const header = /Seq No:\s*(\d+)\s*\|\s*Archived on\s*([\d]{1,2}-[A-Za-z]{3}-\d{4})/.exec(text);

  return {
    loanId,
    status: row[1],
    // The table is denominated in millions of US dollars.
    originalUsd: Math.round(original * 1e6),
    revisedUsd: Math.round(revised * 1e6),
    cancelledUsd: Math.round(cancelled * 1e6),
    disbursedUsd: Math.round(disbursed * 1e6),
    undisbursedUsd: Math.round(undisbursed * 1e6),
    historicalUsd: Math.round(historical * 1e6),
    pctDisbursed: Number(row[3]),
    sequence: header ? Number(header[1]) : null,
    archivedOn: header ? isrDateToIso(header[2]) : null,
  };
}

/**
 * Every way this reading could be wrong that arithmetic can detect.
 *
 * The internal checks matter more than the bounds: disbursed plus
 * undisbursed reconciling to the revised amount, and the printed
 * percentage agreeing with the printed amounts, together mean the six
 * numbers were mapped onto the right six fields. A mis-parse fails both.
 */
export function checkIsrReading(r, previous) {
  const problems = [];
  if (!r) return { ok: false, problems: ["disbursement table not found in the report"] };

  if (r.sequence === null || r.archivedOn === null)
    problems.push("report header (sequence number and archive date) not found");
  if (r.originalUsd <= 0) problems.push("original loan amount is zero or negative");
  if (r.disbursedUsd < 0) problems.push("disbursed amount is negative");
  if (r.disbursedUsd > r.revisedUsd)
    problems.push(`disbursed (${r.disbursedUsd}) exceeds the revised loan (${r.revisedUsd})`);

  const reconcile = r.disbursedUsd + r.undisbursedUsd + r.cancelledUsd - r.revisedUsd;
  if (Math.abs(reconcile) > 20_000)
    problems.push(
      `disbursed + undisbursed + cancelled misses the revised loan by ${reconcile} - the columns did not map`,
    );

  const impliedPct = (r.disbursedUsd / r.revisedUsd) * 100;
  if (Math.abs(impliedPct - r.pctDisbursed) > 0.05)
    problems.push(
      `printed share ${r.pctDisbursed}% disagrees with ${impliedPct.toFixed(2)}% implied by the amounts`,
    );

  /*
   * Cumulative disbursement does not fall. It can only appear to when the
   * loan is cancelled down, so a fall is allowed exactly that far and is
   * reported either way - a quantity moving the wrong way is the most
   * likely shape of a source changing its meaning under us.
   */
  if (previous && r.disbursedUsd < previous.disbursedUsd) {
    const cancelledSince = r.cancelledUsd - (previous.cancelledUsd ?? 0);
    if (cancelledSince <= 0)
      problems.push(
        `cumulative disbursement fell from ${previous.disbursedUsd} to ${r.disbursedUsd} with no cancellation to explain it`,
      );
  }
  if (previous && r.sequence !== null && previous.sequence !== null && r.sequence < previous.sequence)
    problems.push(`report sequence went backwards: ${previous.sequence} to ${r.sequence}`);

  return { ok: problems.length === 0, problems };
}

/**
 * The fields this reading owns.
 *
 * Each entry is a path into one data file plus the value it must hold.
 * Nothing else in those files is machine-owned.
 */
export function planLeapIsr(r, doc) {
  const asOf = r.archivedOn ?? doc.issuedOn;
  const pctOfNeed = Number(((r.disbursedUsd / ASSESSED_NEED_USD) * 100).toPrecision(2));

  return [
    {
      file: "finance.json",
      path: ["funnel", { id: "disbursed" }, "amountUsd"],
      value: r.disbursedUsd,
    },
    { file: "finance.json", path: ["funnel", { id: "disbursed" }, "pctOfLoan"], value: r.pctDisbursed },
    { file: "finance.json", path: ["funnel", { id: "disbursed" }, "pctOfNeed"], value: pctOfNeed },
    { file: "finance.json", path: ["funnel", { id: "disbursed" }, "date"], value: asOf },
    { file: "finance.json", path: ["funnel", { id: "approved" }, "amountUsd"], value: r.revisedUsd },

    { file: "kpis.json", path: [{ id: "kpi-disbursed" }, "value"], value: r.disbursedUsd },
    { file: "kpis.json", path: [{ id: "kpi-disbursed" }, "display"], usd: r.disbursedUsd, locale: "en" },
    { file: "kpis.json", path: [{ id: "kpi-disbursed" }, "displayAr"], usd: r.disbursedUsd, locale: "ar" },
    {
      file: "kpis.json",
      path: [{ id: "kpi-disbursed" }, "label"],
      template: "Disbursed by {date}",
      date: asOf,
      locale: "en",
    },
    {
      file: "kpis.json",
      path: [{ id: "kpi-disbursed" }, "referencePeriod"],
      template: "As of {date}",
      date: asOf,
      locale: "en",
    },
    {
      file: "kpis.json",
      path: [{ id: "kpi-disbursed" }, "referencePeriodAr"],
      template: "حتى {date}",
      date: asOf,
      locale: "ar",
    },

    { file: "kpis.json", path: [{ id: "kpi-disbursed-pct" }, "value"], value: r.pctDisbursed },
    { file: "kpis.json", path: [{ id: "kpi-disbursed-pct" }, "display"], value: `${r.pctDisbursed}%` },
    { file: "kpis.json", path: [{ id: "kpi-disbursed-pct" }, "displayAr"], value: `${r.pctDisbursed}%` },
    {
      file: "kpis.json",
      path: [{ id: "kpi-disbursed-pct" }, "referencePeriod"],
      template: "As of {date}",
      date: asOf,
      locale: "en",
    },
    {
      file: "kpis.json",
      path: [{ id: "kpi-disbursed-pct" }, "referencePeriodAr"],
      template: "حتى {date}",
      date: asOf,
      locale: "ar",
    },

    // The citation register entry the figures point at.
    {
      file: "report-sources.json",
      path: [{ id: "S1" }, "title"],
      template: `LEAP Implementation Status and Results Report (seq. ${r.sequence})`,
    },
    { file: "report-sources.json", path: [{ id: "S1" }, "publicationDate"], value: asOf },
    {
      file: "report-sources.json",
      path: [{ id: "S1" }, "url"],
      value: doc.url,
      skipIfContains: doc.guid,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* The registry                                                        */
/* ------------------------------------------------------------------ */

export const SOURCES = [
  {
    id: "leap-isr",
    label: "LEAP Implementation Status and Results Report (World Bank)",
    sourceId: "S1",
    tier: "auto",
    discover: discoverLeapIsr,
    async read(doc) {
      const res = await get(doc.url, { accept: "application/pdf" });
      if (!res.ok) throw new Error(`report download: HTTP ${res.status}`);
      const { text, ok, streams } = pdfToText(res.body);
      if (!ok)
        throw new Error(
          `report yielded ${text.length} characters from ${streams} streams - not a text PDF`,
        );
      return parseIsrDisbursement(text);
    },
    check: checkIsrReading,
    plan: planLeapIsr,
    /*
     * Change is detected on the document, not on the numbers: a report
     * that is reissued with the same figures still moves the citation's
     * date and url, and a report we have already published needs no
     * download at all.
     */
    docIdentity: (doc) => `${doc.issuedOn}:${doc.guid || doc.url}`,
    describeDoc: (doc) => `report of ${doc.issuedOn}`,
    describeReading: (r) =>
      `seq ${r.sequence}, US$${(r.disbursedUsd / 1e6).toFixed(2)}M disbursed of US$${(r.revisedUsd / 1e6).toFixed(2)}M (${r.pctDisbursed}%), archived ${r.archivedOn}`,
  },

  /*
   * Watched, never written. These carry the figures the site cannot read
   * mechanically - a ministry toll published as a sentence, a cabinet
   * decision, a damage assessment issued as a press release. A change
   * here is a prompt for a human to read the source, which is the only
   * thing that can turn prose into a traced figure.
   */
  {
    id: "wb-project-docs",
    label: "World Bank document listing for the LEAP project",
    sourceId: null,
    tier: "alert",
    async discover() {
      const res = await get(WDS + encodeURIComponent(LEAP_PROJECT_ID));
      if (!res.ok) throw new Error(`World Bank document search: HTTP ${res.status}`);
      /*
       * The status reports are excluded: they have their own entry above,
       * which reads them. What is left is the procurement plans, the
       * agreements and the safeguard documents - the papers that say a
       * contract is being let, which is the milestone the site's
       * procurement copy turns on and which nothing can extract.
       */
      const newest = documentsIn(res.json())
        .filter((d) => String(d.docty ?? "").trim().toLowerCase() !== ISR_DOCTY.toLowerCase())
        .map((d) => ({
          title: `${String(d.docty ?? "document").trim()} - ${Object.values(d.docna ?? {})
            .map((n) => String(n.docna ?? "").replace(/\s+/g, " ").trim())
            .join("; ")}`,
          issuedOn: String(d.docdt ?? "").slice(0, 10),
          url: String(d.pdfurl ?? d.url ?? "").replace(/^http:/, "https:"),
        }))
        .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn))[0];
      return newest ?? null;
    },
    docIdentity: (d) => `${d.issuedOn}:${d.title}`,
    describeDoc: (d) => `${d.issuedOn} - ${d.title}`,
  },
  {
    id: "reliefweb-lebanon",
    label: "ReliefWeb Lebanon updates",
    sourceId: null,
    tier: "alert",
    /*
     * The RSS feed, not the JSON API: the API refuses every request that
     * does not carry an appname it has approved, and this project has
     * none. The feed is keyless and carries the same headline set.
     */
    async discover() {
      const res = await get("https://reliefweb.int/updates/rss.xml?legacy-river=country/lbn", {
        accept: "application/rss+xml, application/xml",
      });
      if (!res.ok) throw new Error(`ReliefWeb feed: HTTP ${res.status}`);
      const xml = res.text();
      const first = /<item>([\s\S]*?)<\/item>/.exec(xml);
      if (!first) return null;
      const field = (name) => {
        const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(first[1]);
        return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
      };
      return { title: field("title"), url: field("link"), issuedOn: field("pubDate") };
    },
    docIdentity: (d) => d.url || d.title,
    describeDoc: (d) => d.title,
  },
];
