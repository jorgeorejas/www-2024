import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';
import type { Card as CardType, DropData } from './types';
import { canPlaceOnFoundation } from './utils';

interface FoundationProps {
  foundations: CardType[][];
  onCardDrop?: (targetIndex: number) => void;
  isDragging?: boolean;
  draggedCard?: CardType | null;
  isEasyMode?: boolean;
}

const Foundation: React.FC<FoundationProps> = ({
  foundations,
  onCardDrop,
  isDragging = false,
  draggedCard = null,
  isEasyMode = false
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xs text-stone-500 dark:text-stone-400 font-mono select-none font-medium">
        Foundations
      </div>
      
      <div className="flex gap-2">
        {foundations.map((foundation, index) => (
          <FoundationPile 
            key={index} 
            foundation={foundation} 
            index={index}
            onCardDrop={onCardDrop}
            isDragging={isDragging}
            draggedCard={draggedCard}
            isEasyMode={isEasyMode}
          />
        ))}
      </div>
    </div>
  );
};

interface FoundationPileProps {
  foundation: CardType[];
  index: number;
  onCardDrop?: (targetIndex: number) => void;
  isDragging?: boolean;
  draggedCard?: CardType | null;
  isEasyMode?: boolean;
}

const FoundationPile: React.FC<FoundationPileProps> = ({
  foundation,
  index,
  onCardDrop,
  isDragging = false,
  draggedCard = null,
  isEasyMode = false
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `foundation-${index}`,
    data: {
      targetType: 'foundation',
      targetIndex: index
    } as DropData
  });

  const topCard = foundation.length > 0 ? foundation[foundation.length - 1] : null;
  
  // Check if this foundation can accept the dragged card (only in easy mode)
  const canAcceptDraggedCard = isEasyMode && isDragging && draggedCard && canPlaceOnFoundation(draggedCard, foundation);
  const shouldHighlight = canAcceptDraggedCard && !isOver;

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        {/* Foundation base (shows when empty) */}
        {!topCard && (
          <div 
            className={`
              absolute inset-0 
              w-full h-24 max-w-16 
              border-2 border-dashed border-stone-300 dark:border-stone-600 
              rounded-lg 
              flex items-center justify-center
              transition-all duration-200
              ${isOver ? 'border-stone-400 bg-stone-50 dark:bg-stone-800/20' : ''}
              ${shouldHighlight ? 'border-green-400 bg-green-50 dark:bg-green-900/20 shadow-lg' : ''}
            `}
            style={{ aspectRatio: '2/3' }}
          >
            <div className="text-stone-400 dark:text-stone-500 text-lg select-none">
              {index === 0 && '♠'}
              {index === 1 && '♥'}
              {index === 2 && '♦'}
              {index === 3 && '♣'}
            </div>
          </div>
        )}
        
        {/* Top card or empty slot */}
        <Card
          card={topCard}
          onClick={() => onCardDrop?.(index)}
          className={`
            transition-all duration-200
            ${isOver ? 'scale-105' : ''}
            ${!topCard ? 'opacity-0' : ''}
            ${shouldHighlight ? 'ring-2 ring-green-400 ring-offset-2' : ''}
          `}
        />
        
        {/* Drop zone overlay */}
        {isOver && (
          <div className="absolute inset-0 rounded-lg border-2 border-stone-400 bg-stone-100/20 dark:bg-stone-400/20" />
        )}
      </div>
      
      {foundation.length > 0 && (
        <div className="text-xs font-mono select-none text-stone-500 dark:text-stone-400">
          {foundation.length}/13
        </div>
      )}
    </div>
  );
};

export default Foundation;