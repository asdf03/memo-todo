import React, { useState, memo, useCallback } from 'react'
import { Card } from '../../types'

interface CardViewProps {
  card: Card
  isDragging?: boolean
  onCardDragStart?: (e: React.DragEvent, card: Card) => void
  onCardDragEnd?: () => void
  onDelete?: (cardId: string) => void
  onUpdate?: (cardId: string, updates: Partial<Card>) => void
}

const CardView: React.FC<CardViewProps> = memo(({ 
  card, 
  isDragging = false, 
  onCardDragStart, 
  onCardDragEnd, 
  onDelete, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [titleInput, setTitleInput] = useState(card.title)

  const handleTitleSave = useCallback(async () => {
    if (titleInput.trim() && titleInput !== card.title) {
      try {
        onUpdate?.(card.id, { title: titleInput.trim() })
      } catch (error) {
        console.error('Failed to update card:', error)
        setTitleInput(card.title)
      }
    }
    setIsEditing(false)
  }, [titleInput, card.title, card.id, onUpdate])

  const handleTitleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setTitleInput(card.title)
      setIsEditing(false)
    }
  }, [handleTitleSave, card.title])

  const handleDelete = useCallback(() => {
    if (confirm('このカードを削除しますか？')) {
      onDelete?.(card.id)
    }
  }, [card.id, onDelete])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    onCardDragStart?.(e, card)
  }, [card, onCardDragStart])

  return (
    <div 
      className={`card ${isDragging ? 'dragging' : ''}`}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={onCardDragEnd}
      data-card-id={card.id}
    >
      {isEditing ? (
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyPress}
          className="card-title-input"
          autoFocus
          maxLength={200}
        />
      ) : (
        <div 
          className="card-title" 
          onClick={() => setIsEditing(true)}
        >
          {card.title}
        </div>
      )}
      <button 
        className="delete-card-btn"
        onClick={handleDelete}
        aria-label="カードを削除"
      >
        ×
      </button>
    </div>
  )
})

export default CardView