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
  findConflicts,
  isSolved,
  nextCellValue,
  solve,
} from "./engine";
import {
  type CellValue,
  type GameState,
  type SaveBlob,
  SaveBlobZ,
} from "./types";

const STORAGE_KEY = "linkedin-games:tango";
const STORAGE_VERSION = 1;
const DEFAULT_DIFFICULTY: Difficulty = "medium";

const storage = createStorage<SaveBlob>(STORAGE_KEY, STORAGE_VERSION, SaveBlobZ);

function newGameState(mode: Mode, difficulty: Difficulty): GameState {
  const seed = mode === "daily" ? dailySeed("tango") : randomSeed();
  const puzzle = generatePuzzle(seed, difficulty);
  return {
    puzzle,
    mode,
    cells: puzzle.clues.map((row) => [...row]),
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
  | { type: "HINT" }
  | { type: "CLEAR" }
  | { type: "NEW_RANDOM"; difficulty?: Difficulty }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_DIFFICULTY"; difficulty: Difficulty };

function withCellChange(
  state: GameState,
  row: number,
  col: number,
  cell: CellValue,
): GameState {
  const cells = state.cells.map((rowCells, r) =>
    r === row ? rowCells.map((c, ci) => (ci === col ? cell : c)) : rowCells,
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
      // Locked clue cells are immutable.
      if (active.puzzle.clues[action.row][action.col] !== "empty") return state;
      const current = active.cells[action.row][action.col];
      const next = withCellChange(
        active,
        action.row,
        action.col,
        nextCellValue(current),
      );
      return { ...state, [state.mode]: next };
    }
    case "HINT": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      const [solution] = solve(active.puzzle, 1);
      if (!solution) return state;
      // Reveal one cell the player hasn't filled correctly yet. Locked clues
      // are skipped (they're already correct).
      for (let r = 0; r < solution.length; r++) {
        for (let c = 0; c < solution[r].length; c++) {
          if (active.puzzle.clues[r][c] !== "empty") continue;
          if (active.cells[r][c] !== solution[r][c]) {
            const next = withCellChange(active, r, c, solution[r][c]);
            return { ...state, [state.mode]: next };
          }
        }
      }
      return state;
    }
    case "CLEAR": {
      const active = state[state.mode];
      if (!active) return state;
      return {
        ...state,
        [state.mode]: {
          ...active,
          cells: active.puzzle.clues.map((row) => [...row]),
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
    default:
      return state;
  }
}

interface TangoContextValue {
  active: GameState | null;
  daily: GameState | null;
  random: GameState | null;
  mode: Mode;
  difficulty: Difficulty;
  conflicts: Set<string>;
  hydrated: boolean;
  cycleCell: (row: number, col: number) => void;
  hint: () => void;
  clear: () => void;
  newRandom: (difficulty?: Difficulty) => void;
  setMode: (mode: Mode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

const TangoContext = createContext<TangoContextValue | null>(null);

const INITIAL: ReducerState = {
  daily: null,
  random: null,
  mode: "daily",
  difficulty: DEFAULT_DIFFICULTY,
  hydrated: false,
};

export function TangoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Hydrate once on mount: try localStorage, fall back to fresh puzzles.
  useEffect(() => {
    const blob = storage.load();
    const today = todayKey();

    let daily: GameState;
    if (blob?.daily && blob.daily.dateKey === today) {
      daily = blob.daily.state;
    } else {
      daily = newGameState("daily", DEFAULT_DIFFICULTY);
    }
    const random = blob?.random ?? newGameState("random", DEFAULT_DIFFICULTY);

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

  const value: TangoContextValue = {
    active,
    daily: state.daily,
    random: state.random,
    mode: state.mode,
    difficulty: state.difficulty,
    conflicts,
    hydrated: state.hydrated,
    cycleCell,
    hint,
    clear,
    newRandom,
    setMode,
    setDifficulty,
  };

  return (
    <TangoContext.Provider value={value}>{children}</TangoContext.Provider>
  );
}

export function useTango(): TangoContextValue {
  const ctx = useContext(TangoContext);
  if (!ctx) throw new Error("useTango must be used within a TangoProvider");
  return ctx;
}
