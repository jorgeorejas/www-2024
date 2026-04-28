export function Rules() {
  return (
    <details className="mt-6 text-sm text-flexoki-base-700 dark:text-flexoki-base-300">
      <summary className="cursor-pointer font-serif text-flexoki-ink dark:text-flexoki-base-50">
        How to play
      </summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Draw a single continuous path that visits every cell on the 6×6 grid exactly once.</li>
        <li>Pass through the numbered cells in order: 1, then 2, then 3, and so on.</li>
        <li>Move only up, down, left, or right between adjacent cells — no diagonals.</li>
        <li>Click the cell labeled 1 to start, then click an orthogonal neighbor of the path tail to extend.</li>
        <li>Click the tail again to undo the last step, or click any earlier cell to rewind back to it.</li>
      </ul>
    </details>
  );
}
