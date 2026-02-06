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
    "A logbook of ideas, notes, and projects—written to think, not to perform.",
};

export const BLOG: Metadata = {
  TITLE: "Notes",
  DESCRIPTION: "Thinking on paper.",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Where I have worked.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "Things built.",
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
