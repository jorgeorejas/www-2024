import React from "react";

interface GameControlsProps {
  difficulty: "easy" | "hard";
  moves: number;
  gameWon: boolean;
  onNewGame: (difficulty: "easy" | "hard") => void;
  onDifficultyChange: (difficulty: "easy" | "hard") => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  difficulty,
  moves,
  gameWon,
  onNewGame,
  onDifficultyChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      {/* Game Title and Difficulty */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <h2 className="text-2xl font-serif font-semibold text-black dark:text-white select-none">
          Klondike Solitaire
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => onDifficultyChange("easy")}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium select-none transition-all duration-200
              ${
                difficulty === "easy"
                  ? "bg-stone-800 text-white shadow-md"
                  : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600"
              }
            `}
          >
            Easy
          </button>
          <button
            onClick={() => onDifficultyChange("hard")}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium select-none transition-all duration-200
              ${
                difficulty === "hard"
                  ? "bg-stone-800 text-white shadow-md"
                  : "bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600"
              }
            `}
          >
            Hard
          </button>
        </div>
      </div>

      {/* Game Stats and Controls */}
      <div className="flex items-center gap-4">
        <div className="text-sm font-mono select-none text-stone-600 dark:text-stone-400">
          Moves: <span className="font-medium">{moves}</span>
        </div>

        <button
          onClick={() => onNewGame(difficulty)}
          className="
            px-4 py-2
            bg-stone-700 hover:bg-stone-800
            text-white font-medium font-mono select-none
            rounded-lg
            transition-all duration-200
            hover:shadow-md
            focus:outline-hidden focus:ring-2 focus:ring-stone-500 focus:ring-offset-2
          "
        >
          New Game
        </button>
      </div>

      {/* Win Message */}
      {gameWon && (
        <div className="w-full mt-4 p-4 bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg">
          <p className="text-stone-800 dark:text-stone-200 text-center font-mono select-none font-semibold">
            🎉 Congratulations! You won in {moves} moves!
          </p>
        </div>
      )}
    </div>
  );
};

export default GameControls;
