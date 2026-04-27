import React, { useState, useEffect, useCallback, useRef } from 'react';

type GridSize = 16 | 32 | 64 | 128;

interface GameOfLifeProps {
  className?: string;
}

type PatternKey = "glider" | "blinker" | "pulsar" | "lwss" | "gosper";

const PATTERNS: Record<PatternKey, { label: string; cells: [number, number][] }> = {
  glider: {
    label: "Glider",
    cells: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
  },
  blinker: {
    label: "Blinker",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  },
  pulsar: {
    label: "Pulsar",
    cells: [
      [0, 2], [0, 3], [0, 4], [0, 8], [0, 9], [0, 10],
      [2, 0], [3, 0], [4, 0], [2, 5], [3, 5], [4, 5],
      [2, 7], [3, 7], [4, 7], [2, 12], [3, 12], [4, 12],
      [5, 2], [5, 3], [5, 4], [5, 8], [5, 9], [5, 10],
      [7, 2], [7, 3], [7, 4], [7, 8], [7, 9], [7, 10],
      [8, 0], [9, 0], [10, 0], [8, 5], [9, 5], [10, 5],
      [8, 7], [9, 7], [10, 7], [8, 12], [9, 12], [10, 12],
      [12, 2], [12, 3], [12, 4], [12, 8], [12, 9], [12, 10],
    ],
  },
  lwss: {
    label: "Lightweight Spaceship",
    cells: [
      [0, 1], [0, 4],
      [1, 0],
      [2, 0], [2, 4],
      [3, 0], [3, 1], [3, 2], [3, 3],
    ],
  },
  gosper: {
    label: "Gosper Glider Gun",
    cells: [
      [5, 1], [5, 2], [6, 1], [6, 2],
      [5, 11], [6, 11], [7, 11],
      [4, 12], [8, 12],
      [3, 13], [9, 13], [3, 14], [9, 14],
      [6, 15],
      [4, 16], [8, 16],
      [5, 17], [6, 17], [7, 17],
      [6, 18],
      [3, 21], [4, 21], [5, 21], [3, 22], [4, 22], [5, 22],
      [2, 23], [6, 23],
      [1, 25], [2, 25], [6, 25], [7, 25],
      [3, 35], [4, 35], [3, 36], [4, 36],
    ],
  },
};

