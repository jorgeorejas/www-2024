import {
  BOX_COLS,
  BOX_ROWS,
  SIZE,
  boxOf,
  type CellValue,
  type GameState,
  type Puzzle,
} from "./types";

// Pure rule check: returns the set of "r,c" keys whose digit duplicates another
// digit in the same row, column, or 2x3 box. Empty cells (0) never conflict.
export function findConflicts(state: GameState): Set<string> {
  const grid = state.values;
  const conflicts = new Set<string>();
  const mark = (r: number, c: number) => conflicts.add(`${r},${c}`);

  // Rows
  for (let r = 0; r < SIZE; r++) {
    const seen = new Map<number, number[]>();
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const cols = seen.get(v) ?? [];
      cols.push(c);
      seen.set(v, cols);
    }
    for (const cols of seen.values()) {
      if (cols.length > 1) for (const c of cols) mark(r, c);
    }
  }
  // Columns
  for (let c = 0; c < SIZE; c++) {
    const seen = new Map<number, number[]>();
    for (let r = 0; r < SIZE; r++) {
      const v = grid[r][c];
      if (!v) continue;
      const rows = seen.get(v) ?? [];
      rows.push(r);
      seen.set(v, rows);
    }
    for (const rows of seen.values()) {
      if (rows.length > 1) for (const r of rows) mark(r, c);
    }
  }
  // Boxes
  for (let b = 0; b < SIZE; b++) {
    const seen = new Map<number, Array<[number, number]>>();
    const baseR = Math.floor(b / BOX_ROWS) * BOX_ROWS;
    const baseC = (b % BOX_ROWS) * BOX_COLS;
    for (let dr = 0; dr < BOX_ROWS; dr++) {
      for (let dc = 0; dc < BOX_COLS; dc++) {
        const r = baseR + dr;
        const c = baseC + dc;
        const v = grid[r][c];
        if (!v) continue;
        const cells = seen.get(v) ?? [];
        cells.push([r, c]);
        seen.set(v, cells);
      }
    }
    for (const cells of seen.values()) {
      if (cells.length > 1) for (const [r, c] of cells) mark(r, c);
    }
  }
  return conflicts;
}

export function isSolved(state: GameState): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!state.values[r][c]) return false;
    }
  }
  return findConflicts(state).size === 0;
}

export function emptyValues(): CellValue[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => 0 as CellValue),
  );
}

// Hydrate the playable values grid from a puzzle's givens (locks + zeros).
export function valuesFromGivens(givens: CellValue[][]): CellValue[][] {
  return givens.map((row) => [...row]);
}

// Backtracking solver. Returns up to `limit` complete solution grids.
// Used by the generator to verify uniqueness.
export function solve(puzzle: Puzzle, limit = 2): CellValue[][][] {
  const grid: CellValue[][] = puzzle.givens.map((row) => [...row]);
  const solutions: CellValue[][][] = [];

  // Per-row/col/box bitmasks of digits already used. Bit i represents digit i+1.
  const rowMask = new Array<number>(SIZE).fill(0);
  const colMask = new Array<number>(SIZE).fill(0);
  const boxMask = new Array<number>(SIZE).fill(0);

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (!v) continue;
      const bit = 1 << (v - 1);
      // Givens that conflict with each other → no solution.
      if (rowMask[r] & bit || colMask[c] & bit || boxMask[boxOf(r, c)] & bit) {
        return [];
      }
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[boxOf(r, c)] |= bit;
    }
  }

  // Find empties up front and order them by fewest candidates first (MRV).
  const empties: Array<[number, number]> = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) empties.push([r, c]);
    }
  }

  const recurse = (): void => {
    if (solutions.length >= limit) return;
    // Pick the empty cell with fewest candidates (minimum-remaining-values).
    let bestIdx = -1;
    let bestCount = 7;
    let bestCells: number[] = [];
    for (let i = 0; i < empties.length; i++) {
      const [r, c] = empties[i];
      if (grid[r][c]) continue;
      const used = rowMask[r] | colMask[c] | boxMask[boxOf(r, c)];
      const cands: number[] = [];
      for (let d = 1; d <= SIZE; d++) {
        if (!(used & (1 << (d - 1)))) cands.push(d);
      }
      if (cands.length === 0) return; // dead end
      if (cands.length < bestCount) {
        bestCount = cands.length;
        bestIdx = i;
        bestCells = cands;
        if (bestCount === 1) break;
      }
    }
    if (bestIdx === -1) {
      // No empties remain → solution found.
      solutions.push(grid.map((row) => [...row]));
      return;
    }
    const [r, c] = empties[bestIdx];
    const b = boxOf(r, c);
    for (const d of bestCells) {
      const bit = 1 << (d - 1);
      grid[r][c] = d as CellValue;
      rowMask[r] |= bit;
      colMask[c] |= bit;
      boxMask[b] |= bit;
      recurse();
      grid[r][c] = 0;
      rowMask[r] &= ~bit;
      colMask[c] &= ~bit;
      boxMask[b] &= ~bit;
      if (solutions.length >= limit) return;
    }
  };

  recurse();
  return solutions;
}

export function hasUniqueSolution(puzzle: Puzzle): boolean {
  return solve(puzzle, 2).length === 1;
}
