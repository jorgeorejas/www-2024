// Smoke test for the Queens generator. Run with: node scripts/test-queens-generator.mjs
// Generates many puzzles per difficulty and asserts each has exactly one solution.

import { generatePuzzle } from "../src/components/games/linkedin/queens/generator.ts";
import { solve } from "../src/components/games/linkedin/queens/engine.ts";

const counts = { easy: 0, medium: 0, hard: 0 };
const failures = [];
const N = 30;

const start = Date.now();
for (const difficulty of ["easy", "medium", "hard"]) {
  for (let i = 0; i < N; i++) {
    const seed = `smoke-${difficulty}-${i}`;
    try {
      const puzzle = generatePuzzle(seed, difficulty);
      const solutions = solve(puzzle, 3);
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
for (const row of sample.regions) {
  console.log(row.map((id) => id.toString(16)).join(" "));
}
const [solution] = solve(sample, 1);
console.log("solution (col per row):", solution);
