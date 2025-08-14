import React from 'react';
import StockWaste from './StockWaste';
import Foundation from './Foundation';
import Tableau from './Tableau';
import type { GameState, DragData } from './types';

interface GameBoardProps {
  gameState: GameState;
  onStockClick: () => void;
  onWasteCardSelect?: (card: any, dragData: DragData) => void;
  onTableauCardSelect?: (card: any, dragData: DragData) => void;
  onFoundationDrop?: (targetIndex: number) => void;
  onTableauDrop?: (targetIndex: number) => void;
  selectedCardId?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onStockClick,
  onWasteCardSelect,
  onTableauCardSelect,
  onFoundationDrop,
  onTableauDrop,
  selectedCardId
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Top row: Stock/Waste and Foundations */}
      <div className="flex justify-between items-start">
        <StockWaste
          stock={gameState.stock}
          waste={gameState.waste}
          onStockClick={onStockClick}
          onWasteCardSelect={onWasteCardSelect}
          selectedCardId={selectedCardId}
        />
        
        <Foundation
          foundations={gameState.foundations}
          onCardDrop={onFoundationDrop}
        />
      </div>
      
      {/* Bottom row: Tableau */}
      <Tableau
        tableau={gameState.tableau}
        onCardSelect={onTableauCardSelect}
        onCardDrop={onTableauDrop}
        selectedCardId={selectedCardId}
      />
    </div>
  );
};

export default GameBoard;