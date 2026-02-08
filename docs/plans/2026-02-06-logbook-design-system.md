# Logbook Design System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform jorgeorejas.com from a portfolio site into a logbook—a writing machine that breathes ambition, structure, and marginal enjoyment through disciplined typography, color, and layout.

**Architecture:** Typography-first redesign using Google Fonts (Bebas Neue for headers, IBM Plex Sans for body, Caveat for handwritten accents). Locked color palette (Ink Black, Paper White, Soft Gray, Orange Ink, Ballpoint Blue). Single-column vertical rhythm with no visual containers. Minimal motion, maximum readability.

**Tech Stack:** Astro 5, Tailwind CSS v4, Google Fonts (direct CSS imports), MDX

---

## Task 1: Remove Old Font Dependencies

**Files:**
- Modify: `package.json:22-25`
- Modify: `src/layouts/PageLayout.astro:5-7`

**Context:** The site currently uses @fontsource packages. We're switching to Google Fonts for Bebas Neue, IBM Plex Sans, and Caveat. Need to clean up old dependencies and imports.

**Step 1: Remove fontsource packages from dependencies**

```bash
npm uninstall @fontsource-variable/caveat @fontsource/ibm-plex-mono @fontsource/inter @fontsource/lora
```

Expected: Packages removed from package.json and node_modules

**Step 2: Remove fontsource imports from PageLayout**

In `src/layouts/PageLayout.astro`, remove lines 6-7:
```astro
import "@fontsource-variable/caveat";
import "@fontsource/ibm-plex-mono";
```

**Step 3: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds (fonts won't be loaded yet, but no errors)

**Step 4: Commit font dependency cleanup**

```bash
git add package.json package-lock.json src/layouts/PageLayout.astro
git commit -m "refactor: remove old fontsource dependencies for google fonts migration"
```

---

## Task 2: Add Google Fonts to Head Component

**Files:**
- Modify: `src/components/Head.astro`

**Context:** We need to load three Google Fonts: Bebas Neue (display), IBM Plex Sans (body, weights 400+500), and Caveat (handwritten). Google Fonts provides optimized CSS with font-display: swap.

**Step 1: Read current Head component**

```bash
cat src/components/Head.astro
```

**Step 2: Add Google Fonts preconnect and stylesheet**

Add these `<link>` tags in the `<head>` section of `src/components/Head.astro`, right after the charset meta tag:

```astro
<!-- Google Fonts Preconnect -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Google Fonts Stylesheet -->
<link
  href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500&family=Caveat&display=swap"
  rel="stylesheet"
/>
```

**Rationale:**
- `preconnect` reduces DNS lookup time
- Single stylesheet request loads all three fonts
- `display=swap` prevents invisible text during load
- Bebas Neue: no weight specified (only Regular exists)
- IBM Plex Sans: weights 400 (Regular) and 500 (Medium)
- Caveat: Variable font, no weight needed

**Step 3: Verify fonts load in browser**

```bash
npm run dev
```

Open browser DevTools → Network → Filter by "fonts.googleapis" → should see stylesheet loaded

**Step 4: Commit Google Fonts integration**

```bash
git add src/components/Head.astro
git commit -m "feat: add google fonts (bebas neue, ibm plex sans, caveat)"
```

---

## Task 3: Define Typography System in Tailwind Config

**Files:**
- Modify: `src/styles/global.css:4-8`

**Context:** Replace current font variable definitions with our three Google Fonts. Bebas Neue for display (headers), IBM Plex Sans for sans (body), Caveat for handwritten (accents). Remove unused mono font.

**Step 1: Update font variables in global.css @theme**

Replace lines 5-8 in `src/styles/global.css` with:

```css
@theme {
  --font-display: "Bebas Neue", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --font-handwritten: "Caveat", cursive, ui-sans-serif;

  --color-international-orange: #FF4F00;

  --spacing-full: 100%;
}
```

**Rationale:**
- `--font-display`: Bebas Neue for headers (uppercase, condensed, ambitious)
- `--font-sans`: IBM Plex Sans for body text (neutral, technical, readable)
- `--font-handwritten`: Caveat for marginal notes (personal, human trace)
- Removed `--font-serif` and `--font-mono` (not needed in logbook design)
- Orange color already defined correctly as #FF4F00

**Step 2: Update Tailwind config to expose display font**

In `tailwind.config.mjs`, add theme extension:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        handwritten: ["var(--font-handwritten)"],
      },
    },
  },
};
```

**Step 3: Test font application**

```bash
npm run dev
```

Open site → inspect text → should see IBM Plex Sans applied

**Step 4: Commit typography system**

```bash
git add src/styles/global.css tailwind.config.mjs
git commit -m "feat: define typography system with bebas neue, ibm plex sans, caveat"
```

---

## Task 4: Define Color System in Global CSS

**Files:**
- Modify: `src/styles/global.css:10,15-28`

**Context:** Lock in the color palette: Ink Black (#0B0B0B), Paper White (#F7F6F3), Soft Gray (#8A8A8A), Orange Ink (#FF4F00), Ballpoint Blue (#3300FF). High contrast but softened, no pure black/white.

**Step 1: Define color variables in @theme**

Update `src/styles/global.css` @theme section to include all colors:

```css
@theme {
  --font-display: "Bebas Neue", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --font-handwritten: "Caveat", cursive, ui-sans-serif;

  /* Core Colors */
  --color-ink-black: #0B0B0B;
  --color-paper-white: #F7F6F3;
  --color-soft-gray: #8A8A8A;

  /* Accent Colors */
  --color-orange-ink: #FF4F00;
  --color-ballpoint-blue: #3300FF;

  --spacing-full: 100%;
}
```

**Step 2: Update root and dark mode backgrounds**

Replace lines 15-28 in `src/styles/global.css`:

```css
:root {
  --bg-color: var(--color-paper-white);
  --text-color: var(--color-ink-black);
}

