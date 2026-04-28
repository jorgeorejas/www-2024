import { z } from "zod";
import { DifficultyZ, ModeZ } from "../../_shared/types";

// Grid is fixed 6x6 (36 cells). Cell index = row * size + col.
export const GRID_SIZE = 6;
export const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// A puzzle: K labeled cells, each cell index → label number (1..K). All other
// cells are unlabeled. The player draws a Hamiltonian path through the grid
// that traverses the labeled cells in label order.
export const PuzzleZ = z.object({
  size: z.number().int().min(4).max(12),
  // Sparse map: cell index (row*size+col) → label number (1..K).
  labels: z.record(z.string(), z.number().int().min(1)),
  seed: z.string(),
  difficulty: DifficultyZ,
});
export type Puzzle = z.infer<typeof PuzzleZ>;

export const GameStateZ = z.object({
  puzzle: PuzzleZ,
  mode: ModeZ,
  // Sequence of cell indices visited so far. Empty until the player clicks
  // the cell labeled 1.
  path: z.array(z.number().int().min(0)),
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
