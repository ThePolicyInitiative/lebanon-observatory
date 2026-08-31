import type { MetadataRoute } from "next";

/**
 * Makes the site installable - a home-screen launcher, its own window, the
 * site's own colours in the OS chrome. Nothing more: there is deliberately no
 * service worker, because the whole point of these pages is that the figures
 * on screen are the current ones, and a cached copy of an analytical page is
 * worse than a page that plainly fails to load.
 *
 * Next registers a web manifest only at the root of the app directory, and
 * the manifest format has no per-language names, so one manifest serves both
 * halves of the site. The Arabic half keeps a first-class place in it through
 * the launcher shortcut below, named in Arabic and opening the Arabic home.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Lebanon Reconstruction Observatory",
    short_name: "Observatory",
    description:
      "Tracking Lebanon's reconstruction: rubble clearance, debris treatment, rebuilding works, shelter and return - who is rebuilding, with what money, at what stage, 2024-2026.",
    start_url: "/",
    // Both language halves stay inside the installed window, so the language
    // switcher does not throw the reader out into a browser tab.
    scope: "/",
    display: "standalone",
    orientation: "any",
    // The page ground and the navy the site's chrome is built on.
    background_color: "#eaeff4",
    theme_color: "#173b63",
    lang: "en",
    dir: "ltr",
    categories: ["news", "government", "education"],
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
    shortcuts: [
      {
        name: "مرصد إعادة إعمار لبنان",
        short_name: "العربية",
        url: "/ar",
      },
      {
        // The map is a section of this page rather than a route, so the
        // shortcut names the page and lands on the section.
        name: "Who is doing what",
        short_name: "Who",
        url: "/map",
      },
      {
        name: "Live updates",
        short_name: "Updates",
        url: "/reported",
      },
    ],
  };
}
