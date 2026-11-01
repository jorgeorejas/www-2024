import satori from "satori";
import sharp from "sharp";

// OG images render on request now, where the repo's files aren't on disk,
// so the fonts come from the site's own /fonts folder
const fonts = new Map<string, Promise<ArrayBuffer>>();

function font(origin: string, path: string) {
  const url = new URL(path, origin).href;
  if (!fonts.has(url)) {
    fonts.set(
      url,
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Font ${url} failed: ${res.status}`);
          return res.arrayBuffer();
        })
        .catch((error) => {
          // Retry on the next request instead of failing every OG image
          fonts.delete(url);
          throw error;
        }),
    );
  }
  return fonts.get(url)!;
}

export async function SVG(component: JSX.Element, origin: string) {
  const [plex, serif] = await Promise.all([
    font(origin, "/fonts/ibm-plex.woff"),
    font(origin, "/fonts/instrument-serif-400.woff"),
  ]);
  return await satori(component, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "IBM Plex Mono", data: plex, weight: 600 },
      { name: "Instrument Serif", data: serif, weight: 400 },
    ],
  });
}

export async function PNG(component: JSX.Element, origin: string) {
  return await sharp(Buffer.from(await SVG(component, origin)))
    .png()
    .toBuffer();
}
