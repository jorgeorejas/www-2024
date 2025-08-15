import { z } from "zod";

/* Primitives */
export const SuitZ = z.enum(["S", "H", "D", "C"]);
export const RankZ = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
  z.literal(11),
  z.literal(12),
  z.literal(13),
]);
export const ColorZ = z.enum(["red", "black"]);

/* Card */
export const CardZ = z
  .object({
    id: z.string().regex(/^[SHDC]-(?:[1-9]|1[0-3])$/), // e.g., "H-7"
    suit: SuitZ,
    rank: RankZ,
    color: ColorZ, // derived from suit on creation; validated on parse
    faceUp: z.boolean(),
  })
  .superRefine((c, ctx) => {
    const should = c.suit === "H" || c.suit === "D" ? "red" : "black";
    if (c.color !== should)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Color/suit mismatch",
      });
  });

/* Options */
export const OptionsZ = z
  .object({
    turn: z.union([z.literal(1), z.literal(3)]).default(3),
    drawThrough: z.enum(["infinite", "finite"]).default("infinite"),
    maxPasses: z.number().int().positive().optional(), // used only when finite
    scoring: z.enum(["standard", "vegas"]).default("standard"),
    autoMoveToFoundation: z.boolean().default(true),
  })
  .superRefine((o, ctx) => {
    if (o.drawThrough === "finite" && o.turn === 3 && (o.maxPasses ?? 3) < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Finite draw requires maxPasses>=1",
      });
    }
  });

/* Foundations */
export const FoundationsZ = z.object({
  S: z.array(CardZ),
  H: z.array(CardZ),
  D: z.array(CardZ),
  C: z.array(CardZ),
});

/* Engine operations (for undo/redo) */
export const PileKindZ = z.enum(["stock", "waste", "foundation", "tableau"]);
export const PileRefZ = z.object({
  kind: PileKindZ,
  index: z.number().int().nonnegative().optional(), // tableau index
  suit: SuitZ.optional(), // foundation suit
});

export const EngineOpZ = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MOVE"),
    from: PileRefZ,
    to: PileRefZ,
    cards: z.array(CardZ).min(1),
  }),
  z.object({
    type: z.literal("FLIP"),
    pile: PileRefZ,
    index: z.number().int().nonnegative(),
    faceUp: z.boolean(),
  }),
  z.object({ type: z.literal("SCORE"), delta: z.number().int() }),
  z.object({ type: z.literal("PASS_COUNT"), delta: z.number().int() }),
  z.object({ type: z.literal("SET_WON"), value: z.boolean() }),
  z.object({ type: z.literal("SET_LOST"), value: z.boolean() }),
]);

export const HistoryEntryZ = z.object({
  inverseOps: z.array(EngineOpZ),
});

/* Move hints */
export const MoveKindZ = z.enum([
  "WASTE→FOUNDATION",
  "WASTE→TABLEAU",
  "TABLEAU→FOUNDATION",
  "TABLEAU→TABLEAU",
  "DRAW",
  "RECYCLE",
]);

export const MoveHintZ = z.object({
  kind: MoveKindZ,
  from: z.number().int().nonnegative().optional(),
  to: z.number().int().nonnegative().optional(),
  count: z.number().int().positive().optional(),
  scoreDeltaEstimate: z.number(),
});

/* Game state */
export const GameStateZ = z
  .object({
    schemaVersion: z.literal(1),
    seed: z.string().optional(),
    stock: z.array(CardZ),
    waste: z.array(CardZ),
    tableaus: z.array(z.array(CardZ)).length(7),
    foundations: FoundationsZ,
    score: z.number().int(),
    moves: z.number().int().nonnegative(),
    passesUsed: z.number().int().nonnegative(),
    timerSec: z.number().int().nonnegative(),
    startedAt: z.number().int().optional(),
    won: z.boolean(),
    lost: z.boolean(),
    options: OptionsZ,
    history: z.array(HistoryEntryZ),
    future: z.array(HistoryEntryZ),
  })
  .superRefine((s, ctx) => {
    // Foundation monotonicity by suit
    (["S", "H", "D", "C"] as const).forEach((suit) => {
      const f = s.foundations[suit];
      for (let i = 1; i < f.length; i++) {
        if (f[i].suit !== suit || f[i].rank !== f[i - 1].rank + 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid foundation order for ${suit}`,
          });
          break;
        }
      }
    });
    // Tableau invariant: all face-down before face-up in each column
    s.tableaus.forEach((col, idx) => {
      let seenFaceUp = false;
      for (const card of col) {
        if (card.faceUp) seenFaceUp = true;
        if (!card.faceUp && seenFaceUp) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Face-down after face-up in tableau ${idx}`,
          });
          break;
        }
      }
    });
  });

/* Persistence blob (for future migrations) */
export const SaveBlobZ = z.object({
  key: z.literal("klondike:v1"),
  savedAt: z.number().int(),
  state: GameStateZ, // validated full state
});

// Inferred Types (used everywhere)
export type Suit = z.infer<typeof SuitZ>;
export type Rank = z.infer<typeof RankZ>;
export type Color = z.infer<typeof ColorZ>;
export type Card = z.infer<typeof CardZ>;
export type Options = z.infer<typeof OptionsZ>;
export type Foundations = z.infer<typeof FoundationsZ>;
export type PileRef = z.infer<typeof PileRefZ>;
export type EngineOp = z.infer<typeof EngineOpZ>;
export type HistoryEntry = z.infer<typeof HistoryEntryZ>;
export type MoveHint = z.infer<typeof MoveHintZ>;
export type GameState = z.infer<typeof GameStateZ>;
export type SaveBlob = z.infer<typeof SaveBlobZ>;
