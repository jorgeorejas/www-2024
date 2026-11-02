import { marginNotes } from "./annotations";
import { cached, cachedBody } from "./cache";
import { getBlockTree, queryDatabase, type NotionPage } from "./client";
import { DATABASES } from "./databases";
import { firstImageBlock, pageImage, blockImage } from "./images";
import { imageSizes } from "./image-size";
import { blocksToMarkdown, blocksToPlainText } from "./markdown";
import { pageEmoji, readProperties, slugify } from "./properties";
import {
  ingredientLines,
  ingredientsToMarkdown,
  splitRecipe,
  stepLines,
  stepsToMarkdown,
} from "./recipe";
import { renderMarkdown } from "./render";
import { showDrafts } from "../preview";

/*
 * One fetcher per Notion database. Property names are the Spanish ones used
 * in Notion; if you rename a column there, rename it here too.
 */

const pages = (name: keyof typeof DATABASES) =>
  cached(`db:${name}`, () => queryDatabase(DATABASES[name]));

const slugOf = (page: NotionPage) => {
  const p = readProperties(page);
  return p.text("Slug") ?? slugify(p.title());
};

/** Published, or anything at all locally and in a preview request */
const visible = (page: NotionPage) => showDrafts() || readProperties(page).checkbox("Publicado");

const startOfToday = () => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

// ---------------------------------------------------------------------------
// Bodies

export type Body = { markdown: string; html: string; text: string };

/** Short hash for cache keys */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

async function pageBody(page: NotionPage, skipBlockId?: string): Promise<Body> {
  const edited = `${page.id}:${page.last_edited_time}`;
  const blocks = await cachedBody(`tree:${edited}`, () => getBlockTree(page.id));
  // Comments don't bump the page's edit time, so notes are read on their own
  // (one request per highlighted block, none on most pages) and keyed in
  const notes = await cached(`notes:${page.id}`, () => marginNotes(blocks), 60_000);
  const notesKey = hash([...notes].flat().join("\u0000"));

  return cachedBody(`body:${edited}:${skipBlockId ?? ""}:${notesKey}`, async () => {
    // Read once per edit: images keep their space before they load
    const sizes = await cachedBody(`sizes:${edited}`, () => imageSizes(blocks));
    // The plain Markdown (llms.txt, .md routes) leaves the margin notes out
    const markdown = blocksToMarkdown(blocks, { skipBlockId, sizes });
    const annotated = notes.size ? blocksToMarkdown(blocks, { skipBlockId, notes, sizes }) : markdown;
    return { markdown, html: await renderMarkdown(annotated), text: blocksToPlainText(blocks) };
  });
}

