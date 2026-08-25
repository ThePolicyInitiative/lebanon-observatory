import { defineConfig, devices } from "@playwright/test";

/**
 * The hydrated half of the site, which nothing else in the suite can see.
 *
 * `npm test` stays what it is: node-environment vitest over the data, the
 * copy and the two client-side hooks, offline and quick. This is the other
 * half - a real browser loading real routes - and it is deliberately a
 * separate command, because it builds and starts the app and takes minutes
 * rather than seconds.
 *
 *     npm run test:e2e                  build, start, run, stop
 *     E2E_SKIP_BUILD=1 npm run test:e2e reuse the build already in .next
 *
 * Headless only, and never through an in-app browser pane: the pane on the
 * development machine cannot composite frames, which stalls hydration and
 * makes every interactive assertion here time out for a reason that has
 * nothing to do with the site.
 */

const PORT = Number(process.env.E2E_PORT ?? 3111);
const BASE_URL = `http://127.0.0.1:${PORT}`;

const start = `npx next start --port ${PORT} --hostname 127.0.0.1`;

export default defineConfig({
  testDir: "./tests/e2e",
  // .spec.ts here, .test.ts in vitest: neither collector sees the other's
  // files, so the two suites cannot pick each other up.
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.E2E_SKIP_BUILD ? start : `npx next build && ${start}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // A cold production build of this app runs into the minutes.
    timeout: 600_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
