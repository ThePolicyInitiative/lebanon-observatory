import type { Metadata } from "next";
import { AR } from "@/lib/i18n";
import ArabicPageShell from "../ArabicPageShell";

export const metadata: Metadata = { title: AR.pages.damage.title };

export default function Page() {
  return (
    <ArabicPageShell
      title={AR.pages.damage.title}
      lede={AR.pages.damage.lede}
      point={AR.pages.damage.point}
      englishHref="/damage"
      figures={[
        { value: "4", label: "مسارات غير قابلة للجمع تحصر دمار 2024" },
        { value: "11,095", label: "مبنى مدمَّر كلياً جنوب الليطاني في تقييم 2026" },
        { value: "1.384 مليار $", label: "أضرار مباشرة في الأبنية جنوب الليطاني" },
        { value: "3.1 مليون م³", label: "ركام جنوب الليطاني" },
      ]}
    >
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        تقييم جنوب الليطاني مسح مكتبي على صور 29 نيسان 2026، بدقة مقدَّرة نحو 85%
        ومن دون تحقق ميداني، ولا يشمل الطوابق تحت الأرض ولا البنى التحتية.
        البقاع وبعلبك-الهرمل والشمال بلا تقييم مماثل حتى تاريخ التوقف: المساحة
        المقيَّمة ليست المساحة المتضررة.
      </p>
    </ArabicPageShell>
  );
}
