"""Collect traceable metadata from the Observatory's registered primary sources.

The collector intentionally stores page metadata rather than copying article bodies. It is
safe to run repeatedly: each run replaces the generated JSON snapshot and records HTTP
or parsing failures beside successful results. The website uses this snapshot as an
additional transparency signal, while its editorial summaries remain in data.js.

Usage:
    python scripts/scrape_official_sources.py
    python scripts/scrape_official_sources.py --scope core
    python scripts/scrape_official_sources.py --timeout 25 --output data/source-snapshots.json
"""

from __future__ import annotations

import argparse
import concurrent.futures
import html
import json
import re
import ssl
import threading
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "data" / "source-snapshots.json"
DATA_FILE = ROOT / "data.js"
USER_AGENT = "Lebanon-Reconstruction-Observatory/1.0 (+metadata-monitor; contact: local-observatory)"
MAX_BYTES = 1_500_000
MAX_WORKERS = 3
HOST_DELAY_SECONDS = 0.35

# A compact diagnostic subset. The default run below derives the complete target list
# from the public source register in data.js, so a page is never monitored without a
# matching public citation in the Observatory.
CORE_TARGETS = [
    {"label": "World Bank — national RDNA", "url": "https://www.worldbank.org/en/news/press-release/2025/03/07/lebanon-s-recovery-and-reconstruction-needs-estimated-at-us-11-billion"},
    {"label": "World Bank — LEAP factsheet", "url": "https://www.worldbank.org/en/news/factsheet/2026/02/17/lebanon-emergency-assistance-project-frequently-asked-questions"},
    {"label": "World Bank — Lebanon Economic Monitor", "url": "https://www.worldbank.org/en/news/press-release/2026/08/21/renewed-conflict-derails-lebanon-s-fragile-economic-recovery"},
    {"label": "UN Lebanon — Lebanon Response Plan", "url": "https://lebanon.un.org/en/309523-lebanon-response-plan-2026"},
    {"label": "UNDP — recovery program index", "url": "https://www.undp.org/lebanon/projects"},
    {"label": "UNDP — socioeconomic impacts assessment", "url": "https://www.undp.org/lebanon/press-releases/un-calls-urgent-recovery-prevent-prolonged-crisis-lebanon"},
    {"label": "UNDP — Beirut and Mount Lebanon damage assessment", "url": "https://www.undp.org/arab-states/press-releases/rapid-damage-assessment-estimates-over-us365-million-building-damage-across-beirut-and-mount-lebanon"},
    {"label": "UNDP — South Lebanon damage assessment", "url": "https://www.undp.org/lebanon/press-releases/building-damage-assessment-estimates-over-usd-138-billion-across-south-lebanon-until-april-2026"},
    {"label": "UNDP — MSME and cooperative grants", "url": "https://www.undp.org/lebanon/grants-msmes-and-cooperatives-affected-2026-war"},
    {"label": "UNDP — solar public-services partnership", "url": "https://www.undp.org/lebanon/press-releases/undp-and-kuwait-fund-sign-us3-million-partnership-strengthen-public-services-lebanon"},
    {"label": "UNDP — local authorities impact assessment", "url": "https://www.undp.org/lebanon/publications/crisis-recovery-local-authorities-confronting-post-war-realities-lebanon-rapid-impact-assessment"},
    {"label": "UNDP — response operations update", "url": "https://www.undp.org/lebanon/press-releases/lebanon-faces-perfect-storm-undp-warns-compounded-crisis-while-supporting-national-response"},
    {"label": "UNICEF — school recovery update", "url": "https://www.unicef.org/lebanon/press-releases/least%E2%80%AF100000-children%E2%80%AF-risk-missing-next-school-year-without-urgent-action-restore"},
    {"label": "World Bank — LEAP implementation schedule", "url": "https://documents1.worldbank.org/curated/en/099092325113021010/pdf/P509428-0fd29ca4-40c0-4950-83a7-5d5a4a805e23.pdf"},
    {"label": "UNDP — community-led municipal preparedness", "url": "https://www.undp.org/lebanon/stories/how-communities-across-lebanon-are-building-stronger-local-solutions"},
    {"label": "UNDP — mine action and safe recovery", "url": "https://www.undp.org/lebanon/projects/mine-action"},
    {"label": "UNDP — EU, LAF and southern community recovery", "url": "https://www.undp.org/lebanon/press-releases/new-eu125m-project-support-lebanese-armed-forces"},
    {"label": "FAO — South Lebanon agrifood recovery", "url": "https://www.fao.org/lebanon/news/detail/ministry-of-agriculture-and-fao-launch-japan-funded-project-to-enhance-recovery-and-resilience-of-agrifood-systems-and-rural-livelihoods-in-conflict-affected-areas-of-south-lebanon/en"},
    {"label": "UNICEF — community protection and outreach", "url": "https://www.unicef.org/lebanon/children-caught-escalating-violence-lebanon"},
    {"label": "UNHCR — community-based protection", "url": "https://www.unhcr.org/lb/what-we-do/protection"},
    {"label": "UN-Habitat — urban recovery framework", "url": "https://unhabitat.org/urban-crisis-response-recovery-and-reconstruction-framework-for-lebanon-urfl"},
    {"label": "UNOPS — Beirut municipal emergency operations", "url": "https://www.unops.org/news-and-stories/stories/on-the-ground-in-lebanon-providing-urgent-relief-and-community-support"},
    {"label": "UN Women — women-led humanitarian response", "url": "https://open.unwomen.org/en/country-results/LB"},
    {"label": "UNFPA — protection and reproductive health response", "url": "https://www.unfpa.org/resources/situation-report-crisis-lebanon-9-22-june-2026"},
    {"label": "WHO — health emergency support", "url": "https://www.emro.who.int/images/stories/lebanon/Lebanon-Emergency-Sitrep-22-2026.pdf"},
    {"label": "ICRC — escalation response", "url": "https://www.icrc.org/sites/default/files/2026-04/AR---26-March---Response-to-the-Escalation-of-Armed-Conflict-in-Lebanon-March-2026_0.pdf"},
    {"label": "MSF — mobile medical response", "url": "https://www.msf.org/msf-scales-response-lebanon-displacement-rises"},
    {"label": "Anera — public hospital medicines support", "url": "https://www.anera.org/stories/supporting-lebanons-hospitals-with-medicines-during-a-time-of-crisis/"},
    {"label": "Save the Children — child-focused response", "url": "https://www.savethechildren.net/what-we-do/emergencies/lebanon-crisis"},
    {"label": "NRC — reconstruction law legal brief", "url": "https://www.nrc.no/resources/briefing-notes/legal-brief-on-law-no.-222025-the-reconstruction-law"},
]


