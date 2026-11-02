import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Jorge Orejas",
  POSITION: "Developer & Entrepreneur",
  EMAIL: "soy@jorgeorejas.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 2,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
  NUM_GAMES_ON_HOMEPAGE: 3,
  TWITTER_HANDLE: "@jorejasrojo",
  AUTHOR_NAME: "Jorge Orejas",
  LOCALE: "es_ES",
};

export const HOME: Metadata = {
  TITLE: "Inicio",
  DESCRIPTION: "Soy Jorge Orejas, desarrollador y emprendedor. Lo mío es la tecnología y montar cosas.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Escribo sobre lo que me tiene enganchado.",
};

export const WORK: Metadata = {
  TITLE: "Trayectoria",
  DESCRIPTION: "Dónde trabajé y qué hice en cada sitio.",
};

export const PROJECTS: Metadata = {
  TITLE: "Proyectos",
  DESCRIPTION: "Las cosas que monté, con enlaces al código y a las demos.",
};

export const WISHLIST: Metadata = {
  TITLE: "Lista de deseos",
  DESCRIPTION:
    "Ideas por si no sabes qué regalarme. Cada cosa lleva a la tienda donde comprarla, y lo que está marcado ya lo tengo.",
};

export const GAMES: Metadata = {
  TITLE: "Juegos",
  DESCRIPTION:
    "Juegos sencillos y sin anuncios, hechos para mi abuela y para cualquiera que solo quiera jugar.",
};

export const COCINA: Metadata = {
  TITLE: "La Cocina de Jorge",
  DESCRIPTION: "Las recetas que cocino para la familia y los amigos.",
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

/*
 * Everything above is the fallback. On each request the middleware reads the
 * "Ajustes" and "Secciones" databases in Notion and writes their values over
 * these objects, so components keep importing them as before. The values are
 * the same for every visitor, so sharing them across requests is safe.
 */

const SETTING_KEYS: Record<string, keyof Site> = {
  name: "NAME",
  position: "POSITION",
  email: "EMAIL",
  twitter_handle: "TWITTER_HANDLE",
};

const SOCIAL_ORDER = ["x", "github", "linkedin"];

/** Spanish position, used on the Spanish pages */
export const SITE_ES = { POSITION: "Desarrollador y emprendedor" };

export function applySettings(settings: { key: string; value: string; social: boolean }[]) {
  const socials: Socials = [];
  for (const { key, value, social } of settings) {
    if (social) socials.push({ NAME: key, HREF: value });
    else if (key === "position_es") SITE_ES.POSITION = value;
    else if (SETTING_KEYS[key]) Object.assign(SITE, { [SETTING_KEYS[key]]: value });
  }
  if (settings.some((s) => s.key === "name")) SITE.AUTHOR_NAME = SITE.NAME;
  // Known networks keep their usual order; new ones from Notion go last
  const rank = (name: string) => {
    const i = SOCIAL_ORDER.indexOf(name);
    return i === -1 ? SOCIAL_ORDER.length : i;
  };
  socials.sort((a, b) => rank(a.NAME) - rank(b.NAME));
  if (socials.length) SOCIALS.splice(0, SOCIALS.length, ...socials);
}

const SECTION_METADATA: Record<string, Metadata> = {
  "/": HOME,
  "/blog": BLOG,
  "/work": WORK,
  "/projects": PROJECTS,
  "/wishlist": WISHLIST,
  "/games": GAMES,
  "/cocina": COCINA,
};

const SECTION_COUNTS: Record<string, keyof Site> = {
  "/blog": "NUM_POSTS_ON_HOMEPAGE",
  "/work": "NUM_WORKS_ON_HOMEPAGE",
  "/projects": "NUM_PROJECTS_ON_HOMEPAGE",
  "/games": "NUM_GAMES_ON_HOMEPAGE",
};

export function applySections(
  sections: { path: string; title?: string; description?: string; homeCount?: number }[],
) {
  for (const section of sections) {
    const metadata = SECTION_METADATA[section.path];
    if (metadata && section.title) metadata.TITLE = section.title;
    if (metadata && section.description) metadata.DESCRIPTION = section.description;
    const count = SECTION_COUNTS[section.path];
    if (count && section.homeCount) Object.assign(SITE, { [count]: section.homeCount });
  }
}
