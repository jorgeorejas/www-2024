export type Site = {
  NAME: string;
  POSITION: string;
  EMAIL: string;
  NUM_POSTS_ON_HOMEPAGE: number;
  NUM_WORKS_ON_HOMEPAGE: number;
  NUM_PROJECTS_ON_HOMEPAGE: number;
  TWITTER_HANDLE: string;
  AUTHOR_NAME: string;
  LOCALE: string;
};

export type Metadata = {
  TITLE: string;
  DESCRIPTION: string;
};

export type Socials = {
  NAME: string;
  HREF: string;
}[];

// SEO Types
export type BreadcrumbItem = {
  href: string;
  label: string;
};

export type HeadProps = {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: Date;
  modifiedTime?: Date;
  author?: string;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
};

export type PersonSchema = {
  "@context": string;
  "@type": "Person";
  name: string;
  url: string;
  email?: string;
  jobTitle?: string;
  sameAs?: string[];
};

export type BlogPostingSchema = {
  "@context": string;
  "@type": "BlogPosting";
  headline: string;
  description?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    "@type": "Person";
    name: string;
    url: string;
  };
  url: string;
  image?: string;
};

export type BreadcrumbListSchema = {
  "@context": string;
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
};
