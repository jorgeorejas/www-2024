import satori from "satori";
import fs from "fs/promises";
import sharp from "sharp";

export async function SVG(component: JSX.Element) {
  return await satori(component, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "IBM Plex Mono",
        data: await fs.readFile("./public/fonts/ibm-plex.woff"),
        weight: 600,
      },
      {
        name: "Asturica",
        data: await fs.readFile("./public/fonts/asturica.ttf"),
        weight: 400,
      },
    ],
  });
}

export async function PNG(component: JSX.Element) {
  return await sharp(Buffer.from(await SVG(component)))
    .png()
    .toBuffer();
}
