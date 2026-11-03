import type { NavItem, NavKey } from "@components/margin/nav";
import {
  SIGNATURE_PATHS,
  SIGNATURE_VIEWBOX,
} from "@components/signature-paths";

/*
 * The share image (1200×630) of every page, drawn like the page itself in the
 * Margin design: dotted paper, the numbered nav in the margin with the
 * current section in orange, the ruler, the name as letterhead, the title in
 * Instrument Serif, the margin note and the signature in blue pen.
 *
 * Satori lays it out (flexbox, inline styles) and sharp rasterizes it
 * (src/lib/og/render.ts). sharp's SVG renderer skips SVGs nested as images,
 * so the drawn pieces (paper + ruler, signature, pen arrow) are SVG strings
 * here that render.ts turns into PNGs first, passed back in as `art`. Satori
 * also misplaces fixed-width boxes positioned with `right`, so every box is
 * placed from the left.
 *
 * Everything sits on a 30px grid, like the site's 27px one: one mono line
 * per row of dots, titles take whole rows.
 */

export type OgCard = {
  /** "home": the name is the title; "page": a section or an entry */
  kind: "home" | "page";
  nav: NavItem[];
  current: NavKey | null;
  name: string;
  role: string;
  /** Host shown top right, e.g. jorgeorejas.com */
  host: string;
  title: string;
  /** "Corrección del título": the title is struck and this goes above it in pen */
  correction?: string;
  /** Small line under the title: date, reading time, period… */
  meta?: string;
  description?: string;
  /** "Nota al margen": in pen, in the margin, at the title's height */
  note?: string;
  /** Photo as a data URI (recipes, projects), shown as a print on the right */
  photo?: string;
  /** A section's latest entries, as the site's list rows: TITLE ──── value */
  rows?: { title: string; value?: string }[];
};

/** The drawn pieces as PNG data URIs (see render.ts) */
export type OgArt = { paper: string; signature: string; arrow: string };

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const OG_PHOTO = { width: 312, height: 400 };

const G = 30;
/** Top of grid row n: the dots sit at 15 + 30n, text lines between them */
const row = (n: number) => 15 + G * n;

const C = {
  paper: "#fbfaf6",
  ink: "#100f0f",
  inkSoft: "#403e3c",
  mute: "#6f6e69",
  signal: "#cb6120",
  pen: "#205ea6",
  base200: "#cecdc3",
  base400: "#9f9d96",
  dot: "#100f0f",
};

const MARGIN_RIGHT = 266; // right edge of the margin column (nav, notes)
const RULER_X = 290;
const CONTENT_X = 336;
const CONTENT_RIGHT = 1140;
const NOTE_WIDTH = 236;

const [, , SIG_W, SIG_H] = SIGNATURE_VIEWBOX.split(" ").map(Number);
const signatureHeight = (width: number) => Math.round((width * SIG_H) / SIG_W);

