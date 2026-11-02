/** Sections of the numbered side nav, in order */
export type NavKey = "home" | "projects" | "blog" | "work" | "games" | "cocina";

export type NavItem = {
  key: NavKey;
  n: string;
  label: string;
  href: string;
  /** Rendered with a ↗, like a link that leaves the main site */
  outward?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "home", n: "00", label: "Inicio", href: "/" },
  { key: "projects", n: "01", label: "Proyectos", href: "/projects" },
  { key: "blog", n: "02", label: "Blog", href: "/blog" },
  { key: "work", n: "03", label: "Trayectoria", href: "/work" },
  { key: "games", n: "04", label: "Juegos", href: "/games", outward: true },
  { key: "cocina", n: "05", label: "Cocina", href: "/cocina" },
];

/** The nav section a path belongs to, or null (e.g. /wishlist) */
export function navKeyFor(pathname: string): NavKey | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  const item = NAV_ITEMS.find((i) => i.href !== "/" && (path === i.href || path.startsWith(`${i.href}/`)));
  return item?.key ?? null;
}
