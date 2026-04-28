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
  areAdjacent,
  hintNextStep,
  isPathComplete,
  isPathValid,
  labelSequence,
} from "./engine";
import {
  type GameState,
  type SaveBlob,
  SaveBlobZ,
} from "./types";

const STORAGE_KEY = "linkedin-games:zip";
const STORAGE_VERSION = 1;
const DEFAULT_DIFFICULTY: Difficulty = "medium";

const storage = createStorage<SaveBlob>(STORAGE_KEY, STORAGE_VERSION, SaveBlobZ);

function newGameState(mode: Mode, difficulty: Difficulty): GameState {
  const seed = mode === "daily" ? dailySeed("zip") : randomSeed();
  const puzzle = generatePuzzle(seed, difficulty);
  return {
    puzzle,
    mode,
    path: [],
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
  | { type: "EXTEND_PATH"; cell: number }
  | { type: "TRUNCATE_PATH"; index: number }
  | { type: "HINT" }
  | { type: "CLEAR" }
  | { type: "NEW_RANDOM"; difficulty?: Difficulty }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_DIFFICULTY"; difficulty: Difficulty };

function withPath(state: GameState, path: number[]): GameState {
  const next: GameState = {
    ...state,
    path,
    moveCount: state.moveCount + 1,
  };
  if (isPathComplete(next.puzzle, next.path) && next.solvedAt == null) {
    next.solvedAt = Date.now();
  } else if (next.solvedAt != null && !isPathComplete(next.puzzle, next.path)) {
    next.solvedAt = null;
  }
  return next;
}

function tryExtend(state: GameState, cell: number): GameState | null {
  const { puzzle, path } = state;
  if (path.length === 0) {
    // First click must be the cell labeled 1.
    const labels = labelSequence(puzzle);
    if (labels.length === 0 || cell !== labels[0]) return null;
    const next = [cell];
    return isPathValid(puzzle, next) ? withPath(state, next) : null;
  }
  const tail = path[path.length - 1];
  if (cell === tail) return null; // ignore re-clicks on tail (use truncate)
  if (path.includes(cell)) return null; // can't revisit
  if (!areAdjacent(tail, cell, puzzle.size)) return null;
  const next = [...path, cell];
  return isPathValid(puzzle, next) ? withPath(state, next) : null;
}

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;
    case "EXTEND_PATH": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      const next = tryExtend(active, action.cell);
      if (!next) return state;
      return { ...state, [state.mode]: next };
    }
    case "TRUNCATE_PATH": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      if (action.index < 0 || action.index >= active.path.length) return state;
      const newPath = active.path.slice(0, action.index + 1);
      return { ...state, [state.mode]: withPath(active, newPath) };
    }
    case "HINT": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      const next = hintNextStep(active.puzzle, active.path);
      if (next == null) return state;
      const newPath = [...active.path, next];
      return { ...state, [state.mode]: withPath(active, newPath) };
    }
    case "CLEAR": {
      const active = state[state.mode];
      if (!active) return state;
      return {
        ...state,
        [state.mode]: {
          ...active,
          path: [],
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

interface ZipContextValue {
  active: GameState | null;
  daily: GameState | null;
  random: GameState | null;
  mode: Mode;
  difficulty: Difficulty;
  hydrated: boolean;
  extendPath: (cell: number) => void;
  truncatePath: (index: number) => void;
  hint: () => void;
  clear: () => void;
  newRandom: (difficulty?: Difficulty) => void;
  setMode: (mode: Mode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

const ZipContext = createContext<ZipContextValue | null>(null);

const INITIAL: ReducerState = {
  daily: null,
  random: null,
  mode: "daily",
  difficulty: DEFAULT_DIFFICULTY,
  hydrated: false,
};

export function ZipProvider({ children }: { children: ReactNode }) {
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

  const extendPath = useCallback((cell: number) => {
    dispatch({ type: "EXTEND_PATH", cell });
  }, []);
  const truncatePath = useCallback((index: number) => {
    dispatch({ type: "TRUNCATE_PATH", index });
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

  const value: ZipContextValue = {
    active,
    daily: state.daily,
    random: state.random,
    mode: state.mode,
    difficulty: state.difficulty,
    hydrated: state.hydrated,
    extendPath,
    truncatePath,
    hint,
    clear,
    newRandom,
    setMode,
    setDifficulty,
  };

  return <ZipContext.Provider value={value}>{children}</ZipContext.Provider>;
}

export function useZip(): ZipContextValue {
  const ctx = useContext(ZipContext);
  if (!ctx) throw new Error("useZip must be used within a ZipProvider");
  return ctx;
}
