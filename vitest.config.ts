import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      SOLIVAN_DATA_FILE: "/tmp/solivan-data/solivan-test.json",
      SOLIVAN_SESSION_SECRET:
        "vitest-only-session-secret-not-for-runtime-use",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
