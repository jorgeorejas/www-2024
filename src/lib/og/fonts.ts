import caveat500 from "./fonts/Caveat-500.woff?inline";
import caveat700 from "./fonts/Caveat-700.woff?inline";
import serif from "./fonts/InstrumentSerif-Regular.woff?inline";
import monoMedium from "./fonts/IoskeleyMono-Medium.woff?inline";
import monoRegular from "./fonts/IoskeleyMono-Regular.woff?inline";

/*
 * The site's three fonts for the share images, inlined into the server
 * bundle (satori reads WOFF, not WOFF2, and a function can't read /public):
 * Instrument Serif for titles, Ioskeley Mono for text, Caveat for the pen.
 * The WOFFs were converted from the site's WOFF2s with fontTools; Caveat is
 * its variable font pinned at 500 and 700.
 */

const bytes = (dataUrl: string) =>
  Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");

export const OG_FONTS = [
  {
    name: "Instrument Serif",
    data: bytes(serif),
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Ioskeley Mono",
    data: bytes(monoRegular),
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    name: "Ioskeley Mono",
    data: bytes(monoMedium),
    weight: 500 as const,
    style: "normal" as const,
  },
  {
    name: "Caveat",
    data: bytes(caveat500),
    weight: 500 as const,
    style: "normal" as const,
  },
  {
    name: "Caveat",
    data: bytes(caveat700),
    weight: 700 as const,
    style: "normal" as const,
  },
];
