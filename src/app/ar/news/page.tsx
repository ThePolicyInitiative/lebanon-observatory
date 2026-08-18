import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import ArabicPageShell from "../ArabicPageShell";
import ArabicNewsFeed from "./ArabicNewsFeed";

export const metadata: Metadata = { title: AR.pages.news.title };

export default function Page() {
  return (
    <ArabicPageShell
      title={AR.pages.news.title}
      lede={AR.pages.news.lede}
      point={AR.pages.news.point}
      englishHref="/news"
    >
      <div className="mt-8">
        <ArabicNewsFeed />
      </div>
    </ArabicPageShell>
  );
}
