import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  try {
    // Get all collections
    const blogPosts = await getCollection("blog");
    const projects = await getCollection("projects");
    const work = await getCollection("work");

    // Sort blog posts by date (newest first)
    const sortedBlogPosts = blogPosts.sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
    );

    // Sort projects by date (newest first)
    const sortedProjects = projects.sort(
      (a, b) =>
        new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
    );

    // Sort work by start date (newest first)
    const sortedWork = work.sort(
      (a, b) =>
        new Date(b.data.dateStart).getTime() -
        new Date(a.data.dateStart).getTime(),
    );

    let content = `# Jorge Orejas - Complete Website Content

> This file contains the full content of all blog posts, projects, and work experience from Jorge Orejas's personal website. Intended for LLM ingestion and deep analysis. For a summary and links, see /llms.txt.

`;

    // Add ALL blog posts (including drafts)
    content += `## Complete Blog Posts Collection\n\n`;
    for (const post of sortedBlogPosts) {
      content += `### ${post.data.title}\n`;
      content += `**Date:** ${post.data.date.toLocaleDateString()}\n`;
      content += `**Description:** ${post.data.description}\n`;
      if (post.data.titleCorrection) {
        content += `**Title Correction:** ${post.data.titleCorrection}\n`;
      }
      content += `**Draft Status:** ${post.data.draft ? "Draft" : "Published"}\n`;
      content += `**Slug:** ${post.slug}\n\n`;

      // Add the complete content body
      const bodyContent = post.body;

      // Clean up the content (remove frontmatter but keep everything else)
      const cleanContent = bodyContent
        .replace(/^---[\s\S]*?---/, "") // Remove frontmatter
        .replace(/^\s+|\s+$/g, "") // Trim whitespace
        .replace(/\n\s*\n\s*\n/g, "\n\n"); // Normalize multiple newlines

      content += cleanContent + "\n\n";
      content += "---\n\n";
    }

    content += `## Complete Projects Collection\n\n`;
    for (const project of sortedProjects) {
      content += `### ${project.data.title}\n`;
      content += `**Date:** ${project.data.date.toLocaleDateString()}\n`;
      content += `**Description:** ${project.data.description}\n`;
      if (project.data.titleCorrection) {
        content += `**Title Correction:** ${project.data.titleCorrection}\n`;
      }
      if (project.data.demoURL) {
        content += `**Demo URL:** ${project.data.demoURL}\n`;
      }
      if (project.data.repoURL) {
        content += `**Repository URL:** ${project.data.repoURL}\n`;
      }
      content += `**Draft Status:** ${project.data.draft ? "Draft" : "Published"}\n`;
      content += `**Slug:** ${project.slug}\n\n`;

      // Add the complete content body
      const bodyContent = project.body;

      // Clean up the content (remove frontmatter but keep everything else)
      const cleanContent = bodyContent
        .replace(/^---[\s\S]*?---/, "") // Remove frontmatter
        .replace(/^\s+|\s+$/g, "") // Trim whitespace
        .replace(/\n\s*\n\s*\n/g, "\n\n"); // Normalize multiple newlines

      content += cleanContent + "\n\n";
      content += "---\n\n";
    }

    content += `## Complete Work Experience Collection\n\n`;
    for (const job of sortedWork) {
      content += `### ${job.data.role} at ${job.data.company}\n`;
      content += `**Start Date:** ${job.data.dateStart.toLocaleDateString()}\n`;
      content += `**End Date:** `;
      if (typeof job.data.dateEnd === "string") {
        content += job.data.dateEnd;
      } else {
        content += job.data.dateEnd.toLocaleDateString();
      }
      content += "\n";
      content += `**Slug:** ${job.slug}\n\n`;

      // Add the complete content body
      const bodyContent = job.body;

      // Clean up the content (remove frontmatter but keep everything else)
      const cleanContent = bodyContent
        .replace(/^---[\s\S]*?---/, "") // Remove frontmatter
        .replace(/^\s+|\s+$/g, "") // Trim whitespace
        .replace(/\n\s*\n\s*\n/g, "\n\n"); // Normalize multiple newlines

      content += cleanContent + "\n\n";
      content += "---\n\n";
    }

    // Add comprehensive site information
    content += `## Website Structure and Information\n\n`;
    content += `### Site Configuration\n- **Site URL:** https://jorgeorejas.com\n- **Framework:** Astro with TypeScript\n- **Styling:** Tailwind CSS\n- **Content Management:** Astro Content Collections\n- **Deployment:** Vercel\n\n`;
    content += `### Content Collections\n- **Blog Posts:** ${blogPosts.length} total posts (${blogPosts.filter((p) => !p.data.draft).length} published, ${blogPosts.filter((p) => p.data.draft).length} drafts)\n- **Projects:** ${projects.length} total projects (${projects.filter((p) => !p.data.draft).length} published, ${projects.filter((p) => p.data.draft).length} drafts)\n- **Work Experience:** ${work.length} entries\n\n`;
    content += `### Available Routes\n- **Homepage:** /\n- **Blog:** /blog\n- **Projects:** /projects\n- **Work Experience:** /work\n- **RSS Feed:** /rss.xml\n- **Sitemap:** /sitemap-index.xml\n- **Robots.txt:** /robots.txt\n- **LLMS.txt:** /llms.txt (filtered content)\n- **LLMS-Full.txt:** /llms-full.txt (complete content)\n\n`;
    content += `### Content Schema Information\n\n#### Blog Posts Schema:\n- title: string (required)\n- titleCorrection: string (optional)\n- description: string (required)\n- date: Date (required)\n- draft: boolean (optional)\n\n#### Projects Schema:\n- title: string (required)\n- titleCorrection: string (optional)\n- description: string (required)\n- date: Date (required)\n- draft: boolean (optional)\n- demoURL: string (optional)\n- repoURL: string (optional)\n\n#### Work Schema:\n- company: string (required)\n- role: string (required)\n- dateStart: Date (required)\n- dateEnd: Date | string (required)\n\n`;
    content += `### Technical Details\n- **Build Output:** Hybrid (static + serverless)\n- **Adapter:** @astrojs/vercel/serverless\n- **Analytics:** Vercel Analytics enabled\n- **Speed Insights:** Vercel Speed Insights enabled\n- **Image Optimization:** Astro's built-in image optimization\n- **Font Loading:** @fontsource packages for optimized font loading\n\n`;
    content += `### Content Processing\n- **Markdown Support:** Full markdown support with MDX\n- **Image Handling:** Optimized images with WebP format\n- **SEO:** Automatic sitemap generation, meta tags, and Open Graph images\n- **RSS:** Automatic RSS feed generation for blog posts\n\n---\n\n## Contact Information\n\nFor more information, visit the website at https://jorgeorejas.com\n\n### Social and Professional Links\n- **Website:** https://jorgeorejas.com\n- **Blog:** https://jorgeorejas.com/blog\n- **Projects:** https://jorgeorejas.com/projects\n- **Work Experience:** https://jorgeorejas.com/work\n\n---\n\n*This file was generated automatically and contains ALL content from Jorge Orejas's personal website, including draft content and comprehensive technical information. This is the complete dataset for LLM training or analysis purposes.*`;

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=1800", // Cache for 30 minutes
      },
    });
  } catch (error) {
    console.error("Error generating llms-full.txt:", error);
    return new Response("Error generating content", { status: 500 });
  }
};
