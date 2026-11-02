import { z } from "zod";

export const ModeZ = z.enum(["daily", "random"]);
export type Mode = z.infer<typeof ModeZ>;

export const DifficultyZ = z.enum(["easy", "medium", "hard"]);
export type Difficulty = z.infer<typeof DifficultyZ>;

/** How each difficulty reads on screen */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
};
