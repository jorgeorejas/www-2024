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

  // Short name of each kind of move, shown next to "Pista" while it's closed
  const KIND_LABEL: Record<MoveHint["kind"], string> = {
    DRAW: "robar",
    RECYCLE: "dar la vuelta al mazo",
    "WASTE→FOUNDATION": "descarte → base",
    "WASTE→TABLEAU": "descarte → columna",
    "TABLEAU→FOUNDATION": "columna → base",
    "TABLEAU→TABLEAU": "columna → columna",
    "FOUNDATION→TABLEAU": "base → columna",
  };

  const formatHint = (hint: MoveHint): string => {
    switch (hint.kind) {
      case "DRAW":
        return "💡 Roba cartas del mazo";

      case "RECYCLE":
        return "♻️ Pasa el descarte otra vez al mazo";

      case "WASTE→FOUNDATION":
        return "⬆️ Sube la carta del descarte a su base";

      case "WASTE→TABLEAU":
        return `➡️ Mueve la carta del descarte a la columna ${hint.to! + 1}`;

      case "TABLEAU→FOUNDATION":
        return `⬆️ Sube la última carta de la columna ${hint.from! + 1} a su base`;

      case "TABLEAU→TABLEAU": {
        const cardText = hint.count === 1 ? "la carta" : `${hint.count} cartas`;
        return `↔️ Mueve ${cardText} de la columna ${hint.from! + 1} a la ${hint.to! + 1}`;
      }

      case "FOUNDATION→TABLEAU": {
        const suitSymbol = getSuitSymbol(hint.suit!);
        return `⬇️ Baja la carta de la base de ${suitSymbol} a la columna ${hint.to! + 1}`;
      }

      default:
        return "❓ Jugada desconocida";
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
    const points = Math.abs(score) === 1 ? "punto" : "puntos";
    if (score > 0) return `+${score} ${points}`;
    if (score < 0) return `${score} ${points}`;
    return "Sin puntos";
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
    <div
      data-testid="solitaire-hint"
      data-hint-kind={hint?.kind ?? ""}
      className="border border-flexoki-base-200 dark:border-flexoki-base-800 col-span-7"
    >
      <button
        data-testid="solitaire-hint-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:text-flexoki-ink dark:hover:text-flexoki-base-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg text-flexoki-yellow-600 dark:text-flexoki-yellow-400">◆</span>
          <span className="text-sm font-medium text-flexoki-ink dark:text-flexoki-base-100">Pista</span>
          {hint && !isOpen && (
            <span className="text-xs text-flexoki-base-500 dark:text-flexoki-base-500">
              ({KIND_LABEL[hint.kind] ?? hint.kind.toLowerCase()})
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
              Ahora mismo no hay ninguna jugada.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-flexoki-yellow-600 dark:text-flexoki-yellow-400 text-lg">◆</div>
                <div className="flex-1">
                  <div className="text-flexoki-ink dark:text-flexoki-base-50 font-medium text-sm mb-1">
                    Jugada sugerida
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
                  data-testid="solitaire-hint-apply"
                  onClick={() => applyHint(hint)}
                  className="px-3 py-1 text-flexoki-ink dark:text-flexoki-base-50 border border-flexoki-ink dark:border-flexoki-base-100 font-medium text-sm hover:border-flexoki-ink dark:hover:border-flexoki-base-50 transition-colors"
                >
                  Aplicar pista
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
