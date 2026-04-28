import { memo } from "react";
import {
  CONFLICT_OUTLINE,
  EMPTY_BG_CLASS,
  FOCUS_OUTLINE,
  LOCKED_BG_CLASS,
  LOCKED_TEXT_CLASS,
  PLAYER_TEXT_CLASS,
} from "./palette";
import type { CellValue } from "./types";

interface CellProps {
  row: number;
  col: number;
  value: CellValue;
  locked: boolean;
  focused: boolean;
  conflict: boolean;
  // True if the cell to the south or east lives in a different box. The cell
  // only renders right + bottom borders; the wrapper draws top + left so each
  // shared edge is owned by exactly one party (avoids double-thickness).
  thickRight: boolean;
  thickBottom: boolean;
  onClick: (row: number, col: number) => void;
  disabled: boolean;
}

const THICK = "2px solid var(--sudoku-border-thick)";
const THIN = "1px solid var(--sudoku-border-thin)";

function CellImpl({
  row,
  col,
  value,
  locked,
  focused,
  conflict,
  thickRight,
  thickBottom,
  onClick,
  disabled,
}: CellProps) {
  return (
    <button
      type="button"
      aria-label={`Row ${row + 1}, column ${col + 1}${
        value ? `, value ${value}` : ", empty"
      }${locked ? ", locked" : ""}`}
      data-row={row}
      data-col={col}
      data-locked={locked ? "true" : "false"}
      data-value={value}
      onClick={() => onClick(row, col)}
      disabled={disabled}
      className={
        "sudoku-cell relative flex items-center justify-center font-serif text-2xl select-none transition-colors disabled:cursor-default " +
        (locked ? LOCKED_BG_CLASS : EMPTY_BG_CLASS) +
        " " +
        (locked ? LOCKED_TEXT_CLASS : PLAYER_TEXT_CLASS)
      }
      style={{
        borderRight: thickRight ? THICK : THIN,
        borderBottom: thickBottom ? THICK : THIN,
        width: "min(calc(72vmin / 6), 56px)",
        height: "min(calc(72vmin / 6), 56px)",
        outline: conflict
          ? `2px solid ${CONFLICT_OUTLINE}`
          : focused
            ? `2px solid ${FOCUS_OUTLINE}`
            : "none",
        outlineOffset: "-2px",
        zIndex: conflict || focused ? 1 : 0,
      }}
    >
      {value ? value : ""}
    </button>
  );
}

export const Cell = memo(CellImpl);
