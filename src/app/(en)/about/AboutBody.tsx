import { ABOUT, CONTACT_EMAIL } from "@/lib/about-content";
import type { Locale } from "@/lib/vocab";

/**
 * The body of the identity page, shared by both languages exactly as the
 * explorer's client module is: one component, two locales, so the Arabic
 * side cannot end up a shorter version of the English one.
 *
 * The address is rendered left-to-right inside the Arabic page - an email
 * address is a Latin identifier, and bending it right-to-left makes it
 * unreadable and uncopyable.
 */
export default function AboutBody({ locale = "en" }: { locale?: Locale } = {}) {
  const t = ABOUT[locale];

  return (
    <div className="mt-7 space-y-7">
      {t.sections.map((s) => (
        <section key={s.id} aria-labelledby={`about-${s.id}`}>
          <h2
            id={`about-${s.id}`}
            className="text-h2 font-semibold text-navy"
          >
            {s.heading}
          </h2>
          {s.body?.map((p) => (
            <p
              key={p.slice(0, 24)}
              className="mt-2.5 max-w-3xl text-body leading-relaxed text-text-secondary"
            >
              {p}
            </p>
          ))}
          {s.points ? (
            <ul className="mt-3 max-w-3xl space-y-2.5">
              {s.points.map((p) => (
                <li
                  key={p.slice(0, 24)}
                  className="card text-body leading-relaxed text-text"
                >
                  {p}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section aria-labelledby="about-contact" className="card">
        <h2
          id="about-contact"
          className="text-h2 font-semibold text-navy"
        >
          {t.contact.heading}
        </h2>
        {CONTACT_EMAIL ? (
          <>
            <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
              {t.contact.body}
            </p>
            <p className="mt-2 text-body font-semibold">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                lang="en"
                dir="ltr"
                className="inline-block text-blue underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="mt-2.5 max-w-3xl text-meta leading-relaxed text-text-secondary">
              {t.contact.note}
            </p>
          </>
        ) : (
          <p className="mt-2 max-w-3xl text-body leading-relaxed text-text-secondary">
            {t.contact.none}
          </p>
        )}
      </section>
    </div>
  );
}
