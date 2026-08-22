"use client";

export default function ArabicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-[700px] px-4 py-20 text-center sm:px-6">
      <h1 className="text-xl font-bold text-[color:var(--color-navy)]">
        حدث خطأ ما
      </h1>
      <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
        وقع خطأ غير متوقّع أثناء عرض هذا القسم. الأرقام نفسها لم تتأثّر.
        {error.digest ? ` (المرجع: ${error.digest})` : ""}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 rounded-md bg-[color:var(--color-navy)] px-5 text-sm font-semibold text-white"
      >
        أعد المحاولة
      </button>
    </div>
  );
}
