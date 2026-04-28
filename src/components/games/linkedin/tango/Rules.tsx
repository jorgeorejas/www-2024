export function Rules() {
  return (
    <details className="mt-6 text-sm text-flexoki-base-700 dark:text-flexoki-base-300">
      <summary className="cursor-pointer font-serif text-flexoki-ink dark:text-flexoki-base-50">
        How to play
      </summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Fill every cell with a sun (☀️) or a moon (🌑).</li>
        <li>Each row and column must hold exactly three suns and three moons.</li>
        <li>No three identical symbols may sit next to each other in any row or column.</li>
        <li>
          A <span className="font-mono">=</span> between two cells means they must match;
          a <span className="font-mono">×</span> means they must differ.
        </li>
        <li>Click a cell to cycle: empty → sun → moon → empty. Locked clue cells can't change.</li>
        <li>The board outlines conflicts in red as you go.</li>
      </ul>
    </details>
  );
}
