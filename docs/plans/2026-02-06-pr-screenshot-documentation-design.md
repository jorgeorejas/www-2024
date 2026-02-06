# PR Screenshot Documentation Design

**Date:** 2026-02-06
**Purpose:** Automate before/after screenshot capture for redesign PR documentation

## Overview

Automated system to capture screenshots of all 8 page types across both the original site and redesign preview, at desktop and mobile viewports, for visual comparison in PR #21.

## Page Types & URLs

| Page Type | Path | Example URL |
|-----------|------|-------------|
| Home | `/` | - |
| Blog List | `/blog` | - |
| Blog Detail | `/blog/talent-and-values` | Specific post |
| Projects List | `/projects` | - |
| Projects Detail | `/projects/aramo-v2` | Specific project |
| Work List | `/work` | - |
| Work Detail | `/work/vivla` | Specific work item |
| CV | `/cv` | - |

## Base URLs

- **Before:** https://www.jorgeorejas.com
- **After:** https://www-git-redesign-2026-jorejas-projects.vercel.app

## Viewports

- **Desktop:** 1920x1080
- **Mobile:** 375x812 (iPhone X)

## File Organization

```
screenshots/
├── before/
│   ├── mobile/
│   │   ├── home.png
│   │   ├── blog-list.png
│   │   ├── blog-detail.png
│   │   ├── projects-list.png
│   │   ├── projects-detail.png
│   │   ├── work-list.png
│   │   ├── work-detail.png
│   │   └── cv.png
│   └── desktop/
│       └── (same structure)
└── after/
    ├── mobile/
    │   └── (same structure)
    └── desktop/
        └── (same structure)
```

**Total:** 32 screenshots (8 pages × 2 versions × 2 viewports)

## Technical Approach

### Tool
Playwright for browser automation and screenshot capture

### Script Features
1. Create directory structure automatically
2. Launch headless browser
3. Iterate through all combinations (page/version/viewport)
4. Wait for page load and animations (2-3 seconds)
5. Capture full-page screenshots
6. Save with organized naming convention
7. Generate markdown tables for PR
8. Progress logging and error handling

### Output Files
1. 32 PNG screenshots in organized directory structure
2. `SCREENSHOTS.md` with ready-to-paste markdown tables
3. Console progress output

## PR Documentation Format

Two separate markdown tables (desktop and mobile) with side-by-side before/after comparisons:

### Desktop View Table
| Page Type | Before | After |
|-----------|--------|-------|
| **Home** | ![](screenshots/before/desktop/home.png) | ![](screenshots/after/desktop/home.png) |
| ... | ... | ... |

### Mobile View Table
(Same structure as desktop)

## Usage

```bash
npm run screenshots
# or
node take-screenshots.mjs
```

## Implementation Notes

- Add Playwright as dev dependency
- Full-page screenshots for complete visual context
- Retry logic for network failures
- Image paths relative to repository root for GitHub rendering
