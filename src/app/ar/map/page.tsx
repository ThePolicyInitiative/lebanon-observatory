import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import { locations } from "@/lib/data";
import ArabicPageShell from "../ArabicPageShell";

export const metadata: Metadata = { title: AR.pages.map.title };

export default function Page() {
  const mappable = locations.regions.filter((r) => r.mappable).length;
  const notMappable = locations.regions.length - mappable;
  return (
    <ArabicPageShell
      title={AR.pages.map.title}
      lede={AR.pages.map.lede}
      point={AR.pages.map.point}
      englishHref="/map"
      figures={[
        { value: String(locations.regions.length), label: "تجمّع إقليمي في التتبّع" },
        { value: String(mappable), label: "منها يمكن وضعه على الخريطة" },
        { value: String(notMappable), label: "يُعرض منفصلاً لتعذّر توطينه" },
        { value: "168", label: "بلدة جنوب الليطاني ضمن نطاق العمل" },
      ]}
    />
  );
}
