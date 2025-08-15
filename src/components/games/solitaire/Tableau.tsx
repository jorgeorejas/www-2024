import Card from "./card";
import { useSolitaire } from "./provider";

export default function Tableau() {
  const {
    gameState,
    moveTableauToFoundation,
    moveTableauToTableau,
    moveWasteToTableau,
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

    // Store drag data
    e.dataTransfer.setData("text/plain", "tableau");
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        fromColumn: columnIndex,
        cardIndex,
        count,
        card,
      }),
    );
  };

  const handleWasteDrop = (targetColumn: number) => {
    moveWasteToTableau(targetColumn);
  };

  return (
    <div className="grid grid-cols-7 col-span-7 gap-4">
      {gameState.tableaus.map((tableau, columnIndex) => (
        <div
          key={columnIndex}
          className="col-span-1 min-h-32"
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
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {tableau.length === 0 ? (
            <div className="w-full aspect-5/7 border border-dashed border-zinc-700/50 rounded-sm flex items-center justify-center">
              <span className="text-zinc-700/50 text-lg">K</span>
            </div>
          ) : (
            tableau.map((card, cardIndex) => (
              <div
                key={card.id}
                className={`-mt-8 md:-mt-20 first:mt-0 ${card.faceUp ? "cursor-grab" : ""}`}
                draggable={card.faceUp}
                onDragStart={(e) =>
                  handleCardDragStart(e, columnIndex, cardIndex)
                }
                onClick={() => handleCardClick(columnIndex, cardIndex)}
                onDragEnd={() => {}}
              >
                <Card card={card} />
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
