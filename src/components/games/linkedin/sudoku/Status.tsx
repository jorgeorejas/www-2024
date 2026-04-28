import { useSudoku } from "./provider";
import { formatDuration } from "../../_shared/timer";

export function Status() {
  const { active, mode } = useSudoku();
  if (!active) return null;
  if (active.solvedAt == null) return null;
  const elapsed = Math.floor((active.solvedAt - active.startedAt) / 1000);
  return (
    <div className="mt-4 text-center text-sm font-serif text-flexoki-ink dark:text-flexoki-base-50">
      Solved {mode === "daily" ? "today's puzzle" : "this puzzle"} in{" "}
      <span className="font-mono">{formatDuration(elapsed)}</span> ·{" "}
      {active.moveCount} moves.
    </div>
  );
}
