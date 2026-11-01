import { markdownConfigDefaults, unified, type MarkdownRenderer } from "@astrojs/markdown-remark";
import { remarkCorrection } from "../remark-correction.mjs";

// Same processor as astro.config.mjs, so Notion bodies render like the old .md files
let renderer: Promise<MarkdownRenderer> | undefined;

export async function renderMarkdown(markdown: string): Promise<string> {
  renderer ??= unified({ remarkPlugins: [remarkCorrection] }).createRenderer(markdownConfigDefaults);
  const { code } = await (await renderer).render(markdown);
  return code;
}
