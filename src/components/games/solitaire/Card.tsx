import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card as CardType, DragData } from './types';
import { SUIT_SYMBOLS, getCardDisplayRank, getCardColorClass } from './utils';

interface CardProps {
  card: CardType | null;
  faceUp?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  draggable?: boolean;
  dragData?: DragData;
  isSelected?: boolean;
  isDragging?: boolean;
}

const Card: React.FC<CardProps> = ({
  card,
  faceUp = true,
  onClick,
  className = '',
  style,
  draggable = false,
  dragData,
  isSelected = false,
  isDragging = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndIsDragging,
  } = useDraggable({
    id: card?.id || 'empty',
    data: dragData,
    disabled: !draggable || !card?.faceUp
  });

  const transformStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Empty card slot
  if (!card) {
    return (
      <div 
        className={`
          w-16 h-24 
          border-2 border-dashed border-gray-300 dark:border-gray-600 
          rounded-lg 
          ${className}
        `} 
        style={style}
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
          w-16 h-24 
          bg-gradient-to-br from-blue-500 to-blue-700 
          border border-gray-300 dark:border-gray-600 
          rounded-lg 
          cursor-pointer 
          transition-all duration-200
          hover:shadow-md
          ${isDragging || dndIsDragging ? 'opacity-50 scale-105' : ''}
          ${className}
        `}
        onClick={onClick}
        style={{ ...style, ...transformStyle }}
        {...(draggable ? { ...listeners, ...attributes } : {})}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-xs text-white opacity-50 font-mono">
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
        w-16 h-24 
        bg-white dark:bg-gray-100 
        border border-gray-300 dark:border-gray-400 
        rounded-lg 
        cursor-pointer 
        transition-all duration-200
        hover:shadow-lg hover:scale-105
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isDragging || dndIsDragging ? 'opacity-50 scale-110 z-50' : ''}
        ${className}
      `}
      onClick={onClick}
      style={{ ...style, ...transformStyle }}
      {...(draggable ? { ...listeners, ...attributes } : {})}
    >
      <div className="p-1 h-full flex flex-col justify-between">
        {/* Top left rank and suit */}
        <div className={`text-xs font-bold leading-none ${colorClass}`}>
          <div>{displayRank}</div>
          <div>{SUIT_SYMBOLS[card.suit]}</div>
        </div>
        
        {/* Center suit symbol */}
        <div className={`text-2xl text-center leading-none ${colorClass}`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
        
        {/* Bottom right rank and suit (rotated) */}
        <div className={`text-xs font-bold leading-none ${colorClass} text-right transform rotate-180`}>
          <div>{displayRank}</div>
          <div>{SUIT_SYMBOLS[card.suit]}</div>
        </div>
      </div>
    </div>
  );
};

export default Card;