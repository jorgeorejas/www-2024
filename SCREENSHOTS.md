# Visual Changes

## Desktop View

| Page Type | Before | After |
|-----------|--------|-------|
| **Home** | ![](screenshots/before/desktop/home.png) | ![](screenshots/after/desktop/home.png) |
| **Blog List** | ![](screenshots/before/desktop/blog-list.png) | ![](screenshots/after/desktop/blog-list.png) |
| **Blog Detail** | ![](screenshots/before/desktop/blog-detail.png) | ![](screenshots/after/desktop/blog-detail.png) |
| **Projects List** | ![](screenshots/before/desktop/projects-list.png) | ![](screenshots/after/desktop/projects-list.png) |
| **Projects Detail** | ![](screenshots/before/desktop/projects-detail.png) | ![](screenshots/after/desktop/projects-detail.png) |
| **Work List** | ![](screenshots/before/desktop/work-list.png) | ![](screenshots/after/desktop/work-list.png) |
| **Work Detail** | ![](screenshots/before/desktop/work-detail.png) | ![](screenshots/after/desktop/work-detail.png) |
| **Cv** | ![](screenshots/before/desktop/cv.png) | ![](screenshots/after/desktop/cv.png) |

## Mobile View

| Page Type | Before | After |
|-----------|--------|-------|
| **Home** | ![](screenshots/before/mobile/home.png) | ![](screenshots/after/mobile/home.png) |
| **Blog List** | ![](screenshots/before/mobile/blog-list.png) | ![](screenshots/after/mobile/blog-list.png) |
| **Blog Detail** | ![](screenshots/before/mobile/blog-detail.png) | ![](screenshots/after/mobile/blog-detail.png) |
| **Projects List** | ![](screenshots/before/mobile/projects-list.png) | ![](screenshots/after/mobile/projects-list.png) |
| **Projects Detail** | ![](screenshots/before/mobile/projects-detail.png) | ![](screenshots/after/mobile/projects-detail.png) |
| **Work List** | ![](screenshots/before/mobile/work-list.png) | ![](screenshots/after/mobile/work-list.png) |
| **Work Detail** | ![](screenshots/before/mobile/work-detail.png) | ![](screenshots/after/mobile/work-detail.png) |
| **Cv** | ![](screenshots/before/mobile/cv.png) | ![](screenshots/after/mobile/cv.png) |

## Design Verification (2026-02-06)

All screenshots taken after applying logbook design system from `docs/design-brief.md`.

### Typography
- Display: Bricolage Grotesque (width: 75, weight: 700) - headers only, uppercase
- Body: IBM Plex Sans - all reading text
- Handwritten: Caveat - micro annotations only (homepage bio)

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

### Key Changes from Before
- Replaced serif fonts with Bricolage Grotesque (condensed, uppercase)
- Replaced generic black/white with logbook color palette
- Applied PageHeader component to blog/projects detail pages
- Applied SectionHeader/DateBadge to work detail page
- Added LogbookDivider components throughout
- Unified typography across all detail pages
