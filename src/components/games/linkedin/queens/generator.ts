import { PRNG } from "../../_shared/rng";
import type { Difficulty } from "../../_shared/types";
import { hasUniqueSolution, solve } from "./engine";
import type { Puzzle } from "./types";

const SIZE_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 7,
  medium: 8,
  hard: 9,
};

// 1) Place N queens with backtracking, randomized column order per row.
// Constraints: one per row, one per col, no diagonal-adjacency between
// queens in consecutive rows.
function placeQueens(size: number, prng: PRNG): number[] | null {
  const placement = new Array<number>(size).fill(-1);
  const colUsed = new Array<boolean>(size).fill(false);

  const recurse = (row: number): boolean => {
    if (row === size) return true;
    const order = prng.shuffle(Array.from({ length: size }, (_, i) => i));
    for (const col of order) {
      if (colUsed[col]) continue;
      if (row > 0 && Math.abs(placement[row - 1] - col) === 1) continue;
      placement[row] = col;
      colUsed[col] = true;
      if (recurse(row + 1)) return true;
      colUsed[col] = false;
      placement[row] = -1;
    }
    return false;
  };

  return recurse(0) ? placement : null;
}

const NEI = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

function inBounds(size: number, r: number, c: number): boolean {
  return r >= 0 && r < size && c >= 0 && c < size;
}

// 2) Multi-source randomized BFS from queen seeds. Each step picks a random
// frontier cell (unassigned, adjacent to an assigned cell) and assigns it to
// one of its assigned neighbors' regions. This guarantees every region is
// orthogonally connected by construction — Manhattan-Voronoi with jitter
// could leave isolated cells stranded across the bisector between two
// equidistant queens.
function growRegions(
  size: number,
  queens: number[],
  prng: PRNG,
): number[][] {
  const regions: number[][] = Array.from({ length: size }, () =>
    new Array<number>(size).fill(-1),
  );
  const frontierKeys = new Set<string>();
  const frontier: Array<[number, number]> = [];

  const addFrontier = (r: number, c: number) => {
    if (!inBounds(size, r, c)) return;
    if (regions[r][c] !== -1) return;
    const k = `${r},${c}`;
    if (frontierKeys.has(k)) return;
    frontierKeys.add(k);
    frontier.push([r, c]);
  };

  for (let q = 0; q < queens.length; q++) {
    regions[q][queens[q]] = q;
    for (const [dr, dc] of NEI) addFrontier(q + dr, queens[q] + dc);
  }

  while (frontier.length > 0) {
    const idx = Math.floor(prng.next() * frontier.length);
    const [r, c] = frontier[idx];
    // Swap-remove for O(1) deletion.
    frontier[idx] = frontier[frontier.length - 1];
    frontier.pop();
    frontierKeys.delete(`${r},${c}`);
    if (regions[r][c] !== -1) continue;

    const neighborIds: number[] = [];
    for (const [dr, dc] of NEI) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(size, nr, nc)) continue;
      const id = regions[nr][nc];
      if (id !== -1) neighborIds.push(id);
    }
    if (neighborIds.length === 0) continue; // shouldn't happen, but defensive
    const pick = neighborIds[Math.floor(prng.next() * neighborIds.length)];
    regions[r][c] = pick;
    for (const [dr, dc] of NEI) addFrontier(r + dr, c + dc);
  }
  return regions;
}

// Returns true iff the connected component of cells with `targetId` containing
// `(seedR, seedC)` covers every cell labeled `targetId`. Used to verify a
// proposed reassignment doesn't split a region.
function regionStaysConnected(
  regions: number[][],
  targetId: number,
  excludeR: number,
  excludeC: number,
): boolean {
  const size = regions.length;
  // Find any cell of targetId other than the excluded one.
  let startR = -1;
  let startC = -1;
  let total = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] !== targetId) continue;
      if (r === excludeR && c === excludeC) continue;
      total++;
      if (startR === -1) {
        startR = r;
        startC = c;
      }
    }
  }
  if (total === 0) return false; // would empty the region
  const seen = new Set<string>([`${startR},${startC}`]);
  const stack: Array<[number, number]> = [[startR, startC]];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    for (const [dr, dc] of NEI) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(size, nr, nc)) continue;
      if (regions[nr][nc] !== targetId) continue;
      if (nr === excludeR && nc === excludeC) continue;
      const k = `${nr},${nc}`;
      if (seen.has(k)) continue;
      seen.add(k);
      stack.push([nr, nc]);
    }
  }
  return seen.size === total;
}

