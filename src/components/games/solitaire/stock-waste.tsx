import Card from "./Card";
import { useSolitaire } from "./provider";
import type { Card as CardType } from "./types";

export default function StockWaste() {
  const {
    gameState,
    draw,
    recycle,
    moveWasteToFoundation,
    canMoveWasteToFoundation,
    setDragState,
  } = useSolitaire();

  const stockCard =
    gameState.stock.length > 0
      ? gameState.stock[gameState.stock.length - 1]
      : null;
  // Get the top 3 cards for stacking effect
  const wasteStack = gameState.waste.slice(-3);

  const canDraw = gameState.stock.length > 0;
  const canRecycle = gameState.stock.length === 0 && gameState.waste.length > 0;

  const handleStockClick = () => {
    if (canDraw) {
      draw();
    } else if (canRecycle) {
      recycle();
    }
  };

  const handleWasteClick = () => {
    if (canMoveWasteToFoundation) {
      moveWasteToFoundation();
    }
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-flexoki-base-700 dark:text-flexoki-base-300 font-medium font-mono select-none">
          Stock
        </div>
        <div
          data-testid="stock"
          data-can-draw={canDraw ? "1" : "0"}
          data-can-recycle={canRecycle ? "1" : "0"}
          className="cursor-grab w-full"
          onClick={handleStockClick}
        >
          {stockCard ? (
            <Card card={stockCard} />
          ) : (
            <div className="w-full aspect-5/7 border border-dashed border-flexoki-base-300 dark:border-flexoki-base-700 rounded-sm flex items-center justify-center">
              {canRecycle && (
                <span className="text-flexoki-base-400 text-2xl">↻</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-flexoki-base-700 dark:text-flexoki-base-300 font-medium font-mono select-none">
          Waste
        </div>
        <div
          data-testid="waste"
          className="cursor-grab w-full relative aspect-5/7"
          onClick={handleWasteClick}
        >
          {wasteStack.length > 0 ? (
            <>
              {wasteStack.map((card: CardType, index: number) => {
                const isTopCard = index === wasteStack.length - 1;
                // Diagonal displacement - each card moves both right and down
                const offsetX = index * 16; // 16px horizontal offset for each card

                return (
                  <div
                    key={`${card.id}-${index}`}
                    className="absolute transition-all duration-200 w-full aspect-5/7"
                    style={{
                      left: `${offsetX}px`,
                      zIndex: isTopCard ? 10 : index,
                    }}
                    draggable={isTopCard}
                    onDragStart={
                      isTopCard
                        ? (e) => {
                            e.dataTransfer.setData("text/plain", "waste");
                            setDragState({
                              isDragging: true,
                              dragType: "waste",
                            });
                          }
                        : undefined
                    }
                    onDragEnd={
                      isTopCard
                        ? () => {
                            setDragState({
                              isDragging: false,
                              dragType: null,
                            });
                          }
                        : undefined
                    }
                  >
                    <Card card={card} />
                  </div>
                );
              })}
            </>
          ) : (
            <div className="w-full h-full border border-dashed border-flexoki-base-300 dark:border-flexoki-base-700 rounded-sm flex items-center justify-center" />
          )}
        </div>
      </div>
    </>
  );
}
