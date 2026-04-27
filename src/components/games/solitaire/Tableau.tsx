import Card from "./Card";
import { useSolitaire } from "./provider";
import type { Card as CardType } from "./types";

export default function Tableau() {
  const {
    gameState,
    moveTableauToFoundation,
    moveTableauToTableau,
    moveWasteToTableau,
    moveFoundationToTableau,
    setDragState,
    isValidDropTarget,
  } = useSolitaire();

  const handleCardClick = (columnIndex: number, cardIndex: number) => {
    const tableau = gameState.tableaus[columnIndex];
    const card = tableau[cardIndex];

    // Only handle face-up cards
    if (!card.faceUp) return;

    // Double-click to auto-move to foundation
    moveTableauToFoundation(columnIndex);
  };

  const handleCardDragStart = (
    e: React.DragEvent,
    columnIndex: number,
    cardIndex: number,
  ) => {
    const tableau = gameState.tableaus[columnIndex];
    const card = tableau[cardIndex];

    if (!card.faceUp) return;

    // Calculate how many cards can be moved (valid sequence from this card to end)
    const count = tableau.length - cardIndex;

    const dragData = {
      fromColumn: columnIndex,
      cardIndex,
      count,
      card,
    };

    // Store drag data
    e.dataTransfer.setData("text/plain", "tableau");
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));

    // Update drag state for highlighting
    setDragState({
      isDragging: true,
      dragType: "tableau",
      dragData,
    });
  };

  const handleCardDragEnd = () => {
    // Clear drag state when drag ends
    setDragState({
      isDragging: false,
      dragType: null,
    });
  };

  const handleWasteDrop = (targetColumn: number) => {
    moveWasteToTableau(targetColumn);
  };

  return (
    <div className="grid grid-cols-7 col-span-7 gap-4">
      {gameState.tableaus.map((tableau: CardType[], columnIndex: number) => {
        const isValidTarget = isValidDropTarget("tableau", columnIndex);
        return (
          <div
            key={columnIndex}
            className="col-span-1 min-h-[400px] md:min-h-[500px] lg:min-h-[600px]"
          onDrop={(e) => {
            e.preventDefault();
            const dragType = e.dataTransfer.getData("text/plain");
            if (dragType === "waste") {
              handleWasteDrop(columnIndex);
            } else if (dragType === "tableau") {
              try {
                const dragData = JSON.parse(
                  e.dataTransfer.getData("application/json"),
                );
                if (dragData.fromColumn !== columnIndex) {
                  moveTableauToTableau(
                    dragData.fromColumn,
                    columnIndex,
                    dragData.count,
                  );
                }
              } catch (error) {
                console.warn("Failed to parse drag data:", error);
              }
            } else if (dragType === "foundation") {
              try {
                const dragData = JSON.parse(
                  e.dataTransfer.getData("application/json"),
                );
                moveFoundationToTableau(dragData.suit, columnIndex);
              } catch (error) {
                console.warn("Failed to parse foundation drag data:", error);
              }
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {tableau.length === 0 ? (
            <div className={`w-full aspect-5/7 border border-dashed border-flexoki-base-300 dark:border-flexoki-base-700 rounded-sm flex items-center justify-center transition-all duration-200 ${
              isValidTarget ? "ring-2 ring-flexoki-blue-600 dark:ring-flexoki-blue-400 ring-offset-2 ring-offset-transparent rounded-sm" : ""
            }`}>
              <span className="text-flexoki-base-400 text-lg">K</span>
            </div>
          ) : (
            tableau.map((card: CardType, cardIndex: number) => {
              const isTopCard = cardIndex === tableau.length - 1;
              return (
                <div
                  key={card.id}
                  className={`-mt-8 md:-mt-20 first:mt-0 ${card.faceUp ? "cursor-grab" : ""} transition-all duration-200 ${
                    isTopCard && isValidTarget ? "ring-2 ring-flexoki-blue-600 dark:ring-flexoki-blue-400 ring-offset-2 ring-offset-transparent rounded-sm" : ""
                  }`}
                  draggable={card.faceUp}
                  onDragStart={(e) =>
                    handleCardDragStart(e, columnIndex, cardIndex)
                  }
                  onClick={() => handleCardClick(columnIndex, cardIndex)}
                  onDragEnd={handleCardDragEnd}
                >
                  <Card card={card} />
                </div>
              );
            })
          )}
        </div>
        );
      })}
    </div>
  );
}
