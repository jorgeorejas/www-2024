import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "Beginner" | "Intermediate" | "Expert";

interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  Beginner: { rows: 9, cols: 9, mines: 10 },
  Intermediate: { rows: 16, cols: 16, mines: 40 },
  Expert: { rows: 16, cols: 30, mines: 99 },
};

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

type GameStatus = "idle" | "playing" | "won" | "lost";

// Classic minesweeper number colors, mapped to Flexoki accents.
const NUMBER_COLOR = [
  "",
  "text-flexoki-blue-600 dark:text-flexoki-blue-400",
  "text-flexoki-green-600 dark:text-flexoki-green-400",
  "text-flexoki-red-600 dark:text-flexoki-red-400",
  "text-flexoki-purple-600 dark:text-flexoki-purple-400",
  "text-flexoki-orange-600 dark:text-flexoki-orange-400",
  "text-flexoki-cyan-600 dark:text-flexoki-cyan-400",
  "text-flexoki-magenta-600 dark:text-flexoki-magenta-400",
  "text-flexoki-ink dark:text-flexoki-base-100",
];

function makeBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    })),
  );
}

function neighbors(r: number, c: number, rows: number, cols: number) {
  const result: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        result.push([nr, nc]);
      }
    }
  }
  return result;
}

function placeMines(
  board: Cell[][],
  mines: number,
  safeR: number,
  safeC: number,
) {
  const rows = board.length;
  const cols = board[0].length;
  const forbidden = new Set<number>();
  forbidden.add(safeR * cols + safeC);
  for (const [nr, nc] of neighbors(safeR, safeC, rows, cols)) {
    forbidden.add(nr * cols + nc);
  }

  let placed = 0;
  const total = rows * cols;
  while (placed < mines) {
    const idx = Math.floor(Math.random() * total);
    if (forbidden.has(idx)) continue;
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    if (board[r][c].mine) continue;
    board[r][c].mine = true;
    placed++;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (const [nr, nc] of neighbors(r, c, rows, cols)) {
        if (board[nr][nc].mine) count++;
      }
      board[r][c].adjacent = count;
    }
  }
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function floodReveal(board: Cell[][], r: number, c: number) {
  const rows = board.length;
  const cols = board[0].length;
  const stack: [number, number][] = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const cell = board[cr][cc];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent === 0 && !cell.mine) {
      for (const [nr, nc] of neighbors(cr, cc, rows, cols)) {
        if (!board[nr][nc].revealed && !board[nr][nc].flagged) {
          stack.push([nr, nc]);
        }
      }
    }
  }
}

function checkWin(board: Cell[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.mine && !cell.revealed) return false;
    }
  }
  return true;
}

interface MinesweeperProps {
  className?: string;
}

