export function Rules() {
  return (
    <details className="mt-6 text-sm text-flexoki-base-700 dark:text-flexoki-base-300">
      <summary className="cursor-pointer font-serif text-flexoki-ink dark:text-flexoki-base-50">
        How to play
      </summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Place one queen (♛) in every row, every column, and every colored region.</li>
        <li>No two queens may touch each other diagonally (corner-to-corner).</li>
        <li>Click a cell to cycle: empty → × (note) → ♛ (queen) → empty.</li>
        <li>The board outlines conflicts in red as you go. Solve when no conflicts remain.</li>
      </ul>
    </details>
  );
}
