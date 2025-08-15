Klondike (Solitaire) — Spec (Zod-first)

0. Tech constraints
   • Language: TypeScript
   • Validation: All data modeled with Zod.
   • Types: Always infer from Zod (no manual TS interfaces).
   • Pure engine: All functions are pure (state) => nextState (except persistence helpers).

⸻

1. Zod Schemas (single source of truth)

import { z } from "zod";

/\*_ Primitives _/
export const SuitZ = z.enum(["S","H","D","C"]);
export const RankZ = z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4),z.literal(5),z.literal(6),
z.literal(7),z.literal(8),z.literal(9),z.literal(10),
z.literal(11),z.literal(12),z.literal(13)]);
export const ColorZ = z.enum(["red","black"]);

/\*_ Card _/
export const CardZ = z.object({
id: z.string().regex(/^[SHDC]-(?:[1-9]|1[0-3])$/), // e.g., "H-7"
suit: SuitZ,
rank: RankZ,
color: ColorZ, // derived from suit on creation; validated on parse
faceUp: z.boolean(),
}).superRefine((c, ctx) => {
const should = (c.suit === "H" || c.suit === "D") ? "red" : "black";
if (c.color !== should) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Color/suit mismatch" });
});

/\*_ Options _/
export const OptionsZ = z.object({
turn: z.union([z.literal(1), z.literal(3)]).default(3),
drawThrough: z.enum(["infinite","finite"]).default("finite"),
maxPasses: z.number().int().positive().optional(), // used only when finite
scoring: z.enum(["standard","vegas"]).default("standard"),
autoMoveToFoundation: z.boolean().default(true),
}).superRefine((o, ctx) => {
if (o.drawThrough === "finite" && o.turn === 3 && (o.maxPasses ?? 3) < 1) {
ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Finite draw requires maxPasses>=1" });
}
});

/\*_ Foundations _/
export const FoundationsZ = z.object({
S: z.array(CardZ),
H: z.array(CardZ),
D: z.array(CardZ),
C: z.array(CardZ),
});

/\*_ Engine operations (for undo/redo) _/
export const PileKindZ = z.enum(["stock","waste","foundation","tableau"]);
export const PileRefZ = z.object({
kind: PileKindZ,
index: z.number().int().nonnegative().optional(), // tableau index
suit: SuitZ.optional(), // foundation suit
});

export const EngineOpZ = z.discriminatedUnion("type", [
z.object({ type: z.literal("MOVE"),
from: PileRefZ, to: PileRefZ,
cards: z.array(CardZ).min(1) }),
z.object({ type: z.literal("FLIP"),
pile: PileRefZ,
index: z.number().int().nonnegative(),
faceUp: z.boolean() }),
z.object({ type: z.literal("SCORE"), delta: z.number().int() }),
z.object({ type: z.literal("PASS_COUNT"), delta: z.number().int() }),
z.object({ type: z.literal("SET_WON"), value: z.boolean() }),
z.object({ type: z.literal("SET_LOST"), value: z.boolean() }),
]);

export const HistoryEntryZ = z.object({
inverseOps: z.array(EngineOpZ),
});

/\*_ Move hints _/
export const MoveKindZ = z.enum([
"WASTE→FOUNDATION","WASTE→TABLEAU","TABLEAU→FOUNDATION","TABLEAU→TABLEAU","DRAW","RECYCLE"
]);

export const MoveHintZ = z.object({
kind: MoveKindZ,
from: z.number().int().nonnegative().optional(),
to: z.number().int().nonnegative().optional(),
count: z.number().int().positive().optional(),
scoreDeltaEstimate: z.number(),
});

/\*_ Game state _/
export const GameStateZ = z.object({
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
}).superRefine((s, ctx) => {
// Foundation monotonicity by suit
(["S","H","D","C"] as const).forEach(suit => {
const f = s.foundations[suit];
for (let i=1;i<f.length;i++){
if (f[i].suit !== suit || f[i].rank !== f[i-1].rank + 1) {
ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid foundation order for ${suit}` });
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
ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Face-down after face-up in tableau ${idx}` });
break;
}
}
});
});

/\*_ Persistence blob (for future migrations) _/
export const SaveBlobZ = z.object({
key: z.literal("klondike:v1"),
savedAt: z.number().int(),
state: GameStateZ, // validated full state
});

Inferred Types (used everywhere)

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

