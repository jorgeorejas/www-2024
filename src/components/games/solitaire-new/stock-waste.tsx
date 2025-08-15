import Card from "./card.jsx";
import { useSolitaire } from "./provider.jsx";

export default function StockWaste() {
  const { gameState, draw, recycle, moveWasteToFoundation } = useSolitaire();

  const stockCard =
    gameState.stock.length > 0
      ? gameState.stock[gameState.stock.length - 1]
      : null;
  const wasteCard =
    gameState.waste.length > 0
      ? gameState.waste[gameState.waste.length - 1]
      : null;

  const canDraw = gameState.stock.length > 0;
  const canRecycle = gameState.stock.length === 0 && gameState.waste.length > 0;

  const canMoveWasteToFoundation =
    wasteCard &&
    (() => {
      const foundationTop =
        gameState.foundations[wasteCard.suit][
          gameState.foundations[wasteCard.suit].length - 1
        ];
      if (!foundationTop) return wasteCard.rank === 1;
      return (
        foundationTop.suit === wasteCard.suit &&
        foundationTop.rank === wasteCard.rank - 1
      );
    })();

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
      <div className="flex flex-col items-center gap-2 pointer-events-none">
        <div className="text-xs text-zinc-50 font-medium font-mono select-none">
          Stock
        </div>
        <div
          className="pointer-events-auto cursor-pointer"
          onClick={handleStockClick}
        >
          {stockCard ? (
            <Card card={stockCard} />
          ) : (
            <div className="w-full aspect-5/7 border border-dashed border-zinc-700/50 rounded-sm flex items-center justify-center">
              {canRecycle && (
                <span className="text-zinc-700/50 text-2xl">↻</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 pointer-events-none">
        <div className="text-xs text-zinc-50 font-medium font-mono select-none">
          Waste
        </div>
        <div
          className="pointer-events-auto cursor-pointer"
          onClick={handleWasteClick}
        >
          {wasteCard ? (
            <Card card={wasteCard} />
          ) : (
            <div className="w-full aspect-5/7 border border-dashed border-zinc-700/50 rounded-sm flex items-center justify-center" />
          )}
        </div>
      </div>
    </>
  );
}
