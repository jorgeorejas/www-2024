import React, { useState, useEffect, useCallback, useRef } from 'react';

type GridSize = 16 | 32 | 64 | 128;

interface GameOfLifeProps {
  className?: string;
}

const GameOfLife: React.FC<GameOfLifeProps> = ({ className = '' }) => {
  const [gridSize, setGridSize] = useState<GridSize>(64);
  const [grid, setGrid] = useState<boolean[][]>(() => 
    Array(64).fill(null).map(() => Array(64).fill(false))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeGrid = useCallback((size: GridSize) => {
    return Array(size).fill(null).map(() => Array(size).fill(false));
  }, []);

  useEffect(() => {
    setGrid(initializeGrid(gridSize));
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
  };

  const clearGrid = () => {
    setGrid(initializeGrid(gridSize));
  };

  const toggleRunning = () => {
    setIsRunning(prev => !prev);
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
            className="bg-white dark:bg-stone-800 border border-black/15 dark:border-white/15 rounded px-2 py-1 font-mono"
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
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <button
          onClick={toggleRunning}
          className="px-4 py-2 font-mono bg-black text-white dark:bg-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        
        <button
          onClick={randomizeGrid}
          disabled={isRunning}
          className="px-4 py-2 font-mono bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors disabled:opacity-50"
        >
          Random
        </button>
        
        <button
          onClick={clearGrid}
          disabled={isRunning}
          className="px-4 py-2 font-mono bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      <div 
        className="grid border-2 border-black/15 dark:border-white/15 bg-white dark:bg-stone-900"
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
                  ? 'bg-black dark:bg-white' 
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700'
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

      <div className="text-xs font-mono text-black/60 dark:text-white/60 text-center max-w-md">
        <p className="mb-1">Click cells to toggle • Use Random for a starting pattern</p>
        <p>Conway's Game of Life: Live cells with 2-3 neighbors survive, dead cells with 3 neighbors become alive</p>
      </div>
    </div>
  );
};

export default GameOfLife;