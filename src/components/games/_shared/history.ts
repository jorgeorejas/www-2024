import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { todayKey } from "./seed";
import { type Difficulty, DifficultyZ, type Mode } from "./types";

export const GAME_IDS = ["queens", "tango", "zip", "sudoku"] as const;
export const GameIdZ = z.enum(GAME_IDS);
export type GameId = z.infer<typeof GameIdZ>;

const SolveRecordZ = z.object({
  elapsedSec: z.number().int().nonnegative(),
  moves: z.number().int().nonnegative(),
});
export type SolveRecord = z.infer<typeof SolveRecordZ>;

const PerDifficultyNumZ = z.record(DifficultyZ, z.number().int().nonnegative());
const PerDifficultyOptZ = z.record(DifficultyZ, z.number().int().nullable());

const DailyStatsZ = z.object({
  lastDate: z.string().nullable(),
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  totalSolved: z.number().int().nonnegative(),
  completed: z.record(z.string(), SolveRecordZ),
});

const RandomStatsZ = z.object({
  totalSolved: PerDifficultyNumZ,
  bestTimes: PerDifficultyOptZ,
});

const GameStatsZ = z.object({
  daily: DailyStatsZ,
  random: RandomStatsZ,
});
export type GameStats = z.infer<typeof GameStatsZ>;

const HistoryZ = z.object({
  schemaVersion: z.literal(1),
  games: z.record(GameIdZ, GameStatsZ),
});
export type History = z.infer<typeof HistoryZ>;

const HISTORY_KEY = "linkedin-games:history:v1";
const STORAGE_EVENT = "linkedin-games:history:changed";

function emptyGameStats(): GameStats {
  return {
    daily: {
      lastDate: null,
      currentStreak: 0,
      longestStreak: 0,
      totalSolved: 0,
      completed: {},
    },
    random: {
      totalSolved: { easy: 0, medium: 0, hard: 0 },
      bestTimes: { easy: null, medium: null, hard: null },
    },
  };
}

function emptyHistory(): History {
  const games = {} as Record<GameId, GameStats>;
  for (const id of GAME_IDS) games[id] = emptyGameStats();
  return { schemaVersion: 1, games };
}

export function loadHistory(): History {
  if (typeof window === "undefined") return emptyHistory();
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return emptyHistory();
    const parsed = HistoryZ.safeParse(JSON.parse(raw));
    if (!parsed.success) return emptyHistory();
    // Backfill games added in newer versions of the app.
    const games = { ...parsed.data.games };
    for (const id of GAME_IDS) games[id] ||= emptyGameStats();
    return { schemaVersion: 1, games };
  } catch {
    return emptyHistory();
  }
}

function saveHistory(history: History): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
  } catch {
    // Quota / serialization failure — silently ignore.
  }
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const aMs = Date.UTC(ay, am - 1, ad);
  const bMs = Date.UTC(by, bm - 1, bd);
  return Math.round((bMs - aMs) / 86400000);
}

export interface SolveInput {
  gameId: GameId;
  mode: Mode;
  difficulty: Difficulty;
  elapsedSec: number;
  moves: number;
}

export function recordSolve(input: SolveInput): History {
  const history = loadHistory();
  const stats = history.games[input.gameId];
  const today = todayKey();

  if (input.mode === "daily") {
    if (stats.daily.completed[today]) return history; // already recorded
    const last = stats.daily.lastDate;
    let streak = 1;
    if (last) {
      const gap = daysBetween(last, today);
      if (gap === 0) streak = stats.daily.currentStreak; // same day, shouldn't happen
      else if (gap === 1) streak = stats.daily.currentStreak + 1;
    }
    stats.daily = {
      lastDate: today,
      currentStreak: streak,
      longestStreak: Math.max(stats.daily.longestStreak, streak),
      totalSolved: stats.daily.totalSolved + 1,
      completed: { ...stats.daily.completed, [today]: { elapsedSec: input.elapsedSec, moves: input.moves } },
    };
  } else {
    const prevBest = stats.random.bestTimes[input.difficulty];
    stats.random = {
      totalSolved: {
        ...stats.random.totalSolved,
        [input.difficulty]: stats.random.totalSolved[input.difficulty] + 1,
      },
      bestTimes: {
        ...stats.random.bestTimes,
        [input.difficulty]:
          prevBest == null ? input.elapsedSec : Math.min(prevBest, input.elapsedSec),
      },
    };
  }

  saveHistory(history);
  return history;
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
  } catch {
    // ignore
  }
}

// Subscribe to history changes (own writes + cross-tab via storage events).
export function useHistory(): History {
  const [history, setHistory] = useState<History>(() => loadHistory());
  useEffect(() => {
    const refresh = () => setHistory(loadHistory());
    window.addEventListener(STORAGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(STORAGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return history;
}

export function useGameStats(gameId: GameId): GameStats {
  return useHistory().games[gameId];
}

interface RecordSolveSource {
  solvedAt: number | null;
  startedAt: number;
  moveCount: number;
  mode: Mode;
  puzzle: { difficulty: Difficulty };
}

// Records a solve once per game-state win transition. Idempotent within a
// single mounted session — calling Clear / New puzzle resets the dedupe.
export function useRecordSolveOnWin(
  gameId: GameId,
  source: RecordSolveSource | null,
): void {
  const recorded = useRef(false);
  useEffect(() => {
    if (!source) {
      recorded.current = false;
      return;
    }
    if (source.solvedAt == null) {
      recorded.current = false;
      return;
    }
    if (recorded.current) return;
    recorded.current = true;
    const elapsedSec = Math.max(
      0,
      Math.floor((source.solvedAt - source.startedAt) / 1000),
    );
    recordSolve({
      gameId,
      mode: source.mode,
      difficulty: source.puzzle.difficulty,
      elapsedSec,
      moves: source.moveCount,
    });
  }, [gameId, source]);
}

