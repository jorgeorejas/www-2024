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
    >
      {mode === "daily" ? "Reto de hoy resuelto" : "Tablero resuelto"} en{" "}
      <span className="font-mono">{formatDuration(elapsed)}</span> ·{" "}
      {active.moveCount} {active.moveCount === 1 ? "movimiento" : "movimientos"}.
      <StatsLine gameId="tango" mode={mode} difficulty={active.puzzle.difficulty} />
    </div>
  );
}
