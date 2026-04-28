// Smoke test for the Zip generator. Run with: npx tsx scripts/test-zip-generator.mjs
// Generates many puzzles per difficulty and asserts each has exactly one solution.

import { generatePuzzle } from "../src/components/games/linkedin/zip/generator.ts";
import { solveHamiltonian, labelSequence } from "../src/components/games/linkedin/zip/engine.ts";

const counts = { easy: 0, medium: 0, hard: 0 };
const failures = [];
const N = 30;

const start = Date.now();
for (const difficulty of ["easy", "medium", "hard"]) {
  for (let i = 0; i < N; i++) {
    const seed = `smoke-${difficulty}-${i}`;
    try {
      const puzzle = generatePuzzle(seed, difficulty);
      const solutions = solveHamiltonian(puzzle, { limit: 2, maxSteps: 5_000_000 });
      if (solutions.length !== 1) {
        failures.push({ seed, difficulty, solutionCount: solutions.length });
      } else {
        counts[difficulty]++;
      }
    } catch (e) {
      failures.push({ seed, difficulty, error: e.message });
    }
  }
}
const elapsed = ((Date.now() - start) / 1000).toFixed(2);

console.log(`generated ${counts.easy + counts.medium + counts.hard}/${3 * N} puzzles in ${elapsed}s`);
console.log("by difficulty:", counts);
if (failures.length) {
  console.error("FAILURES:", failures.slice(0, 5));
  process.exit(1);
}

// Print one sample for visual sanity check.
const sample = generatePuzzle("sample-1", "medium");
console.log(`\nsample medium puzzle (size=${sample.size}, seed=${sample.seed}):`);
const labels = sample.labels;
const SIZE = sample.size;
for (let r = 0; r < SIZE; r++) {
  const cells = [];
  for (let c = 0; c < SIZE; c++) {
    const idx = r * SIZE + c;
    const lbl = labels[String(idx)];
    cells.push(lbl ? String(lbl).padStart(2, " ") : " .");
  }
  console.log(cells.join(" "));
}
const [solution] = solveHamiltonian(sample, { limit: 1 });
console.log("solution length:", solution?.length, "label seq:", labelSequence(sample));
