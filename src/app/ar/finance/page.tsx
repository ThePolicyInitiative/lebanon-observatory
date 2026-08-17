import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import ArabicPageShell from "../ArabicPageShell";

export const metadata: Metadata = { title: AR.pages.finance.title };

export default function Page() {
  return (
    <ArabicPageShell
      title={AR.pages.finance.title}
      lede={AR.pages.finance.lede}
      point={AR.pages.finance.point}
      englishHref="/finance"
      figures={[
        { value: "11 مليار $", label: "احتياجات التعافي وإعادة الإعمار المقدَّرة" },
        { value: "1 مليار $", label: "إطار LEAP القابل للتوسّع" },
        { value: "250 مليون $", label: "القرض الأولي المُقرّ" },
        { value: "1.65%", label: "ما دُفع فعلياً من القرض الأولي" },
      ]}
    />
  );
}
