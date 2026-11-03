import type { APIRoute } from "astro";
import { getLiveCollection, getLiveEntry } from "astro:content";
import { navKeyFor, orderedNav, type NavKey } from "@components/margin/nav";
import {
  applySections,
  applySettings,
  BLOG,
  COCINA,
  GAMES,
  HOME,
  PROJECTS,
  SITE,
  SITE_ES,
  WISHLIST,
  WORK,
} from "@consts";
import { cacheHeaders, isNotFound } from "@lib/cache-headers";
import { formatMinutes, servingsLabel, totalMinutes } from "@lib/cocina";
import { GAMES_LIST } from "@lib/games";
import type { OgCard } from "@lib/og/card";
import { cardPhoto, cardSvg, renderCard } from "@lib/og/render";
import {
  formatDuration,
  formatMonthYear,
  formatShortDate,
  formatYear,
  PRESENT_LABEL,
  processWorkEntry,
} from "@lib/utils";

/*
 * Share image of any page, drawn on request from Notion: /og/home.png for the
 * home page, /og/blog.png for a section, /og/blog/<slug>.png for an entry
 * (see src/lib/og/paths.ts). The CDN keeps it like the pages, and the Notion
 * webhook purges it by the same tags.
 */

type Content = Pick<
  OgCard,
  "title" | "correction" | "meta" | "description" | "note" | "rows"
> & {
  kind?: OgCard["kind"];
  photo?: string;
  tags: string[];
};

type Found = Content | "not-found" | { error: unknown };

/** "5 de noviembre de 2024", like the date under a post's title */
const longDate = (date: Date) =>
  date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const joined = (...parts: (string | false | undefined)[]) =>
  parts.filter(Boolean).join(" · ") || undefined;

type Rows = NonNullable<OgCard["rows"]>;
/** How many of a section's latest entries its card lists */
const LATEST = 3;

/** "2022 – 2024", "2025 – hoy", like the list of companies */
function years(start: Date | string, end: Date | string) {
  if (!(start instanceof Date)) return undefined;
  if (!(end instanceof Date)) return `${formatYear(start)} – hoy`;
  return formatYear(start) === formatYear(end)
    ? formatYear(start)
    : `${formatYear(start)} – ${formatYear(end)}`;
}

type Section = {
  title: () => string;
  description: () => string;
  tags: string[];
  /** The latest entries, for the card's list; an error fails the card */
  rows?: () => Promise<Rows | { error: unknown }>;
};

const SECTIONS: Record<string, Section> = {
  blog: {
    title: () => BLOG.TITLE,
    description: () => BLOG.DESCRIPTION,
    tags: ["blog"],
    rows: async () => {
      const { entries = [], error } = await getLiveCollection("blog");
      if (error) return { error };
      return entries.slice(0, LATEST).map((e) => ({
        title: e.data.titleCorrection ?? e.data.title,
        value: formatShortDate(e.data.date),
      }));
    },
  },
  projects: {
    title: () => PROJECTS.TITLE,
    description: () => PROJECTS.DESCRIPTION,
    tags: ["projects"],
    rows: async () => {
      const { entries = [], error } = await getLiveCollection("projects");
      if (error) return { error };
      return entries.slice(0, LATEST).map((e) => ({
        title: e.data.titleCorrection ?? e.data.title,
        value: formatYear(e.data.date),
      }));
    },
  },
  work: {
    title: () => WORK.TITLE,
    description: () => WORK.DESCRIPTION,
    tags: ["work"],
    rows: async () => {
      const { entries = [], error } = await getLiveCollection("work");
      if (error) return { error };
      return entries
        .map((e) =>
          processWorkEntry({ id: e.id, data: e.data, body: e.data.body }),
        )
        .sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate))
        .slice(0, LATEST)
        .map((w) => ({ title: w.name, value: years(w.startDate, w.endDate) }));
    },
  },
  cocina: {
    title: () => COCINA.TITLE,
    description: () => COCINA.DESCRIPTION,
    tags: ["recipes"],
    rows: async () => {
      const { entries = [], error } = await getLiveCollection("recipes");
      if (error) return { error };
      return entries
        .filter((e) => !e.data.draft)
        .sort((a, b) => +b.data.date - +a.data.date)
        .slice(0, LATEST)
        .map((e) => ({
          title: e.data.title,
          value: formatMinutes(totalMinutes(e.data)),
        }));
    },
  },
  wishlist: {
    title: () => WISHLIST.TITLE,
    description: () => WISHLIST.DESCRIPTION,
    tags: ["wishlist"],
  },
  games: {
    title: () => GAMES.TITLE,
    description: () => GAMES.DESCRIPTION,
    tags: [],
    rows: async () =>
      [...GAMES_LIST]
        .sort((a, b) => +b.date - +a.date)
        .slice(0, LATEST)
        .map((g) => ({ title: g.title, value: g.category })),
  },
};

