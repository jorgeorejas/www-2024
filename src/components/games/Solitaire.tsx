import React, { useState, useCallback } from 'react';

// Card types and interfaces
export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: number; // 1 = Ace, 11 = Jack, 12 = Queen, 13 = King
  id: string;
  faceUp: boolean;
}

export interface GameState {
  tableau: Card[][]; // 7 columns
  foundations: Card[][]; // 4 foundation piles (one per suit)
  stock: Card[]; // Face-down deck
  waste: Card[]; // Face-up discard pile
  difficulty: 'easy' | 'hard'; // 1 card vs 3 cards
  moves: number;
  gameWon: boolean;
}

// Card utilities
const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_COLORS = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black'
} as const;

const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
} as const;

const RANK_NAMES = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K'
} as const;

// Create a standard 52-card deck
const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`,
        faceUp: false
      });
    }
  }
  return deck;
};

// Fisher-Yates shuffle
const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Initialize game state
const initializeGame = (difficulty: 'easy' | 'hard'): GameState => {
  const deck = shuffleDeck(createDeck());
  
  // Deal tableau (28 cards total)
  const tableau: Card[][] = [];
  let cardIndex = 0;
  
  for (let col = 0; col < 7; col++) {
    tableau[col] = [];
    for (let row = 0; row <= col; row++) {
      const card = deck[cardIndex++];
      card.faceUp = row === col; // Only the top card is face up
      tableau[col].push(card);
    }
  }
  
  // Remaining cards go to stock
  const stock = deck.slice(cardIndex);
  
  return {
    tableau,
    foundations: [[], [], [], []], // Empty foundation piles
    stock,
    waste: [],
    difficulty,
    moves: 0,
    gameWon: false
  };
};

// Check if card can be placed on foundation
const canPlaceOnFoundation = (card: Card, foundation: Card[]): boolean => {
  if (foundation.length === 0) {
    return card.rank === 1; // Only Ace can start foundation
  }
  
  const topCard = foundation[foundation.length - 1];
  return topCard.suit === card.suit && topCard.rank === card.rank - 1;
};

// Check if card can be placed on tableau pile
const canPlaceOnTableau = (card: Card, tableauPile: Card[]): boolean => {
  if (tableauPile.length === 0) {
    return card.rank === 13; // Only King can go on empty tableau
  }
  
  const topCard = tableauPile[tableauPile.length - 1];
  const cardColor = SUIT_COLORS[card.suit];
  const topCardColor = SUIT_COLORS[topCard.suit];
  
  return cardColor !== topCardColor && topCard.rank === card.rank + 1;
};

// Check if game is won
const checkWin = (foundations: Card[][]): boolean => {
  return foundations.every(foundation => foundation.length === 13);
};

// Card component
const CardComponent: React.FC<{
  card: Card | null;
  faceUp?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ card, faceUp = true, onClick, className = '', style }) => {
  if (!card) {
    return (
      <div className={`w-16 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded ${className}`} style={style} />
    );
  }

  const displayRank = RANK_NAMES[card.rank as keyof typeof RANK_NAMES] || card.rank.toString();
  const color = SUIT_COLORS[card.suit] === 'red' ? 'text-red-500' : 'text-black dark:text-white';

  if (!faceUp || !card.faceUp) {
    return (
      <div 
        className={`w-16 h-24 bg-blue-600 border border-gray-300 rounded cursor-pointer ${className}`}
        onClick={onClick}
        style={style}
      >
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center">
          <div className="text-xs text-white opacity-50">♠♥♦♣</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-16 h-24 bg-white dark:bg-gray-100 border border-gray-300 rounded cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
      style={style}
    >
      <div className="p-1 h-full flex flex-col justify-between">
        <div className={`text-xs font-bold ${color}`}>
          <div>{displayRank}</div>
          <div>{SUIT_SYMBOLS[card.suit]}</div>
        </div>
        <div className={`text-2xl ${color} text-center`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
        <div className={`text-xs font-bold ${color} text-right transform rotate-180`}>
          <div>{displayRank}</div>
          <div>{SUIT_SYMBOLS[card.suit]}</div>
        </div>
      </div>
    </div>
  );
};

// Main Solitaire component
const Solitaire: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame('easy'));
  const [selectedCard, setSelectedCard] = useState<{card: Card, source: string, index?: number} | null>(null);

  const newGame = useCallback((difficulty: 'easy' | 'hard' = gameState.difficulty) => {
    setGameState(initializeGame(difficulty));
    setSelectedCard(null);
  }, [gameState.difficulty]);

  const drawFromStock = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev };
      const drawCount = prev.difficulty === 'easy' ? 1 : 3;
      
      if (newState.stock.length === 0) {
        // Reset stock from waste pile
        newState.stock = [...newState.waste.reverse()];
        newState.waste = [];
        newState.stock.forEach(card => card.faceUp = false);
      } else {
        // Draw cards from stock
        const drawnCards = newState.stock.splice(-Math.min(drawCount, newState.stock.length));
        drawnCards.forEach(card => card.faceUp = true);
        newState.waste.push(...drawnCards);
      }
      
      return newState;
    });
  }, []);

  const moveCard = useCallback((card: Card, destination: string) => {
    setGameState(prev => {
      const newState = { ...prev, moves: prev.moves + 1 };
      
      // Handle different move types based on destination
      if (destination.startsWith('foundation-')) {
        const foundationIndex = parseInt(destination.split('-')[1]);
        if (canPlaceOnFoundation(card, newState.foundations[foundationIndex])) {
          newState.foundations[foundationIndex].push(card);
          
          // Remove from source
          if (selectedCard?.source === 'waste') {
            newState.waste.pop();
          } else if (selectedCard?.source.startsWith('tableau-')) {
            const tableauIndex = parseInt(selectedCard.source.split('-')[1]);
            newState.tableau[tableauIndex].pop();
            // Flip next card if exists
            const pile = newState.tableau[tableauIndex];
            if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
              pile[pile.length - 1].faceUp = true;
            }
          }
        }
      } else if (destination.startsWith('tableau-')) {
        const tableauIndex = parseInt(destination.split('-')[1]);
        if (canPlaceOnTableau(card, newState.tableau[tableauIndex])) {
          newState.tableau[tableauIndex].push(card);
          
          // Remove from source
          if (selectedCard?.source === 'waste') {
            newState.waste.pop();
          } else if (selectedCard?.source.startsWith('tableau-')) {
            const sourceTableauIndex = parseInt(selectedCard.source.split('-')[1]);
            newState.tableau[sourceTableauIndex].pop();
            // Flip next card if exists
            const pile = newState.tableau[sourceTableauIndex];
            if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
              pile[pile.length - 1].faceUp = true;
            }
          }
        }
      }
      
      // Check for win
      newState.gameWon = checkWin(newState.foundations);
      
      return newState;
    });
    
    setSelectedCard(null);
  }, [selectedCard]);

  const selectCard = useCallback((card: Card, source: string, index?: number) => {
    if (!card.faceUp) return;
    
    setSelectedCard({ card, source, index });
  }, []);

  // Check if card is selected
  const isSelected = (card: Card, source: string) => {
    return selectedCard?.card.id === card.id && selectedCard?.source === source;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-serif font-semibold">Solitaire</h2>
          <div className="flex gap-2">
            <button
              onClick={() => newGame('easy')}
              className={`px-3 py-1 rounded text-sm ${
                gameState.difficulty === 'easy' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Easy (1 card)
            </button>
            <button
              onClick={() => newGame('hard')}
              className={`px-3 py-1 rounded text-sm ${
                gameState.difficulty === 'hard' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Hard (3 cards)
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Moves: {gameState.moves}</span>
          <button
            onClick={() => newGame()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Win Message */}
      {gameState.gameWon && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-300 rounded">
          <p className="text-green-800 dark:text-green-200 text-center font-semibold">
            🎉 Congratulations! You won in {gameState.moves} moves!
          </p>
        </div>
      )}

      {/* Stock, Waste, and Foundations */}
      <div className="flex justify-between mb-6">
        <div className="flex gap-2">
          {/* Stock */}
          <CardComponent
            card={gameState.stock.length > 0 ? gameState.stock[gameState.stock.length - 1] : null}
            faceUp={false}
            onClick={drawFromStock}
            className="cursor-pointer"
          />
          
          {/* Waste */}
          <CardComponent
            card={gameState.waste.length > 0 ? gameState.waste[gameState.waste.length - 1] : null}
            onClick={() => {
              const topCard = gameState.waste[gameState.waste.length - 1];
              if (topCard) selectCard(topCard, 'waste');
            }}
            className={gameState.waste.length > 0 && isSelected(gameState.waste[gameState.waste.length - 1], 'waste') ? 'ring-2 ring-blue-500' : ''}
          />
        </div>
        
        {/* Foundations */}
        <div className="flex gap-2">
          {gameState.foundations.map((foundation, index) => (
            <CardComponent
              key={index}
              card={foundation.length > 0 ? foundation[foundation.length - 1] : null}
              onClick={() => {
                if (selectedCard) {
                  moveCard(selectedCard.card, `foundation-${index}`);
                }
              }}
              className="cursor-pointer"
            />
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="flex gap-2 justify-center">
        {gameState.tableau.map((pile, colIndex) => (
          <div key={colIndex} className="flex flex-col items-center min-h-32">
            {pile.length === 0 ? (
              <CardComponent
                card={null}
                onClick={() => {
                  if (selectedCard && selectedCard.card.rank === 13) {
                    moveCard(selectedCard.card, `tableau-${colIndex}`);
                  }
                }}
                className="cursor-pointer"
              />
            ) : (
              <div className="relative">
                {pile.map((card, cardIndex) => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    onClick={() => {
                      if (card.faceUp) {
                        if (selectedCard) {
                          moveCard(selectedCard.card, `tableau-${colIndex}`);
                        } else {
                          selectCard(card, `tableau-${colIndex}`, cardIndex);
                        }
                      }
                    }}
                    className={`${cardIndex > 0 ? 'absolute' : ''} ${
                      card.faceUp && isSelected(card, `tableau-${colIndex}`) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={cardIndex > 0 ? { top: `${cardIndex * 24}px` } : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Card Info */}
      {selectedCard && (
        <div className="mt-4 p-2 bg-blue-100 dark:bg-blue-900 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Selected: {RANK_NAMES[selectedCard.card.rank as keyof typeof RANK_NAMES] || selectedCard.card.rank} 
            {SUIT_SYMBOLS[selectedCard.card.suit]} - Click a valid location to move
          </p>
        </div>
      )}
    </div>
  );
};

export default Solitaire;