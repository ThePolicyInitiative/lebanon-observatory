"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-[700px] px-4 py-20 text-center sm:px-6">
      <h1 className="text-xl font-bold text-[color:var(--color-navy)]">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
        An unexpected error occurred while rendering this section. The
        underlying data is unaffected.
        {error.digest ? ` (Reference: ${error.digest})` : ""}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 rounded-md bg-[color:var(--color-navy)] px-5 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
