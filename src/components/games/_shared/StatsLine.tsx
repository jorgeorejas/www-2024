import { type GameId, useGameStats } from "./history";
import { formatDuration } from "./timer";
import { DIFFICULTY_LABEL, type Difficulty, type Mode } from "./types";

interface StatsLineProps {
  gameId: GameId;
  mode: Mode;
  difficulty: Difficulty;
}

export function StatsLine({ gameId, mode, difficulty }: StatsLineProps) {
  const stats = useGameStats(gameId);
  if (mode === "daily") {
    const { currentStreak, longestStreak, totalSolved } = stats.daily;
    if (totalSolved === 0) return null;
    return (
      <div className="mt-1 text-xs text-flexoki-base-600 dark:text-flexoki-base-400 font-mono">
        Racha diaria: {currentStreak} (récord: {longestStreak}) · {totalSolved} en total
      </div>
    );
  }
  const solved = stats.random.totalSolved[difficulty];
  const best = stats.random.bestTimes[difficulty];
  if (solved === 0) return null;
  return (
    <div className="mt-1 text-xs text-flexoki-base-600 dark:text-flexoki-base-400 font-mono">
      {solved} {solved === 1 ? "resuelto" : "resueltos"} en {DIFFICULTY_LABEL[difficulty].toLowerCase()}
      {best != null ? ` · récord: ${formatDuration(best)}` : ""}
    </div>
  );
}
