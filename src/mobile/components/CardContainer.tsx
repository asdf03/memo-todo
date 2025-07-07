import React, { useState, useCallback } from 'react'
import { Card, List } from '../../shared/types'
import CardView from './CardViewMobile'
import { useBoardOperations } from '../../shared/hooks/useBoardOperations'

interface CardContainerProps {
  list: List
  onCardDrop?: (card: Card, targetListId: string, targetIndex?: number) => void
}

const CardContainer: React.FC<CardContainerProps> = ({ list, onCardDrop }) => {
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)
  const { deleteCard, updateCard } = useBoardOperations()

  const handleCardDragStart = useCallback((card: Card) => {
    setDraggedCard(card)
  }, [])

  const handleCardDragEnd = useCallback(() => {
    setDraggedCard(null)
    setDragOverIndex(-1)
  }, [])

  const handleCardDragOver = useCallback((index: number) => {
    setDragOverIndex(index)
  }, [])

  const handleCardDrop = useCallback(async (card: Card, dropIndex: number) => {
    if (onCardDrop) {
      await onCardDrop(card, list.id, dropIndex)
    }
    setDragOverIndex(-1)
    setDraggedCard(null)
  }, [list.id, onCardDrop])

  const handleContainerDrop = useCallback(async (card: Card) => {
    if (onCardDrop) {
      await onCardDrop(card, list.id, list.cards.length)
    }
    setDragOverIndex(-1)
    setDraggedCard(null)
  }, [list.id, list.cards.length, onCardDrop])

  const handleDeleteCard = useCallback(async (cardId: string) => {
    if (confirm('このカードを削除しますか？')) {
      await deleteCard(cardId)
    }
  }, [deleteCard])

  const handleUpdateCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    await updateCard(cardId, updates)
  }, [updateCard])

  return (
    <div className={`cards-container-mobile ${dragOverIndex === list.cards.length ? 'drag-over' : ''}`}>
      {list.cards.map((card, index) => (
        <div
          key={card.id}
          className={`card-wrapper-mobile ${dragOverIndex === index ? 'drag-over' : ''}`}
        >
          <CardView
            card={card}
            isDragging={draggedCard?.id === card.id}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
            onCardDragOver={handleCardDragOver}
            onCardDrop={handleCardDrop}
            onContainerDrop={handleContainerDrop}
            onDelete={handleDeleteCard}
            onUpdate={handleUpdateCard}
            cardIndex={index}
          />
        </div>
      ))}
    </div>
  )
}

export default CardContainer