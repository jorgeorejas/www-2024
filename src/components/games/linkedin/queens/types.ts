import { z } from "zod";
import { DifficultyZ, ModeZ } from "../../_shared/types";

export const CellStateZ = z.enum(["empty", "mark", "queen"]);
export type CellState = z.infer<typeof CellStateZ>;

// A puzzle: board size, region map. Cells are excluded — they're player state.
export const PuzzleZ = z.object({
  size: z.number().int().min(4).max(12),
  regions: z.array(z.array(z.number().int().min(0))),
  seed: z.string(),
  difficulty: DifficultyZ,
});
export type Puzzle = z.infer<typeof PuzzleZ>;

export const GameStateZ = z.object({
  puzzle: PuzzleZ,
  mode: ModeZ,
  cells: z.array(z.array(CellStateZ)),
  startedAt: z.number().int(),
  solvedAt: z.number().int().nullable(),
  moveCount: z.number().int().min(0),
});
export type GameState = z.infer<typeof GameStateZ>;

export interface Conflict {
  row: number;
  col: number;
}

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
