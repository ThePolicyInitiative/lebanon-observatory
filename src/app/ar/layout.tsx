import type { ReactNode } from "react";
import HtmlLangSync from "./HtmlLangSync";

/**
 * Everything under /ar is right-to-left Arabic. The root layout owns the
 * <html> element and cannot be told the locale from here, so direction and
 * language are set on the wrapper - which is what the CSS and assistive
 * technology read - and HtmlLangSync mirrors them onto <html> in the
 * browser. Keeping it this way leaves every page statically prerendered.
 */
export default function ArabicLayout({ children }: { children: ReactNode }) {
  return (
    <div lang="ar" dir="rtl">
      <HtmlLangSync />
      {children}
    </div>
  );
}