html {
  overflow-y: scroll;
  color-scheme: light;
  background-color: var(--bg-color);
  color: var(--text-color);
}

html.dark {
  color-scheme: dark;
  --bg-color: var(--color-ink-black);
  --text-color: var(--color-paper-white);
}
```

**Rationale:**
- Light mode: Paper White background (#F7F6F3), Ink Black text (#0B0B0B)
- Dark mode: Inverted (Ink Black bg, Paper White text)
- Soft Gray for secondary metadata
- Orange Ink for editorial marks (dates, categories, emphasis)
- Ballpoint Blue for handwritten annotations (rare, intentional)

**Step 3: Add Tailwind color extensions**

Add to `tailwind.config.mjs` theme.extend:

```js
colors: {
  "ink-black": "var(--color-ink-black)",
  "paper-white": "var(--color-paper-white)",
  "soft-gray": "var(--color-soft-gray)",
  "orange-ink": "var(--color-orange-ink)",
  "ballpoint-blue": "var(--color-ballpoint-blue)",
},
```

**Step 4: Verify color application**

```bash
npm run dev
```

Background should be Paper White, text Ink Black

**Step 5: Commit color system**

```bash
git add src/styles/global.css tailwind.config.mjs
git commit -m "feat: lock in logbook color palette (ink black, paper white, accent colors)"
```

---

## Task 5: Update Body Typography Styles

**Files:**
- Modify: `src/styles/global.css:30-61`

**Context:** Switch body text to IBM Plex Sans, remove font-mono references. Ensure article prose uses correct font and color hierarchy.

**Step 1: Update body base styles**

Replace lines 36-40 in `src/styles/global.css`:

```css
body {
  @apply size-full font-sans antialiased;
  @apply flex flex-col;
  @apply text-ink-black dark:text-paper-white;
}
```

**Step 2: Update article prose styles**

Replace lines 56-61:

```css
article {
  @apply max-w-full prose dark:prose-invert prose-img:mx-auto prose-img:my-auto;
  @apply prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wide;
  @apply prose-p:font-sans prose-p:leading-relaxed;
  @apply prose-headings:text-ink-black prose-headings:dark:text-paper-white;
  @apply prose-p:text-ink-black prose-p:dark:text-paper-white;
}
```

**Rationale:**
- Body uses `font-sans` (IBM Plex Sans), not `font-mono`
- Article headings use `font-display` (Bebas Neue) with uppercase
- Tracking-wide for Bebas Neue letter-spacing (+0.04em to +0.06em)
- Leading-relaxed for body readability
- Colors use new variables

**Step 3: Update article link styles**

Replace lines 64-72:

```css
@layer utilities {
  article a {
    @apply font-sans text-current underline underline-offset-2;
    @apply decoration-soft-gray/40 dark:decoration-soft-gray/50;
    @apply transition-colors duration-300 ease-in-out;
  }
  article a:hover {
    @apply text-orange-ink dark:text-orange-ink;
    @apply decoration-orange-ink/60;
  }
}
```

**Rationale:**
- Links underlined with Soft Gray
- Hover reveals Orange Ink (editorial mark)
- Maintains readability, adds subtle personality

**Step 4: Test typography in article**

```bash
npm run dev
```

Navigate to any blog post → headings should be Bebas Neue uppercase, body IBM Plex Sans

**Step 5: Commit body typography update**

```bash
git add src/styles/global.css
git commit -m "refactor: apply logbook typography (bebas neue headers, ibm plex sans body)"
```

---

## Task 6: Update Selection and Header Styles

**Files:**
- Modify: `src/styles/global.css:42-46,75-77`

**Context:** Selection should use Orange Ink. Header should use Paper White background for consistency.

**Step 1: Update header background**

Replace lines 42-46:

```css
header {
  @apply fixed top-0 left-0 right-0 z-50 py-5;
  background-color: var(--color-paper-white);
}

html.dark header {
  background-color: var(--color-ink-black);
}
```

**Step 2: Update selection style**

Replace lines 75-77:

```css
::selection {
  @apply bg-orange-ink/80 text-paper-white;
}
```

**Rationale:**
- Header uses Paper White bg (light), Ink Black bg (dark)
- Selection uses Orange Ink highlight (editorial mark feeling)
- Text contrasts with orange background

**Step 3: Verify styles**

```bash
npm run dev
```

Select text → should highlight with orange

**Step 4: Commit header and selection styles**

```bash
git add src/styles/global.css
git commit -m "style: update header and selection with logbook colors"
```

---

## Task 7: Create Handwritten Annotation Component

**Files:**
- Create: `src/components/HandwrittenNote.astro`

**Context:** Marginal notes and asides need Caveat font styling. This component provides semantic HTML for handwritten accents (micro-enjoyment).

**Step 1: Create HandwrittenNote component**

Create `src/components/HandwrittenNote.astro`:

```astro
---
export interface Props {
  class?: string;
}

