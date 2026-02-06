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
      colors: {
        "ink-black": "var(--color-ink-black)",
        "paper-white": "var(--color-paper-white)",
        "soft-gray": "var(--color-soft-gray)",
        "orange-ink": "var(--color-orange-ink)",
        "ballpoint-blue": "var(--color-ballpoint-blue)",
      },
    },
  },
};
