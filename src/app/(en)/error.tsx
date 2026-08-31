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
      <h1 className="text-h1 font-bold text-navy">
        Something went wrong
      </h1>
      <p className="mt-3 text-body text-text-secondary">
        An unexpected error occurred while rendering this section. The
        underlying data is unaffected.
        {error.digest ? ` (Reference: ${error.digest})` : ""}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 rounded-md bg-navy px-5 text-body font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
