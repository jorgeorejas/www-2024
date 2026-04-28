import { PRNG } from "../../_shared/rng";
import type { Difficulty } from "../../_shared/types";
import { hasUniqueSolution } from "./engine";
import {
  BOX_COLS,
  BOX_ROWS,
  SIZE,
  boxOf,
  type CellValue,
  type Puzzle,
} from "./types";

const CLUE_TARGET: Record<Difficulty, number> = {
  easy: 22,
  medium: 18,
  hard: 14,
};

// Fill an empty 6x6 grid with a complete valid solution via backtracking.
// Randomized digit order per cell makes every seed produce different solutions.
function fillSolution(prng: PRNG): CellValue[][] {
  const grid: CellValue[][] = Array.from({ length: SIZE }, () =>
    new Array<CellValue>(SIZE).fill(0),
  );
  const rowMask = new Array<number>(SIZE).fill(0);
  const colMask = new Array<number>(SIZE).fill(0);
  const boxMask = new Array<number>(SIZE).fill(0);

  const recurse = (idx: number): boolean => {
    if (idx === SIZE * SIZE) return true;
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    const b = boxOf(r, c);
    const used = rowMask[r] | colMask[c] | boxMask[b];
    const order = prng.shuffle([1, 2, 3, 4, 5, 6]);
    for (const d of order) {
      const bit = 1 << (d - 1);
      if (used & bit) continue;
      grid[r][c] = d as CellValue;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;
      if (recurse(idx + 1)) return true;
      grid[r][c] = 0;
      rowMask[r] &= ~bit;
      colMask[c] &= ~bit;
      boxMask[b] &= ~bit;
    }
    return false;
  };

  if (!recurse(0)) {
    // Should never happen on a 6x6 with a fresh empty grid.
    throw new Error("Failed to fill 6x6 Sudoku solution");
  }
  return grid;
}

// Permute rows within bands and cols within stacks. Preserves Sudoku validity
// because rows/cols within a band/stack only swap positions inside their box.
function shuffleSolution(grid: CellValue[][], prng: PRNG): CellValue[][] {
  let g = grid.map((row) => [...row]);

  // Shuffle rows within each band (each band = BOX_ROWS rows).
  for (let band = 0; band < SIZE / BOX_ROWS; band++) {
    const order = prng.shuffle(
      Array.from({ length: BOX_ROWS }, (_, i) => band * BOX_ROWS + i),
    );
    const next = g.map((row) => [...row]);
    for (let i = 0; i < BOX_ROWS; i++) {
      next[band * BOX_ROWS + i] = [...g[order[i]]];
    }
    g = next;
  }
  // Shuffle cols within each stack (each stack = BOX_COLS cols).
  for (let stack = 0; stack < SIZE / BOX_COLS; stack++) {
    const order = prng.shuffle(
      Array.from({ length: BOX_COLS }, (_, i) => stack * BOX_COLS + i),
    );
    const next = g.map((row) => [...row]);
    for (let r = 0; r < SIZE; r++) {
      for (let i = 0; i < BOX_COLS; i++) {
        next[r][stack * BOX_COLS + i] = g[r][order[i]];
      }
    }
    g = next;
  }
  // Shuffle whole bands (rows of boxes), then whole stacks (cols of boxes).
  const bandOrder = prng.shuffle(
    Array.from({ length: SIZE / BOX_ROWS }, (_, i) => i),
  );
  const swappedBands = g.map((row) => [...row]);
  for (let i = 0; i < bandOrder.length; i++) {
    for (let j = 0; j < BOX_ROWS; j++) {
      swappedBands[i * BOX_ROWS + j] = [...g[bandOrder[i] * BOX_ROWS + j]];
    }
  }
  g = swappedBands;

  const stackOrder = prng.shuffle(
    Array.from({ length: SIZE / BOX_COLS }, (_, i) => i),
  );
  const swappedStacks = g.map((row) => [...row]);
  for (let r = 0; r < SIZE; r++) {
    for (let i = 0; i < stackOrder.length; i++) {
      for (let j = 0; j < BOX_COLS; j++) {
        swappedStacks[r][i * BOX_COLS + j] = g[r][stackOrder[i] * BOX_COLS + j];
      }
    }
  }
  g = swappedStacks;

  // Relabel digits via a random 1..6 permutation.
  const perm = prng.shuffle([1, 2, 3, 4, 5, 6]);
  const relabel = g.map((row) =>
    row.map((v) => (v ? (perm[v - 1] as CellValue) : (0 as CellValue))),
  );
  return relabel;
}

const MAX_ATTEMPTS = 40;

export function generatePuzzle(
  seed: string,
  difficulty: Difficulty = "medium",
): Puzzle {
  const targetClues = CLUE_TARGET[difficulty];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prng = new PRNG(`${seed}#${attempt}`);
    const solution = shuffleSolution(fillSolution(prng), prng);
    const givens: CellValue[][] = solution.map((row) => [...row]);

    // Carve clues out one cell at a time in random order. Keep removing only
    // while the puzzle remains uniquely solvable.
    const positions = prng.shuffle(
      Array.from({ length: SIZE * SIZE }, (_, i) => i),
    );
    let cluesRemaining = SIZE * SIZE;
    for (const pos of positions) {
      if (cluesRemaining <= targetClues) break;
      const r = Math.floor(pos / SIZE);
      const c = pos % SIZE;
      const saved = givens[r][c];
      if (!saved) continue;
      givens[r][c] = 0;
      const candidate: Puzzle = { givens, solution, seed, difficulty };
      if (!hasUniqueSolution(candidate)) {
        givens[r][c] = saved; // revert — removing this clue would create ambiguity
      } else {
        cluesRemaining--;
      }
    }

    if (cluesRemaining <= targetClues + 4) {
      return { givens, solution, seed, difficulty };
    }
  }
  throw new Error(
    `Failed to generate Sudoku puzzle after ${MAX_ATTEMPTS} attempts (seed=${seed}, difficulty=${difficulty})`,
  );
}
