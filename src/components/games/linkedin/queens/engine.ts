import type { CellState, GameState, Puzzle } from "./types";

// Two queens conflict if they share a row, a column, a region, or sit on
// diagonally-adjacent cells (touching corners). Same-row/col is impossible
// once we enforce one queen per row & column during solving, but the runtime
// rule still includes it because the player can place queens freely.

// Cells "attacked" by any placed queen: same row, column, region, or
// diagonally-adjacent corner. Used to draw auto-marks in empty cells so
// the player can see at a glance which squares can't host a queen.
export function findAttacked(state: GameState): Set<string> {
  const { puzzle, cells } = state;
  const { size, regions } = puzzle;
  const attacked = new Set<string>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c] !== "queen") continue;
      const region = regions[r][c];

      for (let i = 0; i < size; i++) {
        if (i !== c) attacked.add(`${r},${i}`);
        if (i !== r) attacked.add(`${i},${c}`);
      }
      for (let rr = 0; rr < size; rr++) {
        for (let cc = 0; cc < size; cc++) {
          if (rr === r && cc === c) continue;
          if (regions[rr][cc] === region) attacked.add(`${rr},${cc}`);
        }
      }
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ] as const) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        attacked.add(`${nr},${nc}`);
      }
    }
  }
  return attacked;
}

export function findConflicts(state: GameState): Set<string> {
  const { puzzle, cells } = state;
  const queens: Array<{ r: number; c: number; region: number }> = [];
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      if (cells[r][c] === "queen") {
        queens.push({ r, c, region: puzzle.regions[r][c] });
      }
    }
  }

  const conflicts = new Set<string>();
  const mark = (r: number, c: number) => conflicts.add(`${r},${c}`);

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      const a = queens[i];
      const b = queens[j];
      const sameRow = a.r === b.r;
      const sameCol = a.c === b.c;
      const sameRegion = a.region === b.region;
      const adjDiag = Math.abs(a.r - b.r) === 1 && Math.abs(a.c - b.c) === 1;
      if (sameRow || sameCol || sameRegion || adjDiag) {
        mark(a.r, a.c);
        mark(b.r, b.c);
      }
    }
  }
  return conflicts;
}

export function isSolved(state: GameState): boolean {
  const { puzzle, cells } = state;
  let queenCount = 0;
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      if (cells[r][c] === "queen") queenCount++;
    }
  }
  if (queenCount !== puzzle.size) return false;
  return findConflicts(state).size === 0;
}

export function emptyCells(size: number): CellState[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "empty" as CellState),
  );
}

export function nextCellState(current: CellState): CellState {
  if (current === "empty") return "mark";
  if (current === "mark") return "queen";
  return "empty";
}

// Backtracking solver. Returns up to `limit` distinct solutions as queen
// row→col mappings. Used by the generator to verify uniqueness.
export function solve(puzzle: Puzzle, limit = 2): number[][] {
  const { size, regions } = puzzle;
  const solutions: number[][] = [];
  const colUsed = new Array<boolean>(size).fill(false);
  const regionUsed = new Map<number, boolean>();
  const placement = new Array<number>(size).fill(-1);

  const recurse = (row: number) => {
    if (solutions.length >= limit) return;
    if (row === size) {
      solutions.push([...placement]);
      return;
    }
    for (let col = 0; col < size; col++) {
      if (colUsed[col]) continue;
      const region = regions[row][col];
      if (regionUsed.get(region)) continue;
      // Diagonal-adjacent check against the previous row only — queens are
      // unique per row so non-adjacent rows cannot be diagonally adjacent.
      if (row > 0) {
        const prev = placement[row - 1];
        if (Math.abs(prev - col) === 1) continue;
      }
      colUsed[col] = true;
      regionUsed.set(region, true);
      placement[row] = col;
      recurse(row + 1);
      placement[row] = -1;
      regionUsed.set(region, false);
      colUsed[col] = false;
    }
  };

  recurse(0);
  return solutions;
}

export function hasUniqueSolution(puzzle: Puzzle): boolean {
  return solve(puzzle, 2).length === 1;
}
