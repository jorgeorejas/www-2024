import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media",
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
        serif: ["Rza Light", "Lora", ...defaultTheme.fontFamily.serif],
        mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
        handwritten: ["Caveat Variable", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        "international-orange": "#FF4F00",
      },
      margin: {
        full: "100%",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
