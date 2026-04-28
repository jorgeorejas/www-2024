import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useZip } from "./provider";
import { Cell } from "./Cell";
import { cellIndex } from "./engine";
import { PATH_COLOR_VAR } from "./palette";

export function Board() {
  const { active, extendPath, truncatePath } = useZip();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [centers, setCenters] = useState<Array<{ x: number; y: number }>>([]);
  const [boxSize, setBoxSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  // Measure cell centers after layout so the SVG overlay can draw the path
  // through accurate pixel positions. We also remeasure when the active
  // puzzle changes (size may differ in the future).
  useLayoutEffect(() => {
    if (!active) return;
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const buttons = grid.querySelectorAll<HTMLButtonElement>("button[data-row]");
      const rect = grid.getBoundingClientRect();
      const next: Array<{ x: number; y: number }> = [];
      buttons.forEach((btn) => {
        const r = Number(btn.dataset.row);
        const c = Number(btn.dataset.col);
        const idx = cellIndex(r, c, active.puzzle.size);
        const b = btn.getBoundingClientRect();
        next[idx] = {
          x: b.left - rect.left + b.width / 2,
          y: b.top - rect.top + b.height / 2,
        };
      });
      setCenters(next);
      setBoxSize({ w: rect.width, h: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [active]);

  const handleClick = useCallback(
    (row: number, col: number) => {
      if (!active) return;
      const idx = cellIndex(row, col, active.puzzle.size);
      const pathIdx = active.path.indexOf(idx);
      if (pathIdx === -1) {
        extendPath(idx);
        return;
      }
      // Click on a cell already in the path — truncate back to (and
      // including) it. If they clicked the tail, this is a no-op shortcut
      // for "undo last step".
      if (pathIdx === active.path.length - 1) {
        truncatePath(active.path.length - 2);
      } else {
        truncatePath(pathIdx);
      }
    },
    [active, extendPath, truncatePath],
  );

  if (!active) return null;
  const { puzzle, path, solvedAt } = active;
  const { size, labels } = puzzle;
  const disabled = solvedAt != null;

  const tail = path.length > 0 ? path[path.length - 1] : -1;
  // Precompute cell → path-index lookup so each cell render is O(1).
  const pathIndexByCell = new Map<number, number>();
  path.forEach((cell, i) => pathIndexByCell.set(cell, i));

  return (
    <div
      className="zip-board mx-auto touch-none select-none relative"
      style={{
        width: "fit-content",
        borderTop: "1px solid var(--zip-border-thick)",
        borderLeft: "1px solid var(--zip-border-thick)",
        borderRight: "1px solid var(--zip-border-thick)",
        borderBottom: "1px solid var(--zip-border-thick)",
      }}
    >
      <style>{`
        .zip-board {
          --zip-border-thick: var(--color-flexoki-base-800);
          --zip-path-color: var(--color-flexoki-cyan-500, #4385be);
        }
        :where(.dark) .zip-board {
          --zip-border-thick: var(--color-flexoki-base-200);
          --zip-path-color: var(--color-flexoki-cyan-400, #66a0c8);
        }
      `}</style>
      <div
        ref={gridRef}
        className="grid relative"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: size }).flatMap((_, r) =>
          Array.from({ length: size }).map((__, c) => {
            const idx = cellIndex(r, c, size);
            const lbl = labels[String(idx)];
            const pathIndex = pathIndexByCell.get(idx) ?? -1;
            return (
              <Cell
                key={`${r}-${c}`}
                row={r}
                col={c}
                size={size}
                label={lbl ?? null}
                pathIndex={pathIndex}
                isTail={idx === tail}
                onClick={handleClick}
                disabled={disabled}
              />
            );
          }),
        )}
        {/* Path overlay. Pointer-events: none so it never intercepts clicks. */}
        {centers.length === size * size && path.length >= 2 ? (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={boxSize.w}
            height={boxSize.h}
            viewBox={`0 0 ${boxSize.w} ${boxSize.h}`}
          >
            <polyline
              points={path
                .map((idx) => {
                  const pt = centers[idx];
                  return pt ? `${pt.x},${pt.y}` : "";
                })
                .filter(Boolean)
                .join(" ")}
              fill="none"
              stroke={PATH_COLOR_VAR}
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
          </svg>
        ) : null}
      </div>
    </div>
  );
}
