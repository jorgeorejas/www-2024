import React from 'react';
import Card from './Card';
import type { Card as CardType, DragData } from './types';

interface StockWasteProps {
  stock: CardType[];
  waste: CardType[];
  onStockClick: () => void;
  onWasteCardSelect?: (card: CardType, dragData: DragData) => void;
  selectedCardId?: string;
}

const StockWaste: React.FC<StockWasteProps> = ({
  stock,
  waste,
  onStockClick,
  onWasteCardSelect,
  selectedCardId
}) => {
  const topWasteCard = waste.length > 0 ? waste[waste.length - 1] : null;
  const hasStock = stock.length > 0;

  return (
    <div className="flex gap-2 sm:gap-4">
      {/* Stock Pile */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Stock
        </div>
        <Card
          card={hasStock ? stock[stock.length - 1] : null}
          faceUp={false}
          onClick={onStockClick}
          className={`
            ${hasStock ? 'hover:scale-105' : 'opacity-50 cursor-not-allowed'} 
            transition-all duration-200
          `}
        />
        {hasStock && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stock.length} cards
          </div>
        )}
      </div>
      
      {/* Waste Pile */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Waste
        </div>
        <Card
          card={topWasteCard}
          onClick={() => {
            if (topWasteCard && onWasteCardSelect) {
              onWasteCardSelect(topWasteCard, {
                cardId: topWasteCard.id,
                sourceType: 'waste',
                sourceIndex: 0
              });
            }
          }}
          draggable={!!topWasteCard}
          dragData={
            topWasteCard
              ? {
                  cardId: topWasteCard.id,
                  sourceType: 'waste',
                  sourceIndex: 0
                }
              : undefined
          }
          isSelected={topWasteCard?.id === selectedCardId}
          className="transition-all duration-200"
        />
        {waste.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {waste.length} cards
          </div>
        )}
      </div>
    </div>
  );
};

export default StockWaste;