import { PRNG } from "../../_shared/rng";
import type { Difficulty } from "../../_shared/types";
import { SIZE, hasUniqueSolution } from "./engine";
import type { CellValue, Constraint, Puzzle } from "./types";

interface DifficultyParams {
  clues: number;
  constraints: number;
}

const PARAMS: Record<Difficulty, DifficultyParams> = {
  easy: { clues: 8, constraints: 5 },
  medium: { clues: 6, constraints: 4 },
  hard: { clues: 4, constraints: 3 },
};

const MAX_ATTEMPTS = 60;

function emptyConstraints(): Array<Array<Constraint | null>> {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null as Constraint | null),
  );
}

// 1) Build a complete valid 6×6 solution via backtracking with seeded shuffled
// choices per cell. Honors the row/col triple-adjacent and 3-of-each rules.
function generateSolution(prng: PRNG): CellValue[][] | null {
  const grid: CellValue[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => "empty" as CellValue),
  );
  const HALF = SIZE / 2;

  const valid = (r: number, c: number, v: CellValue): boolean => {
    // Three-in-a-row guard against assigned predecessors only.
    if (c >= 2 && grid[r][c - 1] === v && grid[r][c - 2] === v) return false;
    if (r >= 2 && grid[r - 1][c] === v && grid[r - 2][c] === v) return false;

    let rowCount = 0;
    let colCount = 0;
    for (let i = 0; i < SIZE; i++) {
      if (grid[r][i] === v) rowCount++;
      if (grid[i][c] === v) colCount++;
    }
    if (rowCount + 1 > HALF) return false;
    if (colCount + 1 > HALF) return false;
    return true;
  };

  const recurse = (idx: number): boolean => {
    if (idx === SIZE * SIZE) return true;
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    const order = prng.shuffle<CellValue>(["sun", "moon"]);
    for (const v of order) {
      if (!valid(r, c, v)) continue;
      grid[r][c] = v;
      if (recurse(idx + 1)) return true;
      grid[r][c] = "empty";
    }
    return false;
  };

  return recurse(0) ? grid : null;
}

interface EdgeCandidate {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  axis: "h" | "v";
}

function allEdges(): EdgeCandidate[] {
  const edges: EdgeCandidate[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE) {
        edges.push({ r1: r, c1: c, r2: r, c2: c + 1, axis: "h" });
      }
      if (r + 1 < SIZE) {
        edges.push({ r1: r, c1: c, r2: r + 1, c2: c, axis: "v" });
      }
    }
  }
  return edges;
}

interface CellCoord {
  r: number;
  c: number;
}

function allCells(): CellCoord[] {
  const cells: CellCoord[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) cells.push({ r, c });
  }
  return cells;
}

// 2) Pick `n` random adjacent cell pairs and assign = or × consistent with the
// solution.
function pickConstraints(
  solution: CellValue[][],
  count: number,
  prng: PRNG,
): {
  hConstraints: Array<Array<Constraint | null>>;
  vConstraints: Array<Array<Constraint | null>>;
  picks: EdgeCandidate[];
} {
  const hConstraints = emptyConstraints();
  const vConstraints = emptyConstraints();
  const shuffled = prng.shuffle(allEdges());
  const picks: EdgeCandidate[] = [];
  for (const edge of shuffled) {
    if (picks.length >= count) break;
    const a = solution[edge.r1][edge.c1];
    const b = solution[edge.r2][edge.c2];
    const k: Constraint = a === b ? "eq" : "ne";
    if (edge.axis === "h") hConstraints[edge.r1][edge.c1] = k;
    else vConstraints[edge.r1][edge.c1] = k;
    picks.push(edge);
  }
  return { hConstraints, vConstraints, picks };
}

// 3) Pick `n` cells to reveal as locked clues.
function pickClues(
  solution: CellValue[][],
  count: number,
  prng: PRNG,
): {
  clues: CellValue[][];
  picks: CellCoord[];
} {
  const clues: CellValue[][] = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => "empty" as CellValue),
  );
  const shuffled = prng.shuffle(allCells());
  const picks: CellCoord[] = [];
  for (const cell of shuffled) {
    if (picks.length >= count) break;
    clues[cell.r][cell.c] = solution[cell.r][cell.c];
    picks.push(cell);
  }
  return { clues, picks };
}

// Reveal one more clue. Returns mutated `picks` and `clues` in place.
function addClue(
  clues: CellValue[][],
  picks: CellCoord[],
  solution: CellValue[][],
  prng: PRNG,
): boolean {
  const remaining = allCells().filter(
    ({ r, c }) => clues[r][c] === "empty",
  );
  if (remaining.length === 0) return false;
  const pick = prng.pick(remaining);
  clues[pick.r][pick.c] = solution[pick.r][pick.c];
  picks.push(pick);
  return true;
}

// Add one more constraint consistent with the solution.
function addConstraint(
  hConstraints: Array<Array<Constraint | null>>,
  vConstraints: Array<Array<Constraint | null>>,
  picks: EdgeCandidate[],
  solution: CellValue[][],
  prng: PRNG,
): boolean {
  const used = new Set(picks.map((e) => `${e.axis}:${e.r1},${e.c1}`));
  const remaining = allEdges().filter(
    (e) => !used.has(`${e.axis}:${e.r1},${e.c1}`),
  );
  if (remaining.length === 0) return false;
  const edge = prng.pick(remaining);
  const a = solution[edge.r1][edge.c1];
  const b = solution[edge.r2][edge.c2];
  const k: Constraint = a === b ? "eq" : "ne";
  if (edge.axis === "h") hConstraints[edge.r1][edge.c1] = k;
  else vConstraints[edge.r1][edge.c1] = k;
  picks.push(edge);
  return true;
}

export function generatePuzzle(
  seed: string,
  difficulty: Difficulty = "medium",
): Puzzle {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prng = new PRNG(`${seed}#${attempt}`);
    const solution = generateSolution(prng);
    if (!solution) continue;

    const params = PARAMS[difficulty];
    const { hConstraints, vConstraints, picks: constraintPicks } =
      pickConstraints(solution, params.constraints, prng);
    const { clues, picks: cluePicks } = pickClues(
      solution,
      params.clues,
      prng,
    );

    // 4) Verify uniqueness; if not unique, reveal one more clue or add one
    // more constraint, alternating, and retry. Each tweak preserves solution
    // consistency, so we never invalidate the chosen solution.
    for (let tweak = 0; tweak < 20; tweak++) {
      const candidate: Puzzle = {
        size: SIZE,
        clues,
        hConstraints,
        vConstraints,
        seed,
        difficulty,
      };
      if (hasUniqueSolution(candidate)) return candidate;
      const added =
        tweak % 2 === 0
          ? addClue(clues, cluePicks, solution, prng)
          : addConstraint(
              hConstraints,
              vConstraints,
              constraintPicks,
              solution,
              prng,
            );
      if (!added) break;
    }
  }
  throw new Error(
    `Failed to generate Tango puzzle after ${MAX_ATTEMPTS} attempts (seed=${seed}, difficulty=${difficulty})`,
  );
}
