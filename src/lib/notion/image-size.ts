import { readFile } from "node:fs/promises";
import path from "node:path";
import { getBlock, type NotionBlock, type NotionFile } from "./client";
import { externalImage, fileUrl, isUnsupportedImage } from "./images";

/*
 * Image sizes for Notion bodies, so every <img> carries width and height and
 * the browser keeps its space before the photo arrives (no layout shift).
 * Only the first bytes of each file are read: the size lives in the header.
 */

export type ImageSize = { width: number; height: number };

const be16 = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const le16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const le24 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const be32 = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const ascii = (b: Uint8Array, i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));

/** EXIF orientation from a JPEG APP1 segment (5–8 mean the photo is turned 90°) */
function exifOrientation(b: Uint8Array, start: number, end: number): number {
  if (ascii(b, start, 4) !== "Exif") return 1;
  const tiff = start + 6;
  const little = ascii(b, tiff, 2) === "II";
  const u16 = (i: number) => (little ? le16(b, i) : be16(b, i));
  const u32 = (i: number) => (little ? (le16(b, i) | (le16(b, i + 2) << 16)) >>> 0 : be32(b, i));
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > end) return 1;
  const count = u16(ifd);
  for (let k = 0; k < count; k++) {
    const entry = ifd + 2 + k * 12;
    if (entry + 12 > end) break;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return 1;
}

/** Width and height from the first bytes of a PNG, JPEG, WebP or GIF */
export function sizeFromHeader(b: Uint8Array): ImageSize | undefined {
  if (b.length < 30) return undefined;
  // PNG: IHDR right after the signature
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG") return { width: be32(b, 16), height: be32(b, 20) };
  // GIF: logical screen size
  if (ascii(b, 0, 4) === "GIF8") return { width: le16(b, 6), height: le16(b, 8) };
  // WebP: lossy, lossless or extended
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") {
    const chunk = ascii(b, 12, 4);
    if (chunk === "VP8 ") return { width: le16(b, 26) & 0x3fff, height: le16(b, 28) & 0x3fff };
    if (chunk === "VP8L") {
      return {
        width: 1 + (((b[22] & 0x3f) << 8) | b[21]),
        height: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)),
      };
    }
    if (chunk === "VP8X") return { width: 1 + le24(b, 24), height: 1 + le24(b, 27) };
    return undefined;
  }
  // JPEG: walk the segments to the frame header, noting the EXIF orientation
  if (b[0] === 0xff && b[1] === 0xd8) {
    let orientation = 1;
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return undefined;
      const marker = b[i + 1];
      if (marker === 0xff) {
        i++;
        continue;
      }
      const length = be16(b, i + 2);
      if (marker === 0xe1) orientation = exifOrientation(b, i + 4, Math.min(b.length, i + 2 + length));
      const frame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (frame) {
        const size = { width: be16(b, i + 7), height: be16(b, i + 5) };
        return orientation >= 5 ? { width: size.height, height: size.width } : size;
      }
      i += 2 + length;
    }
  }
  return undefined;
}

// Enough for a phone photo's EXIF block; a second, larger read covers the rest
const FIRST_READ = 64 * 1024;
const SECOND_READ = 512 * 1024;

async function headOf(url: string, bytes: number): Promise<Uint8Array | undefined> {
  const res = await fetch(url, { headers: { Range: `bytes=0-${bytes - 1}` }, signal: AbortSignal.timeout(4000) });
  if (!res.ok) return undefined;
  return new Uint8Array(await res.arrayBuffer());
}

async function probe(url: string): Promise<ImageSize | undefined> {
  const first = await headOf(url, FIRST_READ);
  if (!first) return undefined;
  const size = sizeFromHeader(first);
  if (size || first.length < FIRST_READ) return size;
  const more = await headOf(url, SECOND_READ);
  return more ? sizeFromHeader(more) : undefined;
}

// Files in /public: from disk while developing, from the deployment otherwise
const SITE_ORIGIN = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://jorgeorejas.com";

async function probeLocal(file: string): Promise<ImageSize | undefined> {
  if (import.meta.env.DEV) {
    const bytes = await readFile(path.join(process.cwd(), "public", file)).catch(() => undefined);
    if (bytes) return sizeFromHeader(new Uint8Array(bytes.subarray(0, SECOND_READ)));
  }
  return probe(new URL(file, SITE_ORIGIN).toString());
}

async function blockSize(block: NotionBlock): Promise<ImageSize | undefined> {
  const file = block.image as NotionFile | undefined;
  if (!file) return undefined;
  const { url, hosted } = fileUrl(file);
  if (isUnsupportedImage(url)) return undefined;
  if (!hosted) {
    const local = externalImage(url);
    return local.startsWith("/") ? probeLocal(local) : probe(local);
  }
  // Notion's signed URL may have expired if the block tree came from cache
  const size = await probe(url).catch(() => undefined);
  if (size) return size;
  const fresh = (await getBlock(block.id)).image as NotionFile | undefined;
  return fresh ? probe(fileUrl(fresh).url) : undefined;
}

function imageBlocks(blocks: NotionBlock[], found: NotionBlock[] = []) {
  for (const block of blocks) {
    if (block.type === "image") found.push(block);
    if (block.children) imageBlocks(block.children, found);
  }
  return found;
}

/** Sizes of every image block in a tree, by block id; images that fail are left out */
export async function imageSizes(blocks: NotionBlock[]): Promise<Map<string, ImageSize>> {
  const sizes = new Map<string, ImageSize>();
  const queue = imageBlocks(blocks);
  const worker = async () => {
    for (let block = queue.shift(); block; block = queue.shift()) {
      try {
        const size = await blockSize(block);
        if (size?.width && size.height) sizes.set(block.id, size);
      } catch (error) {
        console.error(`[notion] image size for ${block.id} failed`, error);
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  return sizes;
}
