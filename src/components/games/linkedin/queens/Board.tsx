import { useCallback, useEffect, useRef } from "react";
import { useQueens } from "./provider";
import { Cell } from "./Cell";

export function Board() {
  const { active, conflicts, attacked, cycleCell, markX } = useQueens();
  const sweepRef = useRef<{ active: boolean; lastKey: string | null; swept: boolean }>(
    { active: false, lastKey: null, swept: false },
  );

  const beginGesture = useCallback((row: number, col: number) => {
    sweepRef.current = { active: true, lastKey: `${row},${col}`, swept: false };
  }, []);

  const enterCell = useCallback(
    (row: number, col: number) => {
      const key = `${row},${col}`;
      const s = sweepRef.current;
      if (!s.active || s.lastKey === key) return;
      if (!s.swept && s.lastKey) {
        const [sr, sc] = s.lastKey.split(",").map(Number);
        markX(sr, sc);
      }
      s.swept = true;
      s.lastKey = key;
      markX(row, col);
    },
    [markX],
  );

  const handleClick = useCallback(
    (row: number, col: number) => {
      const s = sweepRef.current;
      if (s.swept) return;
      cycleCell(row, col);
    },
    [cycleCell],
  );

  useEffect(() => {
    const end = () => {
      const wasSwept = sweepRef.current.swept;
      sweepRef.current.active = false;
      if (wasSwept) {
        setTimeout(() => {
          sweepRef.current.swept = false;
          sweepRef.current.lastKey = null;
        }, 0);
      } else {
        sweepRef.current.lastKey = null;
      }
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  if (!active) return null;
  const { puzzle, cells, solvedAt } = active;
  const { size, regions } = puzzle;
  const disabled = solvedAt != null;

  // Outer board border: the cells only draw right + bottom edges, so the
  // wrapper supplies the top + left outer borders. This guarantees every
  // shared edge is drawn by exactly one party.
  return (
    <div
      className="queens-board mx-auto touch-none select-none"
      style={{
        width: "fit-content",
        borderTop: "2px solid var(--queens-border-thick)",
        borderLeft: "2px solid var(--queens-border-thick)",
      }}
    >
      <style>{`
        .queens-board {
          --queens-border-thick: var(--color-flexoki-base-800);
          --queens-border-thin: var(--color-flexoki-base-300);
        }
        :where(.dark) .queens-board {
          --queens-border-thick: var(--color-flexoki-base-200);
          --queens-border-thin: var(--color-flexoki-base-700);
        }
      `}</style>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {cells.flatMap((row, r) =>
          row.map((state, c) => {
            const regionId = regions[r][c];
            return (
              <Cell
                key={`${r}-${c}`}
                row={r}
                col={c}
                state={state}
                regionId={regionId}
                size={size}
                conflict={conflicts.has(`${r},${c}`)}
                attacked={attacked.has(`${r},${c}`)}
                southRegion={r < size - 1 ? regions[r + 1][c] : null}
                eastRegion={c < size - 1 ? regions[r][c + 1] : null}
                onClick={handleClick}
                onPointerDown={beginGesture}
                onPointerEnter={enterCell}
                disabled={disabled}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
