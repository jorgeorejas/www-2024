import type {
  CellValue,
  Constraint,
  GameState,
  Puzzle,
} from "./types";

export const SIZE = 6;
export const HALF = SIZE / 2;

type ConstraintGrid = Array<Array<Constraint | null>>;

export function emptyCells(): CellValue[][] {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => "empty" as CellValue),
  );
}

export function nextCellValue(current: CellValue): CellValue {
  if (current === "empty") return "sun";
  if (current === "sun") return "moon";
  return "empty";
}

function constraintHolds(
  a: CellValue,
  b: CellValue,
  constraint: Constraint,
): boolean {
  if (a === "empty" || b === "empty") return true;
  if (constraint === "eq") return a === b;
  return a !== b;
}

// Find every cell currently violating a Tango rule. We mark BOTH cells of any
// offending pair so the UI can outline them in red.
export function findConflicts(state: GameState): Set<string> {
  const { puzzle, cells } = state;
  const { hConstraints, vConstraints } = puzzle;
  const conflicts = new Set<string>();
  const mark = (r: number, c: number) => conflicts.add(`${r},${c}`);

  // Three-in-a-row check (horizontal and vertical).
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = cells[r][c];
      if (v === "empty") continue;
      if (c + 2 < SIZE && cells[r][c + 1] === v && cells[r][c + 2] === v) {
        mark(r, c);
        mark(r, c + 1);
        mark(r, c + 2);
      }
      if (r + 2 < SIZE && cells[r + 1][c] === v && cells[r + 2][c] === v) {
        mark(r, c);
        mark(r + 1, c);
        mark(r + 2, c);
      }
    }
  }

  // Row / column count check: at most 3 of each symbol.
  for (let i = 0; i < SIZE; i++) {
    let rSun = 0;
    let rMoon = 0;
    let cSun = 0;
    let cMoon = 0;
    for (let j = 0; j < SIZE; j++) {
      if (cells[i][j] === "sun") rSun++;
      else if (cells[i][j] === "moon") rMoon++;
      if (cells[j][i] === "sun") cSun++;
      else if (cells[j][i] === "moon") cMoon++;
    }
    if (rSun > HALF || rMoon > HALF) {
      const offender: CellValue = rSun > HALF ? "sun" : "moon";
      for (let j = 0; j < SIZE; j++) {
        if (cells[i][j] === offender) mark(i, j);
      }
    }
    if (cSun > HALF || cMoon > HALF) {
      const offender: CellValue = cSun > HALF ? "sun" : "moon";
      for (let j = 0; j < SIZE; j++) {
        if (cells[j][i] === offender) mark(j, i);
      }
    }
  }

  // Constraint check.
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const right = hConstraints[r][c];
      if (right && c + 1 < SIZE) {
        if (!constraintHolds(cells[r][c], cells[r][c + 1], right)) {
          mark(r, c);
          mark(r, c + 1);
        }
      }
      const down = vConstraints[r][c];
      if (down && r + 1 < SIZE) {
        if (!constraintHolds(cells[r][c], cells[r + 1][c], down)) {
          mark(r, c);
          mark(r + 1, c);
        }
      }
    }
  }

  return conflicts;
}

export function isSolved(state: GameState): boolean {
  const { cells } = state;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (cells[r][c] === "empty") return false;
    }
  }
  return findConflicts(state).size === 0;
}

// Would placing `value` at axis-position `pos` put three of `value` in a row
// in any of the three windows that include `pos`? Reads symbols from `at(i)`
// and treats the proposed placement as if it were already there.
function makesTriple(
  pos: number,
  value: CellValue,
  at: (i: number) => CellValue,
): boolean {
  for (let start = pos - 2; start <= pos; start++) {
    if (start < 0 || start + 2 >= SIZE) continue;
    const v0 = start === pos ? value : at(start);
    const v1 = start + 1 === pos ? value : at(start + 1);
    const v2 = start + 2 === pos ? value : at(start + 2);
    if (v0 === value && v1 === value && v2 === value) return true;
  }
  return false;
}

// Local validity check used by the solver: does placing `value` at (r,c) keep
// the partial board (`grid`) consistent with all rules?
function localPlacementOk(
  grid: CellValue[][],
  r: number,
  c: number,
  value: CellValue,
  hConstraints: ConstraintGrid,
  vConstraints: ConstraintGrid,
): boolean {
  if (makesTriple(c, value, (i) => grid[r][i])) return false;
  if (makesTriple(r, value, (i) => grid[i][c])) return false;

  let rowCount = 0;
  let colCount = 0;
  for (let i = 0; i < SIZE; i++) {
    if (i !== c && grid[r][i] === value) rowCount++;
    if (i !== r && grid[i][c] === value) colCount++;
  }
  if (rowCount + 1 > HALF) return false;
  if (colCount + 1 > HALF) return false;

  const checks: Array<[number, number, Constraint | null]> = [
    [r, c - 1, c > 0 ? hConstraints[r][c - 1] : null],
    [r, c + 1, c + 1 < SIZE ? hConstraints[r][c] : null],
    [r - 1, c, r > 0 ? vConstraints[r - 1][c] : null],
    [r + 1, c, r + 1 < SIZE ? vConstraints[r][c] : null],
  ];
  for (const [nr, nc, k] of checks) {
    if (!k) continue;
    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
    const other = grid[nr][nc];
    if (other === "empty") continue;
    if (!constraintHolds(value, other, k)) return false;
  }

  return true;
}

// Backtracking solver. Returns up to `limit` distinct fully-assigned grids.
// Search order is row-major; at each cell tries sun then moon.
export function solve(puzzle: Puzzle, limit = 2): CellValue[][][] {
  const grid: CellValue[][] = puzzle.clues.map((row) => [...row]);
  const solutions: CellValue[][][] = [];
  const { hConstraints, vConstraints } = puzzle;
  const choices: CellValue[] = ["sun", "moon"];

  const recurse = (idx: number) => {
    if (solutions.length >= limit) return;
    if (idx === SIZE * SIZE) {
      solutions.push(grid.map((row) => [...row]));
      return;
    }
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    if (grid[r][c] !== "empty") {
      recurse(idx + 1);
      return;
    }
    for (const v of choices) {
      if (
        localPlacementOk(grid, r, c, v, hConstraints, vConstraints)
      ) {
        grid[r][c] = v;
        recurse(idx + 1);
        grid[r][c] = "empty";
        if (solutions.length >= limit) return;
      }
    }
  };

  recurse(0);
  return solutions;
}

export function hasUniqueSolution(puzzle: Puzzle): boolean {
  return solve(puzzle, 2).length === 1;
}
