import { defineConfig } from "@playwright/test";

// `pnpm test`: the plain functions that are easy to break without noticing
// (Notion → page, recipes, image sizes, share cards). No browser, ~2 s.
export default defineConfig({
  testDir: "./tests",
  reporter: "list",
});
