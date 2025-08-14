import React from "react";
import Card from "./Card";
import type { Card as CardType, DragData } from "./types";

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
  selectedCardId,
}) => {
  const topWasteCard = waste.length > 0 ? waste[waste.length - 1] : null;
  const hasStock = stock.length > 0;

  return (
    <div className="flex gap-4">
      {/* Stock Pile */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-stone-500 dark:text-stone-400 font-mono select-none font-medium">
          Stock
        </div>
        <Card
          card={hasStock ? stock[stock.length - 1] : null}
          faceUp={false}
          onClick={onStockClick}
          className={`
            ${hasStock ? "hover:scale-105" : "opacity-50 cursor-not-allowed"}
            transition-all duration-200
          `}
        />
        {hasStock && (
          <div className="text-xs font-mono select-none text-stone-500 dark:text-stone-400">
            {stock.length} cards
          </div>
        )}
      </div>

      {/* Waste Pile */}
      <div className="flex flex-col items-center gap-2 ml-6">
        <div className="text-xs text-stone-500 dark:text-stone-400 font-mono select-none font-medium">
          Waste
        </div>
        <div className="relative">
          {/* Show stacked waste cards - last 2 cards with partial visibility */}
          {waste.length > 0 && (
            <>
              {/* Second to last card (partially visible) */}
              {waste.length > 1 && (
                <Card
                  card={waste[waste.length - 2]}
                  className="absolute top-0 -left-3 pointer-events-none transition-all duration-200"
                  style={{ zIndex: 1 }}
                />
              )}

              {/* Third to last card (barely visible) */}
              {waste.length > 2 && (
                <Card
                  card={waste[waste.length - 3]}
                  className="absolute top-0 -left-6 pointer-events-none transition-all duration-200"
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Top waste card (fully interactive) */}
              <Card
                card={topWasteCard}
                onClick={() => {
                  if (topWasteCard && onWasteCardSelect) {
                    onWasteCardSelect(topWasteCard, {
                      cardId: topWasteCard.id,
                      sourceType: "waste",
                      sourceIndex: 0,
                    });
                  }
                }}
                draggable={!!topWasteCard}
                dragData={
                  topWasteCard
                    ? {
                        cardId: topWasteCard.id,
                        sourceType: "waste",
                        sourceIndex: 0,
                      }
                    : undefined
                }
                isSelected={topWasteCard?.id === selectedCardId}
                className="relative transition-all duration-200"
                style={{ zIndex: 2 }}
              />
            </>
          )}

          {/* Empty waste slot */}
          {waste.length === 0 && <Card card={null} className="opacity-50" />}
        </div>
        {waste.length > 0 && (
          <div className="text-xs font-mono select-none text-stone-500 dark:text-stone-400">
            {waste.length} cards
          </div>
        )}
      </div>
    </div>
  );
};

export default StockWaste;
