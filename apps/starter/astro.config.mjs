// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Static output: Netlify serves dist/ directly. Add @astrojs/netlify only when SSR is needed.
export default defineConfig({
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
