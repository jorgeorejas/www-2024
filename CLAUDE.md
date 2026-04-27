# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal website built with Astro 5, deployed on Vercel. The site features a blog, projects showcase, work experience timeline, dynamic OG image generation, and Spotify integration showing currently playing music.

**Stack**: Astro 5 (SSR mode), TypeScript, React, Tailwind CSS 4, MDX

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

### Content Collections
Content is managed through Astro's content collections in `src/content/`:

- **blog**: Blog posts with optional `titleCorrection` field for the correction component
- **work**: Work experience with support for multiple roles per company
- **education**: Education timeline entries
- **projects**: Project showcase items with optional demo/repo URLs
- **blocks**: Reusable markdown blocks (bios, mottos, etc.)

All content schemas are defined in `src/content/config.ts`. Use Zod schemas when modifying collection structures.

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

1. **API Route**: `src/pages/api/spotify/now-playing.ts` - Server-side endpoint that uses OAuth refresh tokens to fetch current playback
2. **Component**: `src/components/SpotifyNowPlaying.astro` - Client-side component that polls the API every 30 seconds
3. **Auth Flow**: `src/pages/spotify-auth.astro` - OAuth callback page for initial setup

**Required Environment Variables** (see `.env.example`):
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`
- `SPOTIFY_REDIRECT_URI` (for initial auth only)

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
- Custom fonts: Instrument Serif (serif), Caveat (handwritten for corrections), Berkeley Mono (code/monospace)
- Global styles in `src/styles/global.css`
- Dark mode support via Tailwind's dark mode utilities

### Code Style
- ESLint configured for Astro and TypeScript
- Double quotes required (enforced by ESLint)
- Semicolons required
- TypeScript strict mode enabled

## Common Patterns

### Adding a New Blog Post
1. Create a new `.md` or `.mdx` file in `src/content/blog/`
2. Add frontmatter with required fields: `title`, `description`, `date`
3. Optional: Add `draft: true` to hide from production
4. Optional: Add `titleCorrection` for the correction component

### Adding a New Project
Similar to blog posts, but in `src/content/projects/` with optional `demoURL` and `repoURL` fields.

### Working with Content Collections
When querying collections, use Astro's `getCollection` and `getEntry` helpers:

```typescript
import { getCollection } from "astro:content";
const posts = await getCollection("blog", ({ data }) => !data.draft);
```

### Adding API Routes
API routes go in `src/pages/api/` and must return a `Response` object. The site is in SSR mode, so all routes are dynamic by default.

## Important Notes

- **Node Version**: Requires Node >= 20 and < 23 (specified in `package.json` engines)
- **Custom Remark Plugin**: The `remarkCorrection` plugin is registered in both `markdown` and `mdx` sections of `astro.config.mjs`
- **Vercel Configuration**: The site uses Vercel Web Analytics, enabled in the adapter config
- **ngrok Configuration**: Vite server is configured to allow ngrok domains for local testing with Spotify OAuth callbacks
- **Git Worktrees**: The project uses git worktrees (see `worktree/` directory) - avoid touching these
