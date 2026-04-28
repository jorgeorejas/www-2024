import { expect, test } from "@playwright/test";
import {
  GAME_URLS,
  gotoGame,
  longPress,
  msCell,
  readMinesweeperState,
  waitForMinesweeperStatus,
} from "./_helpers";

test.describe("Minesweeper", () => {
  test.beforeEach(async ({ page }) => {
    await gotoGame(page, GAME_URLS.minesweeper);
    await expect(page.getByTestId("ms-status")).toBeVisible();
  });

  test("Beginner board renders 81 hidden cells, 10 mines remaining, idle", async ({
    page,
  }) => {
    await expect(page.getByTestId("ms-status")).toHaveAttribute(
      "data-status",
      "idle",
    );
    await expect(page.getByTestId("ms-cell")).toHaveCount(81);
    await expect(page.getByTestId("ms-mines-remaining")).toHaveAttribute(
      "data-mines-remaining",
      "10",
    );
  });

  test("first click reveals cells, switches to playing, timer starts", async ({
    page,
  }) => {
    await msCell(page, 4, 4).click();
    await waitForMinesweeperStatus(page, "playing");

    const revealedCount = await page
      .locator("[data-testid=\"ms-cell\"][data-state=\"revealed\"]")
      .count();
    expect(revealedCount).toBeGreaterThanOrEqual(1);

    // Timer ticks at most ~1s per second; poll for ≥1
    await expect
      .poll(
        async () =>
          Number(
            (await page
              .getByTestId("ms-timer")
              .getAttribute("data-seconds")) ?? "0",
          ),
        { timeout: 4_000 },
      )
      .toBeGreaterThanOrEqual(1);
  });

  test("right-click flags and unflags", async ({ page }) => {
    const cell = msCell(page, 0, 0);
    await cell.click({ button: "right" });
    await expect(cell).toHaveAttribute("data-state", "flagged");
    await expect(page.getByTestId("ms-mines-remaining")).toHaveAttribute(
      "data-mines-remaining",
      "9",
    );
    await cell.click({ button: "right" });
    await expect(cell).toHaveAttribute("data-state", "hidden");
    await expect(page.getByTestId("ms-mines-remaining")).toHaveAttribute(
      "data-mines-remaining",
      "10",
    );
  });

  test("shift-click also flags", async ({ page }) => {
    const cell = msCell(page, 0, 1);
    await cell.click({ modifiers: ["Shift"] });
    await expect(cell).toHaveAttribute("data-state", "flagged");
  });

  test("forced loss reveals all mines and disables interaction", async ({
    page,
  }) => {
    // First click reveals + places mines.
    await msCell(page, 0, 0).click();
    await waitForMinesweeperStatus(page, "playing");

    const state = await readMinesweeperState(page);
    const mine = state.board
      .flatMap((row, r) => row.map((cell, c) => ({ cell, r, c })))
      .find(({ cell }) => cell.mine && !cell.revealed);
    expect(mine, "expected at least one un-revealed mine").toBeDefined();

    await msCell(page, mine!.r, mine!.c).click();
    await waitForMinesweeperStatus(page, "lost");

    const finalState = await readMinesweeperState(page);
    const allMinesRevealed = finalState.board
      .flat()
      .filter((c) => c.mine)
      .every((c) => c.revealed);
    expect(allMinesRevealed).toBe(true);

    // hidden buttons must now be disabled
    const anyHiddenEnabled = await page
      .locator("[data-testid=\"ms-cell\"][data-state=\"hidden\"]:not([disabled])")
      .count();
    expect(anyHiddenEnabled).toBe(0);
  });

  test("forced win flags mines and shows won status", async ({ page }) => {
    await msCell(page, 0, 0).click();
    await waitForMinesweeperStatus(page, "playing");

    const state = await readMinesweeperState(page);

    // Reveal every safe cell that is not yet revealed.
    for (let r = 0; r < state.board.length; r++) {
      for (let c = 0; c < state.board[r].length; c++) {
        const cell = state.board[r][c];
        if (cell.mine || cell.revealed) continue;
        await msCell(page, r, c).click();
      }
    }

    await waitForMinesweeperStatus(page, "won");
    const finalState = await readMinesweeperState(page);
    const allMinesFlagged = finalState.board
      .flat()
      .filter((c) => c.mine)
      .every((c) => c.flagged);
    expect(allMinesFlagged).toBe(true);
  });

  test("difficulty switch mid-game resets board and timer", async ({ page }) => {
    await msCell(page, 4, 4).click();
    await waitForMinesweeperStatus(page, "playing");

    await page.getByRole("button", { name: "Intermediate" }).click();
    await waitForMinesweeperStatus(page, "idle");
    await expect(page.getByTestId("ms-cell")).toHaveCount(16 * 16);
    await expect(page.getByTestId("ms-timer")).toHaveAttribute(
      "data-seconds",
      "0",
    );

    // Rapid swap test for the timer-leak suspicion.
    await page.getByRole("button", { name: "Beginner" }).click();
    await page.getByRole("button", { name: "Expert" }).click();
    await page.getByRole("button", { name: "Beginner" }).click();
    await waitForMinesweeperStatus(page, "idle");
    await expect(page.getByTestId("ms-cell")).toHaveCount(81);
    await expect(page.getByTestId("ms-timer")).toHaveAttribute(
      "data-seconds",
      "0",
    );
  });

  test("reset button clears the board", async ({ page }) => {
    await msCell(page, 4, 4).click();
    await waitForMinesweeperStatus(page, "playing");
    await page.getByRole("button", { name: "Reset game" }).click();
    await waitForMinesweeperStatus(page, "idle");
    await expect(page.getByTestId("ms-mines-remaining")).toHaveAttribute(
      "data-mines-remaining",
      "10",
    );
  });

  test("mobile: long-press flags a cell, short tap reveals", async ({
    page,
  }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith("Mobile"),
      "touch-only behaviour",
    );

    const cell = msCell(page, 0, 0);
    await longPress(cell, 450);
    await expect(cell).toHaveAttribute("data-state", "flagged");

    const other = msCell(page, 4, 4);
    await other.tap();
    await waitForMinesweeperStatus(page, "playing");
  });

  test("desktop visual snapshot of idle Beginner", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "snapshot pinned to chromium",
    );
    await expect(page.getByTestId("ms-status")).toHaveAttribute(
      "data-status",
      "idle",
    );
    await expect(page.locator("article").first()).toHaveScreenshot("ms-idle.png");
  });
});
