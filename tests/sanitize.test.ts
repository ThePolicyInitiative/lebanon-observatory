import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { sanitizeText } from "@/lib/news/tagging";

/**
 * Third-party feed text must never survive as tag-shaped strings, and no
 * component may ever start rendering raw HTML: the two halves of the
 * same invariant.
 */

describe("sanitizeText", () => {
  it("strips tags that re-materialize through entity decoding", () => {
    expect(sanitizeText("&lt;img src=x onerror=alert(1)&gt;")).not.toContain("<img");
    expect(sanitizeText("&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;")).not.toContain(
      "<script",
    );
    expect(sanitizeText("<b>bold</b> claim")).toBe("bold claim");
  });

  it("keeps ordinary text intact", () => {
    expect(sanitizeText("Rubble clearance resumed in Aaitaroun &amp; Taybe")).toBe(
      "Rubble clearance resumed in Aaitaroun & Taybe",
    );
  });
});

describe("no raw-HTML rendering anywhere in src/", () => {
  it("finds no dangerouslySetInnerHTML, innerHTML or srcdoc", () => {
    const root = join(__dirname, "..", "src");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
          walk(p);
        } else if (/\.(ts|tsx)$/.test(name)) {
          const text = readFileSync(p, "utf8");
          if (/dangerouslySetInnerHTML|\binnerHTML\b|srcdoc/.test(text)) offenders.push(p);
        }
      }
    };
    walk(root);
    expect(offenders, `raw-HTML rendering found in: ${offenders.join(", ")}`).toEqual([]);
  });
});
