import { memo, type PointerEvent } from "react";
import type { CellState } from "./types";
import { regionFillClass } from "./palette";

interface CellProps {
  row: number;
  col: number;
  state: CellState;
  regionId: number;
  conflict: boolean;
  attacked: boolean;
  // Region of the southern and eastern neighbors (or null at the bottom/right
  // edge). Used to decide whether the shared edge gets a thick region-divider
  // or a thin in-region line. The cell only renders right + bottom borders;
  // top and left are drawn by the previous cell or by the board wrapper.
  southRegion: number | null;
  eastRegion: number | null;
  size: number;
  onClick: (row: number, col: number) => void;
  onPointerDown: (row: number, col: number) => void;
  onPointerEnter: (row: number, col: number) => void;
  disabled: boolean;
}

const THICK = "2px solid var(--queens-border-thick)";
const THIN = "1px solid var(--queens-border-thin)";

function CellImpl({
  row,
  col,
  state,
  regionId,
  conflict,
  attacked,
  southRegion,
  eastRegion,
  size,
  onClick,
  onPointerDown,
  onPointerEnter,
  disabled,
}: CellProps) {
  const fill = regionFillClass(regionId);
  const showAutoMark = state === "empty" && attacked;

  // Each shared edge is drawn by exactly one cell — the upper/left neighbor.
  // This avoids the double-drawing that made interior gridlines look thicker
  // than they should and made region boundaries appear ~4px wide.
  const borderRight =
    eastRegion === null
      ? THICK // outer right edge of the board
      : eastRegion !== regionId
        ? THICK
        : THIN;
  const borderBottom =
    southRegion === null
      ? THICK // outer bottom edge
      : southRegion !== regionId
        ? THICK
        : THIN;

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || e.button === 0) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Some browsers throw if no capture is active — safe to ignore.
      }
    }
    onPointerDown(row, col);
  };

  const handlePointerEnter = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.buttons & 1) onPointerEnter(row, col);
  };

  return (
    <button
      type="button"
      aria-label={`Row ${row + 1}, column ${col + 1}, ${state}`}
      onClick={() => onClick(row, col)}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      disabled={disabled}
      data-region={regionId}
      className={
        "queens-cell relative flex items-center justify-center font-serif select-none transition-colors disabled:cursor-default " +
        fill
      }
      style={{
        borderRight,
        borderBottom,
        width: `min(calc(70vmin / ${size}), 56px)`,
        height: `min(calc(70vmin / ${size}), 56px)`,
        outline: conflict ? "2px solid var(--color-flexoki-red-500, #c03e35)" : "none",
        outlineOffset: "-2px",
        zIndex: conflict ? 1 : 0,
      }}
    >
      <CellGlyph state={state} autoMark={showAutoMark} />
    </button>
  );
}

function CellGlyph({
  state,
  autoMark,
}: {
  state: CellState;
  autoMark: boolean;
}) {
  if (state === "queen") {
    return (
      <span className="text-flexoki-ink dark:text-flexoki-base-50 text-2xl leading-none">
        ♛
      </span>
    );
  }
  if (state === "mark" || autoMark) {
    return (
      <span className="text-flexoki-base-800 dark:text-flexoki-base-200 text-lg leading-none font-semibold">
        ×
      </span>
    );
  }
  return null;
}

export const Cell = memo(CellImpl);
