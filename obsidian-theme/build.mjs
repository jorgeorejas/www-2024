// Builds the Margin Obsidian theme: inlines the site's fonts into theme.css
// and writes dist/Margin/{theme.css,manifest.json}.
//
//   node obsidian-theme/build.mjs                    build only
//   node obsidian-theme/build.mjs --install <vault>  build and copy into
//                                                    <vault>/.obsidian/themes/Margin
//
// Fonts: Ioskeley Mono is the site's Latin subset (public/fonts); a full copy
// installed on the machine wins through local(). Instrument Serif and Caveat
// come from their @fontsource packages.

import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const out = join(here, "dist", "Margin");

const manifest = {
  name: "Margin",
  version: "1.0.0",
  minAppVersion: "1.9.0",
  author: "Jorge Orejas",
  authorUrl: "https://jorgeorejas.com",
};

const ioskeley = (weight, file, ...locals) => ({
  family: "Ioskeley Mono",
  weight,
  file: `public/fonts/IoskeleyMono/${file}`,
  locals,
});

const faces = [
  ioskeley("400", "IoskeleyMono-Regular.woff2", "Ioskeley Mono", "Ioskeley-Mono"),
  ioskeley("500", "IoskeleyMono-Medium.woff2", "Ioskeley Mono Medium", "Ioskeley-Mono-Medium"),
  ioskeley("600", "IoskeleyMono-SemiBold.woff2", "Ioskeley Mono Semibold", "Ioskeley-Mono-Semibold"),
  ioskeley("700", "IoskeleyMono-Bold.woff2", "Ioskeley Mono Bold", "Ioskeley-Mono-Bold"),
  // real italics only where the full font is installed; elsewhere it's slanted
  { family: "Ioskeley Mono", weight: "400", style: "italic", locals: ["Ioskeley Mono Italic", "Ioskeley-Mono-Italic"] },
  {
    family: "Instrument Serif",
    weight: "400",
    file: "node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2",
    locals: ["Instrument Serif", "InstrumentSerif-Regular"],
  },
  {
    family: "Caveat",
    weight: "400 700",
    file: "node_modules/@fontsource-variable/caveat/files/caveat-latin-wght-normal.woff2",
    locals: [],
  },
];

function fontFace({ family, weight, style = "normal", file, locals }) {
  const src = locals.map((name) => `local("${name}")`);
  if (file) {
    const data = readFileSync(join(root, file)).toString("base64");
    src.push(`url(data:font/woff2;base64,${data}) format("woff2")`);
  }
  return [
    "@font-face {",
    `  font-family: "${family}";`,
    `  font-style: ${style};`,
    `  font-weight: ${weight};`,
    "  font-display: swap;",
    `  src: ${src.join(", ")};`,
    "}",
  ].join("\n");
}

const source = readFileSync(join(here, "theme.css"), "utf8");
if (!source.includes("/* @fonts */")) throw new Error("theme.css lost its /* @fonts */ marker");
const css = source.replace("/* @fonts */", faces.map(fontFace).join("\n"));

mkdirSync(out, { recursive: true });
writeFileSync(join(out, "theme.css"), css);
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Built ${join(out, "theme.css")} (${Math.round(css.length / 1024)} KB)`);

const i = process.argv.indexOf("--install");
if (i !== -1) {
  const vault = process.argv[i + 1];
  if (!vault) throw new Error("--install needs the vault folder");
  const target = join(resolve(vault), ".obsidian", "themes", "Margin");
  mkdirSync(target, { recursive: true });
  cpSync(out, target, { recursive: true });
  console.log(`Installed in ${target}`);
}
