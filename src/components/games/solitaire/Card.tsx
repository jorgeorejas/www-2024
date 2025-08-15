import React from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Card as CardType, DragData } from "./types";
import { SUIT_SYMBOLS, getCardDisplayRank, getCardColorClass } from "./utils";

interface CardProps {
  card: CardType | null;
  faceUp?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  dragData?: DragData;
  isSelected?: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  faceUp = true,
  onClick,
  className = "",
  style,
  draggable = false,
  dragData,
  isSelected = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndIsDragging,
  } = useDraggable({
    id: card?.id || "empty",
    data: dragData,
    disabled: !draggable || !card?.faceUp,
  });

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Disable native drag ghost - hide the original element when dragging
  const dragStyle = dndIsDragging
    ? {
        ...transformStyle,
        opacity: 0,
        visibility: "hidden" as const,
      }
    : transformStyle;

  // Empty card slot
  if (!card) {
    return (
      <div
        className={`
          w-full h-24 max-w-16
          border-2 border-dashed border-stone-300 dark:border-stone-600
          rounded-lg
          ${className}
        `}
        style={{ aspectRatio: "2/3", ...style, ...dragStyle }}
        onClick={onClick}
      />
    );
  }

  const displayRank = getCardDisplayRank(card.rank);
  const colorClass = getCardColorClass(card);

  // Face-down card
  if (!faceUp || !card.faceUp) {
    return (
      <div
        ref={draggable ? setNodeRef : undefined}
        className={`
          w-full h-24 max-w-16
          bg-linear-to-br from-stone-600 to-stone-800
          border border-stone-300 dark:border-stone-600
          rounded-lg
          cursor-pointer
          transition-all duration-200
          hover:shadow-md
          shadow
          ${className}
        `}
        onClick={onClick}
        style={{ aspectRatio: "2/3", ...style, ...dragStyle }}
        {...(draggable ? { ...listeners, ...attributes } : {})}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-xs text-white opacity-50 font-mono select-none">
            ♠♥♦♣
          </div>
        </div>
      </div>
    );
  }

  // Face-up card
  return (
    <div
      ref={draggable ? setNodeRef : undefined}
      className={`
        w-full h-24 max-w-16
        bg-white dark:bg-stone-100
        border border-stone-300 dark:border-stone-400
        rounded-lg
        cursor-pointer
        transition-all duration-200
        hover:shadow-lg hover:scale-105
        shadow
        ${isSelected ? "ring-2 ring-stone-500 ring-offset-2" : ""}
        ${className}
      `}
      onClick={onClick}
      style={{ aspectRatio: "2/3", ...style, ...dragStyle }}
      {...(draggable ? { ...listeners, ...attributes } : {})}
    >
      <div className="p-1 h-full flex flex-col justify-between">
        {/* Top left rank and suit */}
        <div
          className={`text-xs font-mono select-none font-bold leading-none ${colorClass}`}
        >
          <div>{displayRank}</div>
          <div>{SUIT_SYMBOLS[card.suit]}</div>
        </div>

        {/* Center suit symbol */}
        <div
          className={`text-2xl font-mono select-none text-center leading-none ${colorClass}`}
        >
          {SUIT_SYMBOLS[card.suit]}
        </div>

        {/* Bottom right rank and suit (rotated) */}
        <div
          className={`text-xs font-mono select-none font-bold leading-none ${colorClass} text-right transform rotate-180`}
        >
          <div>{displayRank}</div>
          <div>{SUIT_SYMBOLS[card.suit]}</div>
        </div>
      </div>
    </div>
  );
};

export default Card;