export function readingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200 + 1))} min de lectura`;
}

// ---------------------------------------------------------------------------
// Blog

export type BlogPost = {
  notionId: string;
  title: string;
  titleCorrection?: string;
  description: string;
  date: Date;
  draft: boolean;
  /** Slugs of related projects */
  projects: string[];
  /** Jorge's pick (◆): optional checkbox "Destacado", false when the column is missing */
  pick: boolean;
  /** Hand note shown in the margin: optional text "Nota al margen" */
  note?: string;
  editedAt: Date;
};

export async function blogPosts() {
  const [posts, projectPages] = await Promise.all([pages("blog"), pages("projects")]);
  const projectSlug = new Map(projectPages.map((p) => [p.id, slugOf(p)]));
  const today = startOfToday();

  return posts
    .filter(visible)
    .map((page) => {
      const p = readProperties(page);
      const data: BlogPost = {
        notionId: page.id,
        title: p.title(),
        titleCorrection: p.text("Corrección del título"),
        description: p.text("Descripción") ?? "",
        date: p.date("Fecha") ?? new Date(page.created_time),
        draft: !p.checkbox("Publicado"),
        projects: p.relation("Proyectos").flatMap((id) => projectSlug.get(id) ?? []),
        pick: p.checkbox("Destacado"),
        note: p.text("Nota al margen"),
        editedAt: new Date(page.last_edited_time),
      };
      return { id: slugOf(page), page, data };
    })
    .filter((entry) => showDrafts() || entry.data.date <= today)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// ---------------------------------------------------------------------------
// Projects

export type Project = {
  notionId: string;
  title: string;
  titleCorrection?: string;
  description: string;
  date: Date;
  draft: boolean;
  hideFromCV: boolean;
  demoURL?: string;
  repoURL?: string;
  image?: string;
  /** Slug of the project this one evolved from, and of the one that replaced it */
  previous?: string;
  next?: string;
  /** Slugs of blog posts about this project */
  articles: string[];
  /** Jorge's pick (◆): optional checkbox "Destacado", false when the column is missing */
  pick: boolean;
  /** Hand note shown in the margin: optional text "Nota al margen" */
  note?: string;
  editedAt: Date;
};

export async function projects() {
  const [projectPages, posts] = await Promise.all([pages("projects"), pages("blog")]);
  const shown = projectPages.filter(visible);
  const slugs = new Map(shown.map((p) => [p.id, slugOf(p)]));
  const postSlugs = new Map(posts.filter(visible).map((p) => [p.id, slugOf(p)]));
  const first = <T>(ids: string[], map: Map<string, T>) =>
    ids.map((id) => map.get(id)).find((v) => v !== undefined);

  return shown
    .map((page) => {
      const p = readProperties(page);
      const data: Project = {
        notionId: page.id,
        title: p.title(),
        titleCorrection: p.text("Corrección del título"),
        description: p.text("Descripción") ?? "",
        date: p.date("Fecha") ?? new Date(page.created_time),
        draft: !p.checkbox("Publicado"),
        hideFromCV: p.checkbox("Ocultar en CV"),
        demoURL: p.url("Demo"),
        repoURL: p.url("Repositorio"),
        image: pageImage(page),
        previous: first(p.relation("Versión anterior"), slugs),
        next: first(p.relation("Versión siguiente"), slugs),
        articles: p.relation("Artículos").flatMap((id) => postSlugs.get(id) ?? []),
        pick: p.checkbox("Destacado"),
        note: p.text("Nota al margen"),
        editedAt: new Date(page.last_edited_time),
      };
      return { id: slugOf(page), page, data };
    })
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

// ---------------------------------------------------------------------------
// Work: companies with their roles

export type Role = {
  title: string;
  dateStart: Date;
  dateEnd: Date | "Present";
  description?: string;
};

export type Company = {
  notionId: string;
  company: string;
  website?: string;
  roles: Role[];
  /** Company description as plain text, for timelines and the CV */
  body: string;
};

export async function companies() {
  const [companyPages, rolePages] = await Promise.all([pages("companies"), pages("roles")]);

  const rolesByCompany = new Map<string, Role[]>();
  for (const page of rolePages) {
    const p = readProperties(page);
    const start = p.date("Inicio");
    if (!start) continue;
    const role: Role = {
      title: p.title(),
      dateStart: start,
      dateEnd: p.date("Fin") ?? "Present",
      description: p.text("Descripción"),
    };
    for (const companyId of p.relation("Empresa")) {
      rolesByCompany.set(companyId, [...(rolesByCompany.get(companyId) ?? []), role]);
    }
  }

  const entries = await Promise.all(
    companyPages.filter(visible).map(async (page) => {
      const p = readProperties(page);
      const body = await pageBody(page);
      const roles = (rolesByCompany.get(page.id) ?? []).sort(
        (a, b) => b.dateStart.valueOf() - a.dateStart.valueOf(),
      );
      const data: Company = {
        notionId: page.id,
        company: p.title(),
        website: p.url("Web"),
        roles,
        body: body.markdown,
      };
      return { id: slugOf(page), page, data, html: body.html };
    }),
  );

  const startOf = (c: Company) => Math.min(...c.roles.map((r) => r.dateStart.valueOf()));
  return entries
    .filter((entry) => entry.data.roles.length > 0)
    .sort((a, b) => startOf(b.data) - startOf(a.data));
}

// ---------------------------------------------------------------------------
// Education

export type Education = {
  notionId: string;
  institution: string;
  degree: string;
  field?: string;
  grade?: string;
  dateStart: Date;
  dateEnd: Date | "Present";
  expectedEnd?: Date;
  body: string;
};

export async function education() {
  const all = await pages("education");
  const entries = await Promise.all(
    all.filter(visible).map(async (page) => {
      const p = readProperties(page);
      const body = await pageBody(page);
      const data: Education = {
        notionId: page.id,
        institution: p.title(),
        degree: p.text("Titulación") ?? "",
        field: p.text("Especialidad"),
        grade: p.text("Nota"),
        dateStart: p.date("Inicio") ?? new Date(page.created_time),
        dateEnd: p.date("Fin") ?? "Present",
        expectedEnd: p.date("Fin previsto"),
        body: body.markdown,
      };
      return { id: slugify(data.institution), page, data };
    }),
  );
  const endOf = (e: Education) => (e.dateEnd === "Present" ? Date.now() : e.dateEnd.valueOf());
  return entries.sort((a, b) => endOf(b.data) - endOf(a.data));
}

// ---------------------------------------------------------------------------
// Reusable text blocks

export type TextBlock = { notionId: string; title: string };

export async function textBlocks() {
  const all = await pages("blocks");
  return all.filter(visible).map((page) => ({
    id: slugOf(page),
    page,
    data: { notionId: page.id, title: readProperties(page).title() } satisfies TextBlock,
  }));
}

// ---------------------------------------------------------------------------
// Recipes

export type RecipeTag = {
  notionId: string;
  name: string;
  slug: string;
  description?: string;
  emoji?: string;
};

export async function recipeTags() {
  const all = await pages("recipeTags");
  return all
    .map((page) => {
      const p = readProperties(page);
      const data: RecipeTag = {
        notionId: page.id,
        name: p.title(),
        slug: slugOf(page),
        description: p.text("Descripción"),
        emoji: pageEmoji(page),
      };
      return { id: data.slug, page, data };
    })
    .sort((a, b) => a.data.name.localeCompare(b.data.name, "es"));
}

export type Recipe = {
  notionId: string;
  title: string;
  description?: string;
  date: Date;
  draft: boolean;
  /** "Destacada": the favourite recipe */
  featured: boolean;
  /** Same as featured, named like blog posts and projects (◆) */
  pick: boolean;
  /** Hand note shown in the margin: optional text "Nota al margen" */
  note?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  difficulty?: "Fácil" | "Media" | "Difícil";
  tags: RecipeTag[];
  /** Cover image; falls back to the first photo in the page */
  image?: string;
  editedAt: Date;
};

export type RecipeBody = {
  intro: string;
  ingredients: string;
  steps: string;
  extra: string;
  gallery: string;
  ingredientLines: string[];
  stepLines: string[];
  servingsHint?: number;
  heroImage?: string;
  text: string;
};

export async function recipes() {
  const [recipePages, tags] = await Promise.all([pages("recipes"), recipeTags()]);
  const tagById = new Map(tags.map((t) => [t.data.notionId, t.data]));

  const entries = await Promise.all(
    recipePages.filter(visible).map(async (page) => {
      const p = readProperties(page);
      const difficulty = p.select("Dificultad");
      const data: Recipe = {
        notionId: page.id,
        title: p.title(),
        description: p.text("Descripción"),
        date: p.date("Fecha") ?? new Date(page.created_time),
        draft: !p.checkbox("Publicado"),
        featured: p.checkbox("Destacada"),
        pick: p.checkbox("Destacada"),
        note: p.text("Nota al margen"),
        servings: p.number("Raciones"),
        prepMinutes: p.number("Preparación (min)"),
        cookMinutes: p.number("Cocción (min)"),
        difficulty:
          difficulty === "Fácil" || difficulty === "Media" || difficulty === "Difícil"
            ? difficulty
            : undefined,
        tags: p.relation("Etiquetas").flatMap((id) => tagById.get(id) ?? []),
        // No cover: the first photo in the page (cached per edit) is the card image
        image: pageImage(page, 1280) ?? (await recipeHeroImage(page)),
        editedAt: new Date(page.last_edited_time),
      };
      return { id: slugOf(page), page, data };
    }),
  );
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** A recipe's blocks, fetched once per edit */
function recipeTree(page: NotionPage) {
  return cachedBody(`recipe-tree:${page.id}:${page.last_edited_time}`, () => getBlockTree(page.id));
}

/**
 * The card photo of a recipe without a cover: its first image. Only reads the
 * blocks, so the /cocina index doesn't render every recipe (and read the size
 * of every photo) just to find one picture.
 */
async function recipeHeroImage(page: NotionPage): Promise<string | undefined> {
  const hero = firstImageBlock(await recipeTree(page));
  return hero ? blockImage(hero, 1920) : undefined;
}

/** A recipe page split into its parts, rendered to HTML */
export async function recipeBody(page: NotionPage, hasCover: boolean): Promise<RecipeBody> {
  return cachedBody(`recipe:${page.id}:${page.last_edited_time}`, async () => {
    const blocks = await recipeTree(page);
    // No cover: the first photo becomes the hero and isn't repeated below
    const hero = hasCover ? undefined : firstImageBlock(blocks);
    const withoutHero = hero ? removeBlock(blocks, hero.id) : blocks;
    const parts = splitRecipe(withoutHero);
    const sizes = await imageSizes(withoutHero);
    const [intro, ingredients, steps, extra, gallery] = await Promise.all([
      renderMarkdown(blocksToMarkdown(parts.intro, { sizes })),
      renderMarkdown(ingredientsToMarkdown(parts.ingredients)),
      renderMarkdown(stepsToMarkdown(parts.steps)),
      renderMarkdown(blocksToMarkdown(parts.extra, { sizes })),
      renderMarkdown(blocksToMarkdown(parts.gallery, { sizes })),
    ]);
    return {
      intro,
      ingredients,
      steps,
      extra,
      gallery,
      ingredientLines: ingredientLines(parts.ingredients),
      stepLines: stepLines(parts.steps),
      servingsHint: parts.servingsHint,
      heroImage: hero ? blockImage(hero, 1920) : undefined,
      text: blocksToPlainText(withoutHero),
    };
  });
}

function removeBlock<T extends { id: string; children?: T[] }>(blocks: T[], id: string): T[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) =>
      block.children ? { ...block, children: removeBlock(block.children, id) } : block,
    );
}

// ---------------------------------------------------------------------------
// Sections and settings: the texts around the content

export type Section = {
  notionId: string;
  name: string;
  path: string;
  title?: string;
  description?: string;
  onHome: boolean;
  homeTitle?: string;
  homeLink?: string;
  homeCount?: number;
  order: number;
  lang: "en" | "es";
  /** Slugs of the text blocks shown in this section */
  blocks: string[];
};

export async function sections() {
  const [sectionPages, blockPages] = await Promise.all([pages("sections"), pages("blocks")]);
  const blockSlug = new Map(blockPages.map((p) => [p.id, slugOf(p)]));
  return sectionPages
    .map((page) => {
      const p = readProperties(page);
      const path = p.text("Ruta") ?? `/${slugify(p.title())}`;
      const data: Section = {
        notionId: page.id,
        name: p.title(),
        path,
        title: p.text("Título"),
        description: p.text("Descripción"),
        onHome: p.checkbox("En inicio"),
        homeTitle: p.text("Título en inicio"),
        homeLink: p.text("Enlace en inicio"),
        homeCount: p.number("Elementos en inicio"),
        order: p.number("Orden") ?? 99,
        // Spanish unless the section says otherwise ("Inglés")
        lang: p.select("Idioma") === "Inglés" ? "en" : "es",
        blocks: p.relation("Bloques").flatMap((id) => blockSlug.get(id) ?? []),
      };
      return { id: path, page, data };
    })
    .sort((a, b) => a.data.order - b.data.order);
}

export type Setting = { key: string; value: string; label: string; social: boolean };

export async function settings() {
  const all = await pages("settings");
  // Creation order is the order Jorge added them, e.g. socials in the footer
  const ordered = [...all].sort((a, b) => a.created_time.localeCompare(b.created_time));
  return ordered.flatMap((page) => {
    const p = readProperties(page);
    const key = p.text("Clave");
    const value = p.text("Valor");
    if (!key || !value) return [];
    const data: Setting = { key, value, label: p.title(), social: p.select("Tipo") === "Red social" };
    return [{ id: key, page, data }];
  });
}

export { pageBody };
