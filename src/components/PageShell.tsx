import type { ReactNode } from "react";

/**
 * The frame every route page shares.
 *
 * It existed twice: once as a component on the Arabic side, and nine times
 * written out by hand on the English side - the same
 * `mx-auto max-w-[1360px] px-4 py-7 sm:px-6`, the same
 * `<header className="max-w-3xl">`, the same h1 classes, copied. So there
 * was no place to change English page rhythm, and nothing holding the nine
 * copies equal to the one Arabic original.
 *
 * That had already failed in the way it was always going to. The Arabic
 * /map page grew a lede, a caution and four figures its English twin did
 * not have - breaking the rule the Arabic shell's own prop comment states,
 * because a comment on one of the two frames cannot bind the other. One
 * frame can.
 *
 * Direction takes no prop: each layout sets `dir` once on <html>, and every
 * rule in here is logical.
 */
export default function PageShell({
  title,
  lede,
  point,
  figures,
  children,
  after,
}: {
  title: string;
  /**
   * Both optional, and the reason is the parity rule: a page whose twin
   * carries no opening passage must not grow one here, in either language.
   */
  lede?: ReactNode;
  /**
   * A node rather than a string, because cautions carry links inline. When
   * this could only hold a string, the Arabic search page ended up
   * repeating its own scope further down the page to put the links
   * somewhere.
   */
  point?: ReactNode;
  figures?: { value: string; label: string }[];
  children?: ReactNode;
  /**
   * Rendered after the children but inside the container. The Arabic shell
   * closes with a card of cross-language links that has to sit inside the
   * measure, so wrapping alone could not reproduce it - this slot is what
   * lets the Arabic frame be this frame plus a tail, rather than a second
   * frame that happens to look the same.
   */
  after?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-7 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          {title}
        </h1>
        {lede ? (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {lede}
          </p>
        ) : null}
        {point ? (
          <p className="note-caution mt-4 text-[13px] leading-relaxed text-text-secondary">
            {point}
          </p>
        ) : null}
      </header>

      {figures && figures.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map((f) => (
            <li key={f.label} className="card p-3.5">
              <p className="figure-number text-2xl text-navy">
                {f.value}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-text-secondary">
                {f.label}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {children}
      {after}
    </div>
  );
}
