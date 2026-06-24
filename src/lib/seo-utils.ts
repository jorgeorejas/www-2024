import type {
  PersonSchema,
  BlogPostingSchema,
  BreadcrumbListSchema,
  BreadcrumbItem,
} from "@types";
import { SITE } from "@consts";
import type { CollectionEntry } from "astro:content";

/**
 * Generate Person schema for the homepage
 */
export function generatePersonSchema(baseUrl: string): PersonSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.AUTHOR_NAME,
    url: baseUrl,
    email: SITE.EMAIL,
    jobTitle: SITE.POSITION,
    sameAs: [
      "https://twitter.com/jorejasrojo",
      "https://github.com/jorgeorejas",
      "https://www.linkedin.com/in/jorgeorejas/",
    ],
  };
}

/**
 * Generate BlogPosting schema for blog posts
 */
export function generateBlogPostingSchema(
  post: CollectionEntry<"blog">,
  baseUrl: string,
): BlogPostingSchema {
  const postUrl = `${baseUrl}blog/${post.id}`;
  const ogImageUrl = `${baseUrl}og/blog/${post.id}.png`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.data.title,
    description: post.data.description,
    datePublished: post.data.date.toISOString(),
    dateModified: post.data.date.toISOString(),
    author: {
      "@type": "Person",
      name: SITE.AUTHOR_NAME,
      url: baseUrl,
    },
    url: postUrl,
    image: ogImageUrl,
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  breadcrumbs: BreadcrumbItem[],
  baseUrl: string,
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `${baseUrl.replace(/\/$/, "")}${crumb.href}`,
    })),
  };
}

/**
 * Generate schema for project pages
 */
export function generateProjectSchema(
  project: CollectionEntry<"projects">,
  baseUrl: string,
): Record<string, unknown> {
  const projectUrl = `${baseUrl}projects/${project.id}`;
  const ogImageUrl = `${baseUrl}og/projects/${project.id}.png`;

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.data.title,
    description: project.data.description,
    url: projectUrl,
    image: ogImageUrl,
    author: {
      "@type": "Person",
      name: SITE.AUTHOR_NAME,
      url: baseUrl,
    },
    datePublished: project.data.date.toISOString(),
  };
}
