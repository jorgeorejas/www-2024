---
title: "Style Showcase (Dev Only)"
description: "A comprehensive showcase of all available markdown styles and components"
date: 2099-12-31
draft: false
---

# Style Showcase

This page showcases all the available markdown styles and components currently supported.

## Typography

### Headings

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

### Text Styles

This is **bold text** and this is *italic text*. You can also use ***bold and italic*** together.

Here's some `inline code` in a sentence.

~~Strikethrough text~~

### Correction Syntax

This is a ~~mistake~~(correction) in the text. You can use multiple corrections in a sentence: I love ~~programing~~(programming) and ~~writting~~(writing) code.

## Links

Here's a [link to example.com](https://example.com) and here's an [internal link](/blog).

## Lists

### Unordered List

- First item
- Second item
- Third item
  - Nested item 1
  - Nested item 2
- Fourth item

### Ordered List

1. First step
2. Second step
3. Third step
   1. Nested step A
   2. Nested step B
4. Fourth step

### Task List

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## Blockquotes

> This is a blockquote.
> It can span multiple lines.
>
> And even have multiple paragraphs.

> **Note:** You can also have styled content inside blockquotes.

## Code Blocks

### JavaScript

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

greet("World");
```

### TypeScript

```typescript
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "Jorge",
  age: 30
};
```

### CSS

```css
.example {
  color: blue;
  font-size: 16px;
  padding: 1rem;
}

.example:hover {
  color: red;
}
```

### Bash

```bash
npm install package-name
pnpm add package-name
cd my-directory
```

## Tables

| Feature | Supported | Notes |
|---------|-----------|-------|
| Bold | ✓ | Use `**text**` |
| Italic | ✓ | Use `*text*` |
| Code | ✓ | Use `` `code` `` |
| Corrections | ✓ | Use `~~old~~(new)` |

## Horizontal Rules

---

## Images

![Alt text for image](https://via.placeholder.com/800x400?text=Example+Image)

## Inline HTML

You can also use <mark>inline HTML</mark> when needed, though it's better to use <strong>markdown syntax</strong> when possible.

## Combinations

You can combine different styles together:

- **Bold** with `code`
- *Italic* with [links](https://example.com)
- ~~Strikethrough~~(Correction) with **bold**
- Lists with ~~mistakes~~(corrections)

## Complex Examples

Here's a complex paragraph with multiple styles: I was **really excited** about ~~writting~~(writing) this *amazing* `code` that would [revolutionize](https://example.com) the way we think about ~~programing~~(programming). It's important to remember that **persistence** and *creativity* go hand in hand.

### Code with Explanations

When working with JavaScript, you might use:

```javascript
const items = [1, 2, 3, 4, 5];
const doubled = items.map(x => x * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```

This demonstrates:
1. Array declaration
2. ~~The map function~~(The `map()` method)
3. Arrow function syntax
4. Console output

## Nested Structures

> **Tip:** Here's a blockquote with a list inside:
> 
> - First tip
> - Second tip with ~~error~~(correction)
> - Third tip with `code`
>
> ```javascript
> // Even code blocks!
> const example = "nested";
> ```

## Special Characters

Testing special characters: & < > " ' @ # $ % ^ * ( ) - _ = + [ ] { } | \ / ? . , ; :

## End Note

This showcase demonstrates all the ~~curent~~(current) styling capabilities. Feel free to add more examples as new features are implemented!
