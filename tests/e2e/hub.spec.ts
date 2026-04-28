import { expect, test } from "@playwright/test";
import { GAME_URLS, gotoGame } from "./_helpers";

test.describe("Games hub /games", () => {
  test.beforeEach(async ({ page }) => {
    await gotoGame(page, GAME_URLS.hub);
  });

  test("renders all 3 game cards with correct routes", async ({ page }) => {
    const cards = page.getByTestId("game-card");
    await expect(cards).toHaveCount(3);

    await expect(page.locator("[data-game=\"solitaire\"]")).toContainText(
      "Klondike Solitaire",
    );
    await expect(page.locator("[data-game=\"game-of-life\"]")).toContainText(
      "Conway's Game of Life",
    );
    await expect(page.locator("[data-game=\"minesweeper\"]")).toContainText(
      "Minesweeper",
    );
  });

  test("each card navigates to its game route", async ({ page }) => {
    await page.locator("[data-game=\"minesweeper\"]").click();
    await expect(page).toHaveURL(/\/games\/minesweeper$/);
    await expect(page.getByTestId("ms-status")).toBeVisible();
  });

  test("desktop visual snapshot", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "snapshot pinned to chromium",
    );
    await expect(page).toHaveScreenshot("hub-desktop.png", {
      fullPage: true,
    });
  });

  test("mobile visual snapshot", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "Mobile Chrome",
      "snapshot pinned to Mobile Chrome",
    );
    await expect(page).toHaveScreenshot("hub-mobile.png", {
      fullPage: true,
    });
  });
});