async function blogPost(slug: string): Promise<Found> {
  const { entry, error } = await getLiveEntry("blog", { id: slug });
  if (error && !isNotFound(error)) return { error };
  if (!entry) return "not-found";
  const { data } = entry;
  return {
    title: data.title,
    correction: data.titleCorrection,
    meta: joined(longDate(data.date), data.readingTime),
    description: data.description,
    note: data.note,
    tags: ["blog", `blog:${slug}`],
  };
}

async function project(slug: string): Promise<Found> {
  const { entry, error } = await getLiveEntry("projects", { id: slug });
  if (error && !isNotFound(error)) return { error };
  if (!entry) return "not-found";
  const { data } = entry;
  return {
    title: data.title,
    correction: data.titleCorrection,
    meta: joined(formatMonthYear(data.date), data.readingTime),
    description: data.description,
    note: data.note,
    photo: data.image,
    tags: ["projects", `projects:${slug}`],
  };
}

async function company(slug: string): Promise<Found> {
  const { entry, error } = await getLiveEntry("work", { id: slug });
  if (error && !isNotFound(error)) return { error };
  if (!entry) return "not-found";
  const work = processWorkEntry({
    id: entry.id,
    data: entry.data,
    body: entry.data.body,
  });
  const start = work.startDate instanceof Date ? work.startDate : undefined;
  const end = work.endDate instanceof Date ? work.endDate : undefined;
  return {
    title: work.name,
    meta:
      start &&
      joined(
        `${formatMonthYear(start)} – ${end ? formatMonthYear(end) : PRESENT_LABEL}`,
        formatDuration(start, work.endDate),
      ),
    description:
      work.positions.map((p) => p.title).join(" · ") || work.description,
    tags: ["work", `work:${slug}`],
  };
}

async function recipe(slug: string): Promise<Found> {
  const { entry, error } = await getLiveEntry("recipes", { id: slug });
  if (error && !isNotFound(error)) return { error };
  if (!entry) return "not-found";
  const { data } = entry;
  const servings = data.servings ?? data.body?.servingsHint;
  return {
    title: data.title,
    meta: joined(
      servings ? servingsLabel(servings) : undefined,
      formatMinutes(totalMinutes(data)),
      data.difficulty,
    ),
    description: data.description,
    note: data.note,
    photo: data.image,
    tags: ["recipes", `recipes:${slug}`],
  };
}

async function recipeTag(slug: string): Promise<Found> {
  const [
    { entries: tags = [], error },
    { entries: recipes = [], error: recipesError },
  ] = await Promise.all([
    getLiveCollection("recipeTags"),
    getLiveCollection("recipes"),
  ]);
  if (error || recipesError) return { error: error ?? recipesError };
  const tag = tags.find((t) => t.id === slug)?.data;
  if (!tag) return "not-found";
  const count = recipes.filter(
    (r) => !r.data.draft && r.data.tags.some((t) => t.slug === slug),
  ).length;
  return {
    title: tag.name,
    meta: `${count} ${count === 1 ? "receta" : "recetas"}`,
    description: tag.description ?? COCINA.DESCRIPTION,
    tags: ["recipes"],
  };
}

