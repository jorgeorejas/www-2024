import {
  type Card,
  type EngineOp,
  type Foundations,
  type GameState,
  type MoveHint,
  type Options,
  type PileRef,
  type SaveBlob,
  GameStateZ,
  MoveHintZ,
  OptionsZ,
  SaveBlobZ,
} from "./types.js";

// PRNG: xorshift32 from string seed (deterministic)
class PRNG {
  private state: number;

  constructor(seed: string) {
    this.state = this.hashSeed(seed);
  }

  private hashSeed(seed: string): number {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0; // Convert to unsigned 32-bit
  }

  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;
    this.state = this.state >>> 0; // Keep as unsigned 32-bit
    return this.state / 0x100000000; // Return [0, 1)
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Deck building
function buildDeck(): Card[] {
  const suits = ["S", "H", "D", "C"] as const;
  const cards: Card[] = [];

  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      const color = suit === "H" || suit === "D" ? "red" : "black";
      cards.push({
        id: `${suit}-${rank}`,
        suit,
        rank: rank as any,
        color,
        faceUp: false,
      });
    }
  }

  return cards;
}

// Deal cards into initial game state
function deal(seed: string, options: Partial<Options> = {}): GameState {
  const opts = OptionsZ.parse(options);
  const prng = new PRNG(seed);
  const deck = prng.shuffle(buildDeck());

  // Deal tableau (7 columns with 1..7 cards)
  const tableaus: Card[][] = Array.from({ length: 7 }, () => []);
  let deckIndex = 0;

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = deck[deckIndex++];
      card.faceUp = row === col; // Last card in column is face-up
      tableaus[col].push(card);
    }
  }

  // Remaining cards go to stock
  const stock = deck
    .slice(deckIndex)
    .map((card) => ({ ...card, faceUp: false }));

  const state: GameState = {
    schemaVersion: 1,
    seed,
    stock,
    waste: [],
    tableaus,
    foundations: { S: [], H: [], D: [], C: [] },
    score: opts.scoring === "vegas" ? -52 : 0,
    moves: 0,
    passesUsed: 0,
    timerSec: 0,
    startedAt: Date.now(),
    won: false,
    lost: false,
    options: opts,
    history: [],
    future: [],
  };

  return GameStateZ.parse(state);
}

// Rule helpers
function canPlaceOnTableau(card: Card, targetTop?: Card): boolean {
  if (!targetTop) {
    // Empty tableau accepts only King
    return card.rank === 13;
  }

  // Must be descending by 1 and alternating color
  return targetTop.rank === card.rank + 1 && targetTop.color !== card.color;
}

function canMoveToFoundation(card: Card, foundationTop?: Card): boolean {
  if (!foundationTop) {
    // Empty foundation accepts only Ace
    return card.rank === 1;
  }

  // Must be same suit and ascending by 1
  return (
    foundationTop.suit === card.suit && foundationTop.rank === card.rank - 1
  );
}

function exposedRun(s: GameState, col: number, countFromTail: number): Card[] {
  const tableau = s.tableaus[col];
  if (countFromTail <= 0 || countFromTail > tableau.length) return [];

  const run = tableau.slice(-countFromTail);

  // All cards must be face-up
  if (run.some((card) => !card.faceUp)) return [];

  // Must form valid descending alternating color sequence
  for (let i = 1; i < run.length; i++) {
    if (!canPlaceOnTableau(run[i], run[i - 1])) return [];
  }

  return run;
}

function isWin(foundations: Foundations): boolean {
  return Object.values(foundations).every((pile) => pile.length === 13);
}