const Minesweeper: React.FC<MinesweeperProps> = ({ className = "" }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>("Beginner");
  const config = DIFFICULTIES[difficulty];
  const [board, setBoard] = useState<Cell[][]>(() =>
    makeBoard(config.rows, config.cols),
  );
  const [status, setStatus] = useState<GameStatus>("idle");
  const [flagCount, setFlagCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  const reset = useCallback(
    (next: Difficulty = difficulty) => {
      const cfg = DIFFICULTIES[next];
      setBoard(makeBoard(cfg.rows, cfg.cols));
      setStatus("idle");
      setFlagCount(0);
      setSeconds(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    [difficulty],
  );

  useEffect(() => {
    reset(difficulty);
  }, [difficulty, reset]);

  useEffect(() => {
    if (status === "playing") {
      timerRef.current = setInterval(() => {
        setSeconds((s) => Math.min(s + 1, 999));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Test-only hook: expose current board so E2E tests can drive deterministic
  // win/lose flows without relying on chance. Gated on dev mode so it never
  // ships to production.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __minesweeper?: unknown }).__minesweeper = {
      board: board.map((row) =>
        row.map((cell) => ({
          mine: cell.mine,
          revealed: cell.revealed,
          flagged: cell.flagged,
          adjacent: cell.adjacent,
        })),
      ),
      status,
      difficulty,
    };
    return () => {
      delete (window as unknown as { __minesweeper?: unknown }).__minesweeper;
    };
  }, [board, status, difficulty]);

  const revealAllMines = (b: Cell[][]) => {
    for (const row of b) {
      for (const cell of row) {
        if (cell.mine) cell.revealed = true;
      }
    }
  };

  const handleReveal = (r: number, c: number) => {
    if (status === "won" || status === "lost") return;
    const cell = board[r][c];
    if (cell.flagged) return;

    const next = cloneBoard(board);
    let nextStatus: GameStatus = status;

    // Mines are placed lazily on the first reveal, not on the first flag —
    // otherwise flagging before any reveal would race ahead and leave the
    // board mineless when the player finally clicks (every cell would then
    // be adjacent=0 and flood-fill would clear everything).
    const minesPlaced = board.some((row) => row.some((cell) => cell.mine));
    if (!minesPlaced) {
      placeMines(next, config.mines, r, c);
    }
    if (status === "idle") nextStatus = "playing";

    const target = next[r][c];
    if (target.mine) {
      target.revealed = true;
      revealAllMines(next);
      nextStatus = "lost";
    } else {
      floodReveal(next, r, c);
      if (checkWin(next)) {
        nextStatus = "won";
        for (const row of next) {
          for (const cell of row) {
            if (cell.mine && !cell.flagged) cell.flagged = true;
          }
        }
      }
    }

    setBoard(next);
    setStatus(nextStatus);
    if (nextStatus === "won" || nextStatus === "lost") {
      setFlagCount(next.flat().filter((cell) => cell.flagged).length);
    }
  };

  const handleFlag = (r: number, c: number) => {
    if (status === "won" || status === "lost") return;
    const cell = board[r][c];
    if (cell.revealed) return;

    const next = cloneBoard(board);
    next[r][c].flagged = !next[r][c].flagged;
    setBoard(next);
    setFlagCount(next.flat().filter((cell) => cell.flagged).length);
    if (status === "idle") setStatus("playing");
  };

  const handleChord = (r: number, c: number) => {
    if (status !== "playing") return;
    const cell = board[r][c];
    if (!cell.revealed || cell.adjacent === 0) return;

    const flagged = neighbors(r, c, config.rows, config.cols).filter(
      ([nr, nc]) => board[nr][nc].flagged,
    ).length;
    if (flagged !== cell.adjacent) return;

    const next = cloneBoard(board);
    let nextStatus: GameStatus = "playing";
    for (const [nr, nc] of neighbors(r, c, config.rows, config.cols)) {
      const t = next[nr][nc];
      if (t.flagged || t.revealed) continue;
      if (t.mine) {
        t.revealed = true;
        revealAllMines(next);
        nextStatus = "lost";
        break;
      }
      floodReveal(next, nr, nc);
    }
    if (nextStatus === "playing" && checkWin(next)) {
      nextStatus = "won";
      for (const row of next) {
        for (const cell of row) {
          if (cell.mine && !cell.flagged) cell.flagged = true;
        }
      }
    }
    setBoard(next);
    setStatus(nextStatus);
    setFlagCount(next.flat().filter((cell) => cell.flagged).length);
  };

  const minesRemaining = Math.max(0, config.mines - flagCount);

  const cellSize = useMemo(() => {
    if (difficulty === "Expert") return 22;
    if (difficulty === "Intermediate") return 26;
    return 30;
  }, [difficulty]);

  const renderCell = (cell: Cell, r: number, c: number) => {
    const baseClass =
      "flex items-center justify-center font-mono select-none border border-flexoki-base-200 dark:border-flexoki-base-800";

    const isMineHit = cell.revealed && cell.mine && status === "lost";

    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        handleChord(r, c);
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false;
        return;
      }
      if (e.shiftKey || e.altKey) {
        handleFlag(r, c);
        return;
      }
      if (cell.revealed && cell.adjacent > 0) {
        handleChord(r, c);
        return;
      }
      handleReveal(r, c);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      handleFlag(r, c);
    };

    const handleTouchStart = () => {
      longPressFiredRef.current = false;
      longPressRef.current = setTimeout(() => {
        longPressFiredRef.current = true;
        handleFlag(r, c);
      }, 350);
    };

    const handleTouchEnd = () => {
      if (longPressRef.current) {
        clearTimeout(longPressRef.current);
        longPressRef.current = null;
      }
    };

    if (!cell.revealed) {
      // Hidden cells: dotted grayscale pattern. No fill.
      return (
        <button
          key={`${r}-${c}`}
          data-testid="ms-cell"
          data-row={r}
          data-col={c}
          data-state={cell.flagged ? "flagged" : "hidden"}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          disabled={status === "won" || status === "lost"}
          aria-label={cell.flagged ? "Flagged cell" : "Hidden cell"}
          className={`${baseClass} pattern-dots text-flexoki-base-300 dark:text-flexoki-base-700 hover:text-flexoki-base-500 dark:hover:text-flexoki-base-500 active:text-flexoki-base-600 dark:active:text-flexoki-base-400 transition-colors disabled:cursor-not-allowed`}
          style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.55 }}
        >
          {cell.flagged ? (
            <span className="text-flexoki-red-600 dark:text-flexoki-red-400 not-italic">
              ⚑
            </span>
          ) : (
            ""
          )}
        </button>
      );
    }

    return (
      <div
        key={`${r}-${c}`}
        data-testid="ms-cell"
        data-row={r}
        data-col={c}
        data-state="revealed"
        data-mine={cell.mine ? "1" : "0"}
        data-adjacent={cell.adjacent}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`${baseClass} ${
          isMineHit ? "pattern-cross text-flexoki-red-600 dark:text-flexoki-red-400" : ""
        } cursor-default`}
        style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.55 }}
      >
        {cell.mine ? (
          <span className="text-flexoki-red-600 dark:text-flexoki-red-400">✸</span>
        ) : cell.adjacent > 0 ? (
          <span className={`${NUMBER_COLOR[cell.adjacent]} font-semibold`}>
            {cell.adjacent}
          </span>
        ) : (
          ""
        )}
      </div>
    );
  };

  const statusGlyph =
    status === "won"
      ? "✓"
      : status === "lost"
        ? "✗"
        : status === "playing"
          ? "•"
          : "○";

  const pillBase =
    "px-3 py-1.5 font-mono text-xs transition-colors border border-flexoki-base-200 dark:border-flexoki-base-800";

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`${pillBase} ${
              difficulty === d
                ? "text-flexoki-ink dark:text-flexoki-base-50 border-flexoki-ink dark:border-flexoki-base-100 font-semibold"
                : "text-flexoki-base-600 dark:text-flexoki-base-400 hover:text-flexoki-ink dark:hover:text-flexoki-base-100"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-6 w-full max-w-md font-mono text-sm">
        <div
          data-testid="ms-mines-remaining"
          data-mines-remaining={minesRemaining}
          className="px-3 py-1.5 border border-flexoki-base-200 dark:border-flexoki-base-800 tabular-nums text-flexoki-red-600 dark:text-flexoki-red-400"
        >
          ⚑ {String(minesRemaining).padStart(3, "0")}
        </div>
        <button
          onClick={() => reset()}
          aria-label="Reset game"
          data-testid="ms-status"
          data-status={status}
          className={`${pillBase} text-flexoki-base-700 dark:text-flexoki-base-300 hover:text-flexoki-ink dark:hover:text-flexoki-base-100`}
        >
          {statusGlyph} reset
        </button>
        <div
          data-testid="ms-timer"
          data-seconds={seconds}
          className="px-3 py-1.5 border border-flexoki-base-200 dark:border-flexoki-base-800 tabular-nums text-flexoki-base-700 dark:text-flexoki-base-300"
        >
          ⏱ {String(seconds).padStart(3, "0")}
        </div>
      </div>

      <div className="overflow-auto max-w-full p-1 border border-flexoki-base-300 dark:border-flexoki-base-700">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${config.rows}, ${cellSize}px)`,
          }}
        >
          {board.map((row, r) => row.map((cell, c) => renderCell(cell, r, c)))}
        </div>
      </div>

      {(status === "won" || status === "lost") && (
        <div
          className={`font-mono text-sm text-center ${
            status === "won"
              ? "text-flexoki-green-600 dark:text-flexoki-green-400"
              : "text-flexoki-red-600 dark:text-flexoki-red-400"
          }`}
        >
          {status === "won"
            ? `Cleared in ${seconds}s. Nice.`
            : "Boom. Try again."}
        </div>
      )}

      <div className="text-xs font-mono text-flexoki-base-500 dark:text-flexoki-base-500 text-center max-w-md space-y-1">
        <p>
          Click to reveal • Right-click (or shift-click) to flag • Long-press on
          mobile to flag
        </p>
        <p>
          Click a number to chord — reveals all neighbors when its flag count
          matches
        </p>
      </div>
    </div>
  );
};

export default Minesweeper;
