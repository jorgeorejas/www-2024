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
import { findConflicts, isSolved, valuesFromGivens } from "./engine";
import {
  SIZE,
  type CellValue,
  type Focus,
  type GameState,
  type SaveBlob,
  SaveBlobZ,
} from "./types";

const STORAGE_KEY = "linkedin-games:sudoku";
const STORAGE_VERSION = 1;
const DEFAULT_DIFFICULTY: Difficulty = "medium";

const storage = createStorage<SaveBlob>(STORAGE_KEY, STORAGE_VERSION, SaveBlobZ);

function newGameState(mode: Mode, difficulty: Difficulty): GameState {
  const seed = mode === "daily" ? dailySeed("sudoku") : randomSeed();
  const puzzle = generatePuzzle(seed, difficulty);
  return {
    puzzle,
    mode,
    values: valuesFromGivens(puzzle.givens),
    focus: null,
    startedAt: Date.now(),
    solvedAt: null,
    moveCount: 0,
  };
}

function isLocked(active: GameState, row: number, col: number): boolean {
  return active.puzzle.givens[row][col] !== 0;
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
  | { type: "SET_VALUE"; row: number; col: number; value: CellValue }
  | { type: "CLEAR_VALUE"; row: number; col: number }
  | { type: "FOCUS"; focus: Focus }
  | { type: "HINT" }
  | { type: "CLEAR" }
  | { type: "NEW_RANDOM"; difficulty?: Difficulty }
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_DIFFICULTY"; difficulty: Difficulty }
  | { type: "REFRESH_DAILY" };

function withValueChange(
  state: GameState,
  row: number,
  col: number,
  value: CellValue,
): GameState {
  // Locked cells are immutable.
  if (isLocked(state, row, col)) return state;
  if (state.values[row][col] === value) return state;
  const values = state.values.map((rowVals, r) =>
    r === row
      ? rowVals.map((v, ci) => (ci === col ? value : v))
      : rowVals,
  );
  const next: GameState = {
    ...state,
    values,
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
    case "SET_VALUE": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      const next = withValueChange(active, action.row, action.col, action.value);
      return { ...state, [state.mode]: next };
    }
    case "CLEAR_VALUE": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      const next = withValueChange(active, action.row, action.col, 0 as CellValue);
      return { ...state, [state.mode]: next };
    }
    case "FOCUS": {
      const active = state[state.mode];
      if (!active) return state;
      return { ...state, [state.mode]: { ...active, focus: action.focus } };
    }
    case "HINT": {
      const active = state[state.mode];
      if (!active || active.solvedAt != null) return state;
      // Find an empty cell and reveal its solution value. Prefer a focused
      // empty cell when available so the hint feels targeted.
      const tries: Array<[number, number]> = [];
      if (active.focus && active.values[active.focus.row][active.focus.col] === 0) {
        tries.push([active.focus.row, active.focus.col]);
      }
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (active.values[r][c] === 0) tries.push([r, c]);
        }
      }
      const target = tries.find(([r, c]) => !isLocked(active, r, c));
      if (!target) return state;
      const [r, c] = target;
      const v = active.puzzle.solution[r][c];
      const next = withValueChange(active, r, c, v);
      return { ...state, [state.mode]: next };
    }
    case "CLEAR": {
      const active = state[state.mode];
      if (!active) return state;
      return {
        ...state,
        [state.mode]: {
          ...active,
          values: valuesFromGivens(active.puzzle.givens),
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

interface SudokuContextValue {
  active: GameState | null;
  daily: GameState | null;
  random: GameState | null;
  mode: Mode;
  difficulty: Difficulty;
  conflicts: Set<string>;
  hydrated: boolean;
  isLocked: (row: number, col: number) => boolean;
  setValue: (row: number, col: number, value: CellValue) => void;
  clearValue: (row: number, col: number) => void;
  focus: (focus: Focus) => void;
  hint: () => void;
  clear: () => void;
  newRandom: (difficulty?: Difficulty) => void;
  setMode: (mode: Mode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

const SudokuContext = createContext<SudokuContextValue | null>(null);

const INITIAL: ReducerState = {
  daily: null,
  random: null,
  mode: "daily",
  difficulty: DEFAULT_DIFFICULTY,
  hydrated: false,
};

export function SudokuProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Hydrate once on mount.
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
    () =>
      active
        ? findConflicts(active)
        : new Set<string>(),
    [active],
  );

  const setValue = useCallback(
    (row: number, col: number, value: CellValue) =>
      dispatch({ type: "SET_VALUE", row, col, value }),
    [],
  );
  const clearValue = useCallback(
    (row: number, col: number) =>
      dispatch({ type: "CLEAR_VALUE", row, col }),
    [],
  );
  const focus = useCallback(
    (f: Focus) => dispatch({ type: "FOCUS", focus: f }),
    [],
  );
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

  const isLockedFn = useCallback(
    (row: number, col: number): boolean => {
      if (!active) return false;
      return isLocked(active, row, col);
    },
    [active],
  );

  const value: SudokuContextValue = {
    active,
    daily: state.daily,
    random: state.random,
    mode: state.mode,
    difficulty: state.difficulty,
    conflicts,
    hydrated: state.hydrated,
    isLocked: isLockedFn,
    setValue,
    clearValue,
    focus,
    hint,
    clear,
    newRandom,
    setMode,
    setDifficulty,
  };

  return (
    <SudokuContext.Provider value={value}>{children}</SudokuContext.Provider>
  );
}

export function useSudoku(): SudokuContextValue {
  const ctx = useContext(SudokuContext);
  if (!ctx) throw new Error("useSudoku must be used within a SudokuProvider");
  return ctx;
}