// Apply engine operations
function applyEngineOp(state: GameState, op: EngineOp): GameState {
  const newState = { ...state };

  switch (op.type) {
    case "MOVE": {
      const { from, to, cards } = op;

      // Remove from source
      if (from.kind === "stock") {
        newState.stock = newState.stock.slice(0, -cards.length);
      } else if (from.kind === "waste") {
        newState.waste = newState.waste.slice(0, -cards.length);
      } else if (from.kind === "tableau" && from.index !== undefined) {
        newState.tableaus = [...newState.tableaus];
        newState.tableaus[from.index] = newState.tableaus[from.index].slice(
          0,
          -cards.length,
        );
      } else if (from.kind === "foundation" && from.suit) {
        newState.foundations = { ...newState.foundations };
        newState.foundations[from.suit] = newState.foundations[from.suit].slice(
          0,
          -cards.length,
        );
      }

      // Add to destination
      if (to.kind === "stock") {
        newState.stock = [...newState.stock, ...cards];
      } else if (to.kind === "waste") {
        newState.waste = [...newState.waste, ...cards];
      } else if (to.kind === "tableau" && to.index !== undefined) {
        newState.tableaus = [...newState.tableaus];
        newState.tableaus[to.index] = [
          ...newState.tableaus[to.index],
          ...cards,
        ];
      } else if (to.kind === "foundation" && to.suit) {
        newState.foundations = { ...newState.foundations };
        newState.foundations[to.suit] = [
          ...newState.foundations[to.suit],
          ...cards,
        ];
      }
      break;
    }

    case "FLIP": {
      const { pile, index, faceUp } = op;
      if (pile.kind === "tableau" && pile.index !== undefined) {
        newState.tableaus = [...newState.tableaus];
        newState.tableaus[pile.index] = [...newState.tableaus[pile.index]];
        newState.tableaus[pile.index][index] = {
          ...newState.tableaus[pile.index][index],
          faceUp,
        };
      }
      break;
    }

    case "SCORE": {
      newState.score += op.delta;
      break;
    }

    case "PASS_COUNT": {
      newState.passesUsed += op.delta;
      break;
    }

    case "SET_WON": {
      newState.won = op.value;
      break;
    }

    case "SET_LOST": {
      newState.lost = op.value;
      break;
    }
  }

  return newState;
}

// Lifecycle
export function newGame(seed?: string, opts?: Partial<Options>): GameState {
  const gameSeed = seed ?? Date.now().toString();
  return deal(gameSeed, opts);
}

export function tick(s: GameState): GameState {
  return { ...s, timerSec: s.timerSec + 1 };
}

// Stock/Waste operations
export function drawFromStock(s: GameState): GameState {
  if (s.stock.length === 0) return s;

  const drawCount = Math.min(s.options.turn, s.stock.length);
  const drawnCards = s.stock
    .slice(-drawCount)
    .map((card) => ({ ...card, faceUp: true }));

  const ops: EngineOp[] = [];

  // Move cards from stock to waste
  ops.push({
    type: "MOVE",
    from: { kind: "stock" },
    to: { kind: "waste" },
    cards: drawnCards,
  });

  let newState = applyEngineOp(s, ops[0]);
  newState.moves += 1;

  // Add to history for undo
  const inverseOps: EngineOp[] = [
    {
      type: "MOVE",
      from: { kind: "waste" },
      to: { kind: "stock" },
      cards: drawnCards.map((card) => ({ ...card, faceUp: false })),
    },
  ];

  newState.history = [...newState.history, { inverseOps }];
  newState.future = [];

  return newState;
}

export function recycleStock(s: GameState): GameState {
  if (s.stock.length > 0 || s.waste.length === 0) return s;

  const canRecycle =
    s.options.drawThrough === "infinite" ||
    s.passesUsed < (s.options.maxPasses ?? 3);

  if (!canRecycle) return s;

  const recycledCards = s.waste
    .slice()
    .reverse()
    .map((card) => ({ ...card, faceUp: false }));

  const ops: EngineOp[] = [];

  // Move waste to stock
  ops.push({
    type: "MOVE",
    from: { kind: "waste" },
    to: { kind: "stock" },
    cards: recycledCards,
  });

  // Increment pass count
  ops.push({
    type: "PASS_COUNT",
    delta: 1,
  });

  let newState = s;
  for (const op of ops) {
    newState = applyEngineOp(newState, op);
  }

  newState.moves += 1;

  // Add to history for undo
  const inverseOps: EngineOp[] = [
    {
      type: "PASS_COUNT",
      delta: -1,
    },
    {
      type: "MOVE",
      from: { kind: "stock" },
      to: { kind: "waste" },
      cards: s.waste.map((card) => ({ ...card, faceUp: true })),
    },
  ];

  newState.history = [...newState.history, { inverseOps }];
  newState.future = [];

  return newState;
}