// 3) Repair loop: while the puzzle has alternate solutions, find an alt-only
// queen cell and reassign it to a neighboring region (without breaking
// connectivity). This kills that specific alternate; repeat until unique.
function repairToUnique(
  puzzle: Puzzle,
  intendedSolution: number[],
  prng: PRNG,
  maxIterations = 80,
): Puzzle | null {
  const { size, regions } = puzzle;
  const work = regions.map((row) => [...row]);

  for (let iter = 0; iter < maxIterations; iter++) {
    const solutions = solve({ ...puzzle, regions: work }, 2);
    if (solutions.length === 0) return null;
    if (solutions.length === 1) {
      return { ...puzzle, regions: work };
    }
    // Find a row where the alt solution differs from the intended one and
    // try to reassign that cell to a neighbor's region.
    const alt = solutions.find(
      (s) => !s.every((col, r) => col === intendedSolution[r]),
    );
    if (!alt) return null;

    const diffRows: number[] = [];
    for (let r = 0; r < size; r++) {
      if (alt[r] !== intendedSolution[r]) diffRows.push(r);
    }
    const order = prng.shuffle(diffRows);
    let mutated = false;
    for (const r of order) {
      const c = alt[r];
      const currentId = work[r][c];
      // Skip if this is the intended queen's cell of currentId — never
      // reassign a queen's own cell (it would become solvable elsewhere).
      const queenCol = intendedSolution[r];
      const queenRowOfCurrentId = intendedSolution.findIndex(
        (qc, qr) => work[qr][qc] === currentId,
      );
      if (queenRowOfCurrentId === r && queenCol === c) continue;

      // If yanking this cell from currentId would split it, no candidate
      // reassignment is safe — try the next diff row.
      if (!regionStaysConnected(work, currentId, r, c)) continue;
      const neighborIds = new Set<number>();
      for (const [dr, dc] of NEI) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(size, nr, nc)) continue;
        const id = work[nr][nc];
        if (id !== currentId) neighborIds.add(id);
      }
      const candidates = prng.shuffle(Array.from(neighborIds));
      if (candidates.length === 0) continue;
      work[r][c] = candidates[0];
      mutated = true;
      break;
    }
    if (!mutated) return null; // no productive reassignment available
  }
  return null;
}

// Compact region ids to 0..N-1 for stable serialization.
function compactRegionIds(regions: number[][]): number[][] {
  const remap = new Map<number, number>();
  let next = 0;
  return regions.map((row) =>
    row.map((id) => {
      if (!remap.has(id)) remap.set(id, next++);
      return remap.get(id)!;
    }),
  );
}

const MAX_ATTEMPTS = 60;

export function generatePuzzle(
  seed: string,
  difficulty: Difficulty = "medium",
): Puzzle {
  const size = SIZE_BY_DIFFICULTY[difficulty];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prng = new PRNG(`${seed}#${attempt}`);
    const queens = placeQueens(size, prng);
    if (!queens) continue;
    const regions = growRegions(size, queens, prng);
    const candidate: Puzzle = { size, regions, seed, difficulty };
    if (hasUniqueSolution(candidate)) {
      return { ...candidate, regions: compactRegionIds(candidate.regions) };
    }
    // Try to repair this Voronoi partition into uniqueness.
    const repaired = repairToUnique(candidate, queens, prng);
    if (repaired) {
      return { ...repaired, regions: compactRegionIds(repaired.regions) };
    }
  }
  throw new Error(
    `Failed to generate Queens puzzle after ${MAX_ATTEMPTS} attempts (seed=${seed}, difficulty=${difficulty})`,
  );
}
