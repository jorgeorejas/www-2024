// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";

import pageInsight from "astro-page-insight";
import remarkDirective from "remark-directive";
import { remarkCorrection } from "./src/lib/remark-correction.mjs";
import { remarkHandwritten } from "./src/lib/remark-handwritten.mjs";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://jorgeorejas.com",
  integrations: [
    mdx({
      remarkPlugins: [remarkCorrection, remarkDirective, remarkHandwritten],
    }),
    sitemap(),
    react(),
    pageInsight(),
  ],
  markdown: {
    remarkPlugins: [remarkCorrection, remarkDirective, remarkHandwritten],
  },
  output: "server",
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [
        "kyla-microporous-erna.ngrok-free.dev",
        ".ngrok-free.dev",
      ],
    },
  },
});
