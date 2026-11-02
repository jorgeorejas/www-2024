import { expect, test, type Page } from "@playwright/test";

/*
 * The dot grid (libreta punteada): every line of text sits between two rows
 * of dots (27px), and nothing jumps while the page loads. Pages come from
 * Notion, so the reading views are found through the index pages instead of
 * hard-coding slugs.
 */

const INDEXES = ["/", "/blog", "/projects", "/work", "/cocina", "/wishlist", "/games"];

async function firstEntry(page: Page, index: string, selector: string) {
  await page.goto(index);
  const href = await page.locator(selector).first().getAttribute("href");
  expect(href, `no entry on ${index}`).toBeTruthy();
  return href as string;
}

/** Lines whose middle isn't half a row (or a row, for two-row titles) past a row of dots */
async function linesOffGrid(page: Page) {
  return page.evaluate(() => {
    const G = 27;
    const grid = document.querySelector("body.margin-ui .m");
    if (!grid) return { total: 0, off: [] as string[] };
    const origin = grid.getBoundingClientRect().top;
    const free = ".hn, .m-corr-new, .font-handwritten, .m-vert, svg, [aria-hidden='true'], .preview-badge, .sr-only";
    const off: string[] = [];
    let total = 0;
    const walker = document.createTreeWalker(grid, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const el = node.parentElement;
      if (!el || el.closest(free)) continue;
      let floating = false;
      for (let a: Element | null = el; a && a !== grid; a = a.parentElement) {
        if (["absolute", "fixed"].includes(getComputedStyle(a).position)) floating = true;
      }
      const cs = getComputedStyle(el);
      if (floating || cs.visibility === "hidden" || cs.display === "none") continue;
      let block: Element = el;
      while (block.parentElement && getComputedStyle(block).display.startsWith("inline")) block = block.parentElement;
      // a smaller inline (a count next to a title) sits on the title's baseline
      if (el !== block && cs.fontSize !== getComputedStyle(block).fontSize) continue;
      const rows = Math.round((parseFloat(getComputedStyle(block).lineHeight) || G) / G);
      const range = document.createRange();
      range.selectNodeContents(node);
      const seen = new Set<number>();
      for (const rect of range.getClientRects()) {
        if (rect.width < 2 || seen.has(Math.round(rect.top))) continue;
        seen.add(Math.round(rect.top));
        total++;
        const middle = (rect.top + rect.bottom) / 2 - origin;
        let delta = ((middle - (rows % 2 === 0 ? 0 : G / 2)) % G + G) % G;
        if (delta > G / 2) delta -= G;
        if (Math.abs(delta) > 3.5) off.push(`${delta.toFixed(1)}px "${node.textContent.trim().slice(0, 40)}"`);
      }
    }
    return { total, off };
  });
}

test.describe("dot grid", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(!["chromium", "Mobile Chrome"].includes(testInfo.project.name), "layout checked in Chrome, desktop and phone");
  });

  const pages = [
    ...INDEXES.map((path) => ({ name: path, path: async () => path })),
    { name: "a blog post", path: (page: Page) => firstEntry(page, "/blog", "a.m-card") },
    { name: "a project", path: (page: Page) => firstEntry(page, "/projects", "a.m-card") },
    { name: "a recipe", path: (page: Page) => firstEntry(page, "/cocina", "a[href^='/cocina/']:not([href*='etiqueta'])") },
  ];

  for (const entry of pages) {
    test(`every line sits between two rows of dots: ${entry.name}`, async ({ page }) => {
      const path = await entry.path(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      const { total, off } = await linesOffGrid(page);
      expect(total, "no text measured").toBeGreaterThan(10);
      expect(off, `${off.length} of ${total} lines off the grid`).toEqual([]);
    });
  }

  // The dev server injects CSS after the first paint, so CLS is only
  // meaningful on a build: SITE_URL=https://www-git-<branch>-jorejas-projects.vercel.app
  test("nothing jumps while the main pages load (CLS)", async ({ page, context }, testInfo) => {
    const site = process.env.SITE_URL;
    test.skip(testInfo.project.name !== "chromium" || !site, "needs SITE_URL (a deployed build), measured once in Chrome");
    const post = await firstEntry(page, `${site}/blog`, "a.m-card");
    for (const path of ["/", "/blog", post, "/wishlist"].map((p) => new URL(p, site).toString())) {
      const tab = await context.newPage();
      await tab.addInitScript(() => {
        const w = window as Window & { cls?: number };
        w.cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
            if (!e.hadRecentInput) w.cls = (w.cls ?? 0) + e.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await tab.goto(path);
      await tab.waitForLoadState("networkidle");
      await tab.waitForTimeout(1500);
      const cls = await tab.evaluate(() => (window as Window & { cls?: number }).cls ?? 0);
      await tab.close();
      expect(cls, `CLS on ${path}`).toBeLessThan(0.01);
    }
  });
});
