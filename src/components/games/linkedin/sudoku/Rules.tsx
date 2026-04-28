export function Rules() {
  return (
    <details className="mt-6 text-sm text-flexoki-base-700 dark:text-flexoki-base-300">
      <summary className="cursor-pointer font-serif text-flexoki-ink dark:text-flexoki-base-50">
        How to play
      </summary>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Fill the 6×6 grid so every row, column, and 2×3 box contains 1–6 exactly once.</li>
        <li>Click a cell to focus it, then press a number key 1–6 to fill it. Backspace or Delete clears the cell.</li>
        <li>On touch devices, tap the focused cell again to open a numpad.</li>
        <li>Pre-filled cells are locked. Conflicting cells are outlined in red.</li>
        <li>Use arrow keys to move focus between cells; press Hint to reveal one cell.</li>
      </ul>
    </details>
  );
}
