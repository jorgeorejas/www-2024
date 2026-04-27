import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import type { GameState, Options, MoveHint, Suit } from "./types.js";
import {
  newGame,
  tick,
  drawFromStock,
  recycleStock,
  moveWasteToFoundation,
  moveWasteToTableau,
  moveTableauToFoundation,
  moveTableauToTableau,
  moveFoundationToTableau,
  legalMoves,
  hint,
  autoMoveAny,
  canAutoMove,
  canPlaceOnTableau,
  canMoveToFoundation,
  undo,
  redo,
  setOptions,
  toSaveBlob,
  fromSaveBlob,
  SAVE_KEY,
} from "./engine.js";

interface DragState {
  isDragging: boolean;
  dragType: "waste" | "tableau" | "foundation" | null;
  dragData?: {
    fromColumn?: number;
    cardIndex?: number;
    count?: number;
    card?: any;
    suit?: Suit;
  };
}

interface SolitaireContextValue {
  gameState: GameState;
  isLoading: boolean;
  dragState: DragState;

  // Game actions
  startNewGame: (seed?: string, options?: Partial<Options>) => void;
  draw: () => void;
  recycle: () => void;
  moveWasteToFoundation: () => void;
  moveWasteToTableau: (to: number) => void;
  moveTableauToFoundation: (from: number) => void;
  moveTableauToTableau: (from: number, to: number, count: number) => void;
  moveFoundationToTableau: (suit: Suit, to: number) => void;
  autoMove: () => void;
  undo: () => void;
  redo: () => void;
  updateOptions: (options: Partial<Options>) => void;

  // Drag state management
  setDragState: (dragState: DragState) => void;

  // Helpers
  getLegalMoves: () => MoveHint[];
  getHint: () => MoveHint | null;
  isValidDropTarget: (targetType: "foundation" | "tableau", targetIndex?: number, targetSuit?: Suit) => boolean;

  // Computed properties
  canMoveWasteToFoundation: boolean;
  canAutoMove: boolean;

  // Persistence
  saveGame: () => void;
  loadGame: () => boolean;
  clearSavedGame: () => void;
}

const SolitaireContext = createContext<SolitaireContextValue | null>(null);

type GameAction =
  | { type: "SET_GAME_STATE"; payload: GameState }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "TICK" }
  | { type: "DRAW" }
  | { type: "RECYCLE" }
  | { type: "MOVE_WASTE_TO_FOUNDATION" }
  | { type: "MOVE_WASTE_TO_TABLEAU"; payload: { to: number } }
  | { type: "MOVE_TABLEAU_TO_FOUNDATION"; payload: { from: number } }
  | {
      type: "MOVE_TABLEAU_TO_TABLEAU";
      payload: { from: number; to: number; count: number };
    }
  | {
      type: "MOVE_FOUNDATION_TO_TABLEAU";
      payload: { suit: Suit; to: number };
    }
  | { type: "AUTO_MOVE" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "UPDATE_OPTIONS"; payload: Partial<Options> }
  | { type: "SET_DRAG_STATE"; payload: DragState };

interface GameStateWithLoading {
  gameState: GameState;
  isLoading: boolean;
  dragState: DragState;
}