const { class: className } = Astro.props;
---

<span
  class:list={[
    "font-handwritten text-ballpoint-blue dark:text-ballpoint-blue",
    "text-sm leading-tight",
    "inline-block",
    className,
  ]}
>
  <slot />
</span>
```

**Rationale:**
- Uses `font-handwritten` (Caveat)
- Ballpoint Blue color (feels like margin notes)
- Small size (text-sm)
- Inline-block for natural flow
- Accepts custom classes for positioning

**Step 2: Create example usage in a content block**

Update `src/content/blocks/bio.mdx` to include a handwritten note:

```mdx
import HandwrittenNote from "@components/HandwrittenNote.astro";

[Existing bio content...]

<HandwrittenNote class="ml-2">← This is enjoyment in the margins</HandwrittenNote>
```

**Step 3: Test handwritten note**

```bash
npm run dev
```

Homepage bio should show blue Caveat note

**Step 4: Commit handwritten component**

```bash
git add src/components/HandwrittenNote.astro src/content/blocks/bio.mdx
git commit -m "feat: add handwritten note component for marginal annotations"
```

---

## Task 8: Redesign Homepage Layout (Single Column)

**Files:**
- Modify: `src/pages/index.astro:49-100`

**Context:** Remove visual containers, apply single-column vertical rhythm. Sections separated by spacing, not borders/boxes. Headings use Bebas Neue uppercase.

**Step 1: Update section headings to use display font**

Replace section heading styles in `src/pages/index.astro`:

```astro
<section class="space-y-8">
  <div class="flex flex-wrap gap-y-2 items-center justify-between">
    <h2 class="font-display uppercase tracking-wider text-3xl text-ink-black dark:text-paper-white">
      Latest posts
    </h2>
    <AnimatedLink href="/blog"> See all posts </AnimatedLink>
  </div>
  <ul class="flex flex-col gap-4">
    {
      blog.map((post) => (
        <li>
          <ArrowCard entry={post} dateFormat="day" />
        </li>
      ))
    }
  </ul>
</section>
```

Apply same pattern to "Recent projects" (line ~72-88) and "Work Experience" (line ~90-98).

**Step 2: Update opening section**

Replace lines 50-52:

```astro
<section class="space-y-6">
  <ContentBlock slug="bio" class="space-y-4 leading-relaxed" />
</section>
```

**Step 3: Increase vertical spacing between sections**

Replace line 49:

```astro
<div class="space-y-24">
```

**Rationale:**
- `font-display` applies Bebas Neue
- `uppercase` + `tracking-wider` follows design spec
- `space-y-24` creates clear separation (was space-y-20)
- No boxes, cards, or borders—just stacked content

**Step 4: Test homepage layout**

```bash
npm run dev
```

Homepage should feel vertical, breathable, no containers

**Step 5: Commit homepage layout redesign**

```bash
git add src/pages/index.astro
git commit -m "refactor: apply single-column logbook layout to homepage"
```

---

## Task 9: Update ArrowCard Component Typography

**Files:**
- Modify: `src/components/ArrowCard.astro`

**Context:** ArrowCard displays blog posts/projects. Needs IBM Plex Sans body, Orange Ink dates, Soft Gray metadata, no boxes.

**Step 1: Read current ArrowCard**

```bash
cat src/components/ArrowCard.astro
```

**Step 2: Update typography and colors**

Key changes to make in `src/components/ArrowCard.astro`:
- Title should use `font-sans` (IBM Plex Sans, not serif)
- Date should use `text-orange-ink` (editorial mark)
- Description should use `text-soft-gray`
- Remove any border/background styles
- Remove hover background changes

Example markup (adapt to current structure):

```astro
<a href={`/${entry.collection}/${entry.slug}`} class="block group space-y-2 py-4">
  <div class="flex items-baseline justify-between gap-4">
    <h3 class="font-sans font-medium text-lg text-ink-black dark:text-paper-white group-hover:text-orange-ink transition-colors">
      {entry.data.title}
    </h3>
    <time class="font-sans text-sm text-orange-ink uppercase tracking-wide">
      <FormattedDate date={entry.data.date} format={dateFormat} />
    </time>
  </div>
  {entry.data.description && (
    <p class="font-sans text-sm text-soft-gray leading-relaxed">
      {entry.data.description}
    </p>
  )}
