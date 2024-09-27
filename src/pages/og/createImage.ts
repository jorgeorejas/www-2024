import satori from "satori";
import fs from "fs/promises";
import sharp from "sharp";

export async function SVG(component: JSX.Element) {
  return await satori(component, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Atkinson",
        data: await fs.readFile("./public/fonts/atkinson-bold.woff"),
        weight: 600,
      },
      {
        name: "Atkinson",
        data: await fs.readFile("./public/fonts/atkinson-regular.woff"),
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
