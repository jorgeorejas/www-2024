import { useCallback, useEffect, useState } from "react";
import { useSudoku } from "./provider";
import { Cell } from "./Cell";
import { Numpad } from "./Numpad";
import { BOX_COLS, BOX_ROWS, SIZE, type CellValue } from "./types";

export function Board() {
  const {
    active,
    conflicts,
    setValue,
    clearValue,
    focus,
    isLocked,
  } = useSudoku();
  const [showNumpad, setShowNumpad] = useState(false);

  const handleClick = useCallback(
    (row: number, col: number) => {
      const current = active?.focus;
      const sameCell = current && current.row === row && current.col === col;
      if (sameCell) {
        // Second click on the focused cell opens the numpad.
        setShowNumpad((s) => !s);
      } else {
        focus({ row, col });
        setShowNumpad(false);
      }
    },
    [active?.focus, focus],
  );

  // Keyboard input: 1-6 sets the focused cell; Backspace/Delete clears it.
  // Arrow keys move focus by one in the chosen direction (clamped to bounds).
  useEffect(() => {
    if (!active || !active.focus) return;
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when the user is typing in a real input/textarea.
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)
      ) {
        return;
      }
      const f = active.focus;
      if (!f) return;
      if (e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        if (!isLocked(f.row, f.col)) {
          setValue(f.row, f.col, parseInt(e.key, 10) as CellValue);
        }
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        e.preventDefault();
        if (!isLocked(f.row, f.col)) clearValue(f.row, f.col);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focus({ row: Math.max(0, f.row - 1), col: f.col });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        focus({ row: Math.min(SIZE - 1, f.row + 1), col: f.col });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focus({ row: f.row, col: Math.max(0, f.col - 1) });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focus({ row: f.row, col: Math.min(SIZE - 1, f.col + 1) });
      } else if (e.key === "Escape") {
        focus(null);
        setShowNumpad(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [active, focus, setValue, clearValue, isLocked]);

  if (!active) return null;
  const { values, focus: focusedCell, solvedAt } = active;
  const disabled = solvedAt != null;
  const focusedLocked =
    focusedCell != null && isLocked(focusedCell.row, focusedCell.col);

  return (
    <div className="flex flex-col">
      <div
        className="sudoku-board mx-auto select-none"
        style={{
          width: "fit-content",
          borderTop: "2px solid var(--sudoku-border-thick)",
          borderLeft: "2px solid var(--sudoku-border-thick)",
        }}
      >
        <style>{`
          .sudoku-board {
            --sudoku-border-thick: var(--color-flexoki-base-800);
            --sudoku-border-thin: var(--color-flexoki-base-300);
          }
          :where(.dark) .sudoku-board {
            --sudoku-border-thick: var(--color-flexoki-base-200);
            --sudoku-border-thin: var(--color-flexoki-base-700);
          }
        `}</style>
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
        >
          {values.flatMap((row, r) =>
            row.map((value, c) => {
              // A border edge is "thick" when it crosses a box boundary or sits
              // on the outer board edge.
              const thickRight =
                c === SIZE - 1 || (c + 1) % BOX_COLS === 0;
              const thickBottom =
                r === SIZE - 1 || (r + 1) % BOX_ROWS === 0;
              const focused =
                focusedCell != null &&
                focusedCell.row === r &&
                focusedCell.col === c;
              return (
                <Cell
                  key={`${r}-${c}`}
                  row={r}
                  col={c}
                  value={value}
                  locked={isLocked(r, c)}
                  focused={focused}
                  conflict={conflicts.has(`${r},${c}`)}
                  thickRight={thickRight}
                  thickBottom={thickBottom}
                  onClick={handleClick}
                  disabled={disabled}
                />
              );
            }),
          )}
        </div>
      </div>
      {showNumpad && focusedCell && (
        <Numpad
          disabled={disabled || focusedLocked}
          onPick={(v) => {
            if (!focusedLocked && !disabled) {
              setValue(focusedCell.row, focusedCell.col, v);
            }
            setShowNumpad(false);
          }}
          onClear={() => {
            if (!focusedLocked && !disabled) {
              clearValue(focusedCell.row, focusedCell.col);
            }
            setShowNumpad(false);
          }}
        />
      )}
    </div>
  );
}