function gameReducer(
  state: GameStateWithLoading,
  action: GameAction,
): GameStateWithLoading {
  switch (action.type) {
    case "SET_GAME_STATE":
      return {
        ...state,
        gameState: action.payload,
        isLoading: false,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "TICK":
      return {
        ...state,
        gameState: tick(state.gameState),
      };

    case "DRAW":
      return {
        ...state,
        gameState: drawFromStock(state.gameState),
      };

    case "RECYCLE":
      return {
        ...state,
        gameState: recycleStock(state.gameState),
      };

    case "MOVE_WASTE_TO_FOUNDATION":
      return {
        ...state,
        gameState: moveWasteToFoundation(state.gameState),
      };

    case "MOVE_WASTE_TO_TABLEAU":
      return {
        ...state,
        gameState: moveWasteToTableau(state.gameState, action.payload.to),
      };

    case "MOVE_TABLEAU_TO_FOUNDATION":
      return {
        ...state,
        gameState: moveTableauToFoundation(state.gameState, action.payload.from),
      };

    case "MOVE_TABLEAU_TO_TABLEAU":
      return {
        ...state,
        gameState: moveTableauToTableau(
          state.gameState,
          action.payload.from,
          action.payload.to,
          action.payload.count,
        ),
      };

    case "MOVE_FOUNDATION_TO_TABLEAU":
      return {
        ...state,
        gameState: moveFoundationToTableau(
          state.gameState,
          action.payload.suit,
          action.payload.to,
        ),
      };

    case "AUTO_MOVE":
      return {
        ...state,
        gameState: autoMoveAny(state.gameState),
      };

    case "UNDO":
      return {
        ...state,
        gameState: undo(state.gameState),
      };

    case "REDO":
      return {
        ...state,
        gameState: redo(state.gameState),
      };

    case "UPDATE_OPTIONS":
      return {
        ...state,
        gameState: setOptions(state.gameState, action.payload),
      };

    case "SET_DRAG_STATE":
      return {
        ...state,
        dragState: action.payload,
      };

    default:
      return state;
  }
}

interface SolitaireProviderProps {
  children: React.ReactNode;
  autoSave?: boolean;
  autoLoad?: boolean;
}

export function SolitaireProvider({
  children,
  autoSave = true,
  autoLoad = true,
}: SolitaireProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, {
    gameState: newGame(),
    isLoading: true,
    dragState: {
      isDragging: false,
      dragType: null,
    },
  });

  // Auto-save debounced
  const debouncedSave = useCallback(
    debounce((gameState: GameState) => {
      if (autoSave) {
        try {
          const blob = toSaveBlob(gameState, Date.now());
          localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
        } catch (error) {
          console.warn("Failed to save game:", error);
        }
      }
    }, 200),
    [autoSave],
  );

  // Save game whenever state changes (debounced)
  useEffect(() => {
    if (!state.isLoading) {
      debouncedSave(state.gameState);
    }
  }, [state.gameState, state.isLoading, debouncedSave]);

  // Timer effect
  useEffect(() => {
    if (
      state.gameState.startedAt &&
      !state.gameState.won &&
      !state.gameState.lost
    ) {
      const interval = setInterval(() => {
        dispatch({ type: "TICK" });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.gameState.startedAt, state.gameState.won, state.gameState.lost]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      const loaded = loadGameFromStorage();
      if (!loaded) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [autoLoad]);

  const loadGameFromStorage = (): boolean => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const json = JSON.parse(saved);
        const gameState = fromSaveBlob(json);
        dispatch({ type: "SET_GAME_STATE", payload: gameState });
        return true;
      }
    } catch (error) {
      console.warn("Failed to load saved game:", error);
      localStorage.removeItem(SAVE_KEY);
    }
    return false;
  };

  // Helper function to check if a target is valid for the current drag
  const isValidDropTarget = (targetType: "foundation" | "tableau", targetIndex?: number, targetSuit?: Suit): boolean => {
    if (!state.dragState.isDragging) return false;

    const { dragType, dragData } = state.dragState;
    
    if (dragType === "waste") {
      const wasteCard = state.gameState.waste[state.gameState.waste.length - 1];
      if (!wasteCard) return false;

      if (targetType === "foundation") {
        if (!targetSuit) return false;
        const foundationTop = state.gameState.foundations[targetSuit][state.gameState.foundations[targetSuit].length - 1];
        return wasteCard.suit === targetSuit && canMoveToFoundation(wasteCard, foundationTop);
      } else if (targetType === "tableau" && targetIndex !== undefined) {
        const targetTop = state.gameState.tableaus[targetIndex].length > 0
          ? state.gameState.tableaus[targetIndex][state.gameState.tableaus[targetIndex].length - 1]
          : undefined;
        return canPlaceOnTableau(wasteCard, targetTop);
      }
    } else if (dragType === "tableau" && dragData) {
      if (dragData.fromColumn === undefined || !dragData.card) return false;

      if (targetType === "foundation" && dragData.count === 1) {
        if (!targetSuit) return false;
        const foundationTop = state.gameState.foundations[targetSuit][state.gameState.foundations[targetSuit].length - 1];
        return dragData.card.suit === targetSuit && canMoveToFoundation(dragData.card, foundationTop);
      } else if (targetType === "tableau" && targetIndex !== undefined && targetIndex !== dragData.fromColumn) {
        const targetTop = state.gameState.tableaus[targetIndex].length > 0
          ? state.gameState.tableaus[targetIndex][state.gameState.tableaus[targetIndex].length - 1]
          : undefined;
        return canPlaceOnTableau(dragData.card, targetTop);
      }
    } else if (dragType === "foundation" && dragData) {
      if (!dragData.suit || !dragData.card) return false;

      // Foundation cards can only go to tableau (not to other foundations)
      if (targetType === "tableau" && targetIndex !== undefined) {
        const targetTop = state.gameState.tableaus[targetIndex].length > 0
          ? state.gameState.tableaus[targetIndex][state.gameState.tableaus[targetIndex].length - 1]
          : undefined;
        return canPlaceOnTableau(dragData.card, targetTop);
      }
    }

    return false;
  };

  const contextValue: SolitaireContextValue = {
    gameState: state.gameState,
    isLoading: state.isLoading,
    dragState: state.dragState,

    startNewGame: (seed?: string, options?: Partial<Options>) => {
      const gameState = newGame(seed, options);
      dispatch({ type: "SET_GAME_STATE", payload: gameState });
    },

    draw: () => dispatch({ type: "DRAW" }),
    recycle: () => dispatch({ type: "RECYCLE" }),
    moveWasteToFoundation: () => dispatch({ type: "MOVE_WASTE_TO_FOUNDATION" }),
    moveWasteToTableau: (to: number) =>
      dispatch({ type: "MOVE_WASTE_TO_TABLEAU", payload: { to } }),
    moveTableauToFoundation: (from: number) =>
      dispatch({ type: "MOVE_TABLEAU_TO_FOUNDATION", payload: { from } }),
    moveTableauToTableau: (from: number, to: number, count: number) =>
      dispatch({
        type: "MOVE_TABLEAU_TO_TABLEAU",
        payload: { from, to, count },
      }),
    moveFoundationToTableau: (suit: Suit, to: number) =>
      dispatch({
        type: "MOVE_FOUNDATION_TO_TABLEAU",
        payload: { suit, to },
      }),
    autoMove: () => dispatch({ type: "AUTO_MOVE" }),
    undo: () => dispatch({ type: "UNDO" }),
    redo: () => dispatch({ type: "REDO" }),
    updateOptions: (options: Partial<Options>) =>
      dispatch({ type: "UPDATE_OPTIONS", payload: options }),

    setDragState: (dragState: DragState) =>
      dispatch({ type: "SET_DRAG_STATE", payload: dragState }),

    getLegalMoves: () => legalMoves(state.gameState),
    getHint: () => hint(state.gameState),
    isValidDropTarget,

    canMoveWasteToFoundation: (() => {
      const wasteCard =
        state.gameState.waste.length > 0
          ? state.gameState.waste[state.gameState.waste.length - 1]
          : null;

      if (!wasteCard) return false;

      const foundationTop =
        state.gameState.foundations[wasteCard.suit][
          state.gameState.foundations[wasteCard.suit].length - 1
        ];

      if (!foundationTop) return wasteCard.rank === 1;

      return (
        foundationTop.suit === wasteCard.suit &&
        foundationTop.rank === wasteCard.rank - 1
      );
    })(),

    canAutoMove: canAutoMove(state.gameState),

    saveGame: () => {
      try {
        const blob = toSaveBlob(state.gameState, Date.now());
        localStorage.setItem(SAVE_KEY, JSON.stringify(blob));
      } catch (error) {
        console.error("Failed to save game:", error);
      }
    },

    loadGame: () => loadGameFromStorage(),

    clearSavedGame: () => {
      localStorage.removeItem(SAVE_KEY);
    },
  };

  return (
    <SolitaireContext.Provider value={contextValue}>
      {children}
    </SolitaireContext.Provider>
  );
}

export function useSolitaire(): SolitaireContextValue {
  const context = useContext(SolitaireContext);
  if (!context) {
    throw new Error("useSolitaire must be used within a SolitaireProvider");
  }
  return context;
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Hook for game statistics
export function useGameStats() {
  const { gameState } = useSolitaire();

  return {
    score: gameState.score,
    moves: gameState.moves,
    time: gameState.timerSec,
    passesUsed: gameState.passesUsed,
    won: gameState.won,
    lost: gameState.lost,
    canUndo: gameState.history.length > 0,
    canRedo: gameState.future.length > 0,
    foundationProgress: {
      S: gameState.foundations.S.length,
      H: gameState.foundations.H.length,
      D: gameState.foundations.D.length,
      C: gameState.foundations.C.length,
      total: Object.values(gameState.foundations).reduce(
        (sum: number, pile: any) => sum + pile.length,
        0,
      ),
    },
  };
}

// Hook for game options
export function useGameOptions() {
  const { gameState, updateOptions } = useSolitaire();

  return {
    options: gameState.options,
    updateOptions,
  };
}
