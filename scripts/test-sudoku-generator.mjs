// Smoke test for the Mini Sudoku generator. Run with: npx tsx scripts/test-sudoku-generator.mjs
// Generates many puzzles per difficulty and asserts each has exactly one solution.

import { generatePuzzle } from "../src/components/games/linkedin/sudoku/generator.ts";
import { solve } from "../src/components/games/linkedin/sudoku/engine.ts";

const counts = { easy: 0, medium: 0, hard: 0 };
const clueCounts = { easy: [], medium: [], hard: [] };
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
        continue;
      }
      // Sanity-check that the puzzle's stored solution matches the solver.
      const solved = solutions[0];
      const matches = solved.every((row, r) =>
        row.every((v, c) => v === puzzle.solution[r][c]),
      );
      if (!matches) {
        failures.push({ seed, difficulty, error: "solution mismatch" });
        continue;
      }
      const clues = puzzle.givens.flat().filter((v) => v !== 0).length;
      clueCounts[difficulty].push(clues);
      counts[difficulty]++;
    } catch (e) {
      failures.push({ seed, difficulty, error: e.message });
    }
  }
}
const elapsed = ((Date.now() - start) / 1000).toFixed(2);

console.log(
  `generated ${counts.easy + counts.medium + counts.hard}/${3 * N} puzzles in ${elapsed}s`,
);
console.log("by difficulty:", counts);
for (const d of ["easy", "medium", "hard"]) {
  if (clueCounts[d].length === 0) continue;
  const avg = (
    clueCounts[d].reduce((a, b) => a + b, 0) / clueCounts[d].length
  ).toFixed(1);
  const min = Math.min(...clueCounts[d]);
  const max = Math.max(...clueCounts[d]);
  console.log(`  ${d}: avg ${avg} clues (min ${min}, max ${max})`);
}
if (failures.length) {
  console.error("FAILURES:", failures.slice(0, 5));
  process.exit(1);
}

const sample = generatePuzzle("sample-1", "medium");
console.log(`\nsample medium puzzle (seed=${sample.seed}):`);
for (const row of sample.givens) {
  console.log(row.map((v) => (v === 0 ? "." : v.toString())).join(" "));
}
console.log("\nsolution:");
for (const row of sample.solution) {
  console.log(row.join(" "));
}