def registered_source_targets() -> list[dict[str, str]]:
    """Read all public source records from data.js without executing its JavaScript.

    The sources registry deliberately uses one-line object literals. Parsing that
    bounded array rather than the entire application keeps this collector limited to
    URLs the site already presents to visitors.
    """
    raw = DATA_FILE.read_text(encoding="utf-8")
    block_match = re.search(r"^\s*sources:\s*\[(?P<body>[\s\S]*?)^\s*\]\s*\n};", raw, re.MULTILINE)
    if not block_match:
        raise RuntimeError("Could not locate the public sources registry in data.js")

    targets: list[dict[str, str]] = []
    source_object_pattern = re.compile(r"\{\s*id:\s*\"(?P<id>[^\"]+)\"(?P<body>[\s\S]*?)\}")

    def field(body: str, name: str) -> str | None:
        match = re.search(rf"\b{name}:\s*\"(?P<value>[^\"]+)\"", body)
        return match.group("value") if match else None

    for match in source_object_pattern.finditer(block_match.group("body")):
        body = match.group(0)
        name = field(body, "name")
        publisher = field(body, "publisher")
        href = field(body, "href")
        if not (name and publisher and href):
            continue
        targets.append({"label": f"{publisher} — {name}", "url": href})

    if not targets:
        raise RuntimeError("No public source URLs were parsed from data.js")
    return targets


def merge_targets(*collections: list[dict[str, str]]) -> list[dict[str, str]]:
    """Deduplicate source targets by URL while retaining their public labels."""
    merged: dict[str, dict[str, str]] = {}
    for collection in collections:
        for target in collection:
            merged.setdefault(target["url"], target)
    return list(merged.values())


