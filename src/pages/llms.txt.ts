import type { APIRoute } from "astro";
import { getLiveCollection, getLiveEntry } from "astro:content";
import { cacheHeaders } from "@lib/cache-headers";
import { blocksText } from "@lib/llms";

export const GET: APIRoute = async () => {
  const [bio, blog, projects, work] = await Promise.all([
    getLiveEntry("blocks", { id: "bio" }),
    getLiveCollection("blog"),
    getLiveCollection("projects"),
    getLiveCollection("work"),
  ]);
  if (blog.error || projects.error || work.error) {
    return new Response("Error generating content", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  let content = `# Jorge Orejas, web personal

> Web personal y blog de Jorge Orejas: posts, proyectos y trayectoria. Es su portfolio y el sitio donde apunta lo que aprende sobre ingeniería creativa, indie hacking y crecimiento personal.

## Sobre Jorge

${blocksText(bio.entry?.rendered?.html) || "La bio no está disponible ahora mismo."}

Abajo están los enlaces a las secciones principales de la web, agrupados para que una IA se mueva por ella sin perderse.

## Blog
`;

  for (const post of (blog.entries ?? []).filter((p) => !p.data.draft)) {
    content += `- [${post.data.title}](https://jorgeorejas.com/blog/${post.id}): ${post.data.description}\n`;
  }
  content += `- [Todos los posts](https://jorgeorejas.com/blog): la lista completa del blog\n`;
  content += `- [Feed RSS](https://jorgeorejas.com/rss.xml): los posts del blog en un feed para máquinas\n`;

  content += `\n## Proyectos\n`;
  for (const project of (projects.entries ?? []).filter((p) => !p.data.draft)) {
    content += `- [${project.data.title}](https://jorgeorejas.com/projects/${project.id}): ${project.data.description}\n`;
  }
  content += `- [Todos los proyectos](https://jorgeorejas.com/projects): proyectos personales y profesionales\n`;
  content += `- [La Cocina de Jorge](https://jorgeorejas.com/cocina): las recetas de casa\n`;

  content += `\n## Trayectoria\n`;
  for (const job of (work.entries ?? [])) {
    const latest = job.data.roles[0];
    content += `- [${latest?.title ?? "Puesto"} en ${job.data.company}](https://jorgeorejas.com/work/${job.id}): ${job.data.body.trim().split("\n")[0] || `Su etapa en ${job.data.company}`}\n`;
  }
  content += `- [Trayectoria](https://jorgeorejas.com/work): dónde trabajó y en qué puestos\n`;

  content += `\n## Opcional\n`;
  content += `- [Todo el contenido](https://jorgeorejas.com/llms-full.txt): el texto completo de posts, proyectos y trayectoria (para IAs)\n`;
  content += `\n---\n\n*Este archivo es un resumen para IAs. El contenido completo está en /llms-full.txt.*`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8", ...cacheHeaders(["blog", "projects", "work"]) },
  });
};