// Move operations
export function moveWasteToFoundation(s: GameState): GameState {
  if (s.waste.length === 0) return s;

  const card = s.waste[s.waste.length - 1];
  const foundationTop =
    s.foundations[card.suit][s.foundations[card.suit].length - 1];

  if (!canMoveToFoundation(card, foundationTop)) return s;

  const ops: EngineOp[] = [];

  // Move card
  ops.push({
    type: "MOVE",
    from: { kind: "waste" },
    to: { kind: "foundation", suit: card.suit },
    cards: [card],
  });

  // Score
  const scoreDelta = s.options.scoring === "standard" ? 10 : 5;
  ops.push({
    type: "SCORE",
    delta: scoreDelta,
  });

  let newState = s;
  for (const op of ops) {
    newState = applyEngineOp(newState, op);
  }

  newState.moves += 1;

  // Check for win
  if (isWin(newState.foundations)) {
    newState.won = true;
    if (s.options.scoring === "standard") {
      const timeBonus = Math.max(
        0,
        Math.floor(700000 / (newState.timerSec + 120)),
      );
      newState.score += timeBonus;
    }
  }

  // Add to history for undo
  const inverseOps: EngineOp[] = [
    {
      type: "SCORE",
      delta: -scoreDelta,
    },
    {
      type: "MOVE",
      from: { kind: "foundation", suit: card.suit },
      to: { kind: "waste" },
      cards: [card],
    },
  ];

  newState.history = [...newState.history, { inverseOps }];
  newState.future = [];

  return newState;
}

export function moveWasteToTableau(s: GameState, to: number): GameState {
  if (s.waste.length === 0 || to < 0 || to >= 7) return s;

  const card = s.waste[s.waste.length - 1];
  const targetTop = s.tableaus[to][s.tableaus[to].length - 1];

  if (!canPlaceOnTableau(card, targetTop)) return s;

  const ops: EngineOp[] = [];

  // Move card
  ops.push({
    type: "MOVE",
    from: { kind: "waste" },
    to: { kind: "tableau", index: to },
    cards: [card],
  });

  let newState = applyEngineOp(s, ops[0]);
  newState.moves += 1;

  // Add to history for undo
  const inverseOps: EngineOp[] = [
    {
      type: "MOVE",
      from: { kind: "tableau", index: to },
      to: { kind: "waste" },
      cards: [card],
    },
  ];

  newState.history = [...newState.history, { inverseOps }];
  newState.future = [];

  return newState;
}