</a>
```

**Rationale:**
- No boxes/cards—just vertical stacking
- Orange dates (editorial emphasis)
- Soft Gray descriptions (secondary info)
- Hover changes title to orange (subtle interaction)
- Uppercase, tracked dates feel like logbook entries

**Step 3: Test ArrowCard appearance**

```bash
npm run dev
```

Homepage blog/project cards should be flat, no backgrounds

**Step 4: Commit ArrowCard redesign**

```bash
git add src/components/ArrowCard.astro
git commit -m "refactor: apply logbook typography and colors to arrowcard"
```

---

## Task 10: Update Navigation Component

**Files:**
- Modify: `src/components/Nav.astro`

**Context:** Navigation should be minimal, clean, IBM Plex Sans. Links use Soft Gray, hover shows Orange Ink. No decoration except on hover.

**Step 1: Read current Nav component**

```bash
cat src/components/Nav.astro
```

**Step 2: Update navigation styles**

Update link styles in `src/components/Nav.astro`:

```astro
<nav class="flex items-center gap-6">
  {navLinks.map(link => (
    <a
      href={link.href}
      class="font-sans text-sm text-soft-gray hover:text-orange-ink transition-colors uppercase tracking-wide"
    >
      {link.label}
    </a>
  ))}
</nav>
```

**Step 3: Update site title/logo styling**

If there's a site title/logo in Nav:

```astro
<a href="/" class="font-display text-2xl uppercase tracking-wider text-ink-black dark:text-paper-white">
  {SITE.NAME}
</a>
```

**Rationale:**
- Site name uses Bebas Neue (display font)
- Nav links use IBM Plex Sans, uppercase, tracked
- Soft Gray default, Orange Ink hover (editorial mark)
- Minimal, functional, no decoration

**Step 4: Test navigation**

```bash
npm run dev
```

Nav should be clean, hover shows orange

**Step 5: Commit navigation redesign**

```bash
git add src/components/Nav.astro
git commit -m "refactor: apply logbook styling to navigation"
```

---

## Task 11: Update Footer Component

**Files:**
- Modify: `src/components/Footer.astro`

**Context:** Footer should be quiet, using Soft Gray text, IBM Plex Sans. Minimal decoration, single line preferred.

**Step 1: Read current Footer**

```bash
cat src/components/Footer.astro
```

**Step 2: Update footer styles**

Update `src/components/Footer.astro`:

```astro
<footer class="py-8 border-t border-soft-gray/20">
  <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-soft-gray">
    <p class="font-sans">
      © {new Date().getFullYear()} {SITE.NAME}
    </p>
    <nav class="flex gap-4">
      {SOCIALS.map(social => (
        <a
          href={social.HREF}
          target="_blank"
          rel="noopener noreferrer"
          class="font-sans hover:text-orange-ink transition-colors uppercase tracking-wide"
        >
          {social.NAME}
        </a>
      ))}
    </nav>
  </div>
</footer>
```

**Rationale:**
- Soft Gray text (secondary)
- Thin top border (subtle separation)
- Social links hover to Orange Ink
- Uppercase, tracked links (consistent with nav)
- Quiet, doesn't compete with content

**Step 3: Test footer**

```bash
npm run dev
```

Footer should be understated, grey, clean

**Step 4: Commit footer redesign**

```bash
git add src/components/Footer.astro
git commit -m "style: apply logbook styling to footer"
```

---

## Task 12: Create Logbook Divider Component

**Files:**
- Create: `src/components/LogbookDivider.astro`

**Context:** Occasional small orange marks between sections (micro-enjoyment). Not decoration—feels like editorial correction marks.

**Step 1: Create LogbookDivider component**

Create `src/components/LogbookDivider.astro`:

```astro
---
export interface Props {
  class?: string;
}

const { class: className } = Astro.props;
---

<div class:list={["flex items-center gap-2 my-12", className]}>
  <span class="block w-8 h-0.5 bg-orange-ink"></span>
  <span class="block w-2 h-0.5 bg-orange-ink"></span>
</div>
```

**Rationale:**
- Small orange marks (editorial feeling)
- Not centered—left-aligned like notes
- Subtle, rare usage
- Feels intentional, not decorative

**Step 2: Add divider to homepage between sections**

In `src/pages/index.astro`, add between major sections:

```astro
<section>
  <ContentBlock slug="bio" class="space-y-4 leading-relaxed" />
</section>

<LogbookDivider />

<section class="space-y-8">
  <div class="flex flex-wrap gap-y-2 items-center justify-between">
    <h2 class="font-display uppercase tracking-wider text-3xl text-ink-black dark:text-paper-white">
      Latest posts
    </h2>
    ...
```

Import at top:
```astro
import LogbookDivider from "@components/LogbookDivider.astro";
```

**Step 3: Test divider appearance**

```bash
npm run dev
```

Small orange marks should appear between sections

**Step 4: Commit logbook divider**

```bash
git add src/components/LogbookDivider.astro src/pages/index.astro
git commit -m "feat: add logbook divider component for editorial marks"
```

---

## Task 13: Update Blog List Page Layout

**Files:**
- Modify: `src/pages/blog/index.astro`

**Context:** Blog list should follow same vertical rhythm as homepage. Bebas Neue title, Orange Ink dates, single column.

**Step 1: Read current blog index**

```bash
cat src/pages/blog/index.astro
```

**Step 2: Update page title**

```astro
<h1 class="font-display uppercase tracking-wider text-5xl text-ink-black dark:text-paper-white mb-12">
  {BLOG.TITLE}
