# Design Implementation Verification Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify that the logbook design system from `docs/design-brief.md` has been fully implemented across all pages and components.

**Current Status:** The design system has been partially implemented on the redesign/2026 branch. Core typography, colors, and layout principles are in place, but several detail pages and components still use the old design system.

**Tech Stack:** Astro, Tailwind CSS, Google Fonts (Bricolage Grotesque, IBM Plex Sans, Caveat)

---

## Implementation Analysis

### ✅ Completed

1. **Typography System**
   - ✅ Bricolage Grotesque (display font) - width: 75, weight: 700
   - ✅ IBM Plex Sans (body font) - weights 400, 500
   - ✅ Caveat (handwritten accent)
   - ✅ Font loading from Google Fonts in Head.astro
   - ✅ CSS variables in global.css and tailwind.config.mjs

2. **Color System**
   - ✅ Core colors: Ink Black (#0B0B0B), Paper White (#F7F6F3), Soft Gray (#8A8A8A)
   - ✅ Accent colors: Orange Ink (#FF4F00), Ballpoint Blue (#3300FF)
   - ✅ CSS variables defined in global.css
   - ✅ Tailwind utilities configured

3. **Core Components**
   - ✅ HandwrittenNote.astro (uses Caveat font, ballpoint blue color)
   - ✅ LogbookDivider.astro (orange ink editorial marks)
   - ✅ Nav.astro (logbook styling with display font)
   - ✅ Footer.astro (logbook styling)
   - ✅ ArrowCard.astro (logbook styling for lists)

4. **Pages - Logbook Layout Applied**
   - ✅ Homepage (index.astro) - single column, clear sections
   - ✅ Blog list page (blog/index.astro)
   - ✅ Projects list page (projects/index.astro)

5. **Site Constants**
   - ✅ Updated to logbook language in consts.ts

### ❌ Incomplete - Detail Pages Need Logbook Styling

The following detail pages still use the OLD design system (serif fonts, old colors, old layout patterns):

1. **Blog Detail Page** (`src/pages/blog/[...slug].astro`)
   - ❌ Still uses `font-serif` instead of `font-display`
   - ❌ Still uses old color values (`text-black` instead of `text-ink-black`)
   - ❌ Header has old styling with serif font
   - ❌ No logbook dividers or editorial marks
   - ❌ Missing handwritten accent opportunities

2. **Projects Detail Page** (`src/pages/projects/[...slug].astro`)
   - ❌ Still uses `font-serif` instead of `font-display`
   - ❌ Still uses old color values (`text-black` instead of `text-ink-black`)
   - ❌ No logbook dividers or editorial marks
   - ❌ Missing handwritten accent opportunities

3. **Work Detail Page** (`src/pages/work/[...slug].astro`)
   - ❌ Still uses `font-serif` instead of `font-display`
   - ❌ Still uses old color values (`text-black` instead of `text-ink-black`)
   - ❌ No logbook dividers or editorial marks
   - ❌ Missing handwritten accent opportunities

### 🔍 Design Brief Principles to Verify

After fixing the detail pages, verify these principles are honored:

1. **Typography Rules**
   - Display font (Bricolage Grotesque) only for headers, uppercase, +0.04em to +0.06em letter-spacing
   - Body text uses IBM Plex Sans, never display font
   - Handwritten font (Caveat) only for micro annotations, never long text
   - No decorative-only usage of handwritten font

2. **Color Usage**
   - Orange Ink: dates, categories, inline emphasis, small dividers - NEVER large surfaces
   - Ballpoint Blue: handwritten annotations, micro-details, rare emphasis
   - High but softened contrast (no pure white/black)

3. **Layout Principles**
   - Single column by default
   - No cards, dashboards, visual containers
   - Vertical rhythm via spacing, scale, alignment
   - Feels like a notebook, not an interface

4. **Micro-Enjoyment**
   - Marginal handwritten notes
   - Small orange marks (dividers)
   - Sense of mind thinking on paper

5. **Motion & Interaction**
   - Minimal, functional, near invisible
   - No parallax, scroll theatre
   - Nothing competing with reading

6. **Red Lines - Must Never Feel**
   - Startupy
   - Branded
   - Influencer-like
   - Over-designed
   - Polished for approval

---

## Task 1: Create Design System Components

**Goal:** Build reusable, typography-locked components that enforce design brief consistency across all pages.

**Files:**
- Create: `src/components/logbook/PageHeader.astro`
- Create: `src/components/logbook/SectionHeader.astro`
- Create: `src/components/logbook/DateBadge.astro`
- Create: `src/components/logbook/MetadataBadge.astro`
- Create: `src/components/logbook/LogbookHeading.astro`
- Create: `src/components/logbook/EditorialMark.astro`
- Create: `src/components/logbook/index.ts` (barrel export)

**Step 1: Create PageHeader component**

This component handles the consistent header structure for detail pages (title, date, metadata).

Create `src/components/logbook/PageHeader.astro`:
```astro
---
export interface Props {
  title: string;
  date: Date;
  metadata?: string; // reading time, location, etc.
  titleCorrection?: string;
  description?: string;
  class?: string;
}

import FormattedDate from "@components/FormattedDate.astro";
import Correction from "@components/Correction.astro";

const { title, date, metadata, titleCorrection, description, class: className } = Astro.props;
---

<div class:list={["space-y-4 my-10", className]}>
  <!-- Date and Metadata Row -->
  <div class="flex items-center gap-1.5">
    <div class="font-sans text-sm text-orange-ink uppercase tracking-wide">
      <FormattedDate date={date} />
    </div>
    {metadata && (
      <>
        <span class="text-soft-gray">&bull;</span>
        <div class="font-sans text-sm text-soft-gray">
          {metadata}
        </div>
      </>
    )}
  </div>

  <!-- Title -->
  {
    titleCorrection ? (
      <Correction text={titleCorrection} textClass="text-3xl -top-6">
        <h1 class="text-3xl font-display uppercase tracking-wider text-ink-black dark:text-paper-white">
          {title}
        </h1>
      </Correction>
    ) : (
      <h1 class="text-3xl font-display uppercase tracking-wider text-ink-black dark:text-paper-white">
        {title}
      </h1>
    )
  }

  <!-- Description -->
  {description && (
    <div class="border-b border-soft-gray/20 pb-4 font-sans text-soft-gray leading-relaxed">
      {description}
    </div>
  )}

  <slot />
</div>
```

**Step 2: Create SectionHeader component**

For consistent section headers throughout the site.

Create `src/components/logbook/SectionHeader.astro`:
```astro
---
export interface Props {
  level?: 1 | 2 | 3;
  class?: string;
}

const { level = 2, class: className } = Astro.props;
const Tag = `h${level}` as 'h1' | 'h2' | 'h3';

// Size based on level
const sizeClasses = {
  1: 'text-3xl',
  2: 'text-xl',
  3: 'text-lg'
};
---

<Tag class:list={[
  "font-display uppercase tracking-wider text-ink-black dark:text-paper-white",
  sizeClasses[level],
  className
]}>
  <slot />
</Tag>
```

**Step 3: Create DateBadge component**

For the orange ink date display used throughout.

Create `src/components/logbook/DateBadge.astro`:
```astro
---
export interface Props {
  date: Date;
  format?: "short" | "day" | "month";
  class?: string;
}

import FormattedDate from "@components/FormattedDate.astro";

const { date, format, class: className } = Astro.props;
---

<time class:list={[
  "font-sans text-sm text-orange-ink uppercase tracking-wide",
  className
]}>
  <FormattedDate date={date} detail={format} />
</time>
```

**Step 4: Create MetadataBadge component**

For soft gray metadata (reading time, tags, etc.).

Create `src/components/logbook/MetadataBadge.astro`:
```astro
---
export interface Props {
  class?: string;
}

const { class: className } = Astro.props;
---

<span class:list={[
  "font-sans text-sm text-soft-gray",
  className
]}>
  <slot />
</span>
```

**Step 5: Create LogbookHeading component**

Typography-locked headings for content areas.

Create `src/components/logbook/LogbookHeading.astro`:
```astro
---
export interface Props {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  uppercase?: boolean;
  class?: string;
}

const { level, uppercase = true, class: className } = Astro.props;
const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

// Sizes for each level
const sizeClasses = {
  1: 'text-3xl',
  2: 'text-2xl',
  3: 'text-xl',
  4: 'text-lg',
  5: 'text-base',
  6: 'text-sm'
};
---

<Tag class:list={[
  "font-display tracking-wider text-ink-black dark:text-paper-white",
  uppercase && "uppercase",
  sizeClasses[level],
  className
]}>
  <slot />
</Tag>
```

**Step 6: Create EditorialMark component**

Small orange marks beyond dividers (inline marks, status indicators).

Create `src/components/logbook/EditorialMark.astro`:
```astro
---
export interface Props {
  variant?: "dot" | "dash" | "double-dash";
  class?: string;
}

const { variant = "dot", class: className } = Astro.props;
---

{variant === "dot" && (
  <span class:list={["inline-block w-1.5 h-1.5 rounded-full bg-orange-ink", className]}></span>
)}

{variant === "dash" && (
  <span class:list={["inline-block w-6 h-0.5 bg-orange-ink", className]}></span>
)}

{variant === "double-dash" && (
  <span class:list={["inline-flex items-center gap-1", className]}>
    <span class="block w-6 h-0.5 bg-orange-ink"></span>
    <span class="block w-2 h-0.5 bg-orange-ink"></span>
  </span>
)}
```

**Step 7: Create barrel export**

Create `src/components/logbook/index.ts`:
```typescript
export { default as PageHeader } from './PageHeader.astro';
export { default as SectionHeader } from './SectionHeader.astro';
export { default as DateBadge } from './DateBadge.astro';
export { default as MetadataBadge } from './MetadataBadge.astro';
export { default as LogbookHeading } from './LogbookHeading.astro';
export { default as EditorialMark } from './EditorialMark.astro';
```

**Step 8: Create logbook directory**

```bash
mkdir -p src/components/logbook
```

**Step 9: Write all component files**

Execute the file writes for all components created above.

**Step 10: Test components in isolation**

Create a test page `src/pages/test-logbook.astro`:
```astro
---
import Container from "@components/Container.astro";
import PageLayout from "@layouts/PageLayout.astro";
import LogbookDivider from "@components/LogbookDivider.astro";
import HandwrittenNote from "@components/HandwrittenNote.astro";
import {
  PageHeader,
  SectionHeader,
  DateBadge,
  MetadataBadge,
  LogbookHeading,
  EditorialMark
} from "@components/logbook";

const testDate = new Date();
---

<PageLayout title="Logbook Components Test" description="Testing design system components">
  <Container>
    <div class="space-y-12">
      <!-- PageHeader Test -->
      <section>
        <h2 class="font-sans text-xs uppercase text-soft-gray mb-4">PageHeader Component</h2>
        <PageHeader
          title="Sample Article Title"
          date={testDate}
          metadata="5 min read"
          description="This is a sample description showing how the PageHeader component structures content."
        />
      </section>

      <LogbookDivider />

      <!-- SectionHeader Tests -->
      <section class="space-y-4">
        <h2 class="font-sans text-xs uppercase text-soft-gray mb-4">SectionHeader Components</h2>
        <SectionHeader level={1}>Level 1 Header</SectionHeader>
        <SectionHeader level={2}>Level 2 Header</SectionHeader>
        <SectionHeader level={3}>Level 3 Header</SectionHeader>
      </section>

      <LogbookDivider />

      <!-- Badge Tests -->
      <section class="space-y-4">
        <h2 class="font-sans text-xs uppercase text-soft-gray mb-4">Badge Components</h2>
        <div class="flex items-center gap-3">
          <DateBadge date={testDate} />
          <MetadataBadge>5 min read</MetadataBadge>
          <HandwrittenNote>~quick note</HandwrittenNote>
        </div>
      </section>

      <LogbookDivider />

      <!-- EditorialMark Tests -->
      <section class="space-y-4">
        <h2 class="font-sans text-xs uppercase text-soft-gray mb-4">EditorialMark Components</h2>
        <div class="flex items-center gap-6">
          <EditorialMark variant="dot" />
          <EditorialMark variant="dash" />
          <EditorialMark variant="double-dash" />
        </div>
      </section>

      <LogbookDivider />

      <!-- LogbookHeading Tests -->
      <section class="space-y-4">
        <h2 class="font-sans text-xs uppercase text-soft-gray mb-4">LogbookHeading Components</h2>
        <LogbookHeading level={1}>H1 Heading</LogbookHeading>
        <LogbookHeading level={2}>H2 Heading</LogbookHeading>
        <LogbookHeading level={3}>H3 Heading</LogbookHeading>
        <LogbookHeading level={4}>H4 Heading</LogbookHeading>
      </section>
    </div>
  </Container>
</PageLayout>
```

**Step 11: Run dev server and verify**

```bash
npm run dev
```

Visit `http://localhost:4321/test-logbook` and verify:
- PageHeader displays correctly with title, date, metadata
- SectionHeaders use display font, proper sizing
- DateBadge shows orange ink styling
- MetadataBadge shows soft gray styling
- EditorialMarks render correctly
- All typography locked to design system

**Step 12: Delete test page**

```bash
rm src/pages/test-logbook.astro
```

**Step 13: Commit**

```bash
git add src/components/logbook/
git commit -m "feat: create logbook design system components for consistency"
```

---

## Task 2: Apply Logbook Components to Blog Detail Page

**Goal:** Replace hardcoded styles with reusable design system components.

**Files:**
- Modify: `src/pages/blog/[...slug].astro`

**Step 1: Update imports**

Add logbook component imports at the top:
```astro
import LogbookDivider from "@components/LogbookDivider.astro";
import { PageHeader, LogbookHeading } from "@components/logbook";
```

**Step 2: Replace sticky header**

Replace lines 36-44 with:
```astro
<header id="sticky-header" class="pointer-events-none">
  <Container>
    <div class="text-lg font-display uppercase tracking-wider text-ink-black dark:text-paper-white">
      <span class="font-display">Jorge Orejas</span>
      <span class="text-soft-gray">~</span>
      <span class="whitespace-wrap">{post.data.title}</span>
    </div>
  </Container>
</header>
```

**Step 3: Replace post header with PageHeader component**

Replace lines 55-85 with:
```astro
<PageHeader
  title={post.data.title}
  date={post.data.date}
  metadata={readingTime(post.body)}
  titleCorrection={post.data.titleCorrection}
  description={post.data.description}
  id="post-header"
/>
```

**Step 4: Add logbook divider before article**

After the PageHeader (around line 85), add:
```astro
<LogbookDivider />
```

**Step 5: Verify article styles**

The `<article>` tag should already inherit logbook typography from global.css:
- `prose-headings:font-display`
- `prose-headings:uppercase`
- `prose-p:font-sans`

No changes needed here.

**Step 6: Remove unused imports**

Remove these imports if they're no longer used:
- `FormattedDate` (now handled by PageHeader)
- `Correction` (now handled by PageHeader)

**Step 7: Full file should look like this**

```astro
---
import Container from "@components/Container.astro";
import Nav from "@components/Nav.astro";
import PageLayout from "@layouts/PageLayout.astro";
import { readingTime } from "@lib/utils";
import { type CollectionEntry, getCollection } from "astro:content";
import LogbookDivider from "@components/LogbookDivider.astro";
import { PageHeader } from "@components/logbook";

export const prerender = true;

export async function getStaticPaths() {
  const posts = (await getCollection("blog"))
    .filter((post: CollectionEntry<"blog">) => !post.data.draft)
    .sort(
      (a: CollectionEntry<"blog">, b: CollectionEntry<"blog">) =>
        b.data.date.valueOf() - a.data.date.valueOf(),
    );
  return posts.map((post: CollectionEntry<"blog">) => ({
    params: { slug: post.slug },
    props: post,
  }));
}
type Props = CollectionEntry<"blog">;

const post = Astro.props;
const { Content } = await post.render();
---

<PageLayout
  title={post.data.title}
  description={post.data.description}
  ogImage={`/og/${post.slug}.png`}
>
  <!-- Sticky header that appears after scrolling past post header -->
  <header id="sticky-header" class="pointer-events-none">
    <Container>
      <div class="text-lg font-display uppercase tracking-wider text-ink-black dark:text-paper-white">
        <span class="font-display">Jorge Orejas</span>
        <span class="text-soft-gray">~</span>
        <span class="whitespace-wrap">{post.data.title}</span>
      </div>
    </Container>
  </header>

  <Container>
    <div class="space-y-2">
      <Nav
        breadCrumbsItems={[
          { href: "/blog", label: "Blog" },
          { href: `/blog/${post.slug}`, label: post.data.title },
        ]}
      />
    </div>

    <PageHeader
      title={post.data.title}
      date={post.data.date}
      metadata={readingTime(post.body)}
      titleCorrection={post.data.titleCorrection}
      description={post.data.description}
      id="post-header"
    />

    <LogbookDivider />

    <article>
      <Content />
    </article>
  </Container>
</PageLayout>

<script>
  // Show sticky header after scrolling past post header
  const stickyHeader = document.getElementById("sticky-header");
  const postHeader = document.getElementById("post-header");

  if (stickyHeader && postHeader) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stickyHeader.classList.add("hidden");
        } else {
          stickyHeader.classList.remove("hidden");
        }
      },
      {
        threshold: 0,
        rootMargin: "-80px 0px 0px 0px",
      },
    );

    observer.observe(postHeader);
  }
</script>
```

**Step 8: Run dev server and verify**

```bash
npm run dev
```

Visit `/blog/[any-post]` and verify:
- PageHeader component renders correctly
- Display font in headers (uppercase, condensed)
- Body text uses IBM Plex Sans
- Orange ink for date
- Soft gray for metadata
- Logbook divider appears

**Step 9: Commit**

```bash
git add src/pages/blog/[...slug].astro
git commit -m "refactor: use logbook components in blog detail page"
```

---

## Task 3: Apply Logbook Components to Projects Detail Page

**Goal:** Replace hardcoded styles with reusable design system components.

**Files:**
- Modify: `src/pages/projects/[...slug].astro`

**Step 1: Update imports**

Add logbook component imports:
```astro
import LogbookDivider from "@components/LogbookDivider.astro";
import { PageHeader } from "@components/logbook";
```

**Step 2: Replace project header with PageHeader component**

Replace lines 41-84 with:
```astro
<PageHeader
  title={project.data.title}
  date={project.data.date}
  metadata={readingTime(project.body)}
  titleCorrection={project.data.titleCorrection}
>
  {(project.data.demoURL || project.data.repoURL) && (
    <nav class="flex gap-2 font-sans text-sm mt-2">
      {project.data.demoURL && (
        <Link href={project.data.demoURL} external>
          visit
        </Link>
      )}
      {project.data.demoURL && project.data.repoURL && <span class="text-soft-gray">/</span>}
      {project.data.repoURL && (
        <Link href={project.data.repoURL} external>
          repo
        </Link>
      )}
    </nav>
  )}
</PageHeader>

<LogbookDivider />
```

**Step 3: Remove unused imports**

Remove:
- `FormattedDate` (now handled by PageHeader)
- `Correction` (now handled by PageHeader)

**Step 4: Run dev server and verify**

```bash
npm run dev
```

Visit `/projects/[any-project]` and verify:
- PageHeader renders correctly
- Orange ink for date
- Soft gray for metadata
- Project links styled correctly
- Logbook divider appears

**Step 5: Commit**

```bash
git add src/pages/projects/[...slug].astro
git commit -m "refactor: use logbook components in projects detail page"
```

---

## Task 4: Apply Logbook Components to Work Detail Page

**Goal:** Replace hardcoded styles with reusable design system components.

**Files:**
- Modify: `src/pages/work/[...slug].astro`

**Step 1: Update imports**

Add logbook component imports:
```astro
import LogbookDivider from "@components/LogbookDivider.astro";
import { SectionHeader, DateBadge } from "@components/logbook";
```

**Step 2: Update work header styling with components**

Replace lines 46-59 with:
```astro
<div class="space-y-4 my-10">
  <DateBadge date={startDate} />

  <SectionHeader level={1}>
    {work.data.company}
  </SectionHeader>

  <div class="prose prose-neutral dark:prose-invert max-w-none">
    <Content />
  </div>
</div>
```

**Step 3: Add logbook divider**

After the work description (around line 60), add:
```astro
<LogbookDivider />
```

**Step 4: Update positions section with components**

Replace lines 61-91 with:
```astro
<div class="space-y-4">
  <SectionHeader level={2}>
    Positions
  </SectionHeader>
  <div class="space-y-4">
    {
      work.data.roles
        .sort((a, b) => b.dateStart.valueOf() - a.dateStart.valueOf())
        .map((position, i) => (
          <div class="space-y-2">
            <DateBadge
              date={position.dateEnd || new Date()}
              format="day"
            />
            <div class="border-l-2 border-soft-gray/20 pl-4 space-y-2">
              <div class="font-sans font-medium text-ink-black dark:text-paper-white">
                {position.title}
              </div>
              {position.description && (
                <div class="font-sans text-sm text-soft-gray leading-relaxed">
                  {position.description}
                </div>
              )}
            </div>
            {i === work.data.roles.length - 1 && (
              <div class="font-sans text-sm text-soft-gray">
                {position.dateStart.toLocaleDateString("es-ES")}
              </div>
            )}
          </div>
        ))
    }
  </div>
</div>
```

**Step 5: Run dev server and verify**

```bash
npm run dev
```

Visit `/work/[any-company]` and verify:
- SectionHeader components render correctly
- DateBadge shows orange ink for dates
- Logbook divider appears
- All typography uses design system

**Step 6: Commit**

```bash
git add src/pages/work/[...slug].astro
git commit -m "refactor: use logbook components in work detail page"
```

---

## Task 5: Add Micro-Enjoyment Opportunities

**Goal:** Add subtle handwritten annotations to bring personality without noise.

**Files:**
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/projects/[...slug].astro`

**Step 1: Add handwritten reading time annotation to blog posts**

In `src/pages/blog/[...slug].astro`, after the reading time, add a small handwritten note:

```astro
<div class="flex items-center gap-1.5">
  <div class="font-sans text-sm text-orange-ink uppercase tracking-wide">
    <FormattedDate date={post.data.date} />
  </div>
  <span class="text-soft-gray">&bull;</span>
  <div class="font-sans text-sm text-soft-gray">
    {readingTime(post.body)}
  </div>
  <HandwrittenNote class="ml-2">
    ~{Math.ceil(parseInt(readingTime(post.body)) / 60)}m
  </HandwrittenNote>
</div>
```

Import HandwrittenNote:
```astro
import HandwrittenNote from "@components/HandwrittenNote.astro";
```

**Step 2: Test sparingly**

View in browser. If it feels too cluttered, remove it. The design brief emphasizes:
- "Very small usage"
- "Never decorative-only"
- "Used like handwriting in a lab notebook"

**Step 3: Commit if keeping**

```bash
git add src/pages/blog/[...slug].astro
git commit -m "feat: add handwritten time annotation for micro-enjoyment"
```

Or revert if it feels wrong:
```bash
git restore src/pages/blog/[...slug].astro
```

---

## Task 6: Design Principles Verification Checklist

**Files:**
- Review all pages visually

**Step 1: Typography verification**

Visit each page and verify:
- [ ] Display font only in headers, always uppercase
- [ ] Display font has condensed feel (width: 75)
- [ ] Letter-spacing on display font ~0.04-0.06em
- [ ] Body text uses IBM Plex Sans
- [ ] Handwritten font only in micro annotations
- [ ] No decorative-only handwritten usage

Pages to check:
- [ ] Homepage
- [ ] Blog list
- [ ] Blog detail
- [ ] Projects list
- [ ] Projects detail
- [ ] Work list
- [ ] Work detail
- [ ] CV

**Step 2: Color verification**

- [ ] Orange Ink only for: dates, categories, small dividers
- [ ] Orange Ink NEVER on: large surfaces, buttons, headline fills
- [ ] Ballpoint Blue only for: handwritten annotations
- [ ] All text uses ink-black or paper-white (not pure black/white)
- [ ] Soft gray for secondary metadata

**Step 3: Layout verification**

- [ ] All content pages use single column
- [ ] No card-style containers visible
- [ ] No dashboard-style layouts
- [ ] Vertical rhythm clear via spacing
- [ ] Feels like notebook, not interface

**Step 4: Motion verification**

- [ ] No parallax effects
- [ ] No scroll-triggered animations beyond sticky header
- [ ] Transitions minimal and functional
- [ ] Nothing competes with reading

**Step 5: Red lines check**

Does the site feel:
- [ ] NOT startupy ✓
- [ ] NOT branded ✓
- [ ] NOT influencer-like ✓
- [ ] NOT over-designed ✓
- [ ] NOT polished for approval ✓

If ANY of these feel violated, identify and fix.

**Step 6: Document findings**

Create a checklist document:

```bash
cat > docs/design-verification-results.md << 'EOF'
# Design Verification Results

Date: $(date +%Y-%m-%d)

## Typography ✓/✗
- Display font usage:
- Body font usage:
- Handwritten font usage:

## Colors ✓/✗
- Orange ink usage:
- Ballpoint blue usage:
- Core colors:

## Layout ✓/✗
- Single column:
- No containers:
- Notebook feel:

## Motion ✓/✗
- Minimal interaction:
- No scroll theatre:

## Red Lines ✓/✗
- Not startupy:
- Not branded:
- Not influencer-like:
- Not over-designed:
- Not polished for approval:

## Issues Found


## Fixes Needed

EOF
```

**Step 7: Fill in checklist manually**

Review site and complete the checklist.

---

## Task 7: Final Screenshots and Documentation

**Files:**
- Run: `take-screenshots.mjs`
- Update: `SCREENSHOTS.md`

**Step 1: Take comprehensive screenshots**

```bash
node take-screenshots.mjs
```

Expected: Screenshots in `screenshots/after/` for:
- desktop/home.png
- desktop/blog-list.png
- desktop/blog-detail.png
- desktop/projects-list.png
- desktop/projects-detail.png
- desktop/work-list.png
- desktop/work-detail.png
- desktop/cv.png
- mobile/* (same pages)

**Step 2: Compare before/after**

```bash
ls -la screenshots/before/desktop/
ls -la screenshots/after/desktop/
```

**Step 3: Update SCREENSHOTS.md**

Add a verification section:

```markdown
## Design Verification (2026-02-06)

All screenshots taken after applying logbook design system from `docs/design-brief.md`.

### Typography
- Display: Bricolage Grotesque (width: 75, weight: 700) - headers only, uppercase
- Body: IBM Plex Sans - all reading text
- Handwritten: Caveat - micro annotations only

### Colors
- Ink Black (#0B0B0B) - primary text
- Paper White (#F7F6F3) - background
- Soft Gray (#8A8A8A) - secondary text
- Orange Ink (#FF4F00) - dates, editorial marks
- Ballpoint Blue (#3300FF) - handwritten notes

### Layout
- Single column throughout
- No visual containers
- Logbook feel: notebook, not interface
```

**Step 4: Commit**

```bash
git add screenshots/ SCREENSHOTS.md docs/design-verification-results.md
git commit -m "docs: add design verification screenshots and results"
```

---

## Task 8: Create PR with Design Verification

**Files:**
- Review all changes

**Step 1: Review all commits**

```bash
git log main..HEAD --oneline
```

**Step 2: Verify no unintended changes**

```bash
git diff main --stat
```

**Step 3: Run build to verify no errors**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

**Step 4: Create PR**

```bash
gh pr create --title "feat: complete logbook design system implementation" --body "$(cat <<'EOF'
## Summary
- Applied logbook design system to all detail pages (blog, projects, work)
- Verified typography, colors, layout principles from design brief
- Added micro-enjoyment details with handwritten annotations
- Comprehensive before/after screenshots

## Design Brief Compliance
- ✅ Typography: Bricolage Grotesque + IBM Plex Sans + Caveat
- ✅ Colors: Ink Black, Paper White, Orange Ink, Ballpoint Blue
- ✅ Layout: Single column, no containers, notebook feel
- ✅ Motion: Minimal, functional only
- ✅ Red lines: Not startupy, branded, or over-designed

## Test Plan
- [ ] Review typography on all pages
- [ ] Verify color usage (orange only for dates/dividers)
- [ ] Check handwritten annotations are subtle
- [ ] Confirm single-column layout throughout
- [ ] Verify no scroll/parallax effects
- [ ] Check mobile responsiveness

## Screenshots
See `SCREENSHOTS.md` for full before/after comparison.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-06-design-implementation-verification.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