export function moveTableauToFoundation(s: GameState, from: number): GameState {
  if (from < 0 || from >= 7 || s.tableaus[from].length === 0) return s;

  const card = s.tableaus[from][s.tableaus[from].length - 1];
  if (!card.faceUp) return s;

  const foundationTop =
    s.foundations[card.suit][s.foundations[card.suit].length - 1];

  if (!canMoveToFoundation(card, foundationTop)) return s;

  const ops: EngineOp[] = [];

  // Move card
  ops.push({
    type: "MOVE",
    from: { kind: "tableau", index: from },
    to: { kind: "foundation", suit: card.suit },
    cards: [card],
  });

  // Score
  const scoreDelta = s.options.scoring === "standard" ? 10 : 5;
  ops.push({
    type: "SCORE",
    delta: scoreDelta,
  });

  let newState = s;
  for (const op of ops) {
    newState = applyEngineOp(newState, op);
  }

  // Check if we need to flip a card
  const remainingTableau = newState.tableaus[from];
  if (remainingTableau.length > 0) {
    const topCard = remainingTableau[remainingTableau.length - 1];
    if (!topCard.faceUp) {
      ops.push({
        type: "FLIP",
        pile: { kind: "tableau", index: from },
        index: remainingTableau.length - 1,
        faceUp: true,
      });

      // Flip scoring
      if (s.options.scoring === "standard") {
        ops.push({
          type: "SCORE",
          delta: 5,
        });
      }

      newState = applyEngineOp(newState, ops[ops.length - 2]);
      if (s.options.scoring === "standard") {
        newState = applyEngineOp(newState, ops[ops.length - 1]);
      }
    }
  }

  newState.moves += 1;

  // Check for win
  if (isWin(newState.foundations)) {
    newState.won = true;
    if (s.options.scoring === "standard") {
      const timeBonus = Math.max(
        0,
        Math.floor(700000 / (newState.timerSec + 120)),
      );
      newState.score += timeBonus;
    }
  }

  // Add to history for undo
  const inverseOps: EngineOp[] = [];

  // Reverse order of operations
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    switch (op.type) {
      case "MOVE":
        inverseOps.push({
          type: "MOVE",
          from: op.to,
          to: op.from,
          cards: op.cards,
        });
        break;
      case "FLIP":
        inverseOps.push({
          type: "FLIP",
          pile: op.pile,
          index: op.index,
          faceUp: !op.faceUp,
        });
        break;
      case "SCORE":
        inverseOps.push({
          type: "SCORE",
          delta: -op.delta,
        });
        break;
    }
  }

  newState.history = [...newState.history, { inverseOps }];
  newState.future = [];

  return newState;
}

export function moveTableauToTableau(
  s: GameState,
  from: number,
  to: number,
  count: number,
): GameState {
  if (from < 0 || from >= 7 || to < 0 || to >= 7 || from === to) return s;
  if (count <= 0) return s;

  const run = exposedRun(s, from, count);
  if (run.length !== count) return s;

  const targetTop =
    s.tableaus[to].length > 0
      ? s.tableaus[to][s.tableaus[to].length - 1]
      : undefined;
  if (!canPlaceOnTableau(run[0], targetTop)) return s;

  const ops: EngineOp[] = [];

  // Move cards
  ops.push({
    type: "MOVE",
    from: { kind: "tableau", index: from },
    to: { kind: "tableau", index: to },
    cards: run,
  });

  let newState = applyEngineOp(s, ops[0]);

  // Check if we need to flip a card
  const remainingFromTableau = newState.tableaus[from];
  if (remainingFromTableau.length > 0) {
    const topCard = remainingFromTableau[remainingFromTableau.length - 1];
    if (!topCard.faceUp) {
      ops.push({
        type: "FLIP",
        pile: { kind: "tableau", index: from },
        index: remainingFromTableau.length - 1,
        faceUp: true,
      });

      // Flip scoring
      if (s.options.scoring === "standard") {
        ops.push({
          type: "SCORE",
          delta: 5,
        });
      }

      newState = applyEngineOp(newState, ops[ops.length - 2]);
      if (s.options.scoring === "standard") {
        newState = applyEngineOp(newState, ops[ops.length - 1]);
      }
    }
  }

  newState.moves += 1;

  // Add to history for undo
  const inverseOps: EngineOp[] = [];

  // Reverse order of operations
  for (let i = ops.length - 1; i >= 0; i--) {
    const op = ops[i];
    switch (op.type) {
      case "MOVE":
        inverseOps.push({
          type: "MOVE",
          from: op.to,
          to: op.from,
          cards: op.cards,
        });
        break;
      case "FLIP":
        inverseOps.push({
          type: "FLIP",
          pile: op.pile,
          index: op.index,
          faceUp: !op.faceUp,
        });
        break;
      case "SCORE":
        inverseOps.push({
          type: "SCORE",
          delta: -op.delta,
        });
        break;
    }
  }

  newState.history = [...newState.history, { inverseOps }];
  newState.future = [];

  return newState;
}

