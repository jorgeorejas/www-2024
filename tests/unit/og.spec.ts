import { expect, test } from "@playwright/test";
import { ogImageFor } from "../../src/lib/og/paths";

/*
 * Which share card each page points at (src/pages/og/[...path].png.ts draws
 * them). Pages without a card of their own share the home one.
 */

test.describe("share image per page", () => {
  test("home, sections and entries get their own card", () => {
    expect(ogImageFor("/")).toBe("/og/home.png");
    expect(ogImageFor("/blog")).toBe("/og/blog.png");
    expect(ogImageFor("/blog/code-as-creativity")).toBe("/og/blog/code-as-creativity.png");
    expect(ogImageFor("/projects/breachpoint")).toBe("/og/projects/breachpoint.png");
    expect(ogImageFor("/work/vivla")).toBe("/og/work/vivla.png");
    expect(ogImageFor("/cocina/fabes-de-chiti")).toBe("/og/cocina/fabes-de-chiti.png");
    expect(ogImageFor("/cocina/etiqueta/asturias")).toBe("/og/cocina/etiqueta/asturias.png");
    expect(ogImageFor("/games/queens")).toBe("/og/games/queens.png");
    expect(ogImageFor("/wishlist")).toBe("/og/wishlist.png");
  });

  test("a trailing slash doesn't change the card", () => {
    expect(ogImageFor("/blog/")).toBe("/og/blog.png");
  });

  test("pages without a card share the home one", () => {
    expect(ogImageFor("/cv")).toBe("/og/home.png");
    expect(ogImageFor("/404")).toBe("/og/home.png");
    expect(ogImageFor("/wishlist/anything")).toBe("/og/home.png");
    expect(ogImageFor("/blog/a/b")).toBe("/og/home.png");
  });
});
