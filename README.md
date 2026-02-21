# Jorge Orejas Personal Website

This is the personal website of Jorge Orejas, built with Astro and deployed on Vercel.

## Technical Details

### Framework and Language

- Astro
- TypeScript

### Styling

- Tailwind CSS
- Custom CSS (global.css)

### Content Management

- Markdown files for blog posts, projects, and work experience

### Deployment

- Vercel

### Key Features

1. Blog
2. Projects showcase
3. Work experience
4. Dynamic OG image generation
5. RSS feed
6. Dark mode support

### Dependencies

- @astrojs/mdx
- @astrojs/react
- @astrojs/rss
- @astrojs/sitemap
- @astrojs/tailwind
- @astrojs/vercel
- @fontsource-variable/caveat
- @fontsource/ibm-plex-mono
- @fontsource/instrument-serif
- @tailwindcss/typography
- @vercel/analytics
- @vercel/speed-insights
- astro-satori
- clsx
- react
- react-dom
- satori
- sharp
- tailwind-merge

### Development Tools

- ESLint
- Prettier

## Project Structure

- `src/`: Source files
  - `components/`: Reusable Astro components
  - `content/`: Markdown files for blog posts, projects, and work experience
  - `layouts/`: Page layouts
  - `pages/`: Astro pages
  - `styles/`: Global CSS
  - `lib/`: Utility functions
  - `consts.ts`: Constant values used throughout the project
- `public/`: Static assets

## Blog Posts

1. "Create Opportunities, Build Ideas"
2. "Building Startups, Building Your Legacy"

## Setup and Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Build for production: `npm run build`

## Deployment

The project is set up for deployment on Vercel. Push to the main branch to trigger a new deployment.