// Helpers
export function legalMoves(s: GameState): MoveHint[] {
  const hints: MoveHint[] = [];

  // DRAW
  if (s.stock.length > 0) {
    hints.push({
      kind: "DRAW",
      scoreDeltaEstimate: 2,
    });
  }

  // RECYCLE
  if (s.stock.length === 0 && s.waste.length > 0) {
    const canRecycle =
      s.options.drawThrough === "infinite" ||
      s.passesUsed < (s.options.maxPasses ?? 3);

    if (canRecycle) {
      hints.push({
        kind: "RECYCLE",
        scoreDeltaEstimate: 1,
      });
    }
  }

  // WASTE→FOUNDATION
  if (s.waste.length > 0) {
    const card = s.waste[s.waste.length - 1];
    const foundationTop =
      s.foundations[card.suit][s.foundations[card.suit].length - 1];

    if (canMoveToFoundation(card, foundationTop)) {
      hints.push({
        kind: "WASTE→FOUNDATION",
        scoreDeltaEstimate: s.options.scoring === "standard" ? 10 : 5,
      });
    }
  }

  // WASTE→TABLEAU
  if (s.waste.length > 0) {
    const card = s.waste[s.waste.length - 1];
    for (let i = 0; i < 7; i++) {
      const targetTop =
        s.tableaus[i].length > 0
          ? s.tableaus[i][s.tableaus[i].length - 1]
          : undefined;
      if (canPlaceOnTableau(card, targetTop)) {
        hints.push({
          kind: "WASTE→TABLEAU",
          to: i,
          scoreDeltaEstimate: 10,
        });
      }
    }
  }

  // TABLEAU→FOUNDATION
  for (let i = 0; i < 7; i++) {
    if (s.tableaus[i].length > 0) {
      const card = s.tableaus[i][s.tableaus[i].length - 1];
      if (card.faceUp) {
        const foundationTop =
          s.foundations[card.suit][s.foundations[card.suit].length - 1];
        if (canMoveToFoundation(card, foundationTop)) {
          const flipBonus =
            s.tableaus[i].length > 1 &&
            !s.tableaus[i][s.tableaus[i].length - 2].faceUp
              ? 5
              : 0;
          hints.push({
            kind: "TABLEAU→FOUNDATION",
            from: i,
            scoreDeltaEstimate:
              (s.options.scoring === "standard" ? 10 : 5) + flipBonus,
          });
        }
      }
    }
  }

  // TABLEAU→TABLEAU
  for (let from = 0; from < 7; from++) {
    const tableau = s.tableaus[from];
    if (tableau.length === 0) continue;

    // Find the longest valid run starting from the first face-up card
    let firstFaceUpIndex = -1;
    for (let i = 0; i < tableau.length; i++) {
      if (tableau[i].faceUp) {
        firstFaceUpIndex = i;
        break;
      }
    }

    if (firstFaceUpIndex === -1) continue;

    for (let count = 1; count <= tableau.length - firstFaceUpIndex; count++) {
      const run = exposedRun(s, from, count);
      if (run.length !== count) break;

      for (let to = 0; to < 7; to++) {
        if (from === to) continue;

        const targetTop =
          s.tableaus[to].length > 0
            ? s.tableaus[to][s.tableaus[to].length - 1]
            : undefined;
        if (canPlaceOnTableau(run[0], targetTop)) {
          const flipBonus =
            tableau.length - count > 0 &&
            !tableau[tableau.length - count - 1].faceUp
              ? s.options.scoring === "standard"
                ? 5
                : 0
              : 0;
          const emptyColumnBonus =
            s.tableaus[to].length === 0 && run[0].rank === 13 ? 15 : 0;

          hints.push({
            kind: "TABLEAU→TABLEAU",
            from,
            to,
            count,
            scoreDeltaEstimate: flipBonus + emptyColumnBonus,
          });
        }
      }
    }
  }

  return MoveHintZ.array().parse(hints);
}

export function hint(s: GameState): MoveHint | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;

  // Sort by score estimate (descending)
  moves.sort((a, b) => b.scoreDeltaEstimate - a.scoreDeltaEstimate);

  return moves[0];
}

