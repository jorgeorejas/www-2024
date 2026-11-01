import type { APIRoute } from "astro";
import { getLiveCollection, getLiveEntry } from "astro:content";
import { cacheHeaders } from "@lib/cache-headers";
import { blocksText } from "@lib/llms";
import { getWorkDateRange } from "@lib/utils";

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

  let content = `# Jorge Orejas - Complete Website Content

> This file contains the full content of all blog posts, projects, and work experience from Jorge Orejas's personal website. Intended for LLM ingestion and deep analysis. For a summary and links, see /llms.txt.

## About Jorge

${blocksText(bio.entry?.rendered?.html) || "Bio content not available"}

`;

  content += `## Complete Blog Posts Collection\n\n`;
  for (const post of (blog.entries ?? [])) {
    content += `### ${post.data.title}\n`;
    content += `**Date:** ${post.data.date.toLocaleDateString()}\n`;
    content += `**Description:** ${post.data.description}\n`;
    if (post.data.titleCorrection) content += `**Title Correction:** ${post.data.titleCorrection}\n`;
    content += `**Draft Status:** ${post.data.draft ? "Draft" : "Published"}\n`;
    content += `**Slug:** ${post.id}\n\n`;
    content += `${post.data.markdown ?? ""}\n\n---\n\n`;
  }

  content += `## Complete Projects Collection\n\n`;
  for (const project of (projects.entries ?? [])) {
    content += `### ${project.data.title}\n`;
    content += `**Date:** ${project.data.date.toLocaleDateString()}\n`;
    content += `**Description:** ${project.data.description}\n`;
    if (project.data.titleCorrection) content += `**Title Correction:** ${project.data.titleCorrection}\n`;
    if (project.data.demoURL) content += `**Demo URL:** ${project.data.demoURL}\n`;
    if (project.data.repoURL) content += `**Repository URL:** ${project.data.repoURL}\n`;
    content += `**Draft Status:** ${project.data.draft ? "Draft" : "Published"}\n`;
    content += `**Slug:** ${project.id}\n\n`;
    content += `${project.data.markdown ?? ""}\n\n---\n\n`;
  }

  content += `## Complete Work Experience Collection\n\n`;
  for (const job of (work.entries ?? [])) {
    const { startDate, endDate } = getWorkDateRange(job.data.roles);
    content += `### ${job.data.roles[0]?.title ?? "Role"} at ${job.data.company}\n`;
    content += `**Start Date:** ${startDate.toLocaleDateString()}\n`;
    content += `**End Date:** ${typeof endDate === "string" ? endDate : endDate.toLocaleDateString()}\n`;
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
