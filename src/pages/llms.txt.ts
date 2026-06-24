import type { APIRoute } from "astro";
import { getCollection, getEntry } from "astro:content";

export const GET: APIRoute = async () => {
  try {
    // Get bio content first
    const bioEntry = await getEntry("blocks", "bio");
    let bioContent = "Bio content not available";
    if (bioEntry) {
      // Process the bio content to handle JavaScript expressions
      let rawBio = (bioEntry.body ?? "").replace(/^---[\s\S]*?---/, "").trim();
      // Handle the age calculation
      rawBio = rawBio.replace(
        /\{new Date\(\)\.getFullYear\(\) - new Date\("2003-03-08"\)\.getFullYear\(\)\}/g,
        String(new Date().getFullYear() - new Date("2003-03-08").getFullYear()),
      );
      bioContent = rawBio;
    }

    // Get all collections
    const blogPosts = await getCollection("blog");
    const projects = await getCollection("projects");
    const work = await getCollection("work");

    let content = `# Jorge Orejas - Personal Website

> Personal website and blog of Jorge Orejas. Contains blog posts, projects, and work experience. This site is a portfolio and knowledge base for creative engineering, indie hacking, and personal growth.

## About Jorge

${bioContent}

Below you'll find links to the main content sections and resources of this site, grouped for LLM-friendly navigation.

## Blog
`;

    // Blog links
    for (const post of blogPosts.filter((p) => !p.data.draft)) {
      content += `- [${post.data.title}](https://jorgeorejas.com/blog/${post.id}): ${post.data.description}\n`;
    }
    content += `- [All Blog Posts](https://jorgeorejas.com/blog): List of all blog articles\n`;
    content += `- [RSS Feed](https://jorgeorejas.com/rss.xml): Machine-readable feed of blog posts\n`;

    content += `\n## Projects\n`;
    for (const project of projects.filter((p) => !p.data.draft)) {
      content += `- [${project.data.title}](https://jorgeorejas.com/projects/${project.id}): ${project.data.description}\n`;
    }
    content += `- [All Projects](https://jorgeorejas.com/projects): Portfolio of personal and professional projects\n`;

    content += `\n## Work\n`;
    for (const job of work) {
      content += `- [${job.data.roles[job.data.roles.length - 1].title} at ${job.data.company}](https://jorgeorejas.com/work): ${(job.body ?? "").trim().split("\n")[0] || "Work experience entry"}\n`;
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
