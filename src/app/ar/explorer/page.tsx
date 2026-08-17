import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import { roleRecords, actors } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";

export const metadata: Metadata = { title: AR.pages.explorer.title };

export default function Page() {
  return (
    <ArabicPageShell
      title={AR.pages.explorer.title}
      lede={AR.pages.explorer.lede}
      point={AR.pages.explorer.point}
      englishHref="/explorer"
      figures={[
        { value: String(roleRecords.length), label: "مدخل متتبَّع" },
        { value: String(actors.length), label: "جهة فاعلة مسمّاة" },
        { value: "12", label: "مرحلة في سلسلة القيمة" },
        { value: "2", label: "سنتان تحت المقارنة" },
      ]}
    />
  );
}
