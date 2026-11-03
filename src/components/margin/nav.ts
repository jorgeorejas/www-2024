/** Sections of the numbered side nav */
export type NavKey = "home" | "projects" | "blog" | "work" | "games" | "cocina" | "wishlist";

export type NavItem = {
  key: NavKey;
  n: string;
  label: string;
  href: string;
  /** Rendered with a ↗, like a link that leaves the main site */
  outward?: boolean;
};

// Default order: the home page's own fallback (blog, projects, work), then
// the rest. With Notion up, orderedNav() follows the home page instead.
export const NAV_ITEMS: NavItem[] = [
  { key: "home", n: "00", label: "Inicio", href: "/" },
  { key: "blog", n: "01", label: "Blog", href: "/blog" },
  { key: "projects", n: "02", label: "Proyectos", href: "/projects" },
  { key: "work", n: "03", label: "Trayectoria", href: "/work" },
  { key: "cocina", n: "04", label: "Cocina", href: "/cocina" },
  { key: "games", n: "05", label: "Juegos", href: "/games", outward: true },
  { key: "wishlist", n: "06", label: "Wishlist", href: "/wishlist" },
];

type SectionOrder = { path: string; onHome: boolean; order: number };

/**
 * The nav in the same order as the home page: Inicio, then the sections shown
 * on the home page in their order ("En inicio" + "Orden" in Notion's
 * Secciones), then the rest by "Orden". Numbers follow the position.
 */
export function orderedNav(sections: SectionOrder[]): NavItem[] {
  const byPath = new Map(sections.map((s) => [s.path, s]));
  const rank = (item: NavItem, index: number) => {
    if (item.href === "/") return [0, 0];
    const section = byPath.get(item.href);
    if (section?.onHome) return [1, section.order];
    return [2, section?.order ?? 1000 + index];
  };
  return NAV_ITEMS.map((item, index) => ({ item, key: rank(item, index) }))
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1])
    .map(({ item }, i) => ({ ...item, n: String(i).padStart(2, "0") }));
}

/** The nav section a path belongs to, or null (e.g. /calendar) */
export function navKeyFor(pathname: string): NavKey | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  const item = NAV_ITEMS.find((i) => i.href !== "/" && (path === i.href || path.startsWith(`${i.href}/`)));
  return item?.key ?? null;
}
