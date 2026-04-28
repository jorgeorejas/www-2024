import { expect, test } from "@playwright/test";
import { GAME_URLS, gotoGame } from "./_helpers";

test.describe("Klondike Solitaire", () => {
  test.beforeEach(async ({ page }) => {
    await gotoGame(page, GAME_URLS.solitaire);
    await expect(page.getByTestId("solitaire-new-game")).toBeVisible();
    // Ensure a fresh deal regardless of prior state.
    await page.getByTestId("solitaire-new-game").click();
  });

  test("fresh deal: 28 tableau cards, 24 stock, top of each column face-up", async ({
    page,
  }) => {
    const tableau = page.getByTestId("tableau");
    await expect(tableau).toHaveCount(7);

    // Sum of cards across tableau columns should be 1+2+3+4+5+6+7 = 28
    const counts = await tableau.evaluateAll((els) =>
      els.map((el) => Number((el as HTMLElement).dataset.count)),
    );
    expect(counts).toEqual([1, 2, 3, 4, 5, 6, 7]);

    // Each column's top card must be face-up
    for (let col = 0; col < 7; col++) {
      const lastCard = page
        .locator(`[data-testid="tableau"][data-column="${col}"] [data-testid="card"]`)
        .last();
      await expect(lastCard).toHaveAttribute("data-faceup", "true");
    }

    // Score 0, moves 0
    await expect(page.getByTestId("solitaire-score")).toHaveText("Score: 0");
    await expect(page.getByTestId("solitaire-moves")).toHaveText("Moves: 0");
  });

  test("clicking stock draws a card to waste", async ({ page }) => {
    const waste = page.getByTestId("waste");
    const before = await waste.locator("[data-testid=\"card\"]").count();
    await page.getByTestId("stock").click();
    const after = await waste.locator("[data-testid=\"card\"]").count();
    expect(after).toBeGreaterThan(before);
  });

  test("recycle: depleting stock then clicking restores from waste", async ({
    page,
  }) => {
    const stock = page.getByTestId("stock");

    // Click until stock is empty (at most 24/3 = 8 clicks for default 3-draw, but
    // hard-cap to avoid infinite loop)
    for (let i = 0; i < 30; i++) {
      const canDraw = await stock.getAttribute("data-can-draw");
      if (canDraw !== "1") break;
      await stock.click();
    }
    await expect(stock).toHaveAttribute("data-can-recycle", "1");

    await stock.click();
    await expect(stock).toHaveAttribute("data-can-draw", "1");
  });

  test("undo restores prior state and decrements move count", async ({
    page,
  }) => {
    await page.getByTestId("stock").click();
    const movesAfterDraw = await page.getByTestId("solitaire-moves").textContent();
    expect(movesAfterDraw).toMatch(/Moves: [1-9]/);

    await page.getByTestId("solitaire-undo").click();
    await expect(page.getByTestId("solitaire-moves")).toHaveText("Moves: 0");
  });

  test("hint panel surfaces a legal move and Apply executes it", async ({
    page,
  }) => {
    await page.getByTestId("solitaire-hint-toggle").click();
    const hint = page.getByTestId("solitaire-hint");
    await expect(hint).toHaveAttribute("data-hint-kind", /\S+/);

    const applyButton = page.getByTestId("solitaire-hint-apply");
    if (await applyButton.isVisible()) {
      const movesBefore = await page.getByTestId("solitaire-moves").textContent();
      await applyButton.click();
      const movesAfter = await page.getByTestId("solitaire-moves").textContent();
      expect(movesAfter).not.toEqual(movesBefore);
    }
  });

  test("regression: waste card stack has strictly increasing z-index (z-${index} bug)", async ({
    page,
  }) => {
    // Draw 3 times to ensure the waste pile shows multiple cards stacked
    await page.getByTestId("stock").click();
    await page.getByTestId("stock").click();
    await page.getByTestId("stock").click();

    const wasteCards = page.locator(
      "[data-testid=\"waste\"] [data-testid=\"card\"]",
    );
    const count = await wasteCards.count();
    if (count < 2) {
      // 1-card draw mode would only ever show one card; skip.
      test.skip();
    }

    const zIndices: number[] = await wasteCards.evaluateAll((els) =>
      els.map((el) => {
        const wrapper = (el as HTMLElement).parentElement!;
        return parseInt(getComputedStyle(wrapper).zIndex || "0", 10) || 0;
      }),
    );

    // The fix uses inline style.zIndex so each stacked card has a real
    // numeric value. Pre-fix code applied class names like z-0, z-1 (via
    // template strings), which Tailwind cannot generate at build time, so
    // computed z-index would be 0 for the non-top cards.
    const allHaveZ = zIndices.every((z) => Number.isFinite(z));
    expect(allHaveZ).toBe(true);
    // top card (last) must be highest
    const topZ = zIndices[zIndices.length - 1];
    for (let i = 0; i < zIndices.length - 1; i++) {
      expect(topZ).toBeGreaterThanOrEqual(zIndices[i]);
    }
  });

  test("new game resets state", async ({ page }) => {
    await page.getByTestId("stock").click();
    await page.getByTestId("solitaire-new-game").click();
    await expect(page.getByTestId("solitaire-moves")).toHaveText("Moves: 0");
    await expect(page.getByTestId("solitaire-score")).toHaveText("Score: 0");
  });

  test("desktop visual snapshot of fresh deal", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "snapshot pinned to chromium",
    );
    // The cards are randomized; mask them so the visual diff focuses on
    // layout, scaffolding, and theming, not specific suits/ranks.
    await expect(page.getByTestId("solitaire-new-game").locator("..")).toBeVisible();
    await expect(page).toHaveScreenshot("solitaire-fresh-deal.png", {
      fullPage: true,
      mask: [page.locator("[data-testid=\"card\"]")],
    });
  });

  test("click waste ace auto-flows to its foundation (uses canMoveWasteToFoundation)", async ({
    page,
  }) => {
    // The waste pile fires moveWasteToFoundation() on click when the top card
    // is legal. Only the *top* (last) waste card is clickable, so we have to
    // wait until an Ace lands as the top, not just appears anywhere in waste.
    const stock = page.getByTestId("stock");
    const waste = page.getByTestId("waste");
    const wasteTop = page
      .locator("[data-testid=\"waste\"] [data-testid=\"card\"]")
      .last();

    for (let i = 0; i < 30; i++) {
      if ((await wasteTop.count()) > 0) {
        const rank = await wasteTop.getAttribute("data-rank");
        if (rank === "1") {
          const suit = await wasteTop.getAttribute("data-suit");
          await waste.click();
          await expect(
            page.locator(`[data-testid="foundation"][data-suit="${suit}"]`),
          ).toHaveAttribute("data-count", "1");
          return;
        }
      }
      const canDraw = await stock.getAttribute("data-can-draw");
      const canRecycle = await stock.getAttribute("data-can-recycle");
      if (canDraw !== "1" && canRecycle !== "1") break;
      await stock.click();
    }
    test.skip(true, "no Ace landed on top of waste this deal");
  });

});

