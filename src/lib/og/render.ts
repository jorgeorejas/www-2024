import satori from "satori";
import sharp from "sharp";
import {
  arrowSvg,
  Card,
  OG_HEIGHT,
  OG_PHOTO,
  OG_WIDTH,
  paperSvg,
  signatureSvg,
  type OgArt,
  type OgCard,
} from "./card";
import { OG_FONTS } from "./fonts";

const dataUri = (png: Buffer) =>
  `data:image/png;base64,${png.toString("base64")}`;

/** The drawn pieces as PNGs, once per instance: they never change */
let art: Promise<OgArt> | undefined;
function drawnArt(): Promise<OgArt> {
  art ??= Promise.all([
    sharp(Buffer.from(paperSvg())).png().toBuffer(),
    // Drawn at 2× and scaled down by the card, so the pen strokes stay smooth
    sharp(Buffer.from(signatureSvg(600)))
      .png()
      .toBuffer(),
    sharp(Buffer.from(arrowSvg(76)))
      .png()
      .toBuffer(),
  ])
    .then(([paper, signature, arrow]) => ({
      paper: dataUri(paper),
      signature: dataUri(signature),
      arrow: dataUri(arrow),
    }))
    .catch((error) => {
      art = undefined;
      throw error;
    });
  return art;
}

/** The card as SVG (satori's output, before rasterizing) */
export async function cardSvg(card: OgCard): Promise<string> {
  return satori(Card(card, await drawnArt()), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: OG_FONTS,
  });
}

/**
 * The share image as a PNG. A 256-colour palette keeps it small (~35 KB, ~100
 * KB with a photo; WhatsApp skips previews over ~300 KB) and still looks the
 * same: the card is flat colours, and the photo only dithers a little.
 */
export async function renderCard(card: OgCard): Promise<Buffer> {
  return sharp(Buffer.from(await cardSvg(card)))
    .png({ palette: true, quality: 95, compressionLevel: 9 })
    .toBuffer();
}

/**
 * A page's photo as a JPEG data URI cropped for the card's print (satori
 * can't read WebP, which is what /api/notion-image serves). Undefined when it
 * fails: the card is still fine without it.
 */
export async function cardPhoto(
  src: string | undefined,
  origin: string,
): Promise<string | undefined> {
  if (!src) return undefined;
  try {
    const response = await fetch(new URL(src, origin), {
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) throw new Error(`${response.status}`);
    const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
      .rotate()
      .resize(OG_PHOTO.width * 2, OG_PHOTO.height * 2, { fit: "cover" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.warn(
      `[og] photo ${src} failed, drawing the card without it:`,
      error,
    );
    return undefined;
  }
}
