import React, { useState, useCallback } from 'react'
import { Card, List } from '../../shared/types'
import CardView from './CardViewDesktop'
import { useBoardOperations } from '../../shared/hooks/useBoardOperations'

interface CardContainerProps {
  list: List
  onCardDrop?: (card: Card, targetListId: string, targetIndex?: number) => void
}

const CardContainer: React.FC<CardContainerProps> = ({ list, onCardDrop }) => {
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)
  const { deleteCard, updateCard } = useBoardOperations()

  const handleCardDragStart = useCallback((e: React.DragEvent, card: Card) => {
    setDraggedCard(card)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/card', card.id)
    e.dataTransfer.setData('application/json', JSON.stringify(card))
  }, [])

  const handleCardDragEnd = useCallback(() => {
    setDraggedCard(null)
    setDragOverIndex(-1)
  }, [])

  const handleCardDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('text/card')) {
      setDragOverIndex(index)
    }
  }, [])

  const handleCardDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    try {
      const cardData = e.dataTransfer.getData('application/json')
      if (cardData) {
        const card: Card = JSON.parse(cardData)
        if (onCardDrop) {
          await onCardDrop(card, list.id, dropIndex)
        }
      }
    } catch (error) {
      console.error('Failed to drop card:', error)
    }
    
    setDragOverIndex(-1)
    setDraggedCard(null)
  }, [list.id, onCardDrop])

  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('text/card')) {
      setDragOverIndex(list.cards.length)
    }
  }, [list.cards.length])

  const handleContainerDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    
    try {
      const cardData = e.dataTransfer.getData('application/json')
      if (cardData) {
        const card: Card = JSON.parse(cardData)
        if (onCardDrop) {
          await onCardDrop(card, list.id, list.cards.length)
        }
      }
    } catch (error) {
      console.error('Failed to drop card in container:', error)
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
    <div 
      className={`cards-container ${dragOverIndex === list.cards.length ? 'drag-over' : ''}`}
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
    >
      {list.cards.map((card, index) => (
        <div
          key={card.id}
          className={`card-wrapper ${dragOverIndex === index ? 'drag-over' : ''}`}
          onDragOver={(e) => handleCardDragOver(e, index)}
          onDrop={(e) => handleCardDrop(e, index)}
        >
          <CardView
            card={card}
            isDragging={draggedCard?.id === card.id}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
            onDelete={handleDeleteCard}
            onUpdate={handleUpdateCard}
          />
        </div>
      ))}
    </div>
  )
}

export default CardContainer