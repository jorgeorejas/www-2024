import Card from "./card";
import { useSolitaire } from "./provider";
import type { Suit } from "./types";

export default function Foundations() {
  const { gameState, moveWasteToFoundation, moveTableauToFoundation } = useSolitaire();

  const suits: Suit[] = ['H', 'C', 'D', 'S'];

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


  return (
    <div className="col-span-4 col-start-4 space-y-2">
      <div className="text-xs text-zinc-50 text-center font-medium font-mono select-none">
        Foundations
      </div>
      <div className="grid grid-cols-4 gap-4">
        {suits.map((suit) => (
          <div
            key={suit}
            className="cursor-pointer"
            onDrop={(e) => handleFoundationDrop(e)}
            onDragOver={(e) => e.preventDefault()}
          >
            {gameState.foundations[suit].length === 0 ? (
              <Card.EmptyStack suit={suit} />
            ) : (
              <Card
                card={gameState.foundations[suit][gameState.foundations[suit].length - 1]}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
