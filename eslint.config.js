import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["**/dist/", "**/.astro/", "**/.netlify/", "**/node_modules/", "**/coverage/"]),
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
