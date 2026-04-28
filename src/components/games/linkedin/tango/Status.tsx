import { useTango } from "./provider";
import { formatDuration } from "../../_shared/timer";
import { StatsLine } from "../../_shared/StatsLine";

export function Status() {
  const { active, mode } = useTango();
  if (!active) return null;
  if (active.solvedAt == null) return null;
  const elapsed = Math.floor((active.solvedAt - active.startedAt) / 1000);
  return (
    <div
      className="mt-4 text-center text-sm font-serif text-flexoki-ink dark:text-flexoki-base-50"
      data-testid="tango-status"
    >
      Solved {mode === "daily" ? "today's puzzle" : "this puzzle"} in{" "}
      <span className="font-mono">{formatDuration(elapsed)}</span> ·{" "}
      {active.moveCount} moves.
      <StatsLine gameId="tango" mode={mode} difficulty={active.puzzle.difficulty} />
    </div>
  );
}
