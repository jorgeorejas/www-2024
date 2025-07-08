// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel/serverless";

import pageInsight from "astro-page-insight";
import astroLlmsTxt from "@4hse/astro-llms-txt";

// https://astro.build/config
export default defineConfig({
  site: "https://jorgeorejas.com",
  integrations: [
    mdx(),
    sitemap(),
    tailwind(),
    react(),
    pageInsight(),
    astroLlmsTxt({
      title: "Jorge Orejas - Personal Website",
      description: "Personal website and blog of Jorge Orejas",
      details: "This site contains blog posts, projects, and work experience.",
      docSet: [
        {
          title: "Blog Posts",
          description: "Personal blog posts and articles",
          url: "/blog.txt",
          include: ["/blog/**"],
          promote: ["/blog/"],
          mainSelector: "main",
          ignoreSelectors: ["nav", "footer", ".breadcrumbs"],
        },
        {
          title: "Projects",
          description: "Personal projects and portfolio",
          url: "/projects.txt",
          include: ["/projects/**"],
          promote: ["/projects/"],
          mainSelector: "main",
          ignoreSelectors: ["nav", "footer", ".breadcrumbs"],
        },
      ],
    }),
  ],
  output: "hybrid",
  adapter: vercel({
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
  }),
});
