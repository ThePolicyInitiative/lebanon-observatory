/**
 * Open, read, write, check, publish: the open-web sweep as a pipeline.
 *
 *   python scripts/web-sweep.py --days 7 --out leads.json   (collection)
 *   node scripts/news-ingest.mjs --leads leads.json --dry-run
 *   node scripts/news-ingest.mjs --leads leads.json         write, rebuild, test
 *   node scripts/news-ingest.mjs --leads leads.json --push  ...and publish
 *
 * Per the site's method an item joins the reported layer only after its
 * page has been opened and read. This pipeline enforces that literally:
 * every lead is fetched; its text has to name the country and touch a
 * reconstruction theme; and only then does a writing model (Claude, key
 * permitting) draft the bilingual row, which `news-rules.mjs` re-checks
 * field by field before the full test suite gets the final word. What the
 * machine cannot settle - an unresolvable redirect, a page that will not
 * open, a draft that fails its checks, or every lead when no key is set -
 * lands in scripts/watch/news-review.json for a human read.
 *
 * The confirmed layer is never touched. Writes go to web-updates.json
 * and coverage-archive.json only, which state on their faces that nothing
 * in them enters any count, matrix or map.
 *
 * Exit codes, matching auto-update.mjs:
 *   0   nothing to write, or a change survived the suite (and was pushed)
 *   10  a draft failed validation - the writer needs a human look
 *   20  the test suite rejected the batch; the tree has been restored
 *   1   the run could not complete
 */

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { get } from "./watch/http.mjs";
import { readData, writeData } from "./watch/data-io.mjs";
import {
  SALIENT, extractPublisherLink, htmlTitle, htmlToText, nearestRows, nextArchiveId,
  relevant, updateKey, validateArchive, validateUpdate,
} from "./watch/news-rules.mjs";
import { apiAuth, draftRow } from "./watch/claude-writer.mjs";

const ROOT = join(import.meta.dirname, "..");
const STATE_FILE = join(import.meta.dirname, "watch", "news-state.json");
const REVIEW_FILE = join(import.meta.dirname, "watch", "news-review.json");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
/** Accepts both --name=value and --name value: the CI workflow quotes a
 *  path with a space-separated flag, and a parser that silently misses
 *  it sends the run hunting for a default file that is not there. */
const opt = (name, fallback) => {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};

const dryRun = flag("dry-run");
const push = flag("push");
const leadsPath = opt("leads", join(import.meta.dirname, "web-sweep-results.json"));
const MAX_PAGES = Number(opt("max-pages", 40));
const MAX_CALLS = Number(opt("max-calls", 16));
const MAX_WRITES = Number(opt("max-writes", 10));

