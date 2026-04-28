import Card from "./Card";
import { useSolitaire } from "./provider";
import type { Suit } from "./types";

export default function Foundations() {
  const { gameState, moveWasteToFoundation, moveTableauToFoundation, isValidDropTarget, setDragState } = useSolitaire();

  const suits: Suit[] = ["H", "C", "D", "S"];

  const handleFoundationDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData("text/plain");
    
    if (dragType === "waste") {
      moveWasteToFoundation();
    } else if (dragType === "tableau") {
      try {
        const dragData = JSON.parse(e.dataTransfer.getData("application/json"));
        if (dragData.count === 1) { // Only single cards can go to foundation
          moveTableauToFoundation(dragData.fromColumn);
        }
      } catch (error) {
        console.warn("Failed to parse drag data:", error);
      }
    }
  };

  const handleFoundationDragStart = (e: React.DragEvent, suit: Suit) => {
    const foundation = gameState.foundations[suit];
    if (foundation.length === 0) return;

    const card = foundation[foundation.length - 1];
    
    const dragData = {
      suit,
      card,
    };

    e.dataTransfer.setData("text/plain", "foundation");
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));

    // Update drag state for highlighting
    setDragState({
      isDragging: true,
      dragType: "foundation",
      dragData,
    });
  };

  const handleFoundationDragEnd = () => {
    // Clear drag state when drag ends
    setDragState({
      isDragging: false,
      dragType: null,
    });
  };


  return (
    <div className="col-span-4 col-start-4 space-y-2">
      <div className="text-xs text-flexoki-base-700 dark:text-flexoki-base-300 text-center font-medium font-mono select-none">
        Foundations
      </div>
      <div className="grid grid-cols-4 gap-4">
        {suits.map((suit) => {
          const isValidTarget = isValidDropTarget("foundation", undefined, suit);
          return (
            <div
              key={suit}
              data-testid="foundation"
              data-suit={suit}
              data-count={gameState.foundations[suit].length}
              className={`cursor-pointer transition-all duration-200 ${
                isValidTarget ? "ring-2 ring-flexoki-blue-600 dark:ring-flexoki-blue-400 ring-offset-2 ring-offset-transparent rounded-sm" : ""
              }`}
              onDrop={(e) => handleFoundationDrop(e)}
              onDragOver={(e) => e.preventDefault()}
          >
            {gameState.foundations[suit].length === 0 ? (
              <Card.EmptyStack suit={suit} />
            ) : (
              <div
                draggable
                onDragStart={(e) => handleFoundationDragStart(e, suit)}
                onDragEnd={handleFoundationDragEnd}
                className="cursor-grab"
              >
                <Card
                  card={gameState.foundations[suit][gameState.foundations[suit].length - 1]}
                />
              </div>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
