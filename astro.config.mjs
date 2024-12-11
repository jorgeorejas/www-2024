// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel/serverless";

import pageInsight from "astro-page-insight";

// https://astro.build/config
export default defineConfig({
  site: "https://jorgeorejas.com",
  integrations: [mdx(), sitemap(), tailwind(), react(), pageInsight()],
  output: "hybrid",
  adapter: vercel({
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
  }),
});
