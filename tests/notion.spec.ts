import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { NotionBlock, RichText } from "../src/lib/notion/client";
import { sizeFromHeader } from "../src/lib/notion/image-size";
import { blocksToMarkdown, richTextToMarkdown } from "../src/lib/notion/markdown";
import { parseQuantity, splitRecipe, tagQuantities } from "../src/lib/notion/recipe";

/*
 * The Notion → page pipeline, without a browser or Notion: image sizes read
 * from file headers, blocks → Markdown, and how recipes get split.
 */

const text = (plain: string, annotations: Partial<RichText[number]["annotations"]> = {}) =>
  ({
    type: "text",
    plain_text: plain,
    href: null,
    annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: "default", ...annotations },
  }) as unknown as RichText[number];

const block = (type: string, data: Record<string, unknown>, id = `${type}-1`) =>
  ({ object: "block", id, type, has_children: false, [type]: data }) as NotionBlock;

const paragraph = (...rich: RichText) => block("paragraph", { rich_text: rich }, `p-${Math.random()}`);
const heading = (level: number, plain: string) => block(`heading_${level}`, { rich_text: [text(plain)] }, `h-${plain}`);

test.describe("image sizes from file headers", () => {
  const u8 = (...bytes: number[]) => new Uint8Array([...bytes, ...new Array(40).fill(0)]);

  test("PNG", () => {
    const png = u8(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0x07, 0x80, 0, 0, 0x04, 0x38);
    expect(sizeFromHeader(png)).toEqual({ width: 1920, height: 1080 });
  });

  test("GIF", () => {
    const gif = u8(0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x40, 0x01, 0xf0, 0x00);
    expect(sizeFromHeader(gif)).toEqual({ width: 320, height: 240 });
  });

  test("JPEG turned 90° by EXIF swaps width and height", () => {
    // SOI, APP1 Exif (little endian, one IFD entry: orientation 6), SOF0 4032×3024
    const exif = [
      0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ];
    const sof = [0xff, 0xc0, 0x00, 0x11, 0x08, 0x0b, 0xd0, 0x0f, 0xc0, 0x03];
    const jpeg = u8(0xff, 0xd8, ...exif, ...sof);
    expect(sizeFromHeader(jpeg)).toEqual({ width: 3024, height: 4032 });
  });

  test("real files in /public", () => {
    const read = (path: string) => new Uint8Array(readFileSync(path).subarray(0, 64 * 1024));
    expect(sizeFromHeader(read("public/img/aramo.png"))).toEqual({ width: 2048, height: 1341 });
    expect(sizeFromHeader(read("public/img/breachpoint/campaign-map.webp"))).toEqual({ width: 1600, height: 900 });
  });

  test("a cut-off JPEG gives no size instead of a wrong one", () => {
    expect(sizeFromHeader(u8(0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff))).toBeUndefined();
  });
});

test.describe("Notion blocks → Markdown", () => {
  test("strikethrough keeps the ~~typo~~(fix) correction syntax", () => {
    expect(richTextToMarkdown([text("programing", { strikethrough: true }), text("(programming)")])).toBe("~~programing~~(programming)");
  });

  test("yellow highlight becomes <mark>, and its comment a hand note first in the block", () => {
    const p = paragraph(text("the best decision", { color: "yellow_background" }), text(" ever"));
    const md = blocksToMarkdown([p], { notes: new Map([[p.id, "ojo aquí →"]]) });
    expect(md).toMatch(/^<span class="hn m-anno">ojo aquí<svg/);
    expect(md).toContain("<mark>the best decision</mark> ever");
  });

  test("images carry width and height when the size is known", () => {
    const image = block("image", { type: "external", external: { url: "https://example.com/a.webp" }, caption: [] }, "img-1");
    expect(blocksToMarkdown([image], { sizes: new Map([["img-1", { width: 1600, height: 900 }]]) })).toContain("width=\"1600\" height=\"900\"");
    expect(blocksToMarkdown([image])).not.toContain("width=");
  });
});

test.describe("recipes", () => {
  test("headings split intro, ingredients, steps and extra; photos in the steps go to the gallery", () => {
    const photo = block("image", { type: "external", external: { url: "https://example.com/p.jpg" }, caption: [] }, "photo");
    const parts = splitRecipe([
      paragraph(text("La de casa.")),
      heading(2, "Ingredientes para 4 personas"),
      paragraph(text("800 g de fabes")),
      heading(2, "Preparación"),
      paragraph(text("A remojo la noche antes.")),
      photo,
      heading(2, "Notas"),
      paragraph(text("Mejor al día siguiente.")),
    ]);
    expect(parts.intro).toHaveLength(1);
    expect(parts.ingredients).toHaveLength(1);
    expect(parts.steps).toHaveLength(1);
    expect(parts.gallery.map((b) => b.id)).toEqual(["photo"]);
    expect(parts.extra).toHaveLength(2);
    expect(parts.servingsHint).toBe(4);
  });

  test("quantities scale, temperatures and ranges don't", () => {
    expect(parseQuantity("½")).toBe(0.5);
    expect(parseQuantity("1,5")).toBe(1.5);
    expect(parseQuantity("3/4")).toBe(0.75);
    const line = tagQuantities("200 g de harina a 180º, 2-3 huevos");
    expect(line).toContain("<span class=\"qty\" data-qty=\"200\">200</span>");
    expect(line).not.toContain("data-qty=\"180\"");
    expect(line).not.toContain("data-qty=\"3\"");
  });
});