class PageMetadataParser(HTMLParser):
    """Extract title and selected Open Graph / article metadata without article scraping."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.title_parts: list[str] = []
        self.in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): (value or "") for key, value in attrs}
        if tag.lower() == "title":
            self.in_title = True
        if tag.lower() != "meta":
            return
        key = (attributes.get("property") or attributes.get("name") or attributes.get("itemprop") or "").lower()
        value = attributes.get("content", "")
        if key and value:
            self.meta.setdefault(key, value)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)


def clean_text(value: str | None, limit: int | None = None) -> str | None:
    if not value:
        return None
    cleaned = re.sub(r"\s+", " ", html.unescape(value)).strip()
    if limit and len(cleaned) > limit:
        return f"{cleaned[: limit - 1].rstrip()}…"
    return cleaned or None


def parse_metadata(document: str) -> dict[str, str | None]:
    parser = PageMetadataParser()
    parser.feed(document)
    parser.close()
    title = parser.meta.get("og:title") or parser.meta.get("twitter:title") or " ".join(parser.title_parts)
    description = parser.meta.get("og:description") or parser.meta.get("description") or parser.meta.get("twitter:description")
    published = (
        parser.meta.get("article:published_time")
        or parser.meta.get("date")
        or parser.meta.get("datepublished")
        or parser.meta.get("datecreated")
    )
    updated = parser.meta.get("article:modified_time") or parser.meta.get("og:updated_time") or parser.meta.get("datemodified")
    return {
        "pageTitle": clean_text(title, 220),
        "description": clean_text(description, 360),
        "publishedAt": clean_text(published, 80),
        "updatedAt": clean_text(updated, 80),
    }


host_locks: dict[str, threading.Lock] = {}
host_last_request: dict[str, float] = {}
host_locks_guard = threading.Lock()


def wait_for_host(url: str) -> None:
    """Keep requests modest when several monitored pages share a publisher."""
    host = urlparse(url).netloc.lower()
    with host_locks_guard:
        lock = host_locks.setdefault(host, threading.Lock())
    with lock:
        pause = HOST_DELAY_SECONDS - (time.monotonic() - host_last_request.get(host, 0.0))
        if pause > 0:
            time.sleep(pause)
        host_last_request[host] = time.monotonic()


def fetch_target(target: dict[str, str], timeout: int, context: ssl.SSLContext) -> dict[str, Any]:
    started = time.monotonic()
    checked_at = datetime.now(timezone.utc).isoformat()
    result: dict[str, Any] = {"label": target["label"], "url": target["url"], "checkedAt": checked_at}
    try:
        wait_for_host(target["url"])
        request = Request(
            target["url"],
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
                "Accept-Language": "en-US,en;q=0.8",
            },
        )
        with urlopen(request, timeout=timeout, context=context) as response:
            content_type = response.headers.get_content_type()
            charset = response.headers.get_content_charset() or "utf-8"
            payload = response.read(MAX_BYTES + 1)
            truncated = len(payload) > MAX_BYTES
            if truncated:
                payload = payload[:MAX_BYTES]
            result.update({
                "state": "reachable",
                "status": response.status,
                "contentType": content_type,
                "finalUrl": response.geturl(),
                "truncated": truncated,
            })
            if content_type in {"text/html", "application/xhtml+xml"}:
                result.update(parse_metadata(payload.decode(charset, errors="replace")))
    except HTTPError as error:
        result.update({"state": "response-error", "status": error.code, "error": f"HTTP {error.code}"})
    except URLError as error:
        result.update({"state": "unreachable", "error": str(error.reason)})
    except TimeoutError:
        result.update({"state": "timeout", "error": "Request timed out"})
    except Exception as error:  # Surface unexpected failures in the generated snapshot.
        result.update({"state": "unreachable", "error": type(error).__name__})
    result["durationMs"] = round((time.monotonic() - started) * 1000)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape metadata from official Observatory sources.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Generated JSON snapshot path")
    parser.add_argument("--timeout", type=int, default=20, help="Per-request timeout in seconds")
    parser.add_argument(
        "--scope",
        choices=("registered", "core"),
        default="registered",
        help="Use every public source registered in data.js or the compact diagnostic subset",
    )
    args = parser.parse_args()
    ssl_context = ssl.create_default_context()
    targets = CORE_TARGETS if args.scope == "core" else merge_targets(registered_source_targets(), CORE_TARGETS)

    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(fetch_target, target, args.timeout, ssl_context) for target in targets]
        results = [future.result() for future in futures]

    results.sort(key=lambda item: item["label"])
    summary = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "collector": "scripts/scrape_official_sources.py",
        "targetCount": len(results),
        "reachableCount": sum(item.get("state") == "reachable" for item in results),
        "targets": results,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.output} — {summary['reachableCount']}/{summary['targetCount']} pages reachable")
    return 0 if summary["reachableCount"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