const say = (line = "") => console.log(line);
const git = (...rest) => execFileSync("git", rest, { cwd: ROOT, encoding: "utf8" }).trim();
const node = (script) => execFileSync(process.execPath, [script], { cwd: ROOT, stdio: "inherit" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toISOString().slice(0, 10);

/*
 * Refuse to run over uncommitted tracked changes, which the restore step
 * could not put back. Untracked files are fine - the leads file itself
 * often sits untracked beside the repo.
 */
if (!dryRun && git("status", "--porcelain", "--untracked-files=no")) {
  say("Tracked files carry uncommitted changes; commit or stash them first.");
  process.exit(1);
}

if (!existsSync(leadsPath)) {
  say(`No leads file at ${leadsPath}. Run scripts/web-sweep.py first.`);
  process.exit(1);
}
const leads = JSON.parse(readFileSync(leadsPath, "utf8")).leads ?? [];

const state = existsSync(STATE_FILE)
  ? JSON.parse(readFileSync(STATE_FILE, "utf8"))
  : { seen: {} };
const previousReview = existsSync(REVIEW_FILE)
  ? JSON.parse(readFileSync(REVIEW_FILE, "utf8"))
  : { items: [] };
const firstSeen = new Map(previousReview.items.map((i) => [i.url, i.firstSeen]));

const webUpdates = readData("web-updates.json");
const archive = readData("coverage-archive.json");
const knownUrls = new Set([
  ...webUpdates.updates.map((u) => u.sourceUrl),
  ...archive.items.map((i) => i.url),
]);
const knownKeys = new Set(webUpdates.updates.map(updateKey));

const auth = apiAuth();
if (!auth) say("No writing key (ANTHROPIC_API_KEY or OPENROUTER_API_KEY): leads will be opened and queued, nothing written.\n");
else if (auth.provider === "openrouter") say(`Writing with OpenRouter model ${auth.model}.\n`);

/*
 * Salient stories first, so the per-run caps never crowd out a major
 * development; then direct publisher links - they can be read now -
 * before Google's redirect links; newest first within each band.
 */
const candidates = leads
  .filter((l) => l.url?.startsWith("https://") && !knownUrls.has(l.url) && !state.seen[l.url])
  .sort((a, b) => {
    const aSalient = SALIENT.test(a.title ?? "") ? 0 : 1;
    const bSalient = SALIENT.test(b.title ?? "") ? 0 : 1;
    const aGoogle = a.url.includes("news.google.com") ? 1 : 0;
    const bGoogle = b.url.includes("news.google.com") ? 1 : 0;
    return (
      aSalient - bSalient ||
      aGoogle - bGoogle ||
      String(b.date ?? "").localeCompare(String(a.date ?? ""))
    );
  });

say(`${leads.length} lead(s), ${candidates.length} unseen.`);

const review = [];
const wroteUpdates = [];
const wroteArchive = [];
let pagesOpened = 0;
let callsMade = 0;
let rejected = 0;
let errors = 0;

const queue = (lead, status, extra = {}) => {
  review.push({
    url: lead.url, title: lead.title, publisher: lead.publisher || null,
    date: lead.date || null, status,
    firstSeen: firstSeen.get(lead.url) ?? today,
    ...extra,
  });
};
/** Leads awaiting only a key are left unseen so a keyed run picks them up. */
const markSeen = (lead, outcome) => { state.seen[lead.url] = { on: today, outcome }; };

for (const lead of candidates) {
  if (pagesOpened >= MAX_PAGES) break;
  if (wroteUpdates.length + wroteArchive.length >= MAX_WRITES) break;

  try {
    pagesOpened += 1;
    let res = await get(lead.url, { accept: "text/html" });
    let finalUrl = res.url;

    if (new URL(finalUrl).hostname.endsWith("news.google.com")) {
      const target = res.ok && extractPublisherLink(res.text());
      if (!target) {
        queue(lead, "google-redirect");
        markSeen(lead, "google-redirect");
        continue;
      }
      if (knownUrls.has(target) || state.seen[target]) {
        markSeen(lead, "already-carried");
        continue;
      }
      res = await get(target, { accept: "text/html" });
      finalUrl = res.url;
    }

    if (!res.ok) {
      queue(lead, "unopened", { httpStatus: res.status });
      markSeen(lead, `http-${res.status}`);
      continue;
    }
    if (!finalUrl.startsWith("https://")) {
      markSeen(lead, "not-https");
      continue;
    }

    const html = res.text();
    const pageTitle = htmlTitle(html);
    const pageText = htmlToText(html).slice(0, 7000);
    if (!relevant(`${pageTitle}\n${pageText}`)) {
      markSeen(lead, "irrelevant-page");
      continue;
    }

    if (!auth) {
      queue(lead, "awaiting-writer", { resolvedUrl: finalUrl });
      continue;
    }
    if (callsMade >= MAX_CALLS) break;

    callsMade += 1;
    const nearest = nearestRows(`${lead.title}\n${pageTitle}\n${pageText.slice(0, 1500)}`, webUpdates.updates);
    const draft = await draftRow({ lead, pageTitle, pageText, nearest, today, auth });

    if (draft.decision === "update" && draft.update) {
      const row = { ...draft.update, sourceUrl: finalUrl, openedDirectly: true };
      const problems = validateUpdate(row, { existingKeys: knownKeys, today });
      if (problems.length) {
        rejected += 1;
        queue(lead, "rejected", { problems, resolvedUrl: finalUrl });
        markSeen(lead, "rejected");
      } else {
        webUpdates.updates.unshift(row);
        knownKeys.add(updateKey(row));
        knownUrls.add(finalUrl);
        wroteUpdates.push({ actor: row.actor, sourceName: row.sourceName, url: finalUrl });
        markSeen(lead, "written-update");
        say(`  + update   ${row.actor}  (${row.sourceName})`);
      }
    } else if (draft.decision === "archive" && draft.archive) {
      const item = { id: nextArchiveId(archive.items), ...draft.archive, url: finalUrl };
      const problems = validateArchive(item, { existingUrls: knownUrls, today });
      if (problems.length) {
        rejected += 1;
        queue(lead, "rejected", { problems, resolvedUrl: finalUrl });
        markSeen(lead, "rejected");
      } else {
        archive.items.push(item);
        knownUrls.add(finalUrl);
        wroteArchive.push({ title: item.title, url: finalUrl });
        markSeen(lead, "written-archive");
        say(`  + archive  ${item.title.slice(0, 70)}`);
      }
    } else {
      markSeen(lead, `skip: ${draft.reason.slice(0, 80)}`);
      say(`  - skip     ${lead.title.slice(0, 60)}  (${draft.reason.slice(0, 60)})`);
    }
    await sleep(400);
  } catch (err) {
    errors += 1;
    const detail = String(err?.message ?? err);
    queue(lead, "error", { detail: detail.slice(0, 200) });
    say(`  ! error    ${lead.title.slice(0, 60)}: ${detail}`);
    if (/API 40[13]/.test(detail)) {
      say("The API refused the credentials; no further writing calls this run.");
      break;
    }
  }
}

/* ---- report --------------------------------------------------------- */

const summaryLines = [
  `Opened ${pagesOpened} page(s), ${callsMade} writing call(s).`,
  `Wrote ${wroteUpdates.length} reported update(s) and ${wroteArchive.length} archive row(s).`,
  ...wroteUpdates.map((w) => `  update: ${w.actor} (${w.sourceName}) ${w.url}`),
  ...wroteArchive.map((w) => `  archive: ${w.title.slice(0, 80)} ${w.url}`),
  review.length ? `${review.length} lead(s) queued for a human read (news-review.json):` : "Nothing queued.",
  ...review.slice(0, 20).map((r) => `  ${r.status}: ${String(r.title).slice(0, 80)}`),
];
say(`\n${summaryLines.join("\n")}\n`);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Open-web sweep\n\n${summaryLines.map((l) => (l.startsWith("  ") ? `- ${l.trim()}` : l)).join("\n")}\n`,
    "utf8",
  );
}

if (dryRun) {
  say("Dry run: nothing was written to disk.");
  process.exit(0);
}

const wroteAnything = wroteUpdates.length + wroteArchive.length > 0;

if (wroteAnything) {
  if (wroteUpdates.length) {
    webUpdates.gatheredOn = today;
    writeData("web-updates.json", webUpdates);
  }
  if (wroteArchive.length) {
    archive.compiled = today;
    writeData("coverage-archive.json", archive);
  }

  /* ---- rebuild and test - the same gate auto-update.mjs trusts ------ */
  const restore = () => git("checkout", "--", "src/data", "public");
  try {
    say("Rebuilding derived files...");
    node("scripts/build-projections.mjs");
    node("scripts/build-search-index.mjs");
  } catch {
    restore();
    say("A derived build failed. The tree has been restored and nothing was published.");
    process.exit(20);
  }
  try {
    say("Running the test suite...");
    execFileSync(process.execPath, [join("node_modules", "vitest", "vitest.mjs"), "run"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    restore();
    say("The test suite rejected the batch. The tree has been restored and nothing");
    say("was published. The drafts, for a human to carry through by hand:");
    for (const w of [...wroteUpdates, ...wroteArchive]) say(`  ${w.url}`);
    process.exit(20);
  }
}

/*
 * State and queue advance only past the gate, so a rejected batch is
 * re-attempted rather than remembered as done.
 */
writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n", "utf8");
writeFileSync(
  REVIEW_FILE,
  JSON.stringify({ updatedOn: today, items: review }, null, 2) + "\n",
  "utf8",
);

/*
 * The state and queue files are committed even on a run that wrote no
 * rows: what a run decided to skip is exactly what the next run must not
 * pay to decide again, and on a CI runner an uncommitted file is gone.
 */
if (wroteAnything) {
  git("add", "src/data", "public", "scripts/watch/news-state.json", "scripts/watch/news-review.json");
} else {
  git("add", "scripts/watch/news-state.json", "scripts/watch/news-review.json");
}
if (git("diff", "--cached", "--name-only")) {
  const summary = wroteAnything
    ? `reported: ${wroteUpdates.length} update(s), ${wroteArchive.length} archive row(s) from the open web`
    : "reported: sweep state advanced, nothing written";
  const body = [
    ...wroteUpdates.map((w) => `${w.actor} (${w.sourceName})\n${w.url}`),
    ...wroteArchive.map((w) => `archive: ${w.title}\n${w.url}`),
  ].join("\n\n");
  git("commit", "-m", summary, ...(body ? ["-m", body] : []));
  say(`Committed ${git("rev-parse", "--short", "HEAD")}.`);
  if (push) {
    git("push");
    say("Pushed. The host builds from the new commit.");
  } else {
    say("Not pushed (pass --push).");
  }
} else {
  say("Nothing moved.");
}

if (rejected > 0) process.exit(10);
process.exit(errors > 0 && !wroteAnything && review.length === 0 ? 1 : 0);
