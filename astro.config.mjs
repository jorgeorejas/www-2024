// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";

import pageInsight from "astro-page-insight";
import { unified } from "@astrojs/markdown-remark";
import { remarkCorrection } from "./src/lib/remark-correction.mjs";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://jorgeorejas.com",
  integrations: [
    // MDX inherits remark plugins from markdown.processor below.
    mdx(),
    react(),
    pageInsight(),
  ],
  markdown: {
    // Astro 7 defaults Markdown to the native Sätteri pipeline. Opt back into
    // the remark/rehype processor so the custom correction plugin keeps working.
    processor: unified({ remarkPlugins: [remarkCorrection] }),
  },
  // Astro 7 changed the default to "jsx" (whitespace stripped using JSX rules).
  // Keep the previous behavior to avoid regressions in inline-element spacing.
  compressHTML: true,
  output: "server",
  // @astrojs/sitemap used to write sitemap-0.xml; search engines may still ask for it
  redirects: { "/sitemap-0.xml": "/sitemap-index.xml" },
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
