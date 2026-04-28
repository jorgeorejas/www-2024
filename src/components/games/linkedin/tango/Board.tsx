import { useCallback } from "react";
import { useTango } from "./provider";
import { Cell } from "./Cell";
import { SIZE } from "./engine";

export function Board() {
  const { active, conflicts, cycleCell } = useTango();

  const handleClick = useCallback(
    (row: number, col: number) => cycleCell(row, col),
    [cycleCell],
  );

  if (!active) return null;
  const { puzzle, cells, solvedAt } = active;
  const { hConstraints, vConstraints, clues } = puzzle;
  const disabled = solvedAt != null;

  return (
    <div
      className="tango-board mx-auto touch-none select-none"
      style={{
        width: "fit-content",
        borderTop: "2px solid var(--tango-border-thick)",
        borderLeft: "2px solid var(--tango-border-thick)",
      }}
    >
      <style>{`
        .tango-board {
          --tango-border-thick: var(--color-flexoki-base-800);
          --tango-border-thin: var(--color-flexoki-base-300);
        }
        :where(.dark) .tango-board {
          --tango-border-thick: var(--color-flexoki-base-200);
          --tango-border-thin: var(--color-flexoki-base-700);
        }
      `}</style>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
        }}
      >
        {cells.flatMap((row, r) =>
          row.map((value, c) => (
            <Cell
              key={`${r}-${c}`}
              row={r}
              col={c}
              value={value}
              locked={clues[r][c] !== "empty"}
              conflict={conflicts.has(`${r},${c}`)}
              size={SIZE}
              rightConstraint={c < SIZE - 1 ? hConstraints[r][c] : null}
              bottomConstraint={r < SIZE - 1 ? vConstraints[r][c] : null}
              hasEastNeighbor={c < SIZE - 1}
              hasSouthNeighbor={r < SIZE - 1}
              onClick={handleClick}
              disabled={disabled}
            />
          )),
        )}
      </div>
    </div>
  );
}
