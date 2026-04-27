import { useState } from "react";
import { useSolitaire } from "./provider";
import type { MoveHint } from "./types";

export default function Hint() {
  const { 
    getHint, 
    draw, 
    recycle, 
    moveWasteToFoundation, 
    moveWasteToTableau, 
    moveTableauToFoundation, 
    moveTableauToTableau, 
    moveFoundationToTableau 
  } = useSolitaire();
  const [isOpen, setIsOpen] = useState(false);

  const hint = getHint();

  const formatHint = (hint: MoveHint): string => {
    switch (hint.kind) {
      case "DRAW":
        return "💡 Draw cards from the stock pile";

      case "RECYCLE":
        return "♻️ Recycle the waste pile back to stock";

      case "WASTE→FOUNDATION":
        return "⬆️ Move the top waste card to its foundation";

      case "WASTE→TABLEAU":
        return `➡️ Move the top waste card to column ${hint.to! + 1}`;

      case "TABLEAU→FOUNDATION":
        return `⬆️ Move the top card from column ${hint.from! + 1} to its foundation`;

      case "TABLEAU→TABLEAU":
        const cardText = hint.count === 1 ? "card" : `${hint.count} cards`;
        return `↔️ Move ${cardText} from column ${hint.from! + 1} to column ${hint.to! + 1}`;

      case "FOUNDATION→TABLEAU":
        const suitSymbol = getSuitSymbol(hint.suit!);
        return `⬇️ Move the top ${suitSymbol} foundation card to column ${hint.to! + 1}`;

      default:
        return "❓ Unknown move suggestion";
    }
  };

  const getSuitSymbol = (suit: string): string => {
    switch (suit) {
      case "S":
        return "♠";
      case "H":
        return "♥";
      case "D":
        return "♦";
      case "C":
        return "♣";
      default:
        return suit;
    }
  };

  const getScoreText = (score: number): string => {
    if (score > 0) return `+${score} points`;
    if (score < 0) return `${score} points`;
    return "No points";
  };

  const getScoreColor = (score: number): string => {
    if (score > 0) return "text-flexoki-green-600 dark:text-flexoki-green-400 font-medium";
    if (score < 0) return "text-flexoki-red-600 dark:text-flexoki-red-400";
    return "text-flexoki-base-600 dark:text-flexoki-base-400";
  };

  const applyHint = (hint: MoveHint) => {
    switch (hint.kind) {
      case "DRAW":
        draw();
        break;
      
      case "RECYCLE":
        recycle();
        break;
      
      case "WASTE→FOUNDATION":
        moveWasteToFoundation();
        break;
      
      case "WASTE→TABLEAU":
        if (hint.to !== undefined) {
          moveWasteToTableau(hint.to);
        }
        break;
      
      case "TABLEAU→FOUNDATION":
        if (hint.from !== undefined) {
          moveTableauToFoundation(hint.from);
        }
        break;
      
      case "TABLEAU→TABLEAU":
        if (hint.from !== undefined && hint.to !== undefined && hint.count !== undefined) {
          moveTableauToTableau(hint.from, hint.to, hint.count);
        }
        break;
      
      case "FOUNDATION→TABLEAU":
        if (hint.suit !== undefined && hint.to !== undefined) {
          moveFoundationToTableau(hint.suit as "S" | "H" | "D" | "C", hint.to);
        }
        break;
    }
    
    // Close the hint panel after applying
    setIsOpen(false);
  };

  return (
    <div className="border border-flexoki-base-200 dark:border-flexoki-base-800 col-span-7">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:text-flexoki-ink dark:hover:text-flexoki-base-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg text-flexoki-yellow-600 dark:text-flexoki-yellow-400">◆</span>
          <span className="text-sm font-medium text-flexoki-ink dark:text-flexoki-base-100">Hint</span>
          {hint && !isOpen && (
            <span className="text-xs text-flexoki-base-500 dark:text-flexoki-base-500">
              ({hint.kind.replace("→", " → ").toLowerCase()})
            </span>
          )}
        </div>
        <div
          className={`text-flexoki-base-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-flexoki-base-200 dark:border-flexoki-base-800 p-4">
          {!hint ? (
            <div className="text-center text-flexoki-base-600 dark:text-flexoki-base-400 text-sm py-2">
              No moves available right now.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-flexoki-yellow-600 dark:text-flexoki-yellow-400 text-lg">◆</div>
                <div className="flex-1">
                  <div className="text-flexoki-ink dark:text-flexoki-base-50 font-medium text-sm mb-1">
                    Suggested Move
                  </div>
                  <div className="text-flexoki-base-700 dark:text-flexoki-base-300 text-sm mb-2">
                    {formatHint(hint)}
                  </div>
                  <div
                    className={`text-xs ${getScoreColor(hint.scoreDeltaEstimate)}`}
                  >
                    {getScoreText(hint.scoreDeltaEstimate)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => applyHint(hint)}
                  className="px-3 py-1 text-flexoki-ink dark:text-flexoki-base-50 border border-flexoki-ink dark:border-flexoki-base-100 font-medium text-sm hover:border-flexoki-ink dark:hover:border-flexoki-base-50 transition-colors"
                >
                  Apply Hint
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
