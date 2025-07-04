import React, { useState, useEffect, memo, useCallback } from 'react'
import { Card } from '../types'
import MobileCardActions from './MobileCardActions'
import MobileOverlay from './MobileOverlay'
import './CardView.css'

interface CardViewProps {
  card: Card
  cardIndex: number
  listId: string
  onDelete: () => void
  onUpdate: (card: Partial<Card>) => void
  onDragStart?: (e: React.DragEvent, card: Card, cardIndex: number) => void
  onDragOver?: (e: React.DragEvent, cardIndex: number) => void
  onDrop?: (e: React.DragEvent, cardIndex: number) => void
  isDragOver?: boolean
}

const CardView: React.FC<CardViewProps> = memo(({ 
  card, 
  cardIndex, 
  listId,
  onDelete, 
  onUpdate, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  isDragOver 
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [titleInput, setTitleInput] = useState(card.title)
  const [descriptionInput, setDescriptionInput] = useState(card.description || '')
  
  // cardが変更されたらinputも更新
  useEffect(() => {
    setTitleInput(card.title)
    setDescriptionInput(card.description || '')
  }, [card.title, card.description])

  const handleSave = useCallback(() => {
    if (titleInput.trim()) {
      onUpdate({
        title: titleInput.trim(),
        description: descriptionInput.trim() || undefined
      })
    } else {
      setTitleInput(card.title)
      setDescriptionInput(card.description || '')
    }
    setIsEditing(false)
  }, [titleInput, descriptionInput, onUpdate, card.title, card.description])

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

  const handleLongPress = useCallback(() => {
    setShowMobileActions(true)
  }, [])

  // 長押し検出
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  
  const handleTouchStart = useCallback(() => {
    const timer = setTimeout(() => {
      handleLongPress()
    }, 500) // 500ms長押し
    setPressTimer(timer)
  }, [handleLongPress])

  const handleTouchEnd = useCallback(() => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
  }, [pressTimer])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`カード「${card.title}」を削除しますか？`)) {
      onDelete()
    }
  }, [card.title, onDelete])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    onDragStart?.(e, card, cardIndex)
  }, [onDragStart, card, cardIndex])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    onDragOver?.(e, cardIndex)
  }, [onDragOver, cardIndex])

  const handleDrop = useCallback((e: React.DragEvent) => {
    onDrop?.(e, cardIndex)
  }, [onDrop, cardIndex])

  if (isEditing) {
    return (
      <div className="card-edit">
        <input
          className="card-title-input"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="カードのタイトル"
          autoFocus
        />
        <textarea
          className="card-description-input"
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          placeholder="説明（オプション）"
          rows={3}
        />
        <div className="card-edit-actions">
          <button className="save-btn" onClick={handleSave}>
            保存
          </button>
          <button className="cancel-btn" onClick={handleCancel}>
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        className={`card-view ${isDragOver ? 'card-drag-over' : ''}`}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="card-content">
          <h4 className="card-title">
            {card.title}
          </h4>
          {card.description && (
            <p className="card-description">
              {card.description}
            </p>
          )}
        </div>
        <button 
          className="delete-card-btn desktop-only"
          onClick={handleDeleteClick}
        >
          ×
        </button>
        <button 
          className="mobile-card-menu mobile-only"
          onClick={(e) => {
            e.stopPropagation()
            setShowMobileActions(true)
          }}
        >
          ⋮
        </button>
      </div>
      
      <MobileOverlay 
        isOpen={showMobileActions} 
        onClose={() => setShowMobileActions(false)}
      >
        <MobileCardActions 
          card={card}
          currentListId={listId}
          onClose={() => setShowMobileActions(false)}
        />
      </MobileOverlay>
    </>
  )
})

export default CardView