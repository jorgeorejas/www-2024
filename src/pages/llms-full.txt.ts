import type { APIRoute } from "astro";
import { getLiveCollection, getLiveEntry } from "astro:content";
import { cacheHeaders } from "@lib/cache-headers";
import { blocksText } from "@lib/llms";
import { PRESENT_LABEL, getWorkDateRange } from "@lib/utils";

/** "15/9/2026" (UTC, Notion dates are date-only) */
const day = (date: Date) => date.toLocaleDateString("es-ES", { timeZone: "UTC" });

export const GET: APIRoute = async () => {
  const [bio, blog, projects, work] = await Promise.all([
    getLiveEntry("blocks", { id: "bio" }),
    getLiveCollection("blog", { withBody: true }),
    getLiveCollection("projects", { withBody: true }),
    getLiveCollection("work"),
  ]);
  if (blog.error || projects.error || work.error) {
    return new Response("Error generating content", { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  let content = `# Jorge Orejas, todo el contenido de la web

> Este archivo tiene el texto completo de los posts, los proyectos y la trayectoria de la web de Jorge Orejas. Está pensado para que lo lea una IA. El resumen con enlaces está en /llms.txt.

## Sobre Jorge

${blocksText(bio.entry?.rendered?.html) || "La bio no está disponible ahora mismo."}

`;

  content += `## Todos los posts\n\n`;
  for (const post of (blog.entries ?? [])) {
    content += `### ${post.data.title}\n`;
    content += `**Fecha:** ${day(post.data.date)}\n`;
    content += `**Descripción:** ${post.data.description}\n`;
    if (post.data.titleCorrection) content += `**Corrección del título:** ${post.data.titleCorrection}\n`;
    content += `**Estado:** ${post.data.draft ? "Borrador" : "Publicado"}\n`;
    content += `**Slug:** ${post.id}\n\n`;
    content += `${post.data.markdown ?? ""}\n\n---\n\n`;
  }

  content += `## Todos los proyectos\n\n`;
  for (const project of (projects.entries ?? [])) {
    content += `### ${project.data.title}\n`;
    content += `**Fecha:** ${day(project.data.date)}\n`;
    content += `**Descripción:** ${project.data.description}\n`;
    if (project.data.titleCorrection) content += `**Corrección del título:** ${project.data.titleCorrection}\n`;
    if (project.data.demoURL) content += `**Demo:** ${project.data.demoURL}\n`;
    if (project.data.repoURL) content += `**Repositorio:** ${project.data.repoURL}\n`;
    content += `**Estado:** ${project.data.draft ? "Borrador" : "Publicado"}\n`;
    content += `**Slug:** ${project.id}\n\n`;
    content += `${project.data.markdown ?? ""}\n\n---\n\n`;
  }

  content += `## Toda la trayectoria\n\n`;
  for (const job of (work.entries ?? [])) {
    const { startDate, endDate } = getWorkDateRange(job.data.roles);
    content += `### ${job.data.roles[0]?.title ?? "Puesto"} en ${job.data.company}\n`;
    content += `**Inicio:** ${day(startDate)}\n`;
    content += `**Fin:** ${typeof endDate === "string" ? PRESENT_LABEL : day(endDate)}\n`;
    content += `**Slug:** ${job.id}\n\n`;
    for (const role of job.data.roles) {
      content += `- ${role.title}${role.description ? `: ${role.description}` : ""}\n`;
    }
    content += `\n${job.data.body}\n\n`;
  }

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8", ...cacheHeaders(["blog", "projects", "work"]) },
  });
};
