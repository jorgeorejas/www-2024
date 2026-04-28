import { z } from "zod";
import { DifficultyZ, ModeZ } from "../../_shared/types";

// Cell symbol. "empty" is the unknown / blank state; "sun" and "moon" are the
// two values the player toggles between.
export const CellValueZ = z.enum(["empty", "sun", "moon"]);
export type CellValue = z.infer<typeof CellValueZ>;

// Constraint marker placed on the edge between two orthogonally-adjacent cells.
// "eq" → the two cells must hold the same symbol. "ne" → they must differ.
export const ConstraintZ = z.enum(["eq", "ne"]);
export type Constraint = z.infer<typeof ConstraintZ>;

// 6×6 board of right-edge constraints (one per cell, null at the right column),
// and a parallel board of bottom-edge constraints.
export const ConstraintGridZ = z.array(z.array(ConstraintZ.nullable()));
export type ConstraintGrid = z.infer<typeof ConstraintGridZ>;

export const PuzzleZ = z.object({
  size: z.literal(6),
  // Pre-filled, immutable clue cells. "empty" means "no clue at this cell."
  clues: z.array(z.array(CellValueZ)),
  // Constraint between cell (r,c) and (r,c+1). null = no constraint.
  hConstraints: ConstraintGridZ,
  // Constraint between cell (r,c) and (r+1,c). null = no constraint.
  vConstraints: ConstraintGridZ,
  seed: z.string(),
  difficulty: DifficultyZ,
});
export type Puzzle = z.infer<typeof PuzzleZ>;

export const GameStateZ = z.object({
  puzzle: PuzzleZ,
  mode: ModeZ,
  cells: z.array(z.array(CellValueZ)),
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
