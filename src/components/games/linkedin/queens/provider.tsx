import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { createStorage } from "../../_shared/storage";
import { dailySeed, randomSeed, todayKey } from "../../_shared/seed";
import { debounce } from "../../_shared/debounce";
import type { Difficulty, Mode } from "../../_shared/types";
import { generatePuzzle } from "./generator";
import {
  emptyCells,
  findConflicts,
  isSolved,
  nextCellState,
  solve,
} from "./engine";
import {
  type CellState,
  type GameState,
  type SaveBlob,
  SaveBlobZ,
} from "./types";

const STORAGE_KEY = "linkedin-games:queens";
const STORAGE_VERSION = 1;
const DEFAULT_DIFFICULTY: Difficulty = "medium";

const storage = createStorage<SaveBlob>(STORAGE_KEY, STORAGE_VERSION, SaveBlobZ);

function newGameState(mode: Mode, difficulty: Difficulty): GameState {
  const seed = mode === "daily" ? dailySeed("queens") : randomSeed();
  const puzzle = generatePuzzle(seed, difficulty);
  return {
    puzzle,
    mode,
    cells: emptyCells(puzzle.size),
    startedAt: Date.now(),
    solvedAt: null,
    moveCount: 0,
  };
}

interface ReducerState {
  daily: GameState | null;
  random: GameState | null;
  mode: Mode;
  difficulty: Difficulty;
  hydrated: boolean;
}

type Action =
  | { type: "HYDRATE"; payload: ReducerState }
  | { type: "CYCLE_CELL"; row: number; col: number }
  | { type: "MARK_X"; row: number; col: number }
  | { type: "HINT" }
  | { type: "CLEAR" }
  | { type: "NEW_RANDOM"; difficulty?: Difficulty }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_DIFFICULTY"; difficulty: Difficulty }
  | { type: "REFRESH_DAILY" };

function withCellChange(
  state: GameState,
  row: number,
  col: number,
  cell: CellState,
): GameState {
  const cells = state.cells.map((rowCells, r) =>
    r === row
      ? rowCells.map((c, ci) => (ci === col ? cell : c))
      : rowCells,
  );
  const next: GameState = {
    ...state,
    cells,
    moveCount: state.moveCount + 1,
  };
  if (isSolved(next) && next.solvedAt == null) {
    next.solvedAt = Date.now();
  } else if (next.solvedAt != null && !isSolved(next)) {
    next.solvedAt = null;
  }
  return next;
}

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;
    case "CYCLE_CELL": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      const current = active.cells[action.row][action.col];
      const next = withCellChange(
        active,
        action.row,
        action.col,
        nextCellState(current),
      );
      return { ...state, [state.mode]: next };
    }
    case "MARK_X": {
      // Sweep: only affect empty cells, leave queens and existing × alone.
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      if (active.cells[action.row][action.col] !== "empty") return state;
      const next = withCellChange(active, action.row, action.col, "mark");
      return { ...state, [state.mode]: next };
    }
    case "HINT": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      const [solution] = solve(active.puzzle, 1);
      if (!solution) return state;
      // Reveal one correct queen position the player hasn't placed yet.
      // Prefer rows where the player put nothing or marked × in the wrong
      // place over rows where they already have a queen at the right column.
      const candidates: number[] = [];
      for (let r = 0; r < solution.length; r++) {
        if (active.cells[r][solution[r]] !== "queen") candidates.push(r);
      }
      if (candidates.length === 0) return state;
      const targetRow = candidates[0];
      const targetCol = solution[targetRow];
      const next = withCellChange(active, targetRow, targetCol, "queen");
      return { ...state, [state.mode]: next };
    }
    case "CLEAR": {
      const active = state[state.mode];
      if (!active) return state;
      return {
        ...state,
        [state.mode]: {
          ...active,
          cells: emptyCells(active.puzzle.size),
          solvedAt: null,
          moveCount: 0,
          startedAt: Date.now(),
        },
      };
    }
    case "NEW_RANDOM": {
      const difficulty = action.difficulty ?? state.difficulty;
      return {
        ...state,
        difficulty,
        mode: "random",
        random: newGameState("random", difficulty),
      };
    }
    case "SET_MODE":
      return { ...state, mode: action.mode };
    case "SET_DIFFICULTY":
      return {
        ...state,
        difficulty: action.difficulty,
        random: newGameState("random", action.difficulty),
      };
    case "REFRESH_DAILY":
      return {
        ...state,
        daily: newGameState("daily", state.difficulty),
      };
    default:
      return state;
  }
}

