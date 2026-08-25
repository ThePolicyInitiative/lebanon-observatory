import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    // .tsx is collected for the two hook suites, which mount into jsdom.
    // They ask for that environment with a `@vitest-environment jsdom`
    // docblock of their own, so every other file stays in node and the
    // run stays fast.
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
