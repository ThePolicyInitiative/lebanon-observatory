# Keeping the figures current

The site's figures are traced: each one names a reporter, a period and a
citation. That is the property automation has to preserve, and it is the
reason the pipeline is shaped the way it is - it automates *detecting*
that a source moved, *reading* the number out of it, *checking* the
number against arithmetic the source itself provides, and *publishing*
only if the whole site still agrees with itself afterwards.

Nothing here invents a figure, and nothing rewrites analysis.

## The three layers

**Already live, no rebuild.** `/api/news` and `/api/news/volume` read
GDELT, ReliefWeb and five RSS feeds server-side on a 5-30 minute cache.
The reported-coverage page changes on its own. See `docs/news-providers.md`.

**Watched and read.** `scripts/watch/registry.mjs` lists the sources that
carry the analytical figures. A source is one of two tiers:

- `auto` - the figure is published in a machine-readable form, so the
  registry declares an extractor, guards, and the exact fields the
  reading owns. Today: the World Bank's quarterly Implementation Status
  and Results Report for the LEAP project, which prints the disbursement
  table the finance pages are built on.
- `alert` - the source is watched for change and reported to a human,
  and writes nothing. Today: the project's other World Bank documents
  (procurement plans, agreements) and the ReliefWeb Lebanon feed.

**Swept and drafted.** The open-web sweep (below) collects news leads from
free feeds, opens them, and - key permitting - drafts reported-layer rows
from what the pages actually say. It writes only the reported layer and
the long-form archive, which state on their faces that nothing in them
enters any count, matrix or map.

**Published.** A push to the default branch builds and deploys.

## Commands

```bash
npm run watch:sources          # what the sources say; changes nothing
npm run auto-update -- --dry-run
npm run auto-update            # write, rebuild, test, commit
npm run auto-update -- --push  # ...and publish
```

`--only=leap-isr` restricts a run to one source.

## What a run does

1. **Discover.** Ask each source what its current document is, and
   compare it with `scripts/watch/state.json`, which records what the
   last run published. Unchanged sources stop here and cost one request.
2. **Read.** Download the new document and extract its numbers.
3. **Check.** Reject a reading that fails its guards.
4. **Write.** Apply the plan: the exact JSON fields the registry
   declares machine-owned, plus the `accessedDate` of the citation.
5. **Rebuild.** `build-projections.mjs`, then `build-search-index.mjs` -
   both derived layers, in that order.
6. **Test.** The full vitest suite.
7. **Publish.** Commit and push, so the host builds.

If step 5, 6 or 7 fails, the tree is restored to exactly what it was and
nothing is published.

Exit codes: `0` nothing moved or a change was published; `10` a source
needs a human read; `20` a change was written and the tests rejected it;
`1` the run could not complete.

## Why the World Bank report can be read mechanically

The ISR prints the loan's finances as a table. Text extraction drops the
spacing, so the row arrives as one run of digits:

```
IBRD-98410Effective250.00250.000.004.13245.880.00 1.65%
```

Six amounts in millions - original, revised, cancelled, disbursed,
undisbursed, historically disbursed - then the share. `parseIsrDisbursement`
requires exactly six, so a column added or removed upstream fails to
parse rather than shifting every field one place and quietly turning
"disbursed" into "cancelled".

Then the guards, which are mostly the report checking itself:

- disbursed + undisbursed + cancelled must reconcile to the revised loan
- the printed share must follow from the printed amounts
- disbursed cannot exceed the loan, or be negative
- cumulative disbursement cannot fall unless a cancellation explains it
- the report's sequence number cannot go backwards

A mis-parse fails at least two of these. A reading that fails any of them
is reported as `suspect`, is never written, and is re-read on every
subsequent run until it passes or the extractor is fixed - there is no
state to clear by hand.

Note that the reports are found through **version 3** of the document
search API. Version 2 answers 200 for the same project and returns four
documents from appraisal in 2025, with no status report in its index at
all; a watcher built on it would have reported "nothing has moved"
indefinitely.

## The boundary: machine-owned and human-owned

`plan()` in the registry names every field a reading may write - amounts,
shares, dates, the citation's title and url. **Everything else is
human-owned and is never touched**: definitions, caveats, and every
sentence that says what a figure means or what has not happened. No
reading of a table can tell you whether a claim about it is still true.

Which leaves the gap that decides whether this is safe. The disbursement
figure is currently hand-written into roughly thirty sentences, alt texts
and chart captions across both languages. A run that moved the data and
left those alone would publish a page that contradicts itself.

`tests/money-figures.test.ts` closes it. Every disbursement figure in the
copy is checked against the finance data it describes - by derivation,
not by pinned wording - so when a new report moves the amount, the suite
fails, the tree is restored, and the run exits 20 with the new figures
printed for a human to carry across. **The pipeline stops rather than
shipping a contradiction.**

That is a working fail-safe, not the finished state. Until the copy reads
its figures from the data instead of carrying them by hand, a genuinely
new disbursement figure will halt the pipeline rather than flow through
it. De-hardcoding those call sites is what turns "detected and prepared"
into "published without a human", and it is the next piece of work.

## The open-web sweep

`.github/workflows/news-sweep.yml`, twice daily; the same pipeline runs
locally:

