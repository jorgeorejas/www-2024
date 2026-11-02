# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website built with Astro 7, deployed on Vercel. The site features a blog, projects showcase, work experience timeline, dynamic OG image generation, and Spotify integration showing currently playing music.

**Stack**: Astro 7 (SSR mode), TypeScript, React, Tailwind CSS 4, MDX

## Language and voice

The site is in **Spanish (Spain)**: `html lang="es"`, `og:locale` `es_ES`, `inLanguage: "es"` in JSON-LD, dates with `es-ES` (`formatMonthYear` → "oct 2026", `formatDuration` → "1 año y 3 meses", `PRESENT_LABEL` → "actualidad" in `src/lib/utils.ts`). The `lang` prop on `PageLayout`/`MarginPage` (and Notion "Idioma" on Secciones) still exists, but defaults to `"es"`; English is only the opt-in branch.

Every string in code (labels, buttons, empty states, aria-labels, fallbacks in `src/consts.ts`) should sound like Jorge talking, not like a translation:
- First person, direct, warm, short sentences. Casual but public: no swearing, no "jajaja".
- Almost **no compound tenses** (Asturian Spanish): use the pretérito indefinido even for the recent past ("monté", "aprendí", "escribí"), never "he hecho" / "ha cambiado".
- Anglicisms he really uses are fine (startup, side project, build, deploy, feature, growth, IA). No calques ("hace sentido", "aplicar a"), no AI filler, no Title Case: Spanish titles use sentence case. Correct accents and ¿? / ¡!.
- Margin notes stay short, lowercase and playful; the `~~typo~~(fix)` correction joke keeps its parentheses.

Where the rules come from: `~/.claude/jorge-writing-style.md` and `~/.claude/skills/slack-reporter/references/voice.md` (his everyday voice and vocabulary). Developer-facing text (console logs, thrown errors, code comments, the `/calendar` JSON API) stays in English.

## Development Commands