</h1>
```

**Step 3: Update blog list structure**

```astro
<ul class="space-y-6">
  {posts.map((post) => (
    <li>
      <ArrowCard entry={post} dateFormat="day" />
    </li>
  ))}
</ul>
```

**Rationale:**
- Large Bebas Neue title (structural anchor)
- Uppercase, tracked (design spec)
- Increased spacing (space-y-6 instead of space-y-4)
- Relies on updated ArrowCard styles

**Step 4: Test blog list page**

```bash
npm run dev
```

Navigate to /blog → should match homepage aesthetic

**Step 5: Commit blog list redesign**

```bash
git add src/pages/blog/index.astro
git commit -m "refactor: apply logbook layout to blog list page"
```

---

## Task 14: Update Projects List Page Layout

**Files:**
- Modify: `src/pages/projects/index.astro`

**Context:** Same treatment as blog list—Bebas Neue title, vertical rhythm, single column.

**Step 1: Read current projects index**

```bash
cat src/pages/projects/index.astro
```

**Step 2: Update page title**

```astro
<h1 class="font-display uppercase tracking-wider text-5xl text-ink-black dark:text-paper-white mb-12">
  {PROJECTS.TITLE}
</h1>
```

**Step 3: Update projects list structure**

```astro
<ul class="space-y-6">
  {projects.map((project) => (
    <li>
      <ArrowCard entry={project} />
    </li>
  ))}
</ul>
```

**Step 4: Test projects list page**

```bash
npm run dev
```

Navigate to /projects → should match blog aesthetic

**Step 5: Commit projects list redesign**

```bash
git add src/pages/projects/index.astro
git commit -m "refactor: apply logbook layout to projects list page"
```

---

## Task 15: Update Work Page Layout

**Files:**
- Modify: `src/pages/work/index.astro`
- Modify: `src/components/WorkTimeline.astro`

**Context:** Work experience should feel like logbook entries—vertical timeline with Orange Ink dates, Soft Gray metadata, Bebas Neue titles.

**Step 1: Read current work index and timeline**

```bash
cat src/pages/work/index.astro
cat src/components/WorkTimeline.astro
```

**Step 2: Update work page title**

In `src/pages/work/index.astro`:

```astro
<h1 class="font-display uppercase tracking-wider text-5xl text-ink-black dark:text-paper-white mb-12">
  {WORK.TITLE}
</h1>
```

**Step 3: Update WorkTimeline component styles**

In `src/components/WorkTimeline.astro`, update typography:

- Company names: `font-sans font-medium text-xl`
- Role titles: `font-sans text-base text-ink-black dark:text-paper-white`
- Dates: `font-sans text-sm text-orange-ink uppercase tracking-wide`
- Descriptions: `font-sans text-sm text-soft-gray leading-relaxed`

Remove timeline dots/lines if present—keep it simple vertical stacking.

**Step 4: Test work page**

```bash
npm run dev
```

Navigate to /work → should feel like structured logbook

**Step 5: Commit work page redesign**

```bash
git add src/pages/work/index.astro src/components/WorkTimeline.astro
git commit -m "refactor: apply logbook layout to work experience page"
```

---

## Task 16: Update Individual Blog Post Layout

**Files:**
- Modify: `src/pages/blog/[slug].astro` (or equivalent blog post layout file)

**Context:** Individual blog posts need proper article typography. Bebas Neue headers, IBM Plex Sans body, Orange Ink accents, short line length for readability.

**Step 1: Find blog post layout file**

```bash
find src/pages/blog -name "*.astro" | grep -v index
```

**Step 2: Update post header**

Update blog post title and metadata:

```astro
<article class="max-w-prose mx-auto space-y-8">
  <header class="space-y-4">
    <h1 class="font-display uppercase tracking-wider text-4xl text-ink-black dark:text-paper-white">
      {post.data.title}
    </h1>
    <div class="flex items-center gap-4 text-sm">
      <time class="font-sans text-orange-ink uppercase tracking-wide">
        <FormattedDate date={post.data.date} />
      </time>
      {post.data.category && (
        <span class="font-sans text-soft-gray">
          {post.data.category}
        </span>
      )}
    </div>
  </header>

  <div class="prose prose-lg">
    <Content />
  </div>