⸻

2. Game Objective & Variants
   • Goal: Move all cards to the 4 foundations (A→K by suit).
   • Options (validated by OptionsZ):
   • Turn: 1 or 3
   • Draw-through: infinite or finite (default 3 passes for turn-3)
   • Scoring: standard or vegas
   • Auto-move to foundation (safe): on/off

⸻

3. Rules
   • Setup: 7 tableau columns with 1..7 cards; top face-up; rest face-down. Remaining to stock.
   • Moves:
   • Tableau→Tableau: move a face-up run; descending by 1 and alternating color; empty accepts only K.
   • Any→Foundation: same suit, ascending by 1; A starts.
   • Stock→Waste: draw turn cards; if stock empty → recycle waste to stock (respect pass rules).
   • Reveal: after removing last face-up from a tableau, flip new top if face-down.
   • End: win when foundations reach K; optional “lose” when no legal moves and recycling forbidden.

⸻

4. Pure Engine API (signatures only)

All inputs/outputs are validated with Zod at module boundaries in dev/test; in prod you may skip parse on hot paths but keep creation via helpers that produce schema-valid data.

// Lifecycle
export function newGame(seed?: string, opts?: Partial<Options>): GameState; // returns GameStateZ.parse(...)
export function tick(s: GameState): GameState; // +1 sec

// Stock/Waste
export function drawFromStock(s: GameState): GameState;
export function recycleStock(s: GameState): GameState;

// Moves
export function moveWasteToFoundation(s: GameState): GameState;
export function moveWasteToTableau(s: GameState, to: number): GameState;
export function moveTableauToFoundation(s: GameState, from: number): GameState;
export function moveTableauToTableau(s: GameState, from: number, to: number, count: number): GameState;

// Helpers
export function legalMoves(s: GameState): MoveHint[]; // MoveHintZ.array().parse(...)
export function hint(s: GameState): MoveHint | null;
export function autoMoveSafe(s: GameState): GameState;

// Undo/Redo
export function undo(s: GameState): GameState;
export function redo(s: GameState): GameState;

// Options
export function setOptions(s: GameState, opts: Partial<Options>): GameState;

// Serialization / persistence
export function toSaveBlob(s: GameState, now: number): SaveBlob;
export function fromSaveBlob(json: unknown): GameState; // parses & migrates

⸻

5. Core Algorithms (logic details)

5.1 Deck, Shuffle, Deal
• Deck build: 52 cards; id = \${suit}-${rank}`, color` derived.
• PRNG: xorshift32 from string seed (deterministic).
• Deal: Fill tableau 0..6 with i+1 cards; set last to faceUp; leftovers → stock; waste empty; foundations empty.
• After dealing, GameState is created and validated via GameStateZ.parse.

5.2 Validation Helpers (pure)

export function canPlaceOnTableau(card: Card, targetTop?: Card): boolean;
export function canMoveToFoundation(card: Card, foundationTop?: Card): boolean;
export function exposedRun(s: GameState, col: number, countFromTail: number): Card[]; // [] if invalid
export function isWin(f: Foundations): boolean;

5.3 Scoring
• Standard: flip +5; to foundation +10; undo −5; time bonus on win (e.g., Math.max(0, 700000/(s.timerSec+120))).
• Vegas: start −52; to foundation +5; no time bonus.
• Implement scoring as EngineOp SCORE so undo is perfect.

5.4 Stock/Recycle
• Draw: move min(turn, stock.length) to waste; faceUp=true; order preserved (last drawn is waste top).
• Recycle: if stock empty and (infinite or passesUsed < maxPasses):
• stock = reverse(waste).map(faceUp:false); waste=[]; passesUsed++.

5.5 Auto-move (safe heuristic)
• Always move A and 2 to foundation.
• For 3+, only if:
• Legal to foundation and
• Opposite color foundation not lagging (opp.top.rank >= card.rank-1) or
• Moving doesn’t reduce ability to uncover face-downs (e.g., the card is not needed in any tableau placement that would enable a flip).
• Loop: try waste top, then each tableau top; repeat until no change.

5.6 Hint & Move Ranking
• Rank moves by utility: 1. Flip-enabling tableau shifts (+30) 2. Safe foundation moves (+20) 3. Create/maintain empty column with K-led runs (+15) 4. Use waste without drawing (+10) 5. Draw (+2) 6. Recycle (+1; maybe negative when finite passes are scarce)