/** Dotted paper with the ruler, as SVG: a dot every 30px, ticks every row and every 10px */
export function paperSvg(): string {
  const ticks: string[] = [];
  for (let y = 5; y <= OG_HEIGHT; y += 10) {
    const long = (y - 15) % G === 0;
    ticks.push(
      `<line x1="${RULER_X + (long ? 0 : 7)}" x2="${RULER_X + 14}" y1="${y + 0.5}" y2="${y + 0.5}" stroke="${long ? C.base400 : C.base200}" stroke-width="1"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
<defs><pattern id="dots" width="${G}" height="${G}" patternUnits="userSpaceOnUse">
<circle cx="15" cy="15" r="1.25" fill="${C.dot}" fill-opacity="0.17"/></pattern></defs>
<rect width="100%" height="100%" fill="${C.paper}"/>
<rect width="100%" height="100%" fill="url(#dots)"/>
${ticks.join("")}
</svg>`;
}

/** The signature in pen blue, as SVG */
export function signatureSvg(width: number): string {
  const paths = SIGNATURE_PATHS.map(
    (p) =>
      `<path d="${p.d}" stroke-width="${p.strokeWidth}" stroke="${C.pen}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${signatureHeight(width)}" viewBox="${SIGNATURE_VIEWBOX}">${paths}</svg>`;
}

/** The notes' pen arrow (hand-arrow.ts), pointing right, as SVG */
export function arrowSvg(width: number): string {
  const stroke = `stroke="${C.pen}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round((width * 22) / 30)}" viewBox="0 0 30 22">
<path d="M2.2 12.6c5.4-2.3 11.9-2.7 22.4-1.5" ${stroke}/>
<path d="M19.3 6.5c2.2 1.5 4.1 3 5.8 4.7-2 1.1-3.9 2.6-5.5 4.5" ${stroke}/></svg>`;
}

/** Title size that fits ~2 lines in the width (Instrument Serif is ~0.41em per char) */
function titleSize(title: string, width: number, max: number) {
  const fit = Math.floor((width * 2) / (Math.max(title.length, 1) * 0.41));
  return Math.max(48, Math.min(max, fit));
}

function Nav({ items, current }: { items: NavItem[]; current: NavKey | null }) {
  return (
    <div
      style={{
        position: "absolute",
        top: row(1),
        left: 0,
        width: MARGIN_RIGHT,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      {items.map((item) => {
        const on = item.key === current;
        return (
          <div
            style={{
              display: "flex",
              height: G,
              alignItems: "center",
              fontSize: 19,
            }}
          >
            {item.outward && (
              <span style={{ color: C.mute, marginRight: 10 }}>↗</span>
            )}
            <span
              style={{
                color: on ? C.ink : C.inkSoft,
                fontWeight: on ? 500 : 400,
              }}
            >
              {item.label}
            </span>
            <span style={{ color: on ? C.signal : C.mute, marginLeft: 12 }}>
              {item.n}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Note({
  text,
  top,
  arrow,
}: {
  text: string;
  top: number;
  arrow: string;
}) {
  const pointing = /\s*(?:→|->)\s*$/.test(text);
  const words = text.replace(/\s*(?:→|->)\s*$/, "");
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: MARGIN_RIGHT - NOTE_WIDTH,
        width: NOTE_WIDTH,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        transform: "rotate(-3deg)",
      }}
    >
      <div
        style={{
          fontFamily: "Caveat",
          fontWeight: 500,
          fontSize: 29,
          lineHeight: `${G}px`,
          color: C.pen,
          textAlign: "right",
          lineClamp: 5,
        }}
      >
        {words}
      </div>
      {pointing && (
        <img src={arrow} width={38} height={28} style={{ marginTop: 2 }} />
      )}
    </div>
  );
}

function Title({
  text,
  correction,
  size,
}: {
  text: string;
  correction?: string;
  size: number;
}) {
  // Whole rows: 3 rows of dots per line at the largest sizes, 2 below 60px
  const lineHeight = size > 60 ? G * 3 : G * 2;
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        marginTop: correction ? G : 0,
      }}
    >
      <div
        style={{
          fontFamily: "Instrument Serif",
          fontSize: size,
          lineHeight: `${lineHeight}px`,
          color: C.ink,
          letterSpacing: "-0.01em",
          lineClamp: 3,
          textDecoration: correction ? "line-through" : "none",
          textDecorationColor: C.pen,
        }}
      >
        {text}
      </div>
      {correction && (
        <div
          style={{
            position: "absolute",
            left: Math.round(size * 0.45),
            top: -Math.round(size * 0.6),
            fontFamily: "Caveat",
            fontWeight: 700,
            fontSize: Math.round(size * 0.62),
            color: C.pen,
            whiteSpace: "nowrap",
            transform: "rotate(-5deg)",
          }}
        >
          {correction}
        </div>
      )}
    </div>
  );
}

function Host({ host }: { host: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: row(1),
        left: CONTENT_X,
        width: CONTENT_RIGHT - CONTENT_X,
        height: G,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        fontSize: 18,
        color: C.mute,
      }}
    >
      {host}
    </div>
  );
}

function Letterhead({ name, role }: { name: string; role: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: row(1),
        left: CONTENT_X,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily: "Instrument Serif",
          fontSize: 46,
          lineHeight: `${G * 2}px`,
          color: C.ink,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 500,
          lineHeight: `${G}px`,
          color: C.inkSoft,
          letterSpacing: "0.02em",
        }}
      >
        {role}
      </div>
    </div>
  );
}

/** The site's list rows (ListRow): title in mono caps, a ruled leader, the value */
function Rows({ rows }: { rows: NonNullable<OgCard["rows"]> }) {
  return (
    <div style={{ marginTop: G, display: "flex", flexDirection: "column" }}>
      {rows.map((r) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: G,
            fontSize: 17,
            color: C.ink,
          }}
        >
          <div
            style={{
              maxWidth: 560,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {r.title}
          </div>
          <div
            style={{
              flexGrow: 1,
              height: 1,
              margin: "4px 14px 0",
              backgroundColor: C.base400,
            }}
          />
          {r.value && <div style={{ color: C.mute }}>{r.value}</div>}
        </div>
      ))}
    </div>
  );
}

