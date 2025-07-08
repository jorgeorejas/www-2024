import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  try {
    // Get all collections
    const blogPosts = await getCollection("blog");
    const projects = await getCollection("projects");
    const work = await getCollection("work");

    let content = `# Jorge Orejas - Personal Website

> Personal website and blog of Jorge Orejas. Contains blog posts, projects, and work experience. This site is a portfolio and knowledge base for creative engineering, indie hacking, and personal growth.

Below you'll find links to the main content sections and resources of this site, grouped for LLM-friendly navigation.

## Blog
`;

    // Blog links
    for (const post of blogPosts.filter((p) => !p.data.draft)) {
      content += `- [${post.data.title}](https://jorgeorejas.com/blog/${post.slug}): ${post.data.description}\n`;
    }
    content += `- [All Blog Posts](https://jorgeorejas.com/blog): List of all blog articles\n`;
    content += `- [RSS Feed](https://jorgeorejas.com/rss.xml): Machine-readable feed of blog posts\n`;

    content += `\n## Projects\n`;
    for (const project of projects.filter((p) => !p.data.draft)) {
      content += `- [${project.data.title}](https://jorgeorejas.com/projects/${project.slug}): ${project.data.description}\n`;
    }
    content += `- [All Projects](https://jorgeorejas.com/projects): Portfolio of personal and professional projects\n`;

    content += `\n## Work\n`;
    for (const job of work) {
      content += `- [${job.data.role} at ${job.data.company}](https://jorgeorejas.com/work): ${job.body.trim().split("\n")[0] || "Work experience entry"}\n`;
    }
    content += `- [Work Experience](https://jorgeorejas.com/work): Professional history and roles\n`;

    content += `\n## Optional\n`;
    content += `- [Full Content Dump](https://jorgeorejas.com/llms-full.txt): Complete content of all posts, projects, and work (for LLMs)\n`;

    content += `\n---\n\n*This file is a summary for LLMs. For the full content, see /llms-full.txt.*`;

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating llms.txt:", error);
    return new Response("Error generating content", { status: 500 });
  }
};
