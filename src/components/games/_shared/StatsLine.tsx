import { type GameId, useGameStats } from "./history";
import { formatDuration } from "./timer";
import type { Difficulty, Mode } from "./types";

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
        Daily streak: {currentStreak} (best {longestStreak}) · {totalSolved} total
      </div>
    );
  }
  const solved = stats.random.totalSolved[difficulty];
  const best = stats.random.bestTimes[difficulty];
  if (solved === 0) return null;
  return (
    <div className="mt-1 text-xs text-flexoki-base-600 dark:text-flexoki-base-400 font-mono">
      {solved} {difficulty} {solved === 1 ? "puzzle" : "puzzles"} solved
      {best != null ? ` · best ${formatDuration(best)}` : ""}
    </div>
  );
}
