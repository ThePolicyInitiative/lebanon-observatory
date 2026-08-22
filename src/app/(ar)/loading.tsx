import { CHROME } from "@/lib/i18n";

export default function Loading() {
  return (
    <div
      className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6"
      aria-busy="true"
      aria-label={CHROME.ar.loading}
    >
      <div className="h-8 w-2/5 animate-pulse rounded bg-white" />
      <div className="mt-4 h-4 w-3/5 animate-pulse rounded bg-white" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-md border border-[color:var(--color-border)] bg-white" />
        ))}
      </div>
    </div>
  );
}
