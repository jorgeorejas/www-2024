import type { GameState, Puzzle } from "./types";
import { GRID_SIZE, TOTAL_CELLS } from "./types";

// Cell index ↔ row/col helpers. Index = row * size + col.
export function cellIndex(row: number, col: number, size = GRID_SIZE): number {
  return row * size + col;
}

export function cellRowCol(index: number, size = GRID_SIZE): [number, number] {
  return [Math.floor(index / size), index % size];
}

const NEI = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

export function neighbors(index: number, size = GRID_SIZE): number[] {
  const [r, c] = cellRowCol(index, size);
  const out: number[] = [];
  for (const [dr, dc] of NEI) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
    out.push(cellIndex(nr, nc, size));
  }
  return out;
}

export function areAdjacent(a: number, b: number, size = GRID_SIZE): boolean {
  const [ar, ac] = cellRowCol(a, size);
  const [br, bc] = cellRowCol(b, size);
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

// Returns the sorted array of labeled cell indices in label order.
// puzzle.labels is { [index]: labelNumber }. Result[0] is the cell labeled 1.
export function labelSequence(puzzle: Puzzle): number[] {
  const entries = Object.entries(puzzle.labels)
    .map(([idx, label]) => [Number(idx), label] as const)
    .sort((a, b) => a[1] - b[1]);
  return entries.map(([idx]) => idx);
}

// A path is "valid" if (a) every cell is in-bounds (b) consecutive cells are
// orthogonal neighbors (c) no cell repeats (d) labels seen so far appear in
// strictly increasing order. Useful for both player-validation and the solver.
export function isPathValid(puzzle: Puzzle, path: number[]): boolean {
  if (path.length === 0) return true;
  const seen = new Set<number>();
  let lastLabel = 0;
  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (cell < 0 || cell >= TOTAL_CELLS) return false;
    if (seen.has(cell)) return false;
    seen.add(cell);
    if (i > 0 && !areAdjacent(path[i - 1], cell, puzzle.size)) return false;
    const lbl = puzzle.labels[String(cell)];
    if (lbl !== undefined) {
      if (lbl !== lastLabel + 1) return false;
      lastLabel = lbl;
    }
  }
  return true;
}

// "Complete" means: visits every cell and all labels were traversed in order.
export function isPathComplete(puzzle: Puzzle, path: number[]): boolean {
  if (path.length !== TOTAL_CELLS) return false;
  return isPathValid(puzzle, path);
}

export function isSolved(state: GameState): boolean {
  return isPathComplete(state.puzzle, state.path);
}

// Cells the current path conflicts with. Currently always empty because the
// provider only allows valid extensions (so the path is never in a conflict
// state at rest). Kept for symmetry with Queens' API surface.
export function findConflicts(state: GameState): Set<string> {
  void state;
  return new Set<string>();
}

// Hamiltonian-path solver through the labeled cells in label order. Returns
// up to `limit` distinct full paths. Used by the generator to verify
// uniqueness; cap iteration count to avoid runaway searches on early-stage
// candidates. Returns paths as arrays of cell indices.
export interface SolveOptions {
  limit?: number;
  maxSteps?: number;
}

export function solveHamiltonian(
  puzzle: Puzzle,
  options: SolveOptions = {},
): number[][] {
  const limit = options.limit ?? 2;
  const maxSteps = options.maxSteps ?? 5_000_000;
  const size = puzzle.size;
  const total = size * size;
  const labels = labelSequence(puzzle);
  if (labels.length === 0) return [];

  const labelOf = new Array<number>(total).fill(0);
  for (const [idx, n] of Object.entries(puzzle.labels)) {
    labelOf[Number(idx)] = n;
  }

  const start = labels[0];
  const solutions: number[][] = [];
  const visited = new Array<boolean>(total).fill(false);
  const path = new Array<number>(total).fill(-1);
  let steps = 0;
  let aborted = false;

  // Precompute neighbor lists for speed.
  const nbrs: number[][] = new Array(total);
  for (let i = 0; i < total; i++) nbrs[i] = neighbors(i, size);

  function recurse(depth: number, cell: number, labelsConsumed: number): void {
    if (aborted || solutions.length >= limit) return;
    steps++;
    if (steps > maxSteps) {
      aborted = true;
      return;
    }
    visited[cell] = true;
    path[depth] = cell;
    // Caller has guaranteed any label on `cell` matches the next expected
    // label in sequence, so we just advance the consumed counter.
    const consumed = labelOf[cell] !== 0 ? labelsConsumed + 1 : labelsConsumed;

    if (depth === total - 1) {
      if (consumed === labels.length) solutions.push(path.slice());
      visited[cell] = false;
      return;
    }

    const expectedNextLabelCell =
      consumed < labels.length ? labels[consumed] : -1;

    for (const next of nbrs[cell]) {
      if (visited[next]) continue;
      // If next carries a label, it must be the next expected one.
      if (labelOf[next] !== 0 && next !== expectedNextLabelCell) continue;
      recurse(depth + 1, next, consumed);
      if (aborted || solutions.length >= limit) {
        visited[cell] = false;
        return;
      }
    }
    visited[cell] = false;
  }

  // Start cell must be the cell labeled 1.
  recurse(0, start, 0);
  return solutions;
}

export function hasUniqueSolution(
  puzzle: Puzzle,
  options: SolveOptions = {},
): boolean {
  const sols = solveHamiltonian(puzzle, { limit: 2, ...options });
  return sols.length === 1;
}

// Returns the next cell (after current path tail) along the unique solution,
// or null if no unique extension exists. Used for the Hint action.
export function hintNextStep(
  puzzle: Puzzle,
  currentPath: number[],
): number | null {
  const sols = solveHamiltonian(puzzle, { limit: 1 });
  if (sols.length === 0) return null;
  const sol = sols[0];
  // The unique solution starts at the cell labeled 1. The player's path is
  // a prefix of that solution because every move was validated. Find where
  // the player is and return the next cell. If the player path doesn't
  // match the solution prefix, fall back to the first cell.
  if (currentPath.length === 0) return sol[0];
  for (let i = 0; i < currentPath.length; i++) {
    if (sol[i] !== currentPath[i]) {
      // Player diverged. Return null — the UI should clear first.
      return null;
    }
  }
  return currentPath.length < sol.length ? sol[currentPath.length] : null;
}