function game(slug: string): Found {
  const found = GAMES_LIST.find((g) => g.href === `/games/${slug}`);
  if (!found) return "not-found";
  return {
    title: found.title,
    meta: joined(found.category, found.difficulty),
    description: found.description,
    tags: [],
  };
}

/** What the card for /og/<parts>.png shows */
async function content(parts: string[]): Promise<Found> {
  const [first, second, third] = parts;
  if (parts.length === 1 && first === "home") {
    return {
      kind: "home",
      title: SITE.NAME,
      description: HOME.DESCRIPTION,
      tags: [],
    };
  }
  if (parts.length === 1 && SECTIONS[first]) {
    const section = SECTIONS[first];
    const rows = await section.rows?.();
    if (rows && "error" in rows) return rows;
    return {
      title: section.title(),
      description: section.description(),
      rows,
      tags: section.tags,
    };
  }
  if (parts.length === 1) return blogPost(first); // the old /og/<post>.png
  if (parts.length === 2) {
    if (first === "blog") return blogPost(second);
    if (first === "projects") return project(second);
    if (first === "work") return company(second);
    if (first === "cocina") return recipe(second);
    if (first === "games") return game(second);
  }
  if (parts.length === 3 && first === "cocina" && second === "etiqueta")
    return recipeTag(third);
  return "not-found";
}

export const GET: APIRoute = async ({ params, url, site }) => {
  const parts = (params.path ?? "").split("/").filter(Boolean);

  // The middleware skips /og, so the Notion settings and sections (titles,
  // role, nav order) are applied here
  const [settings, sections] = await Promise.all([
    getLiveCollection("settings"),
    getLiveCollection("sections"),
  ]);
  if (!settings.error)
    applySettings((settings.entries ?? []).map((e) => e.data));
  const sectionData = sections.error
    ? []
    : (sections.entries ?? []).map((e) => e.data);
  applySections(sectionData);

  const found = await content(parts);
  if (found === "not-found") return new Response("Not found", { status: 404 });
  if ("error" in found) {
    console.error("[og] Notion failed:", found.error);
    return new Response("Unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // The page the card stands for, to mark its section in the nav (a lone
  // unknown segment is an old /og/<post>.png)
  const page =
    parts[0] === "home"
      ? "/"
      : parts.length === 1 && !SECTIONS[parts[0]]
        ? "/blog"
        : `/${parts.join("/")}`;
  const current: NavKey | null = navKeyFor(page);
  try {
    const card = {
      kind: found.kind ?? ("page" as const),
      nav: orderedNav(sectionData),
      current,
      name: SITE.NAME,
      role: SITE_ES.POSITION,
      host: (site ?? url).host.replace(/^www\./, ""),
      title: found.title,
      correction: found.correction,
      meta: found.meta,
      description: found.description,
      note: found.note,
      rows: found.rows,
      photo: await cardPhoto(found.photo, url.origin),
    } satisfies OgCard;
    // Dev only: ?svg answers satori's SVG, handy while working on the layout
    if (import.meta.env.DEV && url.searchParams.has("svg")) {
      return new Response(await cardSvg(card), {
        headers: { "Content-Type": "image/svg+xml" },
      });
    }
    const image = await renderCard(card);
    // Without Notion's settings and sections the card used the defaults: don't keep it
    const headers =
      settings.error || sections.error
        ? { "Cache-Control": "no-store" }
        : cacheHeaders(found.tags);
    return new Response(new Uint8Array(image), {
      headers: { "Content-Type": "image/png", ...headers },
    });
  } catch (error) {
    console.error("[og] render failed", error);
    return new Response("Internal server error", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
};
