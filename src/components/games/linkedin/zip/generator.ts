import { PRNG } from "../../_shared/rng";
import type { Difficulty } from "../../_shared/types";
import { hasUniqueSolution, neighbors } from "./engine";
import type { Puzzle } from "./types";
import { GRID_SIZE, TOTAL_CELLS } from "./types";

const LABEL_COUNT_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 10,
  medium: 8,
  hard: 6,
};

const MAX_ATTEMPTS = 60;

// Generate a random Hamiltonian path on a 6×6 grid using Warnsdorff's
// heuristic: at each step pick the unvisited neighbor with the fewest
// onward unvisited neighbors. Ties broken randomly via the PRNG.
function generateHamiltonianPath(prng: PRNG): number[] | null {
  const total = TOTAL_CELLS;
  const path: number[] = [];
  const visited = new Array<boolean>(total).fill(false);

  // Random start cell.
  const start = prng.randInt(total);
  path.push(start);
  visited[start] = true;

  // Precompute neighbor lists.
  const nbrs: number[][] = new Array(total);
  for (let i = 0; i < total; i++) nbrs[i] = neighbors(i, GRID_SIZE);

  function countOnward(cell: number): number {
    let n = 0;
    for (const nb of nbrs[cell]) if (!visited[nb]) n++;
    return n;
  }

  while (path.length < total) {
    const cur = path[path.length - 1];
    const candidates = nbrs[cur].filter((n) => !visited[n]);
    if (candidates.length === 0) return null;
    // Score each candidate by onward count (lower is better).
    let bestScore = Infinity;
    for (const c of candidates) {
      visited[c] = true;
      const score = countOnward(c);
      visited[c] = false;
      if (score < bestScore) bestScore = score;
    }
    const best = candidates.filter((c) => {
      visited[c] = true;
      const score = countOnward(c);
      visited[c] = false;
      return score === bestScore;
    });
    const pick = prng.pick(best);
    path.push(pick);
    visited[pick] = true;
  }
  return path;
}

// Place K labels at evenly-spaced positions along the path. The first label
// (1) is always at path[0], and the last label (K) is at path[total-1].
function evenlySpacedLabelIndices(pathLen: number, k: number): number[] {
  if (k <= 1) return [0];
  if (k >= pathLen) {
    return Array.from({ length: pathLen }, (_, i) => i);
  }
  const indices: number[] = [];
  for (let i = 0; i < k; i++) {
    const t = i / (k - 1);
    const idx = Math.round(t * (pathLen - 1));
    indices.push(idx);
  }
  // Dedup (rare for our sizes) while preserving order.
  return Array.from(new Set(indices));
}

function buildPuzzleFromLabels(
  path: number[],
  labelPathIndices: number[],
  seed: string,
  difficulty: Difficulty,
): Puzzle {
  const labels: Record<string, number> = {};
  labelPathIndices.forEach((pIdx, i) => {
    const cell = path[pIdx];
    labels[String(cell)] = i + 1;
  });
  return {
    size: GRID_SIZE,
    labels,
    seed,
    difficulty,
  };
}

// Pick a path index that isn't already labeled and is "in the middle" of an
// unlabeled gap. We collect the midpoints of every largest-gap segment, and
// the caller picks one randomly via the PRNG. If no gap > 1 exists, we fall
// back to any unlabeled index.
function nextLabelCandidates(
  pathLen: number,
  existingLabelIndices: number[],
): number[] {
  if (existingLabelIndices.length >= pathLen) return [];
  const sorted = [...existingLabelIndices].sort((a, b) => a - b);
  let bestGap = -1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i];
    if (gap > bestGap) bestGap = gap;
  }
  const out: number[] = [];
  if (bestGap > 1) {
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const gap = sorted[i + 1] - a;
      if (gap === bestGap) out.push(a + Math.floor(gap / 2));
    }
  }
  if (out.length > 0) return out;
  // Fallback: every unlabeled index.
  const taken = new Set(sorted);
  for (let i = 0; i < pathLen; i++) {
    if (!taken.has(i)) out.push(i);
  }
  return out;
}

export function generatePuzzle(
  seed: string,
  difficulty: Difficulty = "medium",
): Puzzle {
  const k0 = LABEL_COUNT_BY_DIFFICULTY[difficulty];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const prng = new PRNG(`${seed}#${attempt}`);
    const path = generateHamiltonianPath(prng);
    if (!path) continue;

    const labelIndices = evenlySpacedLabelIndices(path.length, k0);

    // Try uniqueness; if not unique, keep adding labels. The cap below
    // determines when we give up on this particular path and move on.
    // Adding labels monotonically reduces solutions, so a fully labeled
    // path is trivially unique — but a puzzle with 30+ labels stops being
    // interesting, so we bound this and let the outer attempt loop try a
    // different path.
    const maxLabels = Math.min(path.length, k0 + 12);
    while (labelIndices.length <= maxLabels) {
      const candidate = buildPuzzleFromLabels(
        path,
        labelIndices,
        seed,
        difficulty,
      );
      if (hasUniqueSolution(candidate, { maxSteps: 2_000_000 })) {
        return candidate;
      }
      const candidates = nextLabelCandidates(path.length, labelIndices);
      if (candidates.length === 0) break;
      const nextIdx = prng.pick(candidates);
      labelIndices.push(nextIdx);
      labelIndices.sort((a, b) => a - b);
    }
  }
  throw new Error(
    `Failed to generate Zip puzzle after ${MAX_ATTEMPTS} attempts (seed=${seed}, difficulty=${difficulty})`,
  );
}
