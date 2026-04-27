# Markdown Correction Annotation Specification

## Overview

A custom markdown syntax for inline text corrections that displays both the original (incorrect) text and the correction in a visually distinctive way.

## Syntax

```markdown
~~original text~~(correction text)
```

### Components

- `~~original text~~` - Standard markdown strikethrough syntax
- `(correction text)` - Correction text immediately following the strikethrough, enclosed in parentheses
- **No space** between the closing `~~` and opening `(`

### Examples

**Single correction:**
```markdown
I love ~~programing~~(programming).
```

**Multiple corrections in one sentence:**
```markdown
I was ~~writting~~(writing) some ~~importnat~~(important) code.
```

**In a paragraph:**
```markdown
The ~~recieve~~(receive) function handles incoming data and ~~proccesses~~(processes) it efficiently.
```

## Visual Display

### Styling Rules

1. **Original Text (Strikethrough)**
   - Display: Strikethrough line
   - Color: `blue-800` (`decoration-blue-800`)
   - Style: Standard text rendering

2. **Correction Text**
   - Font: Handwritten (`font-handwritten`)
   - Weight: Bold (`font-bold`)
   - Color: `blue-800` (`text-blue-800`)
   - Size: Smaller than body text (`text-sm`)
   - White space: No wrapping (`whitespace-nowrap`)

3. **Layout**
   - Position: Inline, immediately to the right of strikethrough
   - Spacing: Single space between strikethrough and correction
   - Line breaks: None (flows with surrounding text)

### Rendered Example

Input:
```markdown
This is a ~~mistake~~(correction) in the text.
```

Visual output:
```
This is a mistake̶ correction in the text.
           ^^^^^   ^^^^^^^^^^
       strikethrough  handwritten
        (blue-800)    (blue-800)
```

## Implementation

### Technical Details

- **Plugin**: Custom remark plugin (`src/lib/remark-correction.mjs`)
- **Processor**: Runs during markdown compilation
- **Output**: Inline HTML with Tailwind CSS classes
- **AST Node**: Transforms `delete` nodes followed by text nodes starting with `(`

### HTML Output

```html
<span class="inline">
  <span class="line-through decoration-blue-800">original text</span>
  <span class="font-handwritten font-bold text-blue-800 whitespace-nowrap text-sm">correction text</span>
</span>
```

## Usage Guidelines

### When to Use

- **Typo corrections**: Show common spelling mistakes and their corrections
- **Term updates**: Display outdated terminology with modern equivalents
- **Educational content**: Highlight common errors in technical writing
- **Humorous effect**: Intentional "corrections" for comedic purposes

### When NOT to Use

- **Major content revisions**: Use version control and edit history instead
- **Sensitive corrections**: Use standard editing to avoid confusion
- **Accessibility concerns**: Ensure corrections don't obscure meaning
- **Excessive corrections**: Too many corrections reduce readability

## Comparison with Astro Component

### Astro Component (`Correction.astro`)
- **Position**: Correction appears **above** the strikethrough
- **Rotation**: Text is rotated `-6deg` for handwritten effect
- **Use case**: Titles, headings, and standalone text
- **Layout**: Flexbox column with absolute positioning

### Markdown Annotation
- **Position**: Correction appears **inline to the right**
- **Rotation**: None (stays horizontal)
- **Use case**: Body text, paragraphs, lists
- **Layout**: Inline flow with surrounding text

## Configuration

### Astro Config Setup

```javascript
// astro.config.mjs
import { remarkCorrection } from "./src/lib/remark-correction.mjs";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkCorrection],
  },
});
```

### Required Dependencies

```json
{
  "dependencies": {
    "unist-util-visit": "^5.0.0"
  }
}
```

### Tailwind CSS

Ensure the following utilities are available:
- `line-through`, `decoration-blue-800`
- `font-handwritten` (custom font family)
- `font-bold`, `text-blue-800`, `text-sm`
- `whitespace-nowrap`, `inline`

## Examples in Context

### Blog Post
```markdown
When I first started learning JavaScript, I kept ~~writting~~(writing) 
`var` instead of `const` or `let`. The ~~comunity~~(community) helped 
me understand the difference.
```

### Code Documentation
```markdown
The function ~~recives~~(receives) two parameters: `userId` and `callback`. 
Make sure to ~~valdate~~(validate) the input before ~~proccessing~~(processing).
```

### Tutorial Content
```markdown
A common mistake is to forget the ~~async~~(await) keyword when calling 
~~asyncronous~~(asynchronous) functions.
```

## Accessibility Considerations

- Screen readers will announce both the strikethrough and correction text
- Visual distinction is clear with color contrast (blue-800 on white/dark backgrounds)
- Inline positioning maintains natural reading flow
- Correction text is semantically marked with HTML structure