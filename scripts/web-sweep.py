#!/usr/bin/env python3
"""Sweep the open web for material on Lebanon's post-war reconstruction.

This is the collection step of the methodology, as a runnable script: it
queries free, keyless feeds - Google News RSS in English, Arabic and
French, ReliefWeb's RSS, UN News RSS and (gently) the GDELT document
API - filters what comes back for relevance, dedupes it, and writes one
JSON of leads plus a readable summary.

Everything it returns is a LEAD, not an entry: per the site's method, an
item joins the tracking only after the underlying page has been opened
and read. The script therefore never touches src/data - it hands its
findings to a human (or a later pipeline step) instead.

Usage:
    python scripts/web-sweep.py [--days 120] [--out path.json] [--max-per-query 25]

Notes for this machine (see docs/automation.md): ReliefWeb's JSON API
answers 403 without a registered appname, but its RSS works keylessly;
GDELT rate-limits per IP quickly, so it gets one query and a shrug on
failure; Node's fetch cannot open TLS here but Python's stdlib can.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

# The Windows console defaults to cp1252, which cannot print the Arabic
# half of the query battery; the JSON output was always UTF-8, this makes
# the progress lines match it.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

UA = {"User-Agent": "LebanonObservatoryResearch/1.0 (policy research; contact via site)"}

# ---------------------------------------------------------------------------
# What to ask for. One battery, three languages, angles matching the site's
# four actor groups and four action categories.
# ---------------------------------------------------------------------------

QUERIES_EN = [
    "Lebanon reconstruction",
    "Lebanon Emergency Assistance Project LEAP",
    "Lebanon World Bank reconstruction loan disbursement",
    "CDR Lebanon tender roads rubble",
    "Council of the South Lebanon compensation",
    "south Lebanon rubble removal debris",
    "Lebanon war damage assessment",
    "Lebanon shelter displaced return south",
    "Lebanon municipality rebuild village",
    "Lebanon school hospital rehabilitation war",
    "Lebanon diaspora rebuild campaign",
    "Hezbollah compensation reconstruction payments",
]

QUERIES_AR = [
    "إعادة إعمار لبنان",
    "مجلس الجنوب تعويضات",
    "رفع الأنقاض الجنوب",
    "مشروع المساعدة الطارئة للبنان",
    "مجلس الإنماء والإعمار مناقصة",
    "ترميم مدارس الجنوب",
    "الضاحية الجنوبية ترميم",
    "بعلبك الهرمل أضرار إعمار",
    "بلدية الجنوب إعمار",
    "تعويضات متضرري الحرب لبنان",
]

QUERIES_FR = [
    "Liban reconstruction sud",
    "Liban Banque mondiale reconstruction",
]

# A hit must name the country and touch at least one reconstruction theme.
COUNTRY = re.compile(r"lebanon|liban|لبنان|اللبناني", re.IGNORECASE)
THEMES = re.compile(
    "|".join(
        [
            "reconstruct", "rebuild", "rubble", "debris", "compensat",
            "shelter", "displac", "damage", "recovery", "tender",
            "procurement", "restoration", "rehabilitat", "return",
            "إعمار", "ترميم", "أنقاض", "ركام", "تعويض", "إيواء", "نزوح",
            "أضرار", "تأهيل", "عودة", "مناقصة", "إغاثة",
            "reconstruction", "décombres", "indemnis",
        ]
    ),
    re.IGNORECASE,
)


def fetch(url: str, timeout: int = 25) -> bytes | None:
    """One GET with a real User-Agent, one retry, and no exception surface."""
    for attempt in (1, 2):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if attempt == 2:
                print(f"  ! gave up on {url.split('?')[0]}: {e}", file=sys.stderr)
                return None
            time.sleep(2)
    return None


def text_of(el: ET.Element | None) -> str:
    return (el.text or "").strip() if el is not None else ""


def parse_rss(raw: bytes) -> list[dict]:
    """RSS 2.0 and Atom, tolerantly. Returns title/url/date/source dicts."""
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return []
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items = []
    for it in root.iter("item"):  # RSS 2.0
        link = text_of(it.find("link"))
        src = it.find("source")
        items.append(
            {
                "title": text_of(it.find("title")),
                "url": link,
                "date": text_of(it.find("pubDate")),
                "source": text_of(src) if src is not None else "",
            }
        )
    for it in root.iter("{http://www.w3.org/2005/Atom}entry"):  # Atom
        link_el = it.find("atom:link", ns)
        items.append(
            {
                "title": text_of(it.find("atom:title", ns)),
                "url": link_el.get("href", "") if link_el is not None else "",
                "date": text_of(it.find("atom:updated", ns)),
                "source": "",
            }
        )
    return items


def when(datestr: str) -> datetime | None:
    if not datestr:
        return None
    try:
        return parsedate_to_datetime(datestr).astimezone(timezone.utc)
    except (ValueError, TypeError):
        pass
    try:
        return datetime.fromisoformat(datestr.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def google_news(query: str, lang: str) -> list[dict]:
    locale = {
        "en": "hl=en-US&gl=US&ceid=US:en",
        "ar": "hl=ar&gl=LB&ceid=LB:ar",
        "fr": "hl=fr&gl=FR&ceid=FR:fr",
    }[lang]
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&{locale}"
    raw = fetch(url)
    return parse_rss(raw) if raw else []


def reliefweb() -> list[dict]:
    # The JSON API wants a registered appname; the RSS does not.
    raw = fetch("https://reliefweb.int/updates/rss.xml?advanced-search=%28PC137%29")
    return parse_rss(raw) if raw else []


def un_news() -> list[dict]:
    raw = fetch("https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml")
    return parse_rss(raw) if raw else []


def gdelt(query: str) -> list[dict]:
    """One gentle call; GDELT 429s fast from this network and that is fine."""
    url = (
        "https://api.gdeltproject.org/api/v2/doc/doc?query="
        + urllib.parse.quote(f"{query} sourcecountry:LE")
        + "&mode=artlist&maxrecords=40&format=json&timespan=3months"
    )
    raw = fetch(url)
    if not raw:
        return []
    try:
        arts = json.loads(raw).get("articles", [])
    except json.JSONDecodeError:
        return []
    return [
        {
            "title": a.get("title", ""),
            "url": a.get("url", ""),
            "date": a.get("seendate", ""),
            "source": a.get("domain", ""),
        }
        for a in arts
    ]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--days", type=int, default=120, help="keep items newer than this many days (undated items are kept)")
    ap.add_argument("--max-per-query", type=int, default=25)
    ap.add_argument("--out", type=Path, default=Path(__file__).with_name("web-sweep-results.json"))
    args = ap.parse_args()

    cutoff = datetime.now(timezone.utc) - timedelta(days=args.days)
    seen_urls: set[str] = set()
    seen_titles: set[str] = set()
    leads: list[dict] = []
    per_feed: dict[str, int] = {}

    def keep(raw_items: list[dict], feed: str, query: str, lang: str, themed: bool = True) -> None:
        """themed=False for feeds already scoped to Lebanon's response,
        whose titles ("Flash Update #12") rarely carry a theme word."""
        kept = 0
        for it in raw_items:
            if kept >= args.max_per_query:
                break
            title, url = it["title"], it["url"]
            if not title or not url:
                continue
            blob = f"{title} {url}"
            if not COUNTRY.search(blob) and lang == "en":
                continue
            if themed and not THEMES.search(blob):
                continue
            dt = when(it["date"])
            if dt and dt < cutoff:
                continue
            tkey = re.sub(r"\W+", " ", title.lower()).strip()
            if url in seen_urls or tkey in seen_titles:
                continue
            seen_urls.add(url)
            seen_titles.add(tkey)
            leads.append(
                {
                    "title": title,
                    "url": url,
                    "publisher": it["source"],
                    "date": dt.date().isoformat() if dt else None,
                    "language": lang,
                    "feed": feed,
                    "query": query,
                }
            )
            kept += 1
        per_feed[feed] = per_feed.get(feed, 0) + kept

    batteries = (
        [("google-news", q, "en") for q in QUERIES_EN]
        + [("google-news", q, "ar") for q in QUERIES_AR]
        + [("google-news", q, "fr") for q in QUERIES_FR]
    )
    for feed, query, lang in batteries:
        print(f"» {feed} [{lang}] {query}")
        keep(google_news(query, lang), feed, query, lang)
        time.sleep(1.2)  # politeness between requests

    print("» reliefweb rss")
    keep(reliefweb(), "reliefweb", "(country feed)", "en", themed=False)
    print("» un news rss")
    keep(un_news(), "un-news", "(regional feed)", "en")
    print("» gdelt (one query, tolerant)")
    keep(gdelt("lebanon reconstruction"), "gdelt", "lebanon reconstruction", "en")

    leads.sort(key=lambda x: x["date"] or "", reverse=True)
    out = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "windowDays": args.days,
        "note": "Leads only: nothing here enters the tracking until its page has been opened and read.",
        "counts": {"total": len(leads), "byFeed": per_feed},
        "leads": leads,
    }
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    print(f"\n{len(leads)} leads -> {args.out}")
    for feed, n in sorted(per_feed.items()):
        print(f"  {feed:12} {n}")
    print("\nnewest 15:")
    for lead in leads[:15]:
        print(f"  {lead['date'] or '????-??-??'}  [{lead['language']}] {lead['title'][:90]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
