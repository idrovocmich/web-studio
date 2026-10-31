import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests import workspace packages from source so they run without a prior build.
export default defineConfig({
  resolve: {
    alias: {
      "@idrovocmich/tokens": fileURLToPath(
        new URL("./packages/tokens/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["packages/*/src/**/*.test.ts"],
  },
});
