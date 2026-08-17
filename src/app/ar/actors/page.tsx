import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import { roleRecords } from "@/lib/data";
import webUpdates from "@/data/web-updates.json";
import ArabicPageShell from "../ArabicPageShell";

export const metadata: Metadata = { title: AR.pages.actors.title };

const LAYER_AR: Record<string, string> = {
  official: "المؤسسات الرسمية",
  ngo_international: "المنظمات الدولية وغير الحكومية",
  municipal: "البلديات واتحاداتها",
  community: "المجتمع المحلي والأهالي",
};

export default function Page() {
  const counts = Object.entries(LAYER_AR).map(([id, label]) => ({
    value: String(roleRecords.filter((r) => r.actorLayer === id).length),
    label,
  }));
  const south = webUpdates.updates.filter((u) => u.southOfLitani).length;
  return (
    <ArabicPageShell
      title={AR.pages.actors.title}
      lede={AR.pages.actors.lede}
      point={AR.pages.actors.point}
      englishHref="/actors"
      figures={counts}
    >
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        إضافةً إلى ما سبق، يحمل المرصد {webUpdates.updates.length} مدخلاً من تغطية
        مفتوحة على الإنترنت، منها {south} بين الليطاني والخط الأزرق. هذه المدخلات
        غير مُتحقَّق منها ولا تدخل في أي عدّ.
      </p>
    </ArabicPageShell>
  );
}
