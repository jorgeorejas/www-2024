// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless";
import remarkDirective from "remark-directive"; // Importar remark-directive
import { visit } from "unist-util-visit";
// Lógica personalizada para las directivas MDX
function remarkCustomDirectives() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === "containerDirective" && node.name === "correction") {
        const data = node.data || (node.data = {});
        const correctionText = node.attributes?.text || "";

        // Transformar el nodo en el componente <Correction>
        data.hName = "Correction";
        data.hProperties = { text: correctionText };

        // Pasar los hijos como contenido del componente
        node.children = node.children.map((child) => ({
          ...child,
          type: "element",
          tagName: "span",
          properties: {},
        }));
      }
    });
  };
}

// Configuración principal de Astro
export default defineConfig({
  site: "https://jorgeorejas.com",
  integrations: [
    mdx({
      remarkPlugins: [remarkDirective, remarkCustomDirectives],
    }),
    sitemap(),
    tailwind(),
    react(),
  ],
  output: "hybrid",
  adapter: vercel({
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
  }),
});
