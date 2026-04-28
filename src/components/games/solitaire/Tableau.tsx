import { useRef } from "react";
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

  const dragGhostRef = useRef<HTMLElement | null>(null);

  const handleCardDragStart = (
    e: React.DragEvent,
    columnIndex: number,
    cardIndex: number,
  ) => {
    const tableau = gameState.tableaus[columnIndex];
    const card = tableau[cardIndex];

    if (!card.faceUp) return;

    // Expand back to the lowest contiguous face-up card so grabbing the
    // visible top card drags the whole face-up sub-pile, not just the one
    // card under the cursor. Splitting still works: grabbing a non-top
    // face-up card drags from there onward (its index is not the bottom of
    // the face-up run, so this loop is a no-op for that case).
    let dragIndex = cardIndex;
    while (dragIndex > 0 && tableau[dragIndex - 1].faceUp) {
      dragIndex -= 1;
    }
    const count = tableau.length - dragIndex;

    const dragData = {
      fromColumn: columnIndex,
      cardIndex: dragIndex,
      count,
      card: tableau[dragIndex],
    };

    // Store drag data
    e.dataTransfer.setData("text/plain", "tableau");
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));

    // Custom drag image: clone the whole sub-pile so the user sees a stack
    // following the cursor, not a single card.
    if (count > 1) {
      const cardEl = e.currentTarget as HTMLElement;
      const columnEl = cardEl.parentElement;
      if (columnEl) {
        const ghost = document.createElement("div");
        ghost.style.position = "fixed";
        ghost.style.top = "-1000px";
        ghost.style.left = "-1000px";
        ghost.style.width = `${cardEl.offsetWidth}px`;
        ghost.style.pointerEvents = "none";
        ghost.style.opacity = "0.92";
        const siblings = Array.from(columnEl.children).slice(dragIndex);
        for (const node of siblings) {
          ghost.appendChild(node.cloneNode(true));
        }
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, cardEl.offsetWidth / 2, 20);
        dragGhostRef.current = ghost;
      }
    }

    // Update drag state for highlighting
    setDragState({
      isDragging: true,
      dragType: "tableau",
      dragData,
    });
  };

  const handleCardDragEnd = () => {
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
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
            data-testid="tableau"
            data-column={columnIndex}
            data-count={tableau.length}
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
