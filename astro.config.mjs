// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";

import pageInsight from "astro-page-insight";
import { remarkCorrection } from "./src/lib/remark-correction.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://jorgeorejas.com",
  integrations: [
    mdx({
      remarkPlugins: [remarkCorrection],
    }),
    sitemap(),
    react(),
    pageInsight(),
  ],
  markdown: {
    remarkPlugins: [remarkCorrection],
  },
  output: "server",
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  vite: {
    server: {
      allowedHosts: [
        'kyla-microporous-erna.ngrok-free.dev',
        '.ngrok-free.dev', // Allow all ngrok domains
      ],
    },
  },
});