export function autoMoveSafe(s: GameState): GameState {
  if (!s.options.autoMoveToFoundation) return s;

  let state = s;
  let changed = true;

  while (changed) {
    changed = false;

    // Try waste top
    if (state.waste.length > 0) {
      const card = state.waste[state.waste.length - 1];
      if (canAutoMoveCardToFoundation(card, state)) {
        const newState = moveWasteToFoundation(state);
        if (newState !== state) {
          state = newState;
          changed = true;
          continue;
        }
      }
    }

    // Try each tableau top
    for (let i = 0; i < 7; i++) {
      if (state.tableaus[i].length > 0) {
        const card = state.tableaus[i][state.tableaus[i].length - 1];
        if (card.faceUp && canAutoMoveCardToFoundation(card, state)) {
          const newState = moveTableauToFoundation(state, i);
          if (newState !== state) {
            state = newState;
            changed = true;
            break;
          }
        }
      }
    }
  }

  return state;
}

export function autoMoveAny(s: GameState): GameState {
  const moves = legalMoves(s);
  if (moves.length === 0) return s;

  // Sort moves by priority and score potential
  const prioritizedMoves = moves.sort((a, b) => {
    // Foundation moves get highest priority
    if (a.kind.includes("FOUNDATION") && !b.kind.includes("FOUNDATION")) return -1;
    if (!a.kind.includes("FOUNDATION") && b.kind.includes("FOUNDATION")) return 1;
    
    // Then by score estimate
    return b.scoreDeltaEstimate - a.scoreDeltaEstimate;
  });

  const bestMove = prioritizedMoves[0];
  
  // Execute the best move
  switch (bestMove.kind) {
    case "DRAW":
      return drawFromStock(s);
    
    case "RECYCLE":
      return recycleStock(s);
    
    case "WASTE→FOUNDATION":
      return moveWasteToFoundation(s);
    
    case "WASTE→TABLEAU":
      return moveWasteToTableau(s, bestMove.to!);
    
    case "TABLEAU→FOUNDATION":
      return moveTableauToFoundation(s, bestMove.from!);
    
    case "TABLEAU→TABLEAU":
      return moveTableauToTableau(s, bestMove.from!, bestMove.to!, bestMove.count!);
    
    default:
      return s;
  }
}

function canAutoMoveCardToFoundation(card: Card, s: GameState): boolean {
  const foundationTop =
    s.foundations[card.suit][s.foundations[card.suit].length - 1];

  if (!canMoveToFoundation(card, foundationTop)) return false;

  // Always move Ace and 2
  if (card.rank <= 2) return true;

  // For 3+, check if opposite color foundations are not lagging
  const oppositeColor = card.color === "red" ? "black" : "red";
  const oppositeSuits = oppositeColor === "red" ? ["H", "D"] : ["S", "C"];

  for (const suit of oppositeSuits) {
    const oppFoundation = s.foundations[suit as keyof Foundations];
    const oppTop = oppFoundation[oppFoundation.length - 1];
    const oppRank = oppTop ? oppTop.rank : 0;

    if (oppRank < card.rank - 1) return false;
  }

  return true;
}

export function canAutoMoveToFoundation(s: GameState): boolean {
  if (!s.options.autoMoveToFoundation) return false;

  // Check if waste top can be auto-moved
  if (s.waste.length > 0) {
    const card = s.waste[s.waste.length - 1];
    if (canAutoMoveCardToFoundation(card, s)) {
      return true;
    }
  }

  // Check if any tableau top can be auto-moved
  for (let i = 0; i < 7; i++) {
    if (s.tableaus[i].length > 0) {
      const card = s.tableaus[i][s.tableaus[i].length - 1];
      if (card.faceUp && canAutoMoveCardToFoundation(card, s)) {
        return true;
      }
    }
  }

  return false;
}

export function canAutoMove(s: GameState): boolean {
  const moves = legalMoves(s);
  return moves.length > 0;
}

// Undo/Redo
export function undo(s: GameState): GameState {
  if (s.history.length === 0) return s;

  const lastEntry = s.history[s.history.length - 1];
  let state = s;

  // Apply inverse operations in order
  for (const op of lastEntry.inverseOps) {
    state = applyEngineOp(state, op);
  }

  // Move history entry to future
  state.history = state.history.slice(0, -1);
  state.future = [...state.future, lastEntry];

  return state;
}

