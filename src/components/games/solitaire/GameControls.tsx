import React from 'react';

interface GameControlsProps {
  difficulty: 'easy' | 'hard';
  moves: number;
  gameWon: boolean;
  onNewGame: (difficulty: 'easy' | 'hard') => void;
  onDifficultyChange: (difficulty: 'easy' | 'hard') => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  difficulty,
  moves,
  gameWon,
  onNewGame,
  onDifficultyChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      {/* Game Title and Difficulty */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <h2 className="text-2xl font-serif font-semibold text-black dark:text-white">
          Klondike Solitaire
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => onDifficultyChange('easy')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${difficulty === 'easy' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            Easy (1 card)
          </button>
          <button
            onClick={() => onDifficultyChange('hard')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${difficulty === 'hard' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }
            `}
          >
            Hard (3 cards)
          </button>
        </div>
      </div>
      
      {/* Game Stats and Controls */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Moves: <span className="font-medium">{moves}</span>
        </div>
        
        <button
          onClick={() => onNewGame(difficulty)}
          className="
            px-4 py-2 
            bg-green-500 hover:bg-green-600 
            text-white font-medium 
            rounded-lg 
            transition-all duration-200 
            hover:shadow-md 
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          "
        >
          New Game
        </button>
      </div>
      
      {/* Win Message */}
      {gameWon && (
        <div className="w-full mt-4 p-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-center font-semibold">
            🎉 Congratulations! You won in {moves} moves!
          </p>
        </div>
      )}
    </div>
  );
};

export default GameControls;