interface QueensContextValue {
  active: GameState | null;
  daily: GameState | null;
  random: GameState | null;
  mode: Mode;
  difficulty: Difficulty;
  conflicts: Set<string>;
  hydrated: boolean;
  cycleCell: (row: number, col: number) => void;
  markX: (row: number, col: number) => void;
  hint: () => void;
  clear: () => void;
  newRandom: (difficulty?: Difficulty) => void;
  setMode: (mode: Mode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

const QueensContext = createContext<QueensContextValue | null>(null);

const INITIAL: ReducerState = {
  daily: null,
  random: null,
  mode: "daily",
  difficulty: DEFAULT_DIFFICULTY,
  hydrated: false,
};

export function QueensProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Hydrate once on mount: try localStorage first, fall back to fresh puzzles.
  useEffect(() => {
    const blob = storage.load();
    const today = todayKey();

    let daily: GameState;
    if (blob?.daily && blob.daily.dateKey === today) {
      daily = blob.daily.state;
    } else {
      daily = newGameState("daily", DEFAULT_DIFFICULTY);
    }
    const random =
      blob?.random ?? newGameState("random", DEFAULT_DIFFICULTY);

    dispatch({
      type: "HYDRATE",
      payload: {
        daily,
        random,
        mode: "daily",
        difficulty: random.puzzle.difficulty,
        hydrated: true,
      },
    });
  }, []);

  const debouncedSave = useMemo(
    () =>
      debounce((s: ReducerState) => {
        if (!s.hydrated || !s.daily || !s.random) return;
        const blob: SaveBlob = {
          schemaVersion: 1,
          daily: { dateKey: todayKey(), state: s.daily },
          random: s.random,
        };
        storage.save(blob);
      }, 200),
    [],
  );

  useEffect(() => {
    debouncedSave(state);
  }, [state, debouncedSave]);

  const active = state.mode === "daily" ? state.daily : state.random;
  const conflicts = useMemo(
    () => (active ? findConflicts(active) : new Set<string>()),
    [active],
  );

  const cycleCell = useCallback((row: number, col: number) => {
    dispatch({ type: "CYCLE_CELL", row, col });
  }, []);
  const markX = useCallback((row: number, col: number) => {
    dispatch({ type: "MARK_X", row, col });
  }, []);
  const hint = useCallback(() => dispatch({ type: "HINT" }), []);
  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const newRandom = useCallback(
    (difficulty?: Difficulty) => dispatch({ type: "NEW_RANDOM", difficulty }),
    [],
  );
  const setMode = useCallback(
    (mode: Mode) => dispatch({ type: "SET_MODE", mode }),
    [],
  );
  const setDifficulty = useCallback(
    (difficulty: Difficulty) =>
      dispatch({ type: "SET_DIFFICULTY", difficulty }),
    [],
  );

  const value: QueensContextValue = {
    active,
    daily: state.daily,
    random: state.random,
    mode: state.mode,
    difficulty: state.difficulty,
    conflicts,
    hydrated: state.hydrated,
    cycleCell,
    markX,
    hint,
    clear,
    newRandom,
    setMode,
    setDifficulty,
  };

  return (
    <QueensContext.Provider value={value}>{children}</QueensContext.Provider>
  );
}

export function useQueens(): QueensContextValue {
  const ctx = useContext(QueensContext);
  if (!ctx) throw new Error("useQueens must be used within a QueensProvider");
  return ctx;
}
