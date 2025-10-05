import type { APIRoute } from "astro";
import { getCollection, getEntry } from "astro:content";
import { getWorkDateRange } from "@lib/utils";

// Helper function to process content and resolve JavaScript expressions and components
async function processContent(content: string): Promise<string> {
  let processed = content
    .replace(/^---[\s\S]*?---/, "") // Remove frontmatter
    .trim();

  // Handle age calculation
  processed = processed.replace(
    /\{new Date\(\)\.getFullYear\(\) - new Date\("2003-03-08"\)\.getFullYear\(\)\}/g,
    String(new Date().getFullYear() - new Date("2003-03-08").getFullYear()),
  );

  // Handle ContentBlock components by replacing them with the actual content
  const contentBlockMatches = processed.match(
    /<ContentBlock slug="([^"]+)" \/>/g,
  );
  if (contentBlockMatches) {
    for (const match of contentBlockMatches) {
      const slugMatch = match.match(/slug="([^"]+)"/);
      if (slugMatch) {
        const slug = slugMatch[1];
        const blockEntry = await getEntry("blocks", slug);
        if (blockEntry) {
          let blockContent = blockEntry.body
            .replace(/^---[\s\S]*?---/, "")
            .trim();
          // Process any JavaScript expressions in the block content too
          blockContent = blockContent.replace(
            /\{new Date\(\)\.getFullYear\(\) - new Date\("2003-03-08"\)\.getFullYear\(\)\}/g,
            String(
              new Date().getFullYear() - new Date("2003-03-08").getFullYear(),
            ),
          );
          processed = processed.replace(match, blockContent);
        }
      }
    }
  }

  // Remove import statements
  processed = processed.replace(/import\s+.*?from\s+.*?;?\n?/g, "");

  return processed;
}

export const GET: APIRoute = async () => {
  try {
    // Get bio content first
    const bioEntry = await getEntry("blocks", "bio");
    let bioContent = "Bio content not available";
    if (bioEntry) {
      bioContent = await processContent(bioEntry.body);
    }

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
    const sortedWork = work.sort((a, b) => {
      const aDateRange = getWorkDateRange(a.data.roles);
      const bDateRange = getWorkDateRange(b.data.roles);
      return bDateRange.startDate.getTime() - aDateRange.startDate.getTime();
    });

    let content = `# Jorge Orejas - Complete Website Content

> This file contains the full content of all blog posts, projects, and work experience from Jorge Orejas's personal website. Intended for LLM ingestion and deep analysis. For a summary and links, see /llms.txt.

## About Jorge

${bioContent}

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

      // Process the complete content with proper component and image handling
      const processedContent = await processContent(post.body);
      content += processedContent + "\n\n";
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

      // Process the complete content with proper component and image handling
      const processedContent = await processContent(project.body);
      content += processedContent + "\n\n";
      content += "---\n\n";
    }

    content += `## Complete Work Experience Collection\n\n`;
    for (const job of sortedWork) {
      const { startDate, endDate } = getWorkDateRange(job.data.roles);
      content += `### ${job.data.roles[job.data.roles.length - 1].title} at ${job.data.company}\n`;
      content += `**Start Date:** ${startDate.toLocaleDateString()}\n`;
      content += `**End Date:** `;
      if (typeof endDate === "string") {
        content += endDate;
      } else {
        content += endDate.toLocaleDateString();
      }
      content += "\n";
      content += `**Slug:** ${job.slug}\n\n`;

      // Process the complete content with proper component and image handling
      const processedContent = await processContent(job.body);
      content += processedContent + "\n\n";
    }

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
