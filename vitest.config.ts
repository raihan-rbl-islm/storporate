import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.spec.{ts,tsx}"],
    setupFiles: ["tests/unit/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // The lookup helper imports `server-only`, which throws when imported
      // from a Client Component context; Vitest's jsdom env looks like one
      // to it, so we replace it with a no-op for test runs.
      "server-only": path.resolve(__dirname, "tests/unit/server-only-stub.ts"),
    },
  },
});