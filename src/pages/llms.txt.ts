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

  let content = `# Jorge Orejas - Personal Website

> Personal website and blog of Jorge Orejas. Contains blog posts, projects, and work experience. This site is a portfolio and knowledge base for creative engineering, indie hacking, and personal growth.

## About Jorge

${blocksText(bio.entry?.rendered?.html) || "Bio content not available"}

Below you'll find links to the main content sections and resources of this site, grouped for LLM-friendly navigation.

## Blog
`;

  for (const post of (blog.entries ?? []).filter((p) => !p.data.draft)) {
    content += `- [${post.data.title}](https://jorgeorejas.com/blog/${post.id}): ${post.data.description}\n`;
  }
  content += `- [All Blog Posts](https://jorgeorejas.com/blog): List of all blog articles\n`;
  content += `- [RSS Feed](https://jorgeorejas.com/rss.xml): Machine-readable feed of blog posts\n`;

  content += `\n## Projects\n`;
  for (const project of (projects.entries ?? []).filter((p) => !p.data.draft)) {
    content += `- [${project.data.title}](https://jorgeorejas.com/projects/${project.id}): ${project.data.description}\n`;
  }
  content += `- [All Projects](https://jorgeorejas.com/projects): Portfolio of personal and professional projects\n`;
  content += `- [La Cocina de Jorge](https://jorgeorejas.com/cocina): Family recipes, in Spanish\n`;

  content += `\n## Work\n`;
  for (const job of (work.entries ?? [])) {
    const latest = job.data.roles[0];
    content += `- [${latest?.title ?? "Role"} at ${job.data.company}](https://jorgeorejas.com/work/${job.id}): ${job.data.body.trim().split("\n")[0] || "Work experience entry"}\n`;
  }
  content += `- [Work Experience](https://jorgeorejas.com/work): Professional history and roles\n`;

  content += `\n## Optional\n`;
  content += `- [Full Content Dump](https://jorgeorejas.com/llms-full.txt): Complete content of all posts, projects, and work (for LLMs)\n`;
  content += `\n---\n\n*This file is a summary for LLMs. For the full content, see /llms-full.txt.*`;

  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8", ...cacheHeaders(["blog", "projects", "work"]) },
  });
};
