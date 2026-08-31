import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[700px] px-4 py-20 text-center sm:px-6">
      <h1 className="text-h1 font-bold text-navy">
        Page not found
      </h1>
      <p className="mt-3 text-body text-text-secondary">
        The page you requested does not exist. The observatory&apos;s main
        sections are linked below.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-3 text-body">
        {/* One entry per page. It listed seven when there were seven pages;
            "2024 vs 2026" and "Map" have since become sections of the home
            page and of /who, so listing them here would print two links to
            the same route and leave /destroyed and /reported unlisted. */}
        {[
          ["/", "Home"],
          ["/who", "Actor layers & map"],
          ["/destroyed", "Damage assessments"],
          ["/money", "Finance & delivery"],
          ["/reported", "Live updates"],
          ["/entries", "Data explorer"],
          ["/search", "Search"],
        ].map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-white px-4 text-navy hover:border-navy"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
