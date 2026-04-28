import { expect, type Locator, type Page } from "@playwright/test";

export const GAME_URLS = {
  hub: "/games",
  gameOfLife: "/games/game-of-life",
  minesweeper: "/games/minesweeper",
  solitaire: "/games/solitaire",
} as const;

// Solitaire auto-saves to localStorage and auto-loads on mount, which makes
// tests order-dependent. Always start from a clean slate.
export async function gotoGame(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      // some webkit configs throw on storage; safe to ignore in tests
    }
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
}

export async function getGenerationCount(page: Page): Promise<number> {
  const value = await page
    .getByTestId("gol-generation")
    .getAttribute("data-generation");
  return Number(value ?? "0");
}

export async function getCellCount(page: Page): Promise<number> {
  return page.getByTestId("gol-cell").count();
}

export interface MinesweeperBoardCell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

export interface MinesweeperState {
  board: MinesweeperBoardCell[][];
  status: "idle" | "playing" | "won" | "lost";
  difficulty: "Beginner" | "Intermediate" | "Expert";
}

export async function readMinesweeperState(page: Page): Promise<MinesweeperState> {
  return page.evaluate(() => {
    const w = window as unknown as { __minesweeper?: MinesweeperState };
    if (!w.__minesweeper) {
      throw new Error(
        "window.__minesweeper test hook not available — is dev mode running?",
      );
    }
    return JSON.parse(JSON.stringify(w.__minesweeper));
  });
}

export function msCell(page: Page, row: number, col: number): Locator {
  return page.locator(
    `[data-testid="ms-cell"][data-row="${row}"][data-col="${col}"]`,
  );
}

export async function waitForMinesweeperStatus(
  page: Page,
  status: MinesweeperState["status"],
): Promise<void> {
  await expect(page.getByTestId("ms-status")).toHaveAttribute(
    "data-status",
    status,
  );
}

// HTML5 native drag/drop synthesizer for solitaire — Playwright's high-level
// dragTo() is unreliable for native HTML5 dataTransfer (especially on webkit).
// We dispatch the four events explicitly with a shared DataTransfer.
export async function nativeDragAndDrop(
  page: Page,
  sourceSelector: string,
  targetSelector: string,
): Promise<void> {
  await page.evaluate(
    ({ src, tgt }) => {
      const source = document.querySelector(src) as HTMLElement | null;
      const target = document.querySelector(tgt) as HTMLElement | null;
      if (!source || !target) {
        throw new Error(`drag failed: source=${!!source} target=${!!target}`);
      }
      const dataTransfer = new DataTransfer();
      const sRect = source.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const fire = (
        el: HTMLElement,
        type: string,
        x: number,
        y: number,
      ): boolean =>
        el.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            clientX: x,
            clientY: y,
          }),
        );
      fire(source, "dragstart", sRect.x + sRect.width / 2, sRect.y + sRect.height / 2);
      fire(target, "dragenter", tRect.x + tRect.width / 2, tRect.y + tRect.height / 2);
      fire(target, "dragover", tRect.x + tRect.width / 2, tRect.y + tRect.height / 2);
      fire(target, "drop", tRect.x + tRect.width / 2, tRect.y + tRect.height / 2);
      fire(source, "dragend", tRect.x + tRect.width / 2, tRect.y + tRect.height / 2);
    },
    { src: sourceSelector, tgt: targetSelector },
  );
}

// Long-press by dispatching touch events through Playwright's dispatchEvent
// API — avoids the `new Touch()` / `new TouchEvent()` constructors which are
// not available on every browser engine (notably WebKit throws "Illegal
// constructor"). Playwright synthesizes a browser-compatible TouchEvent
// from the init dict for us.
export async function longPress(locator: Locator, ms = 400): Promise<void> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("longPress: element has no bounding box");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const touchInit = {
    identifier: 1,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
  };
  await locator.dispatchEvent("touchstart", {
    bubbles: true,
    cancelable: true,
    touches: [touchInit],
    targetTouches: [touchInit],
    changedTouches: [touchInit],
  });
  await locator.page().waitForTimeout(ms);
  await locator.dispatchEvent("touchend", {
    bubbles: true,
    cancelable: true,
    touches: [],
    targetTouches: [],
    changedTouches: [touchInit],
  });
}