</article>
```

**Rationale:**
- `max-w-prose` enforces short line length (design spec)
- Bebas Neue title (structural anchor)
- Orange date (editorial mark)
- Soft Gray category (secondary metadata)
- Prose styles already updated in Task 5

**Step 3: Test individual blog post**

```bash
npm run dev
```

Open any blog post → should feel like reading a notebook

**Step 4: Commit blog post layout**

```bash
git add src/pages/blog/[slug].astro
git commit -m "refactor: apply logbook typography to blog post layout"
```

---

## Task 17: Update Individual Project Layout

**Files:**
- Modify: `src/pages/projects/[slug].astro` (or equivalent)

**Context:** Same treatment as blog posts—Bebas Neue title, structured metadata, readable body.

**Step 1: Find project layout file**

```bash
find src/pages/projects -name "*.astro" | grep -v index
```

**Step 2: Update project header**

```astro
<article class="max-w-prose mx-auto space-y-8">
  <header class="space-y-4">
    <h1 class="font-display uppercase tracking-wider text-4xl text-ink-black dark:text-paper-white">
      {project.data.title}
    </h1>
    <div class="flex items-center gap-4 text-sm">
      <time class="font-sans text-orange-ink uppercase tracking-wide">
        <FormattedDate date={project.data.date} />
      </time>
      {project.data.technologies && (
        <div class="flex gap-2">
          {project.data.technologies.map(tech => (
            <span class="font-sans text-soft-gray">
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  </header>

  <div class="prose prose-lg">
    <Content />
  </div>
</article>
```

**Step 3: Test individual project page**

```bash
npm run dev
```

Open any project → should match blog post aesthetic

**Step 4: Commit project layout**

```bash
git add src/pages/projects/[slug].astro
git commit -m "refactor: apply logbook typography to project layout"
```

---

## Task 18: Remove Noise Texture Overlay

**Files:**
- Modify: `src/layouts/PageLayout.astro:29-33`

**Context:** Current site has a noise texture overlay. Logbook design is clean—no visual effects that compete with reading. Remove it.

**Step 1: Remove noise overlay div**

Delete lines 29-33 from `src/layouts/PageLayout.astro`:

```astro
<div
  class="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.025]"
  style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 /%3E%3C/filter%3E%3Crect width=%22300%22 height=%22300%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E');"
>
</div>
```

**Rationale:**
- Design spec: "No visual tricks"
- "If something looks good but slows reading, it is wrong"
- Paper White background is sufficient

**Step 2: Verify clean background**

```bash
npm run dev
```

Background should be solid Paper White, no texture

**Step 3: Commit noise removal**

```bash
git add src/layouts/PageLayout.astro
git commit -m "remove: delete noise texture overlay for clean logbook aesthetic"
```

---

## Task 19: Update AnimatedLink Component

**Files:**
- Modify: `src/components/AnimatedLink.astro`

**Context:** "See all posts" links need subtle treatment—Soft Gray default, Orange Ink hover. Minimal animation (if any).

**Step 1: Read current AnimatedLink**

```bash
cat src/components/AnimatedLink.astro
```

**Step 2: Update AnimatedLink styles**

```astro
---
export interface Props {
  href: string;
  class?: string;
}

const { href, class: className } = Astro.props;
---

<a
  href={href}
  class:list={[
    "font-sans text-sm text-soft-gray hover:text-orange-ink",
    "uppercase tracking-wide transition-colors duration-200",
    "inline-flex items-center gap-1",
    className,
  ]}
>
  <slot />
  <span class="inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
</a>
```

**Rationale:**
- Soft Gray → Orange Ink on hover (editorial mark)
- Minimal animation (arrow shifts slightly)
- Uppercase, tracked (consistent with nav)
- IBM Plex Sans

**Step 3: Test AnimatedLink**

```bash
npm run dev
```

Homepage "See all posts" links should be grey, hover orange

**Step 4: Commit AnimatedLink update**

```bash
git add src/components/AnimatedLink.astro
git commit -m "refactor: apply logbook styling to animated links"
```

---

## Task 20: Update Container Component (If Exists)

**Files:**
- Modify: `src/components/Container.astro`

**Context:** Container should enforce single-column max-width for readability. No background, no borders—just width constraint.

**Step 1: Read current Container**

```bash
cat src/components/Container.astro
```

**Step 2: Update Container styles**

```astro
---
export interface Props {
  class?: string;
}

const { class: className } = Astro.props;
---

<div class:list={["w-full max-w-3xl mx-auto px-6 py-12", className]}>
  <slot />
</div>
```

**Rationale:**
- `max-w-3xl` = ~48rem = readable column width
- No background/border—transparent
- Padding for mobile spacing
- Vertical padding (py-12) for breathing room

**Step 3: Test container width**

```bash
npm run dev
```

Content should be centered, readable width

**Step 4: Commit container update**

```bash
git add src/components/Container.astro
git commit -m "refactor: simplify container to enforce readable width"
```

---

## Task 21: Update Site Constants

**Files:**
- Modify: `src/consts.ts:3-16`

**Context:** Update site description and position to match logbook ethos. Remove generic descriptions.

**Step 1: Update SITE constants**

Replace lines 3-16 in `src/consts.ts`:

```typescript
export const SITE: Site = {
  NAME: "Jorge Orejas",
  POSITION: "Logbook", // Or leave as "Developer & Entrepreneur"
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
```

**Step 2: Update page metadata descriptions**

```typescript
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
```

**Rationale:**
- "Logbook of ideas" sets tone immediately
- Short, declarative descriptions (design spec)
- "Notes" instead of "Blog" (more logbook-like)
- Terse language matches design ethos

**Step 3: Test updated metadata**

```bash
npm run dev
```

Check page titles and descriptions

**Step 4: Commit constants update**

```bash
git add src/consts.ts
git commit -m "refactor: update site constants to match logbook ethos"
```

---

## Task 22: Update Breadcrumbs Component (If Used)

**Files:**
- Modify: `src/components/Breadcrumbs.astro` (if exists)

**Context:** Breadcrumbs should be minimal—Soft Gray with Orange Ink current page. Uppercase, tracked.

**Step 1: Check if Breadcrumbs exists**

```bash
cat src/components/Breadcrumbs.astro
```

If file doesn't exist, skip to commit step.

**Step 2: Update breadcrumb styles**

```astro
<nav class="flex items-center gap-2 text-sm font-sans">
  {breadcrumbs.map((crumb, index) => (
    <>
      {index > 0 && (
        <span class="text-soft-gray">/</span>
      )}
      {crumb.href ? (
        <a
          href={crumb.href}
          class="text-soft-gray hover:text-orange-ink transition-colors uppercase tracking-wide"
        >
          {crumb.label}
        </a>
      ) : (
        <span class="text-orange-ink uppercase tracking-wide">
          {crumb.label}
        </span>
      )}
    </>
  ))}
</nav>
```

**Rationale:**
- Links: Soft Gray → Orange Ink hover
- Current page: Orange Ink (you are here)
- Uppercase, tracked (consistent with nav)
- Slash separator (minimal)

**Step 3: Test breadcrumbs**

```bash
npm run dev
```

Navigate to blog post → breadcrumbs should be clean

**Step 4: Commit breadcrumbs update (if modified)**

```bash
git add src/components/Breadcrumbs.astro
git commit -m "refactor: apply logbook styling to breadcrumbs"
```

---

## Task 23: Add Logbook Meta Description to Head

**Files:**
- Modify: `src/components/Head.astro`

**Context:** Ensure default meta description reflects logbook ethos. Important for SEO and sharing.

**Step 1: Read current Head component**

```bash
cat src/components/Head.astro
```

**Step 2: Verify or update default description**

Ensure meta description tag includes:

```astro
<meta
  name="description"
  content={description || "A logbook of ideas, notes, and projects—written to think, not to perform."}
/>
```

**Step 3: Verify OG tags use logbook language**

```astro
<meta property="og:description" content={description || "A logbook of ideas, notes, and projects—written to think, not to perform."} />
<meta property="og:type" content="website" />
<meta property="og:locale" content="en_US" />
```

**Step 4: Test meta tags**

```bash
npm run dev
```

View page source → check meta description

**Step 5: Commit head updates (if changed)**

```bash
git add src/components/Head.astro
git commit -m "docs: update meta description to reflect logbook identity"
```

---

## Task 24: Test Full Site - Light and Dark Mode

**Files:**
- None (verification task)

**Context:** Comprehensive visual test of all pages in both light and dark modes. Verify typography hierarchy, color application, spacing.

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test light mode pages**

Navigate and verify:
- Homepage: Bebas Neue headers, IBM Plex Sans body, orange dates, clean layout
- /blog: Same hierarchy, no boxes
- Individual blog post: Readable width, proper prose styles
- /projects: Matches blog aesthetic
- Individual project: Same treatment
- /work: Timeline feels like logbook entries

Check for:
- No font-serif or font-mono (except intentional mono in code blocks)
- Orange Ink dates throughout
- Soft Gray metadata
- Bebas Neue headers uppercase
- Paper White background (#F7F6F3)
- Ink Black text (#0B0B0B)

**Step 3: Toggle to dark mode**

Use browser/system dark mode toggle.

**Step 4: Test dark mode pages**

Same navigation, verify:
- Ink Black background (#0B0B0B)
- Paper White text (#F7F6F3)
- Orange Ink still visible (#FF4F00)
- Ballpoint Blue still visible (#3300FF)
- Soft Gray still readable (#8A8A8A)

**Step 5: Document any visual issues**

Create notes for any problems found (missing styles, wrong fonts, poor contrast).

**Step 6: If issues found, create quick fixes**

For each issue:
- Identify file and line
- Apply fix
- Test
- Commit individually

---

## Task 25: Build and Deploy Verification

**Files:**
- None (build verification)

**Context:** Ensure production build succeeds with all changes. Check for TypeScript errors, build warnings.

**Step 1: Run type check**

```bash
npm run build
```

Expected: No TypeScript errors, successful build

**Step 2: Run preview server**

```bash
npm run preview
```

**Step 3: Test production build locally**

Navigate through site, verify:
- Fonts load correctly (Google Fonts CDN)
- Colors match design system
- No console errors
- Dark mode toggle works

**Step 4: Check bundle size (if concerned)**

```bash
ls -lh dist/
```

Font switching from @fontsource to Google Fonts should reduce bundle size.

**Step 5: Document build success**

If build succeeds, ready to deploy. If errors, fix and retry.

---

## Task 26: Create Design System Documentation

**Files:**
- Create: `docs/design-system.md`

**Context:** Document the logbook design system for future reference. Include typography, colors, components, usage guidelines.

**Step 1: Create design system doc**

Create `docs/design-system.md`:

```markdown
# Logbook Design System

## Philosophy

jorgeorejas.com is a **logbook**—not a portfolio, brand, or landing page. It is the written trace of a vivid mind under pressure. Ideas arrive fast. Structure keeps them legible. Enjoyment lives in the margins.

**Design Spine:** Writing machine first. Personality second.

---

## Typography

### Display Font: Bebas Neue
- **Source:** Google Fonts
- **Usage:** Page titles, section headers, structural anchors
- **Style:** Uppercase only, letter-spacing +0.04em to +0.06em
- **Tailwind:** `font-display uppercase tracking-wider`
- **Feel:** Ambition and pressure

### Body Font: IBM Plex Sans
- **Source:** Google Fonts
- **Weights:** 400 (Regular), 500 (Medium)
- **Usage:** All body text, notes, essays, lists
- **Tailwind:** `font-sans`
- **Feel:** The engine—neutral, technical, readable

### Handwritten Font: Caveat
- **Source:** Google Fonts
- **Usage:** Micro annotations, marginal notes, asides
- **Tailwind:** `font-handwritten text-sm`
- **Feel:** Human trace, enjoyment in margins

---

## Colors

### Core Palette

| Color | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| Ink Black | #0B0B0B | `text-ink-black` | Primary text (light mode) |
| Paper White | #F7F6F3 | `bg-paper-white` | Background (light mode) |
| Soft Gray | #8A8A8A | `text-soft-gray` | Secondary metadata |
| Orange Ink | #FF4F00 | `text-orange-ink` | Dates, emphasis, dividers |
| Ballpoint Blue | #3300FF | `text-ballpoint-blue` | Handwritten notes |

### Dark Mode
- Background: Ink Black (#0B0B0B)
- Text: Paper White (#F7F6F3)
- Accents remain the same

---

## Components

### HandwrittenNote
Marginal annotations in Caveat font with Ballpoint Blue color.

Usage:
\`\`\`astro
<HandwrittenNote class="ml-2">← quick note</HandwrittenNote>
\`\`\`

### LogbookDivider
Small orange marks for section separation (rare usage).

Usage:
\`\`\`astro
<LogbookDivider />
\`\`\`

### ArrowCard
Blog/project list items with orange dates, no boxes.

### AnimatedLink
"See all" links with minimal arrow animation.

---

## Layout Principles

### Vertical Rhythm
- Content stacked, not boxed
- Clear separation through spacing (`space-y-24`)
- Tight grouping inside sections
- Hierarchy by spacing, scale, alignment—never color noise

### Grid Discipline
- Single column by default (`max-w-3xl`)
- Multi-column only when structurally required
- No cards, dashboards, or visual containers

### Reading Experience
- Short line length (`max-w-prose`)
- Tight but breathable line-height
- No parallax, scroll effects, or motion that competes with reading

---

## Red Lines

This site must never feel:
- Startupy
- Branded
- Influencer-like
- Over-designed
- Polished for approval

**If it starts to feel impressive instead of precise, it has failed.**

---

## Micro-Enjoyment

Enjoyment does NOT come from animations or visual tricks.

Enjoyment lives in:
- Marginal handwritten notes
- Unexpected line breaks
- Small orange marks
- The sense of a mind thinking on paper

This is where the site smiles—briefly.

---

## Implementation Notes

- Google Fonts loaded via CDN (preconnect + stylesheet in Head.astro)
- Tailwind v4 with CSS variables for colors (`--color-*`)
- Dark mode via `html.dark` class
- No noise textures, no decorative elements
- Typography hierarchy enforced through `@layer` utilities

---

**Final Sentence:** jorgeorejas.com is the logbook of a vivid mind whose ideas brim faster than they can be polished. It is awake in attention, strong in structure, ambitious in direction, enjoyed in the margins.
```

**Step 2: Commit design system doc**

```bash
git add docs/design-system.md
git commit -m "docs: create logbook design system documentation"
```

---

## Task 27: Final Commit and Summary

**Files:**
- None (summary task)

**Context:** Review all commits, ensure clean git history, prepare final summary.

**Step 1: Review commit history**

```bash
git log --oneline --graph --decorate --all -27
```

Should see 26+ commits following conventional commit format.

**Step 2: Verify all changes committed**

```bash
git status
```

Expected: Clean working directory.

**Step 3: Create summary of changes**

Document high-level changes made:

**Typography:**
- Switched to Google Fonts (Bebas Neue, IBM Plex Sans, Caveat)
- Removed @fontsource dependencies
- Applied font hierarchy across all components

**Colors:**
- Locked palette: Ink Black, Paper White, Soft Gray, Orange Ink, Ballpoint Blue
- Updated all components to use new color system
- Ensured dark mode compatibility

**Layout:**
- Removed visual containers and borders
- Single-column vertical rhythm
- Increased spacing between sections
- Max-width constraints for readability

**Components:**
- Created HandwrittenNote for marginal annotations
- Created LogbookDivider for editorial marks
- Updated ArrowCard, Nav, Footer, AnimatedLink, etc.
- Removed noise texture overlay

**Content:**
- Updated site constants and metadata
- Adjusted page layouts (homepage, blog, projects, work)
- Applied logbook-first language

**Documentation:**
- Created design-system.md
- Preserved design canon principles

**Step 4: Verify final build**

```bash
npm run build
```

Expected: Successful build, no errors.

**Step 5: Plan complete**

Ready for execution via superpowers:executing-plans or superpowers:subagent-driven-development.

---

## Execution Handoff

**Plan complete and saved to `docs/plans/2026-02-06-logbook-design-system.md`.**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
