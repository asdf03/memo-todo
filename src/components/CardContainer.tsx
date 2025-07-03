import React, { useState } from 'react'
import { List, Card } from '../types'
import CardView from './CardView'
import { useBoardOperations } from '../hooks/useBoardOperations'

interface CardContainerProps {
  list: List
  onCardDrop?: (card: Card, targetListId: string) => void
}

const CardContainer: React.FC<CardContainerProps> = ({ list, onCardDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [cardDragOverIndex, setCardDragOverIndex] = useState<number>(-1)
  const [, setDraggedCard] = useState<Card | null>(null)
  
  const { deleteCard, updateCard, reorderCards } = useBoardOperations()

  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(list.id, cardId)
  }

  const handleUpdateCard = async (cardId: string, updatedCard: any) => {
    await updateCard(list.id, cardId, updatedCard)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('text/card') && !e.dataTransfer.types.includes('text/list')) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
      setCardDragOverIndex(-1)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setCardDragOverIndex(-1)
    
    const cardData = e.dataTransfer.getData('application/json')
    const sourceListId = e.dataTransfer.getData('text/sourceList')
    
    if (cardData && !e.dataTransfer.types.includes('text/list') && e.dataTransfer.types.includes('text/card')) {
      try {
        const card = JSON.parse(cardData)
        
        if (sourceListId !== list.id) {
          await onCardDrop?.(card, list.id)
        }
      } catch (error) {
        console.error('Error parsing dropped card data:', error)
      }
    }
  }

  const handleCardDragStart = (e: React.DragEvent, card: Card) => {
    e.dataTransfer.setData('application/json', JSON.stringify(card))
    e.dataTransfer.setData('text/card', card.id)
    e.dataTransfer.setData('text/sourceList', list.id)
    setDraggedCard(card)
  }

  const handleCardDragOver = (e: React.DragEvent, cardIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer.types.includes('text/card') && !e.dataTransfer.types.includes('text/list')) {
      setCardDragOverIndex(cardIndex)
    }
  }

  const handleCardDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    const cardData = e.dataTransfer.getData('application/json')
    const sourceListId = e.dataTransfer.getData('text/sourceList')
    
    if (cardData && e.dataTransfer.types.includes('text/card') && !e.dataTransfer.types.includes('text/list')) {
      try {
        const droppedCard = JSON.parse(cardData)
        
        if (sourceListId === list.id) {
          const dragIndex = list.cards.findIndex(c => c.id === droppedCard.id)
          if (dragIndex !== -1 && dragIndex !== dropIndex) {
            await reorderCards(list.id, dragIndex, dropIndex)
          }
        } else {
          await onCardDrop?.(droppedCard, list.id)
        }
      } catch (error) {
        console.error('Error parsing dropped card data:', error)
      }
    }
    
    setDraggedCard(null)
    setCardDragOverIndex(-1)
  }

  return (
    <div 
      className={`cards-container ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {list.cards.map((card, cardIndex) => (
        <CardView
          key={card.id}
          card={card}
          cardIndex={cardIndex}
          isDragOver={cardDragOverIndex === cardIndex}
          onDelete={() => handleDeleteCard(card.id)}
          onUpdate={(updatedCard) => handleUpdateCard(card.id, updatedCard)}
          onDragStart={(e) => handleCardDragStart(e, card)}
          onDragOver={handleCardDragOver}
          onDrop={handleCardDrop}
        />
      ))}
    </div>
  )
}

export default CardContainer