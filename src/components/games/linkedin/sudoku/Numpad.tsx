import type { CellValue } from "./types";

interface NumpadProps {
  disabled: boolean;
  onPick: (value: CellValue) => void;
  onClear: () => void;
}

const DIGITS: CellValue[] = [1, 2, 3, 4, 5, 6];

// Touch / no-keyboard fallback: a small popover with 1-6 buttons + clear,
// rendered above the board when the focused cell is double-tapped.
export function Numpad({ disabled, onPick, onClear }: NumpadProps) {
  return (
    <div
      role="dialog"
      aria-label="Pick a digit"
      className="mx-auto mt-3 mb-1 flex w-fit items-center gap-1 border border-flexoki-base-200 dark:border-flexoki-base-800 bg-flexoki-paper dark:bg-flexoki-base-950 p-1 shadow-sm"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {DIGITS.map((d) => (
        <button
          key={d}
          type="button"
          disabled={disabled}
          onClick={() => onPick(d)}
          className="font-serif text-lg w-8 h-8 hover:bg-flexoki-base-100 dark:hover:bg-flexoki-base-900 transition-colors disabled:cursor-not-allowed"
          aria-label={`Set value ${d}`}
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onClear()}
        className="text-sm w-8 h-8 hover:bg-flexoki-base-100 dark:hover:bg-flexoki-base-900 transition-colors disabled:cursor-not-allowed"
        aria-label="Clear cell"
      >
        ×
      </button>
    </div>
  );
}
