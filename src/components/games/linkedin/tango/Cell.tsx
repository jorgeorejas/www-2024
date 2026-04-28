import { memo, type CSSProperties } from "react";
import type { CellValue, Constraint } from "./types";
import {
  EQ_GLYPH,
  MOON_GLYPH,
  MOON_TEXT_CLASS,
  NE_GLYPH,
  SUN_GLYPH,
  SUN_TEXT_CLASS,
} from "./palette";

interface CellProps {
  row: number;
  col: number;
  value: CellValue;
  locked: boolean;
  conflict: boolean;
  size: number;
  // Constraint sitting on the right edge of this cell (between (r,c) and
  // (r,c+1)). null when there's no constraint or this cell is in the last
  // column. Same shape for the bottom edge.
  rightConstraint: Constraint | null;
  bottomConstraint: Constraint | null;
  // Whether the right / bottom neighbor exists (false at the rightmost column
  // / bottom row). Used to know which edges should render outer thick borders.
  hasEastNeighbor: boolean;
  hasSouthNeighbor: boolean;
  onClick: (row: number, col: number) => void;
  disabled: boolean;
}

const THIN = "1px solid var(--tango-border-thin)";
const THICK = "2px solid var(--tango-border-thick)";

function CellImpl({
  row,
  col,
  value,
  locked,
  conflict,
  size,
  rightConstraint,
  bottomConstraint,
  hasEastNeighbor,
  hasSouthNeighbor,
  onClick,
  disabled,
}: CellProps) {
  // Each shared edge is drawn by exactly one cell (the upper-left of the pair)
  // to avoid the double-thickness that bit Queens. Top + left of the board
  // come from the wrapper.
  const borderRight = hasEastNeighbor ? THIN : THICK;
  const borderBottom = hasSouthNeighbor ? THIN : THICK;

  const label = `Row ${row + 1}, column ${col + 1}, ${value}${locked ? ", locked" : ""}`;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onClick(row, col)}
      disabled={disabled || locked}
      data-row={row}
      data-col={col}
      data-value={value}
      data-locked={locked ? "true" : "false"}
      data-constraint-right={rightConstraint ?? ""}
      data-constraint-down={bottomConstraint ?? ""}
      className={
        "tango-cell relative flex items-center justify-center font-serif select-none transition-colors disabled:cursor-default " +
        (locked
          ? "bg-flexoki-base-100 dark:bg-flexoki-base-900"
          : "bg-flexoki-paper dark:bg-flexoki-base-950 hover:bg-flexoki-base-50 dark:hover:bg-flexoki-base-900")
      }
      style={{
        borderRight,
        borderBottom,
        width: `min(calc(70vmin / ${size}), 56px)`,
        height: `min(calc(70vmin / ${size}), 56px)`,
        outline: conflict
          ? "2px solid var(--color-flexoki-red-500, #c03e35)"
          : "none",
        outlineOffset: "-2px",
        zIndex: conflict ? 1 : 0,
      }}
    >
      <CellGlyph value={value} />
      {rightConstraint && hasEastNeighbor && (
        <ConstraintBadge kind={rightConstraint} position="right" />
      )}
      {bottomConstraint && hasSouthNeighbor && (
        <ConstraintBadge kind={bottomConstraint} position="bottom" />
      )}
    </button>
  );
}

function CellGlyph({ value }: { value: CellValue }) {
  if (value === "sun") {
    return (
      <span
        className={"text-2xl leading-none " + SUN_TEXT_CLASS}
        aria-hidden="true"
      >
        {SUN_GLYPH}
      </span>
    );
  }
  if (value === "moon") {
    return (
      <span
        className={"text-2xl leading-none " + MOON_TEXT_CLASS}
        aria-hidden="true"
      >
        {MOON_GLYPH}
      </span>
    );
  }
  return null;
}

interface ConstraintBadgeProps {
  kind: Constraint;
  position: "right" | "bottom";
}

function ConstraintBadge({ kind, position }: ConstraintBadgeProps) {
  // Absolute-position the badge centered on the shared edge between this cell
  // and its neighbor. Sits above the cell border via z-index.
  const style: CSSProperties =
    position === "right"
      ? {
          top: "50%",
          right: 0,
          transform: "translate(50%, -50%)",
        }
      : {
          left: "50%",
          bottom: 0,
          transform: "translate(-50%, 50%)",
        };
  return (
    <span
      className="absolute z-10 flex items-center justify-center bg-flexoki-paper dark:bg-flexoki-base-950 text-flexoki-base-800 dark:text-flexoki-base-200 font-mono text-xs font-semibold leading-none"
      style={{
        ...style,
        width: "16px",
        height: "16px",
        borderRadius: "9999px",
        border: "1px solid var(--tango-border-thick)",
      }}
      aria-hidden="true"
    >
      {kind === "eq" ? EQ_GLYPH : NE_GLYPH}
    </span>
  );
}

export const Cell = memo(CellImpl);
