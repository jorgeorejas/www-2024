import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Jorge Orejas",
  POSITION: "Developer & Entrepreneur",
  EMAIL: "soy@jorgeorejas.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 2,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION:
    "Jorge Orejas is a software developer and a passionate about technology & entrepreneurship.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "A collection of articles on topics I am passionate about.",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Where I have worked and what I have done.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "A collection of my projects, with links to repositories and demos.",
};

export const SOCIALS: Socials = [
  {
    NAME: "x",
    HREF: "https://twitter.com/jorejasrojo",
  },
  {
    NAME: "github",
    HREF: "https://github.com/jorgeorejas",
  },
  {
    NAME: "linkedin",
    HREF: "https://www.linkedin.com/in/jorgeorejas/",
  },
];
