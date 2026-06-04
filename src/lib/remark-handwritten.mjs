import { visit } from "unist-util-visit";

/**
 * Remark plugin (runs after `remark-directive`) that turns handwritten-quirk
 * directives into the same `data-rn` markup emitted by the annotation Astro
 * components. The strokes are then drawn client-side by
 * `src/scripts/rough-annotations.ts`.
 *
 * Inline (text) directives:
 *   :circle[ECP]
 *   :underline[immediately obtainable]{color=red}
 *
 * Leaf directive (block aside):
 *   ::margin-note[One-off prompts don't compound]{color=blue side=right}
 *
 * Supported `{...}` attributes: color (blue|red|green|orange|black),
 * stroke (px), padding (px), iterations, duration (ms), and — for margin-note —
 * side (right|left).
 */

// Light / dark stroke colors per palette name (Flexoki). Keep in sync with
// src/components/annotations/Annotation.astro.
const COLORS = {
  blue: { light: "#205ea6", dark: "#4385be" },
  red: { light: "#af3029", dark: "#d14d41" },
  green: { light: "#66800b", dark: "#879a39" },
  orange: { light: "#ff4f00", dark: "#ff4f00" },
  black: { light: "#100f0f", dark: "#f2f0e5" },
};

const MARGIN_NOTE_COLOR_CLASS = {
  blue: "text-flexoki-blue-600 dark:text-flexoki-blue-400",
  red: "text-flexoki-red-600 dark:text-flexoki-red-400",
  green: "text-flexoki-green-600 dark:text-flexoki-green-400",
  orange: "text-international-orange",
  black: "text-flexoki-ink dark:text-flexoki-base-50",
};

function resolveColor(name) {
  return COLORS[name] ? name : "blue";
}

export function remarkHandwritten() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "textDirective" && node.type !== "leafDirective") {
        return;
      }

      const attrs = node.attributes || {};
      const colorName = resolveColor(attrs.color);
      const { light, dark } = COLORS[colorName];

      // Inline strokes: circle + underline.
      if (
        node.type === "textDirective" &&
        (node.name === "circle" || node.name === "underline")
      ) {
        const hProperties = {
          dataRn: node.name,
          dataRnColorLight: light,
          dataRnColorDark: dark,
          className: ["relative"],
        };
        if (node.name === "underline") hProperties.dataRnMultiline = "true";
        if (attrs.stroke) hProperties.dataRnStroke = String(attrs.stroke);
        if (attrs.padding) hProperties.dataRnPadding = String(attrs.padding);
        else if (node.name === "circle") hProperties.dataRnPadding = "4";
        if (attrs.iterations)
          hProperties.dataRnIterations = String(attrs.iterations);
        if (attrs.duration) hProperties.dataRnDuration = String(attrs.duration);

        node.data = {
          ...node.data,
          hName: "span",
          hProperties,
        };
        return;
      }

      // Block aside: margin-note.
      if (node.type === "leafDirective" && node.name === "margin-note") {
        const side = attrs.side === "left" ? "left" : "right";
        const className = [
          "not-prose",
          "font-handwritten",
          "font-bold",
          "text-xl",
          "leading-tight",
          ...MARGIN_NOTE_COLOR_CLASS[colorName].split(" "),
          "my-3",
          "text-center",
          ...(side === "right"
            ? [
                "xl:float-right",
                "xl:clear-right",
                "xl:my-0",
                "xl:ml-6",
                "xl:-mr-52",
                "xl:w-44",
                "xl:text-left",
                "-rotate-3",
              ]
            : [
                "xl:float-left",
                "xl:clear-left",
                "xl:my-0",
                "xl:mr-6",
                "xl:-ml-52",
                "xl:w-44",
                "xl:text-right",
                "rotate-3",
              ]),
        ];

        node.data = {
          ...node.data,
          hName: "aside",
          hProperties: { className },
        };
      }
    });
  };
}
