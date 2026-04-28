import { z } from "zod";
import { DifficultyZ, ModeZ } from "../../_shared/types";

// 6x6 mini-Sudoku. Boxes are 2 rows tall by 3 cols wide (6 boxes total).
// Cell values: 0 means empty, 1-6 are digits.
export const SIZE = 6;
export const BOX_ROWS = 2;
export const BOX_COLS = 3;

export const CellValueZ = z.number().int().min(0).max(SIZE);
export type CellValue = z.infer<typeof CellValueZ>;

// `givens` carries the locked-cell values (0 means not a clue).
export const PuzzleZ = z.object({
  givens: z.array(z.array(CellValueZ)),
  solution: z.array(z.array(CellValueZ)),
  seed: z.string(),
  difficulty: DifficultyZ,
});
export type Puzzle = z.infer<typeof PuzzleZ>;

export const FocusZ = z
  .object({ row: z.number().int().min(0).max(SIZE - 1), col: z.number().int().min(0).max(SIZE - 1) })
  .nullable();
export type Focus = z.infer<typeof FocusZ>;

export const GameStateZ = z.object({
  puzzle: PuzzleZ,
  mode: ModeZ,
  values: z.array(z.array(CellValueZ)),
  focus: FocusZ,
  startedAt: z.number().int(),
  solvedAt: z.number().int().nullable(),
  moveCount: z.number().int().min(0),
});
export type GameState = z.infer<typeof GameStateZ>;

export const SaveBlobZ = z.object({
  schemaVersion: z.literal(1),
  daily: z
    .object({
      dateKey: z.string(),
      state: GameStateZ,
    })
    .nullable(),
  random: GameStateZ.nullable(),
});
export type SaveBlob = z.infer<typeof SaveBlobZ>;

// Cell at (r, c) belongs to box index `boxOf(r, c)`.
// Boxes are 2 tall x 3 wide; bands stack vertically (2 bands), stacks across (2 stacks).
export function boxOf(r: number, c: number): number {
  return Math.floor(r / BOX_ROWS) * BOX_ROWS + Math.floor(c / BOX_COLS);
}
