import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';
import type { Card as CardType, DragData, DropData } from './types';
import { getMovableSequence } from './utils';

interface TableauProps {
  tableau: CardType[][];
  onCardSelect?: (card: CardType, dragData: DragData) => void;
  onCardDrop?: (targetIndex: number) => void;
  selectedCardId?: string;
}

const Tableau: React.FC<TableauProps> = ({
  tableau,
  onCardSelect,
  onCardDrop,
  selectedCardId
}) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xs text-stone select-none-500 dark:text-stone-400 font-mono select-none font-medium">
        Tableau
      </div>
      
      <div className="w-full">
        <div className="flex gap-1 justify-center w-full">
          {tableau.map((pile, colIndex) => (
          <TableauColumn
            key={colIndex}
            pile={pile}
            colIndex={colIndex}
            onCardSelect={onCardSelect}
            onCardDrop={onCardDrop}
            selectedCardId={selectedCardId}
          />
          ))}
        </div>
      </div>
    </div>
  );
};

interface TableauColumnProps {
  pile: CardType[];
  colIndex: number;
  onCardSelect?: (card: CardType, dragData: DragData) => void;
  onCardDrop?: (targetIndex: number) => void;
  selectedCardId?: string;
}

const TableauColumn: React.FC<TableauColumnProps> = ({
  pile,
  colIndex,
  onCardSelect,
  onCardDrop,
  selectedCardId
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `tableau-${colIndex}`,
    data: {
      targetType: 'tableau',
      targetIndex: colIndex
    } as DropData
  });

  const isEmpty = pile.length === 0;
  const CARD_OFFSET = 18; // Smaller offset for mobile, will use responsive spacing

  return (
    <div 
      ref={setNodeRef}
      className="flex flex-col items-center min-h-32 flex-1"
    >
      {isEmpty ? (
        // Empty pile - only Kings can be placed
        <div 
          className={`
            w-full h-24 max-w-16 
            border-2 border-dashed border-stone-300 dark:border-stone-600 
            rounded-lg 
            flex items-center justify-center
            cursor-pointer
            transition-all duration-200
            ${isOver ? 'border-stone-400 bg-stone-50 dark:bg-stone-800/20' : ''}
          `}
          style={{ aspectRatio: '2/3' }}
          onClick={() => onCardDrop?.(colIndex)}
        >
          <div className="text-stone-400 dark:text-stone-500 text-xs font-mono select-none font-medium">
            King
          </div>
        </div>
      ) : (
        // Cards in pile
        <div className="relative">
          {pile.map((card, cardIndex) => {
            // Check if this card can start a moveable sequence
            const movableSequence = card.faceUp ? getMovableSequence(pile, cardIndex) : [];
            const canDrag = card.faceUp && movableSequence.length > 0;
            
            // Check if this card is part of a selected sequence
            const isInSelectedSequence = Boolean(selectedCardId && movableSequence.some(c => c.id === selectedCardId) && 
              movableSequence.findIndex(c => c.id === card.id) >= movableSequence.findIndex(c => c.id === selectedCardId));
            
            return (
              <Card
                key={card.id}
                card={card}
                onClick={() => {
                  if (card.faceUp && onCardSelect) {
                    onCardSelect(card, {
                      cardId: card.id,
                      sourceType: 'tableau',
                      sourceIndex: colIndex,
                      cardIndex,
                      cardSequence: movableSequence
                    });
                  }
                }}
                draggable={canDrag}
                dragData={
                  canDrag
                    ? {
                        cardId: card.id,
                        sourceType: 'tableau',
                        sourceIndex: colIndex,
                        cardIndex,
                        cardSequence: movableSequence
                      }
                    : undefined
                }
                isSelected={card.id === selectedCardId || isInSelectedSequence}
                className={`
                  ${cardIndex > 0 ? 'absolute' : 'relative'}
                  transition-all duration-200
                  ${!card.faceUp ? 'hover:scale-105' : ''}
                  ${isInSelectedSequence ? 'ring-2 ring-stone-400 ring-opacity-75' : ''}
                `}
                style={
                  cardIndex > 0
                    ? { top: `${cardIndex * CARD_OFFSET}px` }
                    : undefined
                }
              />
            );
          })}
          
          {/* Drop zone indicator for non-empty piles */}
          {isOver && (
            <div 
              className="absolute inset-x-0 rounded-lg border-2 border-stone-400 bg-stone-100/20 dark:bg-stone-400/20 w-full h-24 max-w-16"
              style={{
                top: `${pile.length * CARD_OFFSET}px`,
                aspectRatio: '2/3'
              }}
            />
          )}
        </div>
      )}
      
      {/* Column stats */}
      <div className="mt-2 text-xs font-mono select-none text-stone-500 dark:text-stone-400">
        {pile.length > 0 && `${pile.length} cards`}
        {pile.length === 0 && 'Empty'}
      </div>
    </div>
  );
};

export default Tableau;