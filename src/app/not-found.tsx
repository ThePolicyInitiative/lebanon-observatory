import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[700px] px-4 py-20 text-center sm:px-6">
      <h1 className="text-xl font-bold text-[color:var(--color-navy)]">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
        The page you requested does not exist. The observatory&apos;s main
        sections are linked below.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        {[
          ["/", "Home"],
          ["/compare", "2024 vs 2026"],
          ["/actors", "Actor layers"],
          ["/map", "Map"],
          ["/finance", "Finance & delivery"],
          ["/explorer", "Data explorer"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex min-h-11 items-center rounded-md border border-[color:var(--color-border)] bg-white px-4 text-[color:var(--color-navy)] hover:border-[color:var(--color-navy)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