function Home(card: OgCard, art: OgArt) {
  return [
    <div
      style={{
        position: "absolute",
        top: row(3),
        left: CONTENT_X,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily: "Instrument Serif",
          fontSize: 132,
          lineHeight: `${G * 5}px`,
          color: C.ink,
          letterSpacing: "-0.015em",
        }}
      >
        {card.name}
      </div>
      <div
        style={{
          marginTop: G / 2,
          fontSize: 26,
          fontWeight: 500,
          lineHeight: `${G}px`,
          color: C.inkSoft,
          letterSpacing: "0.02em",
        }}
      >
        {card.role}
      </div>
      {card.description && (
        <div
          style={{
            marginTop: G,
            width: 720,
            fontSize: 22,
            lineHeight: `${G}px`,
            color: C.inkSoft,
            lineClamp: 3,
          }}
        >
          {card.description}
        </div>
      )}
    </div>,
    <img
      src={art.signature}
      width={300}
      height={signatureHeight(300)}
      style={{ position: "absolute", left: CONTENT_X - 12, top: row(15) }}
    />,
  ];
}

function Page(card: OgCard, art: OgArt) {
  const photo = Boolean(card.photo);
  const width =
    (photo ? CONTENT_RIGHT - OG_PHOTO.width - 76 : CONTENT_RIGHT) - CONTENT_X;
  const size = titleSize(card.correction ?? card.title, width, photo ? 68 : 86);
  // A section with its list starts a row higher, to fit it
  const top = row(card.correction || card.rows?.length ? 8 : 9);
  return [
    <Letterhead name={card.name} role={card.role} />,
    <div
      style={{
        position: "absolute",
        top,
        left: CONTENT_X,
        width,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Title text={card.title} correction={card.correction} size={size} />
      {card.meta && (
        <div
          style={{
            fontSize: 18,
            lineHeight: `${G}px`,
            color: C.mute,
            letterSpacing: "0.01em",
          }}
        >
          {card.meta}
        </div>
      )}
      {card.description && (
        <div
          style={{
            marginTop: G,
            fontSize: 21,
            lineHeight: `${G}px`,
            color: C.inkSoft,
            lineClamp: photo ? 4 : 2,
          }}
        >
          {card.description}
        </div>
      )}
      {card.rows?.length ? <Rows rows={card.rows} /> : null}
    </div>,
    card.note && (
      <Note
        text={card.note}
        top={top + (card.correction ? G : 0) + 6}
        arrow={art.arrow}
      />
    ),
    card.photo && (
      <div
        style={{
          position: "absolute",
          top: row(3) + 8,
          left: CONTENT_RIGHT - OG_PHOTO.width - 20,
          display: "flex",
          padding: 10,
          backgroundColor: "#ffffff",
          boxShadow:
            "0 1px 2px rgba(16, 15, 15, 0.14), 0 10px 28px rgba(16, 15, 15, 0.12)",
          transform: "rotate(1.5deg)",
        }}
      >
        <img
          src={card.photo}
          width={OG_PHOTO.width}
          height={OG_PHOTO.height}
          style={{ objectFit: "cover" }}
        />
      </div>
    ),
    <img
      src={art.signature}
      width={170}
      height={signatureHeight(170)}
      style={{ position: "absolute", left: MARGIN_RIGHT - 174, top: row(17) }}
    />,
  ];
}

export function Card(card: OgCard, art: OgArt) {
  return (
    <div
      style={{
        width: OG_WIDTH,
        height: OG_HEIGHT,
        display: "flex",
        position: "relative",
        backgroundColor: C.paper,
        fontFamily: "Ioskeley Mono",
        color: C.ink,
      }}
    >
      <img
        src={art.paper}
        width={OG_WIDTH}
        height={OG_HEIGHT}
        style={{ position: "absolute", left: 0, top: 0 }}
      />
      <Nav items={card.nav} current={card.current} />
      <Host host={card.host} />
      {card.kind === "home" ? Home(card, art) : Page(card, art)}
    </div>
  );
}