export function redo(s: GameState): GameState {
  if (s.future.length === 0) return s;

  const nextEntry = s.future[s.future.length - 1];
  let state = s;

  // Apply original operations by reversing the inverse operations
  for (let i = nextEntry.inverseOps.length - 1; i >= 0; i--) {
    const inverseOp = nextEntry.inverseOps[i];
    let originalOp: EngineOp;

    switch (inverseOp.type) {
      case "MOVE":
        originalOp = {
          type: "MOVE",
          from: inverseOp.to,
          to: inverseOp.from,
          cards: inverseOp.cards,
        };
        break;
      case "FLIP":
        originalOp = {
          type: "FLIP",
          pile: inverseOp.pile,
          index: inverseOp.index,
          faceUp: !inverseOp.faceUp,
        };
        break;
      case "SCORE":
        originalOp = {
          type: "SCORE",
          delta: -inverseOp.delta,
        };
        break;
      case "PASS_COUNT":
        originalOp = {
          type: "PASS_COUNT",
          delta: -inverseOp.delta,
        };
        break;
      case "SET_WON":
        originalOp = {
          type: "SET_WON",
          value: !inverseOp.value,
        };
        break;
      case "SET_LOST":
        originalOp = {
          type: "SET_LOST",
          value: !inverseOp.value,
        };
        break;
    }

    state = applyEngineOp(state, originalOp);
  }

  // Move future entry to history
  state.future = state.future.slice(0, -1);
  state.history = [...state.history, nextEntry];

  return state;
}

// Options
export function setOptions(s: GameState, opts: Partial<Options>): GameState {
  const newOptions = OptionsZ.parse({ ...s.options, ...opts });
  return { ...s, options: newOptions };
}

// Serialization / persistence
export const SAVE_KEY = "klondike:v1";

export function toSaveBlob(s: GameState, now: number): SaveBlob {
  const blob = { key: SAVE_KEY, savedAt: now, state: s as GameState };
  return SaveBlobZ.parse(blob);
}

export function fromSaveBlob(json: unknown): GameState {
  const blob = SaveBlobZ.parse(json);

  // Optional integrity check: verify all 52 ids across piles are unique
  const allCards: Card[] = [
    ...blob.state.stock,
    ...blob.state.waste,
    ...blob.state.tableaus.flat(),
    ...Object.values(blob.state.foundations).flat(),
  ];

  const cardIds = allCards.map((c) => c.id);
  const uniqueIds = new Set(cardIds);

  if (uniqueIds.size !== 52 || cardIds.length !== 52) {
    throw new Error("Invalid card distribution in saved game");
  }

  return GameStateZ.parse(blob.state);
}

// Accessibility helpers
export function describePile(s: GameState, ref: PileRef): string {
  if (ref.kind === "stock") {
    return `Stock pile with ${s.stock.length} cards`;
  } else if (ref.kind === "waste") {
    const topCard = s.waste[s.waste.length - 1];
    return `Waste pile with ${s.waste.length} cards${topCard ? `, top card is ${topCard.rank} of ${topCard.suit}` : ""}`;
  } else if (ref.kind === "foundation" && ref.suit) {
    const pile = s.foundations[ref.suit];
    const topCard = pile[pile.length - 1];
    return `${ref.suit} foundation with ${pile.length} cards${topCard ? `, top card is ${topCard.rank}` : ", empty"}`;
  } else if (ref.kind === "tableau" && ref.index !== undefined) {
    const pile = s.tableaus[ref.index];
    const topCard = pile[pile.length - 1];
    const faceUpCount = pile.filter((c) => c.faceUp).length;
    return `Tableau column ${ref.index + 1} with ${pile.length} cards, ${faceUpCount} face up${topCard && topCard.faceUp ? `, top card is ${topCard.rank} of ${topCard.suit}` : ""}`;
  }
  return "Unknown pile";
}

export function isAutoCompleteSafe(s: GameState): boolean {
  // All cards are face up in tableaus
  return s.tableaus.every((tableau) => tableau.every((card) => card.faceUp));
}
