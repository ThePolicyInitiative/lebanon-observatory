import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import { roleRecords } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";

export const metadata: Metadata = { title: AR.pages.compare.title };

export default function Page() {
  const y24 = roleRecords.filter((r) => r.year === 2024).length;
  const y26 = roleRecords.filter((r) => r.year === 2026).length;
  const community26 = roleRecords.filter(
    (r) => r.year === 2026 && r.actorLayer === "community",
  ).length;
  const municipal26 = roleRecords.filter(
    (r) => r.year === 2026 && r.actorLayer === "municipal",
  ).length;
  return (
    <ArabicPageShell
      title={AR.pages.compare.title}
      lede={AR.pages.compare.lede}
      point={AR.pages.compare.point}
      englishHref="/compare"
      figures={[
        { value: String(y24), label: "مدخل متتبَّع في 2024" },
        { value: String(y26), label: "مدخل متتبَّع في 2026" },
        { value: String(community26), label: "منها للمجتمع المحلي في 2026" },
        { value: String(municipal26), label: "منها للبلديات في 2026" },
      ]}
    />
  );
}
