import { Card, GameState } from './types';

// Card utilities
export const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const SUIT_COLORS = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black'
} as const;

export const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
} as const;

export const RANK_NAMES = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K'
} as const;

// Create a standard 52-card deck
export const createDeck = (): Card[] => {
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
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Initialize game state
export const initializeGame = (difficulty: 'easy' | 'hard'): GameState => {
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
export const canPlaceOnFoundation = (card: Card, foundation: Card[]): boolean => {
  if (foundation.length === 0) {
    return card.rank === 1; // Only Ace can start foundation
  }
  
  const topCard = foundation[foundation.length - 1];
  return topCard.suit === card.suit && topCard.rank === card.rank - 1;
};

// Check if card can be placed on tableau pile
export const canPlaceOnTableau = (card: Card, tableauPile: Card[]): boolean => {
  if (tableauPile.length === 0) {
    return card.rank === 13; // Only King can go on empty tableau
  }
  
  const topCard = tableauPile[tableauPile.length - 1];
  const cardColor = SUIT_COLORS[card.suit];
  const topCardColor = SUIT_COLORS[topCard.suit];
  
  return cardColor !== topCardColor && topCard.rank === card.rank + 1;
};

// Check if game is won
export const checkWin = (foundations: Card[][]): boolean => {
  return foundations.every(foundation => foundation.length === 13);
};

// Get card display name
export const getCardDisplayRank = (rank: number): string => {
  return RANK_NAMES[rank as keyof typeof RANK_NAMES] || rank.toString();
};

// Check if card is red
export const isRedCard = (card: Card): boolean => {
  return SUIT_COLORS[card.suit] === 'red';
};

// Get card color class for Tailwind
export const getCardColorClass = (card: Card): string => {
  return isRedCard(card) ? 'text-red-500' : 'text-black dark:text-white';
};