```bash
# Start development server
pnpm dev

# Start dev server accessible on network (useful for testing on mobile)
pnpm dev:network

# Type-check and build for production
pnpm build

# Preview production build
pnpm preview

# Preview on network
pnpm preview:network

# Lint code
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

**Important**: This project uses **pnpm**, not npm. Always use `pnpm` for package management.

## Architecture & Key Concepts

### Rendering Mode
- The site uses **SSR (Server-Side Rendering)** with `output: "server"` in `astro.config.mjs`
- Deployed using `@astrojs/vercel` adapter
- This enables dynamic API routes and server-side features like the Spotify integration

### Content: Notion live collections
All content lives in Notion, under the hub page **jorgeorejas.com** (tabs: Inicio, Escribir, Trayectoria, Cocina, Wishlist, Web, Guía). There is no `src/content/` folder anymore.

- Collections are defined in `src/live.config.ts` as Astro **live collections**: read from Notion on each request, addressed by slug (`getLiveEntry("blog", { id: slug })`).
- One fetcher per database in `src/lib/notion/collections.ts`; property names are the Spanish Notion column names (Título, Slug, Descripción, Fecha, Publicado…). Rename a column in Notion → rename it there.
- Database ids: `src/lib/notion/databases.ts` (not secret). Collections: blog, projects, work (Empresas + Puestos), education, blocks, recipes, recipeTags, sections, settings, wishlist.
- Page bodies: Notion blocks → Markdown (`src/lib/notion/markdown.ts`) → the same remark pipeline as `astro.config.mjs` (`src/lib/notion/render.ts`), so the correction syntax still works.
- Drafts: "Publicado" unchecked → visible in `pnpm dev`, and in production with `?preview=true` on any URL (`src/lib/preview.ts`: the middleware marks the request, sends `no-store` + `noindex`, and internal links keep the param while browsing; set `PREVIEW_SECRET` to require a secret instead of `true`). Every Notion database has a "Web" formula column that links to the page: the plain URL when published, the preview URL when not.
- "Ajustes" (name, email, socials) and "Secciones" (page titles/descriptions, home blocks and order) are applied by `src/middleware.ts` over the defaults in `src/consts.ts`.
- Images hosted by Notion expire, so they go through `/api/notion-image/[...path]` (resized WebP via sharp, no EXIF).

### Caching and instant updates
Pages call `cachePage(Astro.response, tags, error)` from `src/lib/cache-headers.ts`: CDN keeps HTML 1 h, serves stale while revalidating, and up to a week if Notion fails. Responses carry `Vercel-Cache-Tag`. Notion webhooks reach `/api/notion/webhook` (via Vercel Connect, OIDC-verified) and call `invalidateByTag`.

### Cocina (recipes)
`/cocina`, `/cocina/[slug]`, `/cocina/etiqueta/[slug]`. Recipe bodies are split into intro / ingredients / steps / extra / gallery (`src/lib/notion/recipe.ts`); quantities are tagged for the servings scaler. Old `cocina.jorgeorejas.com` URLs are redirected by the middleware.

### Custom Markdown Correction Syntax
The site implements a unique inline correction feature for showing typos and corrections:

**Syntax**: `~~original text~~(correction text)`

**Example**: `I love ~~programing~~(programming).`

This is processed by a custom remark plugin (`src/lib/remark-correction.mjs`) that transforms the markdown into styled HTML. The strikethrough appears in blue with the correction in a handwritten font next to it.

There's also a `<Correction>` Astro component for titles/headings where the correction appears above the text with rotation.

See `docs/markdown-correction-spec.md` for full specification.

### Path Aliases
The project uses `@*` path aliases that map to `src/*`:

```typescript
import { SITE } from "@consts";
import BaseLayout from "@layouts/BaseLayout.astro";
```

### Spotify Integration
The site displays currently playing Spotify tracks in the footer via:

1. **API Route**: `src/pages/api/spotify/now-playing.ts` - Server-side endpoint that fetches current playback with a token from Vercel Connect (connector `spotify/www`, `src/lib/spotify.ts`); `/api/spotify/connect?key=<SPOTIFY_CONNECT_KEY>` re-authorizes Jorge's account
2. **Component**: `src/components/SpotifyNowPlaying.astro` - Client-side component that polls the API every 30 seconds
3. **Legacy auth page**: `src/pages/spotify-auth.astro` - dev-only page that mints an env refresh token (the fallback when Connect isn't available, e.g. locally)

**Environment Variables** (see `.env.example`; Notion reads `NOTION_TOKEN`, and Vercel Connect connector `notion/notion-www` delivers the webhooks):
- `SPOTIFY_CONNECT_KEY` (opens `/api/spotify/connect`; without it the route is a 404)
- Optional fallback for local development: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `SPOTIFY_REDIRECT_URI`

Setup instructions are in `SPOTIFY_SETUP.md`.

### Dynamic OG Images
OG (Open Graph) images are generated dynamically using Satori:

- Blog posts: `src/pages/og/blog/[...slug].png.ts`
- Projects: `src/pages/og/projects/[...slug].png.ts`
- General pages: Uses `src/components/OG.tsx` for the visual template

Images are generated at build time for static content and on-demand for SSR routes.

### Constants & Configuration
Site-wide configuration lives in `src/consts.ts`:
- Site metadata (name, email, position)
- Number of items shown on homepage
- Social links

This is the single source of truth for site configuration.

### Styling
- **Tailwind CSS 4** with `@tailwindcss/typography` for prose content
- Custom fonts: Instrument Serif (serif), Caveat (handwritten for corrections), Ioskeley Mono (code/monospace) — open-source Berkeley Mono lookalike, served from `public/fonts/IoskeleyMono`
- Global styles in `src/styles/global.css`
- Light only (dark mode code is kept but disabled)

### Margin design system
The redesign is called **Margin**: a left margin column (numbered side nav, vertical section labels with a drawn ↱, handwritten notes), a thin measuring ruler, and a content column (max 728px). Below 760px it collapses to one column (nav becomes a scrolling row, labels go horizontal, notes go inline above their item).
- Components: `src/components/margin/` — `MarginPage` (page shell, wraps `PageLayout` with `variant="margin"`), `Row` (margin slot + content), `SideNav`, `SectionLabel`, `SectionHead`, `ListRow` (TITLE ____ value rows), `Markers` (◆ pick / NEW), `Legend`, `MarginNote`, `NowNote`, `Crumbs`, `NowPlayingMini`, `MarginFooter`; `classes.ts` has the square selector buttons used on /wishlist.
- CSS: the `Margin` block at the end of `global.css` (`.m-*` classes, `.hn` hand notes, `.m-prose` for reading views incl. footnotes and corrections) plus tokens `signal` (Flexoki orange-500), `signal-ink` (orange-600), `pen` (blue-600), `rule`, `mute`, and the `mg:` breakpoint. Flexoki colours only; don't use `international-orange` in Margin pages.
- Classic element rules (`header`, `main`, `article` prose…) skip Margin pages (`body.margin-ui`), so pages not yet migrated keep working with `Container` + `Nav`.
- Margin notes and picks are content from Notion ("Nota al margen", "Destacado"/"Destacada"), never copy in code.
- Annotations: in a Notion body, give words the yellow background colour and leave a comment on them. The site draws a marker over the words, a pen bracket next to those lines and the comment as a hand note in the margin, animated the first time they scroll into view (`src/lib/notion/annotations.ts` reads the comments, `src/lib/annotate.ts` draws). Only Jorge's open comments show: resolving a comment hides its note, and a highlight without a comment is just the marker. The site's Notion token is read-only, and it only asks for comments on blocks that have a highlight.
- Dot grid (libreta punteada): faint dots every 27px behind every Margin page. One cell = one line of the 15px mono body = 3 characters (9px each), so every line sits between two rows of dots and titles take two rows. Keep vertical sizes in multiples of 27px (or 13.5px), and draw horizontal rules as shadows or backgrounds, not borders, because a 1px border shifts every row below it. The "Dot grid" block at the end of `global.css` sets the metrics; spacing in Margin templates should be `--g` multiples (`mt-(--g)`, `mt-[54px]`), not Tailwind's 4px steps. `src/lib/dot-grid-snap.js` nudges any block that still lands between rows (images, odd layouts): `PageLayout` inlines it so the first pass runs before the first paint (`rel="expect"` holds rendering), and `src/lib/dot-grid.ts` re-snaps on fonts, resize, media and navigations, then fires `dotgrid:snapped` so overlays redraw. Hand notes, pen corrections and vertical labels float free. Notion images carry `width`/`height` read from their file headers (`src/lib/notion/image-size.ts`), so they never push text when they load.
- List cards (`.m-card`, `data-sketch="left"`) and the project meta table get their rules from the architect's pen (`src/lib/sketch-rules.ts`): thin strokes that overshoot a few px and draw in on scroll.
- Ioskeley Mono in `public/fonts` is subset to Latin plus the symbols the site uses (~28 KB per weight) and preloaded in `Head.astro`. Re-subset with fontTools if a new symbol shows up in system fallback.
- A note (or an annotation comment) that ends in "→" (typed in Notion) gets a pen-drawn arrow instead (`HandArrow.astro`): it points right, at the content, in the margin, and curls down on phones, where the note sits above its item.

### Code Style
- ESLint configured for Astro and TypeScript
- Double quotes required (enforced by ESLint)
- Semicolons required
- TypeScript strict mode enabled

## Common Patterns

### Adding a Blog Post, Project or Recipe
Create a row in the matching Notion database, fill Slug/Descripción/Fecha, write the body, tick **Publicado**. No code or deploy needed.

### Reading content
```typescript
import { getLiveCollection, getLiveEntry } from "astro:content";
const { entries: posts = [], error } = await getLiveCollection("blog");
cachePage(Astro.response, ["blog"], error);
```
Render bodies with `<Fragment set:html={entry.rendered?.html} />`.

### Adding a collection
Create the database inside the Notion hub page, add its id to `src/lib/notion/databases.ts`, add a fetcher in `collections.ts`, define it in `live.config.ts`.

### Adding API Routes
API routes go in `src/pages/api/` and must return a `Response` object. The site is in SSR mode, so all routes are dynamic by default.

## Important Notes

- **Node Version**: Requires Node >= 22.22.0 (Astro 7 requirement, specified in `package.json` engines)
- **Custom Remark Plugin**: The `remarkCorrection` plugin is registered in `markdown.processor` in `astro.config.mjs` and again in `src/lib/notion/render.ts` for Notion bodies. Astro 7 defaults Markdown to the native Sätteri pipeline, so the config opts back into the remark/rehype processor via `unified()` from `@astrojs/markdown-remark` to keep the correction plugin working.
- **Vercel Configuration**: The site uses Vercel Web Analytics, enabled in the adapter config
- **ngrok Configuration**: Vite server is configured to allow ngrok domains for local testing with Spotify OAuth callbacks
- **Git Worktrees**: The project uses git worktrees (see `worktree/` directory) - avoid touching these
