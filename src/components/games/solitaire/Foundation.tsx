import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';
import type { Card as CardType, DropData } from './types';

interface FoundationProps {
  foundations: CardType[][];
  onCardDrop?: (targetIndex: number) => void;
}

const Foundation: React.FC<FoundationProps> = ({
  foundations,
  onCardDrop
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Foundations
      </div>
      
      <div className="flex gap-1 sm:gap-2">
        {foundations.map((foundation, index) => (
          <FoundationPile 
            key={index} 
            foundation={foundation} 
            index={index}
            onCardDrop={onCardDrop}
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
}

const FoundationPile: React.FC<FoundationPileProps> = ({
  foundation,
  index,
  onCardDrop
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `foundation-${index}`,
    data: {
      targetType: 'foundation',
      targetIndex: index
    } as DropData
  });

  const topCard = foundation.length > 0 ? foundation[foundation.length - 1] : null;

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        {/* Foundation base (shows when empty) */}
        {!topCard && (
          <div className={`
            absolute inset-0 
            w-12 h-18 sm:w-16 sm:h-24 
            border-2 border-dashed border-gray-300 dark:border-gray-600 
            rounded-lg 
            flex items-center justify-center
            transition-all duration-200
            ${isOver ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : ''}
          `}>
            <div className="text-gray-400 dark:text-gray-500 text-lg">
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
          `}
        />
        
        {/* Drop zone overlay */}
        {isOver && (
          <div className="absolute inset-0 rounded-lg border-2 border-green-400 bg-green-100/20 dark:bg-green-400/20" />
        )}
      </div>
      
      {foundation.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {foundation.length}/13
        </div>
      )}
    </div>
  );
};

export default Foundation;