const GameOfLife: React.FC<GameOfLifeProps> = ({ className = '' }) => {
  const [gridSize, setGridSize] = useState<GridSize>(64);
  const [grid, setGrid] = useState<boolean[][]>(() =>
    Array(64).fill(null).map(() => Array(64).fill(false))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [generation, setGeneration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initializeGrid = useCallback((size: GridSize) => {
    return Array(size).fill(null).map(() => Array(size).fill(false));
  }, []);

  useEffect(() => {
    setGrid(initializeGrid(gridSize));
    setGeneration(0);
  }, [gridSize, initializeGrid]);

  const countNeighbors = useCallback((grid: boolean[][], x: number, y: number) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newX = x + i;
        const newY = y + j;
        if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
          count += grid[newX][newY] ? 1 : 0;
        }
      }
    }
    return count;
  }, [gridSize]);

  const nextGeneration = useCallback(() => {
    setGrid(currentGrid => {
      const newGrid = currentGrid.map(row => [...row]);

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const neighbors = countNeighbors(currentGrid, i, j);

          if (currentGrid[i][j]) {
            newGrid[i][j] = neighbors === 2 || neighbors === 3;
          } else {
            newGrid[i][j] = neighbors === 3;
          }
        }
      }

      return newGrid;
    });
    setGeneration((g) => g + 1);
  }, [countNeighbors, gridSize]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(nextGeneration, speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, nextGeneration, speed]);

  const toggleCell = (row: number, col: number) => {
    if (isRunning) return;

    setGrid(currentGrid => {
      const newGrid = currentGrid.map(r => [...r]);
      newGrid[row][col] = !newGrid[row][col];
      return newGrid;
    });
  };

  const randomizeGrid = () => {
    setGrid(currentGrid =>
      currentGrid.map(row =>
        row.map(() => Math.random() > 0.7)
      )
    );
    setGeneration(0);
  };

  const clearGrid = () => {
    setGrid(initializeGrid(gridSize));
    setGeneration(0);
  };

  const loadPattern = (key: PatternKey) => {
    const pattern = PATTERNS[key];
    const maxRow = Math.max(...pattern.cells.map(([r]) => r));
    const maxCol = Math.max(...pattern.cells.map(([, c]) => c));
    if (maxRow >= gridSize || maxCol >= gridSize) {
      // Pattern doesn't fit; bail silently
      return;
    }
    const offsetR = Math.max(0, Math.floor((gridSize - maxRow - 1) / 2));
    const offsetC = Math.max(0, Math.floor((gridSize - maxCol - 1) / 2));
    const next = initializeGrid(gridSize);
    for (const [r, c] of pattern.cells) {
      next[r + offsetR][c + offsetC] = true;
    }
    setGrid(next);
    setGeneration(0);
    setIsRunning(false);
  };

  const toggleRunning = () => {
    setIsRunning(prev => !prev);
  };

  const stepOnce = () => {
    if (isRunning) return;
    nextGeneration();
  };

  const cellSize = gridSize <= 32 ? 8 : gridSize <= 64 ? 6 : 4;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <label className="font-mono">Grid Size:</label>
          <select
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value) as GridSize)}
            disabled={isRunning}
            className="bg-flexoki-paper dark:bg-flexoki-base-50 border border-flexoki-base-200 dark:border-flexoki-base-800 rounded-sm px-2 py-1 font-mono"
          >
            <option value={16}>16x16</option>
            <option value={32}>32x32</option>
            <option value={64}>64x64</option>
            <option value={128}>128x128</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="font-mono">Speed (ms):</label>
          <input
            type="range"
            min="50"
            max="500"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-20"
          />
          <span className="w-12 font-mono text-xs">{speed}</span>
        </div>

        <div className="font-mono text-xs tabular-nums text-flexoki-base-600 dark:text-flexoki-base-400">
          gen {generation}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <button
          onClick={toggleRunning}
          className="px-4 py-2 font-mono text-flexoki-ink dark:text-flexoki-base-50 border border-flexoki-ink dark:border-flexoki-base-100 font-semibold hover:border-flexoki-ink dark:hover:border-flexoki-base-50 transition-colors"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={stepOnce}
          disabled={isRunning}
          className="px-4 py-2 font-mono border border-flexoki-base-200 dark:border-flexoki-base-800 text-flexoki-base-700 dark:text-flexoki-base-300 hover:text-flexoki-ink dark:hover:text-flexoki-base-100 transition-colors disabled:opacity-40"
        >
          Step
        </button>

        <button
          onClick={randomizeGrid}
          disabled={isRunning}
          className="px-4 py-2 font-mono border border-flexoki-base-200 dark:border-flexoki-base-800 text-flexoki-base-700 dark:text-flexoki-base-300 hover:text-flexoki-ink dark:hover:text-flexoki-base-100 transition-colors disabled:opacity-40"
        >
          Random
        </button>

        <button
          onClick={clearGrid}
          disabled={isRunning}
          className="px-4 py-2 font-mono border border-flexoki-base-200 dark:border-flexoki-base-800 text-flexoki-base-700 dark:text-flexoki-base-300 hover:text-flexoki-ink dark:hover:text-flexoki-base-100 transition-colors disabled:opacity-40"
        >
          Clear
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="font-mono text-flexoki-base-600 dark:text-flexoki-base-400">Patterns:</span>
        {(Object.keys(PATTERNS) as PatternKey[]).map((key) => {
          const pattern = PATTERNS[key];
          const maxRow = Math.max(...pattern.cells.map(([r]) => r));
          const maxCol = Math.max(...pattern.cells.map(([, c]) => c));
          const fits = maxRow < gridSize && maxCol < gridSize;
          return (
            <button
              key={key}
              onClick={() => loadPattern(key)}
              disabled={isRunning || !fits}
              title={!fits ? `Needs a larger grid` : pattern.label}
              className="px-3 py-1 font-mono border border-flexoki-base-200 dark:border-flexoki-base-800 text-flexoki-base-600 dark:text-flexoki-base-400 hover:text-flexoki-ink dark:hover:text-flexoki-base-100 transition-colors disabled:opacity-40"
            >
              {pattern.label}
            </button>
          );
        })}
      </div>

      <div
        className="grid border border-flexoki-base-300 dark:border-flexoki-base-700"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gap: '1px',
          padding: '1px'
        }}
      >
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className={`cursor-pointer transition-colors duration-75 ${
                cell
                  ? 'bg-flexoki-ink dark:bg-flexoki-base-50'
                  : 'pattern-dots text-flexoki-base-300 dark:text-flexoki-base-800 hover:text-flexoki-base-500 dark:hover:text-flexoki-base-600'
              }`}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`
              }}
              onClick={() => toggleCell(i, j)}
            />
          ))
        )}
      </div>

      <div className="text-xs font-mono text-flexoki-base-500 dark:text-flexoki-base-500 text-center max-w-md">
        <p className="mb-1">Click cells to toggle • Try a pattern or hit Random</p>
        <p>Live cells with 2-3 neighbors survive; dead cells with 3 neighbors come alive.</p>
      </div>
    </div>
  );
};

export default GameOfLife;
