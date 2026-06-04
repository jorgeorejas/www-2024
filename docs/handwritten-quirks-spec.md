# Handwritten Quirks Specification

Hand-drawn "quirk" annotations inspired by the [Attio GTM Atlas](https://atlas.attio.com/build-your-gtm-brain) page: circled words, sketchy underlines, a bracket wrapping a whole paragraph, and handwritten Caveat margin notes.

These complement the existing inline correction syntax (`~~original~~(correction)`, see `markdown-correction-spec.md`).

## How it works

The stroke quirks (circle / underline / bracket) are drawn with the [`rough-notation`](https://roughnotation.com/) library, **client-side**, as elements scroll into view.

1. An annotation is authored as either an Astro/MDX component or a markdown directive.
2. Both render to a plain element carrying `data-rn*` attributes — nothing visible is baked into the HTML, so it is fully SSR/prerender-safe.
3. The global initializer `src/scripts/rough-annotations.ts` (loaded once from `PageLayout.astro`) finds every `[data-rn]` element, draws the sketch, and reveals it on scroll via `IntersectionObserver`.

The initializer also:

- recolors annotations when the `dark` class toggles on `<html>` (via `MutationObserver`),
- repositions them on resize (debounced), and
- respects `prefers-reduced-motion` (strokes appear instantly, no animation).

Margin notes are **not** rough-notation — they are plain Caveat (`font-handwritten`) text positioned in the side gutter.

## The four quirks

| Quirk | Component | Markdown directive | rough-notation |
| --- | --- | --- | --- |
| Circled text | `<Circle>` | `:circle[text]` | yes (`circle`) |
| Hand-drawn underline | `<Underline>` | `:underline[text]` | yes (`underline`) |
| Paragraph bracket | `<Bracket>` | — (component only) | yes (`bracket`) |
| Margin / aside note | `<MarginNote>` | `::margin-note[text]` | no (Caveat text) |

## Markdown directive syntax

Requires `remark-directive` + `remark-handwritten` (registered in `astro.config.mjs`). Works in both `.md` and `.mdx`.

```markdown
When you're early, this is your :circle[ECP].
So focus on what's :underline[immediately obtainable].

::margin-note[One-off prompts don't compound]
```

### Attributes

Pass options in trailing braces: `:circle[ECP]{color=red padding=6}`.

- `color` — `blue` (default) `| red | green | orange | black`
- `stroke` — stroke width in px
- `padding` — padding in px
- `iterations` — number of sketch passes
- `duration` — animation duration in ms
- `side` — **margin-note only**: `right` (default) `| left`

## MDX component usage

```mdx
import Circle from "@components/annotations/Circle.astro";
import Underline from "@components/annotations/Underline.astro";
import Bracket from "@components/annotations/Bracket.astro";
import MarginNote from "@components/annotations/MarginNote.astro";

The real unlock is <Underline>context engineering</Underline>.

<MarginNote text="One-off prompts don't compound" />

<Bracket>
A team still prompting is running a chatbot. A team doing context
engineering is running a brain.
</Bracket>
```

### Shared props

`Circle` / `Underline` / `Bracket` accept: `color`, `strokeWidth`, `padding`, `iterations`, `duration`, `class`.

- `Underline` also accepts `multiline` (default `true`).
- `Bracket` also accepts `brackets` (default `["left", "right"]`) and renders as a block wrapper.
- `MarginNote` accepts: `text`, `color`, `rotate` (default `true`), `side` (`"right" | "left"`), `class`, or children via the default slot.

All three stroke components are thin wrappers over `Annotation.astro`, which emits the `data-rn*` attributes.

## Colors

Stroke colors map to the Flexoki palette, with a lighter dark-mode variant (kept in sync between `Annotation.astro` and `remark-handwritten.mjs`):

| Name | Light | Dark |
| --- | --- | --- |
| blue | `#205ea6` | `#4385be` |
| red | `#af3029` | `#d14d41` |
| green | `#66800b` | `#879a39` |
| orange | `#ff4f00` | `#ff4f00` |
| black | `#100f0f` | `#f2f0e5` |

## Files

- `src/scripts/rough-annotations.ts` — client-side drawing/observer logic
- `src/components/annotations/Annotation.astro` — base wrapper emitting `data-rn*`
- `src/components/annotations/{Circle,Underline,Bracket}.astro` — stroke wrappers
- `src/components/annotations/MarginNote.astro` — Caveat margin aside
- `src/lib/remark-handwritten.mjs` — directive → `data-rn*` markup
- `astro.config.mjs` — registers `remark-directive` + `remark-handwritten`
- `src/layouts/PageLayout.astro` — loads the initializer globally
