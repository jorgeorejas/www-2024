import { memo } from "react";
import { LABEL_PILL_CLASS } from "./palette";

interface CellProps {
  row: number;
  col: number;
  size: number;
  label: number | null;
  // Position of this cell in the current path (0-indexed), or -1 if not on path.
  pathIndex: number;
  // True if this cell is the current path tail (clicking it truncates by one).
  isTail: boolean;
  onClick: (row: number, col: number) => void;
  disabled: boolean;
}

const THICK = "1px solid var(--zip-border-thick)";

function CellImpl({
  row,
  col,
  size,
  label,
  pathIndex,
  isTail,
  onClick,
  disabled,
}: CellProps) {
  const inPath = pathIndex >= 0;
  // Each cell renders right + bottom borders only. The board wrapper draws
  // top + left so shared edges aren't double-drawn.
  const isRightEdge = col === size - 1;
  const isBottomEdge = row === size - 1;
  const labelText = label != null ? `, label ${label}` : "";
  const pathText = pathIndex >= 0 ? `, path step ${pathIndex + 1}` : "";

  return (
    <button
      type="button"
      data-row={row}
      data-col={col}
      data-label={label ?? ""}
      data-path-index={pathIndex}
      aria-label={`Row ${row + 1}, column ${col + 1}${labelText}${pathText}`}
      onClick={() => onClick(row, col)}
      disabled={disabled}
      className={
        "zip-cell relative flex items-center justify-center font-serif select-none transition-colors disabled:cursor-default " +
        (inPath
          ? "bg-flexoki-base-100 dark:bg-flexoki-base-900"
          : "bg-flexoki-paper dark:bg-flexoki-base-950 hover:bg-flexoki-base-50 dark:hover:bg-flexoki-base-900")
      }
      style={{
        borderRight: isRightEdge ? "none" : THICK,
        borderBottom: isBottomEdge ? "none" : THICK,
        width: `min(calc(72vmin / ${size}), 64px)`,
        height: `min(calc(72vmin / ${size}), 64px)`,
        outline: isTail ? "2px solid var(--zip-path-color)" : "none",
        outlineOffset: "-2px",
        zIndex: isTail ? 2 : 0,
      }}
    >
      {label != null ? (
        <span
          className={
            "relative flex items-center justify-center text-base font-semibold leading-none rounded-full w-7 h-7 z-10 " +
            LABEL_PILL_CLASS
          }
        >
          {label}
        </span>
      ) : null}
    </button>
  );
}

export const Cell = memo(CellImpl);
