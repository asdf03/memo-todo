import React, { useState, useEffect, memo, useCallback } from 'react'
import { Card } from '../../types'

interface CardViewDesktopProps {
  card: Card
  cardIndex: number
  onDelete: (cardId: string) => void
  onUpdate: (cardId: string, updatedCard: Partial<Card>) => void
  onDragStart: (e: React.DragEvent, card: Card, cardIndex: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetIndex: number) => void
  isDragOver?: boolean
}

const CardViewDesktop: React.FC<CardViewDesktopProps> = memo(({ 
  card, 
  cardIndex,
  onDelete, 
  onUpdate, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  isDragOver
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [titleInput, setTitleInput] = useState(card.title)
  const [descriptionInput, setDescriptionInput] = useState(card.description || '')
  const [isDragging, setIsDragging] = useState(false)
  
  // cardが変更されたらinputも更新
  useEffect(() => {
    setTitleInput(card.title)
    setDescriptionInput(card.description || '')
  }, [card.title, card.description])

  const handleSave = useCallback(() => {
    if (titleInput.trim()) {
      onUpdate(card.id, {
        title: titleInput.trim(),
        description: descriptionInput.trim() || undefined
      })
    } else {
      setTitleInput(card.title)
      setDescriptionInput(card.description || '')
    }
    setIsEditing(false)
  }, [titleInput, descriptionInput, onUpdate, card.title, card.description, card.id])

  const handleCancel = useCallback(() => {
    setTitleInput(card.title)
    setDescriptionInput(card.description || '')
    setIsEditing(false)
  }, [card.title, card.description])

  const handleCardClick = useCallback(() => {
    if (!isEditing) {
      setIsEditing(true)
    }
  }, [isEditing])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`カード「${card.title}」を削除しますか？`)) {
      onDelete(card.id)
    }
  }, [card.title, onDelete, card.id])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true)
    onDragStart(e, card, cardIndex)
  }, [card, onDragStart, cardIndex])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    onDragOver(e)
  }, [onDragOver])

  const handleDrop = useCallback((e: React.DragEvent) => {
    onDrop(e, cardIndex)
  }, [onDrop, cardIndex])

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  if (isEditing) {
    return (
      <div className="card-edit-desktop">
        <input
          className="card-title-input-desktop"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="カードのタイトル"
          autoFocus
        />
        <textarea
          className="card-description-input-desktop"
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          placeholder="説明（オプション）"
          rows={3}
        />
        <div className="card-edit-actions-desktop">
          <button className="save-btn-desktop" onClick={handleSave}>
            保存
          </button>
          <button className="cancel-btn-desktop" onClick={handleCancel}>
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`card-view-desktop ${isDragOver ? 'card-drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label={`カード: ${card.title}`}
      data-card-index={cardIndex}
    >
      <div className="card-content-desktop">
        <h4 className="card-title-desktop">
          {card.title}
        </h4>
        {card.description && (
          <p className="card-description-desktop">
            {card.description}
          </p>
        )}
        <div className="card-content-text-desktop" onDoubleClick={handleDoubleClick}>
          {card.description}
        </div>
      </div>
      <button 
        className="delete-card-btn-desktop"
        onClick={handleDeleteClick}
        aria-label="カードを削除"
      >
        ×
      </button>
    </div>
  )
})

export default CardViewDesktop 