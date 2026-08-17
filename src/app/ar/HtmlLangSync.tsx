"use client";

import { useEffect } from "react";

/**
 * Mirrors the Arabic locale onto <html>, which the root layout hardcodes to
 * English left-to-right. The wrapper in the Arabic layout already carries
 * lang and dir for CSS and assistive technology; this keeps the document
 * element honest too, and puts it back on the way out to the English side.
 */
export default function HtmlLangSync() {
  useEffect(() => {
    const el = document.documentElement;
    const prevLang = el.lang;
    const prevDir = el.dir;
    el.lang = "ar";
    el.dir = "rtl";
    return () => {
      el.lang = prevLang || "en";
      el.dir = prevDir || "ltr";
    };
  }, []);
  return null;
}