5.7 Undo/Redo
• Each mutator collects inverse EngineOps:
• MOVE (with exact card slice and from/to)
• FLIP (pile/index/previous flag)
• SCORE (−delta)
• PASS_COUNT (−1 when you incremented)
• SET_WON / SET_LOST (previous value)
• undo/redo apply those ops in reverse/forward order; history/future validated with HistoryEntryZ.

⸻

6. On-device Persistence (resume later)

Storage contract
• Key: "klondike:v1" (inside SaveBlobZ.key).
• Shape: SaveBlobZ (includes savedAt, state with schemaVersion: 1).
• When: save after every committed move and on app unload (debounced ~200ms).
• How:
• toSaveBlob(state, Date.now()) → JSON.stringify → localStorage.setItem(key, str).
• On boot: if present, fromSaveBlob(JSON.parse(str)):
• Validates with SaveBlobZ.
• Verifies deck integrity (52 unique ids across piles).
• If invalid → discard and start newGame().

Versioning & migrations
• schemaVersion on GameState is 1.
• Future changes: bump version and add migrate(saved:any): GameState that:
• Parses old shapes with relaxed Zod guards.
• Normalizes to GameStateZ vN.
• Keep a checksum (optional): SHA-1 of concatenated card ids per pile for integrity checks.

Autosave edge cases
• If localStorage quota errors: catch and drop the oldest snapshot (or switch to a minimal snapshot: deck order + faceUp bitmap).
• Private/Incognito: saving may fail; engine must still function.

⸻

7. Accessibility & UX Contracts (engine-level)
   • Provide pile introspection for ARIA labels:
   • describePile(s: GameState, ref: PileRef): string
   • Provide deterministic legalMoves(s) for “Hint”.
   • Provide isAutoCompleteSafe(s) to allow UI to trigger endgame animations.

⸻

8. Edge Cases (must pass)
   • Draw when stock.length < turn → draw remaining only.
   • Recycle when waste=[] → no-op.
   • Empty tableau accepts only K (or K-led run).
   • Foundation suit mismatch or non-+1 rank → reject.
   • Reveal only when the new top was face-down.
   • Turn-3 finite: the 4th recycle with maxPasses=3 is rejected.
   • Vegas scoring fully reversible with undo.
   • Auto-move never promotes a card that blocks revealing (per heuristic).
   • Persistence round-trip: state -> save -> load -> validate -> equal (deep-equal except time fields).

⸻

9. Testing Plan (schemas + logic)

Schema tests
• CardZ rejects color/suit mismatch; id format enforced.
• GameStateZ rejects tableau with face-down after face-up.
• Foundations strictly ascending by suit.

Property tests
• 52 unique cards across piles; no duplicates.
• Seed determinism (same seed ⇒ same state).
• Undo ⇒ original state (deep equality for structural parts).
• legalMoves(s).length===0 implies either win, or (no stock & recycle forbidden).

Scenario tests
• Flip scoring +5 once; not repeated spuriously.
• Waste order preserved on draw; recycle reverses waste.
• Auto-move loop terminates and only does legal/safe moves.

⸻

10. Implementation Checklist (in order)
    1.  Implement PRNG + buildDeck() + helpers to create Zod-valid cards.
    2.  deal(seed, options) → GameState via GameStateZ.parse.
    3.  Rule helpers: canPlaceOnTableau, canMoveToFoundation, exposedRun.
    4.  Mutators: drawFromStock, recycleStock, move\* (each returns validated state in dev/test).
    5.  Win detection + scoring ops.
    6.  Auto-move safe loop.
    7.  legalMoves + hint ranking.
    8.  Undo/redo op stack.
    9.  Persistence toSaveBlob / fromSaveBlob with Zod validation + (optional) checksum.
    10. Tests (schema, property, scenario).

⸻

11. Example Persistence Helpers (signatures + notes)

export const SAVE_KEY = "klondike:v1";

export function toSaveBlob(s: GameState, now: number): SaveBlob {
const blob = { key: SAVE_KEY, savedAt: now, state: s as GameState };
return SaveBlobZ.parse(blob);
}

export function fromSaveBlob(json: unknown): GameState {
const blob = SaveBlobZ.parse(json);
// (Optional) extra integrity: verify all 52 ids across piles are unique
return GameStateZ.parse(blob.state);
}
