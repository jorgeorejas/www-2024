/** Rendered HTML → plain text, for the llms.txt files */
export function blocksText(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<\/(p|li|h[1-6]|blockquote)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
