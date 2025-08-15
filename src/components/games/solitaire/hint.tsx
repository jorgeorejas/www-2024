import { useState } from "react";
import { useSolitaire } from "./provider";
import type { MoveHint } from "./types";

export default function Hint() {
  const { getHint } = useSolitaire();
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
    if (score > 0) return "text-green-600";
    if (score < 0) return "text-red-600";
    return "text-zinc-600";
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-sm col-span-7">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span className="text-sm font-medium text-zinc-700">Hint</span>
          {hint && !isOpen && (
            <span className="text-xs text-zinc-500">
              ({hint.kind.replace("→", " → ").toLowerCase()})
            </span>
          )}
        </div>
        <div
          className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-zinc-200 p-4">
          {!hint ? (
            <div className="text-center text-zinc-600 text-sm py-2">
              🤔 No moves available right now
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-lg">💡</div>
                <div className="flex-1">
                  <div className="text-blue-900 font-medium text-sm mb-1">
                    Suggested Move
                  </div>
                  <div className="text-blue-800 text-sm mb-2">
                    {formatHint(hint)}
                  </div>
                  <div
                    className={`text-xs ${getScoreColor(hint.scoreDeltaEstimate)}`}
                  >
                    {getScoreText(hint.scoreDeltaEstimate)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