```bash
python scripts/web-sweep.py --days 7        # collect leads (free feeds, keyless)
node scripts/news-ingest.mjs --dry-run      # open, judge, report; write nothing
node scripts/news-ingest.mjs                # write, rebuild, test, commit
node scripts/news-ingest.mjs --push         # ...and publish
```

The site's method says an item joins the reported layer only after its
page has been opened and read. The pipeline enforces that literally, in
stages, and every stage can only shrink what the next one sees:

1. **Collect.** `web-sweep.py` queries Google News RSS in English, Arabic
   and French, ReliefWeb's Lebanon RSS, UN News and (gently) GDELT, and
   filters titles for country + reconstruction theme.
2. **Open.** `news-ingest.mjs` fetches each unseen lead over
   `scripts/watch/http.mjs`. A Google redirect page is followed only when
   it names exactly one outside address; otherwise the lead is queued. A
   page that will not open is queued.
3. **Read.** The page's own text must pass the same country + theme gate,
   or the lead is dropped before it costs anything.
4. **Draft.** A model (`scripts/watch/claude-writer.mjs`) is shown the
   page text, the site's writing rules, and the nearest existing rows,
   and answers in a fixed JSON shape: one reported update, one archive
   item, or a refusal with a reason. With `ANTHROPIC_API_KEY` set that is
   a Claude model with the schema enforced by the API; with
   `OPENROUTER_API_KEY` set instead, it is a free OpenRouter model
   (`OPENROUTER_MODEL`, falling back to the free auto-router when the
   configured model has been rotated out) with the shape spelled out in
   the prompt - free models fail the checks in step 5 more often, and
   those drafts queue rather than publish, so the free tier trades
   throughput, never quality. The model never controls a URL -
   `sourceUrl`, `id` and `openedDirectly` are set by the pipeline from
   what it actually fetched. With no key at all, opened leads queue
   instead.
5. **Check.** `scripts/watch/news-rules.mjs` re-validates every field
   mechanically: the banned vocabulary in both languages (imported from
   `tests/vocab-patterns.ts`, the same module the guard suites read, never
   copied), em/en dashes, date-as-limit phrasing, enum fields, date
   shapes, bilingual parity of the optional fields, caution floors, and
   the same actor-and-action dedupe key `duplication.test.ts` enforces
   (shared via `scripts/watch/content-key.mjs`). A draft that fails any of
   it is queued with its problems, and the run reports exit 10.
6. **Gate and publish.** Exactly as the figures pipeline: rebuild both
   derived layers, run the whole vitest suite, restore the tree on any
   failure, otherwise commit and push. The two workflows share one
   concurrency group so their pushes never interleave.

What the machine cannot settle lands in `scripts/watch/news-review.json`
(committed, so the queue survives the runner), and
`scripts/watch/news-state.json` remembers every judged lead so no run
pays twice for the same page. Cost and load are bounded per run:
`--max-pages` (40), `--max-calls` (16 writing calls), `--max-writes`
(10 rows).

Exit codes match `auto-update.mjs`: `0` nothing to write or published;
`10` a draft needs a human look; `20` the suite rejected the batch and
the tree was restored; `1` the run could not complete.

## Adding a source

In `scripts/watch/registry.mjs`:

```js
{
  id: "...",
  label: "...",
  sourceId: "S…",          // its entry in report-sources.json, or null
  tier: "auto",            // or "alert", and then only discover() is needed
  discover: async () => ({ url, issuedOn, guid }),
  read: async (doc) => ({ …numbers }),
  check: (reading, previous) => ({ ok, problems }),
  plan: (reading, doc) => [{ file, path, value }],
  docIdentity: (doc) => `${doc.issuedOn}:${doc.guid}`,
  describeDoc: (doc) => "…",
  describeReading: (r) => "…",
}
```

A `path` is a list of steps into the JSON: a string or number is a key or
an index, an object matches an array element by its fields, so
`["funnel", { id: "disbursed" }, "amountUsd"]` reads as "the funnel step
whose id is disbursed, its amount". Matching by id rather than by index
means the data file can be reordered without repointing a write. A path
that matches nothing, or more than one element, is an error.

Then add cases to `tests/automation.test.ts` against a fixture of the
real document, kept in `tests/fixtures/`. The suite runs offline on
purpose: one that reached the network would fail on a plane and pass on a
bad parse.

Use `node:https`, not `fetch` - undici's pooling is blocked by the
network filtering this project is developed behind. `scripts/watch/http.mjs`
already handles redirects, deadlines, size caps and retries.

## What cannot be automated, and why

Most of the site's other figures are published as prose in a PDF or a
press release - a ministry's death toll, a cabinet decision, a damage
assessment. There is no mechanical reading of "roughly 4,300 people" that
is safe to publish unattended **as a confirmed figure**, so those sources
sit in the `alert` tier: the pipeline tells a human that the source
moved, and a human turns prose into a traced figure. That division is the
limit of the sources, not of the tooling.

The open-web sweep does not cross that line. What it writes are
reported-layer rows - attributed claims that enter no count, matrix or
map - and even those pass a mechanical validator and the whole test suite
before they publish. A new number in the news changes what the reported
layer carries and what its own tallies say; it never changes a confirmed
figure. Those still move only through the watched-source registry or a
human read.

The ReliefWeb JSON API is also unavailable: it refuses any request
without an application name it has approved, and this project has none
(`RELIEFWEB_APP_NAME` in `.env.example`). The watcher reads its RSS feed
instead, which is keyless and carries the same headlines.
