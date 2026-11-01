/**
 * Notion databases behind the site. They all live under the "jorgeorejas.com"
 * hub page in Notion, which is connected to the "My site" integration. Ids are
 * not secret.
 */
export const DATABASES = {
  blog: "da51003a30b04add924168390f691391",
  projects: "3be901ccafa64dd6b54960b9776491c0",
  companies: "3c353e4a2fd2448db47e4603d4b5ecde",
  roles: "fe237756379e448687babde2271190b2",
  education: "00423fca548c4fbca5de18041119d10f",
  blocks: "2fdedfb951aa4a07a5384156092a6a8e",
  recipes: "142014c5e077440abbdbd85217f64347",
  recipeTags: "0c1df33714d84a0fbfab29ba6de9a4f1",
  sections: "2c64c8ff35d742ef9da43ac09fea7826",
  settings: "2fa876cd6ea142c8b05003af7fe8288a",
  wishlist: "f808041afacd4c48aaffb96346652124",
} as const;

/** Data source ids, which is what newer Notion webhooks report as parent */
const DATA_SOURCES: Record<keyof typeof DATABASES, string> = {
  blog: "8d632fbf9a6d45b2a794b507972ad889",
  projects: "544d27010e7a40b38ea428d33dd7d536",
  companies: "918c951b2afc4c109c9beb6b1a05cbab",
  roles: "19921a1c523f48749111972776699b94",
  education: "b12cac957c5e4d329e6c46e966808638",
  blocks: "6c83d88dec114885a932bdb53a4539cc",
  recipes: "b4eb4a1bade449e9a3cf50078cd63b4d",
  recipeTags: "73bd2032caf74cb498dd1fdea3c1d46b",
  sections: "99ffcaa4315240f08617b29766b7945a",
  settings: "ad9c8e6507584cb78e7aa58e899bfb61",
  wishlist: "3941dea59f8447d9ba6961c6de6276c8",
};

export type DatabaseName = keyof typeof DATABASES;

/**
 * CDN cache tag for each database. Pages tag themselves with the tags of the
 * collections they read, and the Notion webhook invalidates by these tags.
 * Settings, sections and blocks show up on every page, so they map to the
 * catch-all tag.
 */
export const CACHE_TAGS: Record<DatabaseName, string> = {
  blog: "blog",
  projects: "projects",
  companies: "work",
  roles: "work",
  education: "education",
  blocks: "notion",
  recipes: "recipes",
  recipeTags: "recipes",
  sections: "notion",
  settings: "notion",
  wishlist: "wishlist",
};

/** Every page that reads Notion carries this tag */
export const ALL_NOTION = "notion";

const byId = new Map<string, DatabaseName>();
for (const name of Object.keys(DATABASES) as DatabaseName[]) {
  byId.set(DATABASES[name], name);
  byId.set(DATA_SOURCES[name], name);
}

/** Resolves a database or data source id (with or without dashes) */
export function databaseFromId(id: string | undefined): DatabaseName | undefined {
  return id ? byId.get(id.replaceAll("-", "")) : undefined;
}
