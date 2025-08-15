// Card types and interfaces for Solitaire
export interface Card {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: number; // 1 = Ace, 11 = Jack, 12 = Queen, 13 = King
  id: string;
  faceUp: boolean;
}

export interface GameState {
  tableau: Card[][]; // 7 columns
  foundations: Card[][]; // 4 foundation piles (one per suit)
  stock: Card[]; // Face-down deck
  waste: Card[]; // Face-up discard pile
  difficulty: "easy" | "hard"; // 1 card vs 3 cards
  moves: number;
  gameWon: boolean;
}

export type DragData = {
  cardId: string;
  sourceType: "tableau" | "waste" | "foundation";
  sourceIndex: number;
  cardIndex?: number; // For tableau cards
  cardSequence?: Card[]; // For multi-card moves from tableau
};

export type DropData = {
  targetType: "tableau" | "foundation";
  targetIndex: number;
};
