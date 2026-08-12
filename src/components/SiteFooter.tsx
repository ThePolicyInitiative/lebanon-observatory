import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[#0e2542] bg-[color:var(--color-navy)]">
      <div className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6">
        <nav aria-label="Footer">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
            Explore
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {[
              ["/compare", "2024 vs 2026"],
              ["/actors", "Actor layers"],
              ["/damage", "Damage assessments"],
              ["/map", "Reconstruction map"],
              ["/finance", "Finance & delivery"],
              ["/news", "Live updates"],
              ["/explorer", "Data explorer"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-8 items-center text-white/70 underline-offset-2 hover:text-white hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
