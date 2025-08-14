import React, { useState, useCallback } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import GameControls from './GameControls';
import GameBoard from './GameBoard';
import Card from './Card';
import type { GameState, DragData, DropData, Card as CardType } from './types';
import { 
  initializeGame, 
  canPlaceOnFoundation, 
  canPlaceOnTableau, 
  checkWin 
} from './utils';

const SolitaireGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame('easy'));
  const [selectedCard, setSelectedCard] = useState<{card: CardType, dragData: DragData} | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null);

  const newGame = useCallback((difficulty: 'easy' | 'hard' = gameState.difficulty) => {
    setGameState(initializeGame(difficulty));
    setSelectedCard(null);
    setActiveId(null);
    setDraggedCard(null);
  }, [gameState.difficulty]);

  const drawFromStock = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev };
      const drawCount = prev.difficulty === 'easy' ? 1 : 3;
      
      if (newState.stock.length === 0) {
        // Reset stock from waste pile
        newState.stock = [...newState.waste.reverse()];
        newState.waste = [];
        newState.stock.forEach(card => card.faceUp = false);
      } else {
        // Draw cards from stock
        const drawnCards = newState.stock.splice(-Math.min(drawCount, newState.stock.length));
        drawnCards.forEach(card => card.faceUp = true);
        newState.waste.push(...drawnCards);
      }
      
      return newState;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current as DragData;
    
    setActiveId(active.id as string);
    
    // Find the dragged card (always show the top card in the overlay)
    let card: CardType | null = null;
    
    if (dragData.sourceType === 'waste') {
      const topWasteCard = gameState.waste[gameState.waste.length - 1];
      card = topWasteCard || null;
    } else if (dragData.sourceType === 'tableau') {
      const pile = gameState.tableau[dragData.sourceIndex];
      if (pile && dragData.cardIndex !== undefined) {
        card = pile[dragData.cardIndex] || null;
      }
    }
    
    setDraggedCard(card);
  }, [gameState]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedCard(null);
    
    if (!over) return;
    
    const dragData = active.data.current as DragData;
    const dropData = over.data.current as DropData;
    
    if (!dragData || !dropData) return;
    
    // Handle multi-card sequences from tableau
    if (dragData.sourceType === 'tableau' && dragData.cardSequence && dragData.cardSequence.length > 0) {
      const sequence = dragData.cardSequence;
      const firstCard = sequence[0];
      
      // Foundations only accept single cards
      if (dropData.targetType === 'foundation') {
        if (sequence.length === 1 && canPlaceOnFoundation(firstCard, gameState.foundations[dropData.targetIndex])) {
          // Move single card to foundation
          setGameState(prev => {
            const newState = { ...prev, moves: prev.moves + 1 };
            newState.foundations[dropData.targetIndex].push(firstCard);
            
            // Remove card from source tableau
            const sourcePile = newState.tableau[dragData.sourceIndex];
            sourcePile.splice(dragData.cardIndex!, 1);
            
            // Flip next card if exists and is face down
            if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
              sourcePile[sourcePile.length - 1].faceUp = true;
            }
            
            newState.gameWon = checkWin(newState.foundations);
            return newState;
          });
        }
        return;
      }
      
      // Check if sequence can be placed on tableau
      if (dropData.targetType === 'tableau' && canPlaceOnTableau(firstCard, gameState.tableau[dropData.targetIndex])) {
        // Move entire sequence to tableau
        setGameState(prev => {
          const newState = { ...prev, moves: prev.moves + 1 };
          newState.tableau[dropData.targetIndex].push(...sequence);
          
          // Remove sequence from source tableau
          const sourcePile = newState.tableau[dragData.sourceIndex];
          sourcePile.splice(dragData.cardIndex!, sequence.length);
          
          // Flip next card if exists and is face down
          if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
            sourcePile[sourcePile.length - 1].faceUp = true;
          }
          
          newState.gameWon = checkWin(newState.foundations);
          return newState;
        });
      }
      return;
    }
    
    // Handle single card moves (waste pile or single cards from tableau)
    let cardToMove: CardType | null = null;
    
    if (dragData.sourceType === 'waste') {
      cardToMove = gameState.waste[gameState.waste.length - 1] || null;
    } else if (dragData.sourceType === 'tableau') {
      const pile = gameState.tableau[dragData.sourceIndex];
      if (pile && dragData.cardIndex !== undefined) {
        cardToMove = pile[dragData.cardIndex] || null;
      }
    }
    
    if (!cardToMove) return;
    
    // Check if move is valid
    let canMove = false;
    
    if (dropData.targetType === 'foundation') {
      canMove = canPlaceOnFoundation(cardToMove, gameState.foundations[dropData.targetIndex]);
    } else if (dropData.targetType === 'tableau') {
      canMove = canPlaceOnTableau(cardToMove, gameState.tableau[dropData.targetIndex]);
    }
    
    if (!canMove) return;
    
    // Execute the move
    setGameState(prev => {
      const newState = { ...prev, moves: prev.moves + 1 };
      
      // Add card to destination
      if (dropData.targetType === 'foundation') {
        newState.foundations[dropData.targetIndex].push(cardToMove);
      } else if (dropData.targetType === 'tableau') {
        newState.tableau[dropData.targetIndex].push(cardToMove);
      }
      
      // Remove card from source
      if (dragData.sourceType === 'waste') {
        newState.waste.pop();
      } else if (dragData.sourceType === 'tableau') {
        const sourcePile = newState.tableau[dragData.sourceIndex];
        sourcePile.pop();
        // Flip next card if exists and is face down
        if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
          sourcePile[sourcePile.length - 1].faceUp = true;
        }
      }
      
      // Check for win
      newState.gameWon = checkWin(newState.foundations);
      
      return newState;
    });
  }, [gameState]);

  const handleCardSelect = useCallback((card: CardType, dragData: DragData) => {
    setSelectedCard({ card, dragData });
  }, []);

  const handleFoundationClick = useCallback((targetIndex: number) => {
    if (!selectedCard) return;
    
    const canMove = canPlaceOnFoundation(selectedCard.card, gameState.foundations[targetIndex]);
    if (!canMove) return;
    
    // Simulate drag end event
    const fakeEvent = {
      active: { id: selectedCard.card.id, data: { current: selectedCard.dragData } },
      over: { id: `foundation-${targetIndex}`, data: { current: { targetType: 'foundation', targetIndex } } },
      activatorEvent: null,
      collisions: null,
      delta: { x: 0, y: 0 }
    } as unknown as DragEndEvent;
    
    handleDragEnd(fakeEvent);
    setSelectedCard(null);
  }, [selectedCard, gameState, handleDragEnd]);

  const handleTableauClick = useCallback((targetIndex: number) => {
    if (!selectedCard) return;
    
    // For multi-card sequences, check if the first card can be placed
    const cardToCheck = selectedCard.dragData.cardSequence && selectedCard.dragData.cardSequence.length > 1 
      ? selectedCard.dragData.cardSequence[0] 
      : selectedCard.card;
    
    const canMove = canPlaceOnTableau(cardToCheck, gameState.tableau[targetIndex]);
    if (!canMove) return;
    
    // Simulate drag end event
    const fakeEvent = {
      active: { id: selectedCard.card.id, data: { current: selectedCard.dragData } },
      over: { id: `tableau-${targetIndex}`, data: { current: { targetType: 'tableau', targetIndex } } },
      activatorEvent: null,
      collisions: null,
      delta: { x: 0, y: 0 }
    } as unknown as DragEndEvent;
    
    handleDragEnd(fakeEvent);
    setSelectedCard(null);
  }, [selectedCard, gameState, handleDragEnd]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
        <GameControls
          difficulty={gameState.difficulty}
          moves={gameState.moves}
          gameWon={gameState.gameWon}
          onNewGame={newGame}
          onDifficultyChange={(difficulty) => newGame(difficulty)}
        />
        
        <GameBoard
          gameState={gameState}
          onStockClick={drawFromStock}
          onWasteCardSelect={handleCardSelect}
          onTableauCardSelect={handleCardSelect}
          onFoundationDrop={handleFoundationClick}
          onTableauDrop={handleTableauClick}
          selectedCardId={selectedCard?.card.id}
        />
        
        {/* Selected Card Info */}
        {selectedCard && !activeId && (
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Selected: <span className="font-medium">{selectedCard.card.rank === 1 ? 'A' : selectedCard.card.rank === 11 ? 'J' : selectedCard.card.rank === 12 ? 'Q' : selectedCard.card.rank === 13 ? 'K' : selectedCard.card.rank}</span>
              <span className="ml-1">
                {selectedCard.card.suit === 'hearts' ? '♥' : 
                 selectedCard.card.suit === 'diamonds' ? '♦' : 
                 selectedCard.card.suit === 'clubs' ? '♣' : '♠'}
              </span>
              {selectedCard.dragData.cardSequence && selectedCard.dragData.cardSequence.length > 1 && (
                <span className="ml-2 px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded text-xs font-medium">
                  +{selectedCard.dragData.cardSequence.length - 1} more
                </span>
              )}
              <span className="ml-2 text-blue-600 dark:text-blue-300">
                - Click a valid location to move or drag the {selectedCard.dragData.cardSequence && selectedCard.dragData.cardSequence.length > 1 ? 'sequence' : 'card'}
              </span>
            </p>
          </div>
        )}
      </div>
      
      {/* Drag Overlay */}
      <DragOverlay>
        {draggedCard ? (
          <Card
            card={draggedCard}
            className="rotate-6 scale-110"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SolitaireGame;