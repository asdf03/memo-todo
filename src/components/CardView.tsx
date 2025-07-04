import React, { useState, useEffect, memo, useCallback } from 'react'
import { Card } from '../types'
import { useTouchDrag } from '../hooks/useTouchDrag'
import { useBoardOperations } from '../hooks/useBoardOperations'
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
  const [titleInput, setTitleInput] = useState(card.title)
  const [descriptionInput, setDescriptionInput] = useState(card.description || '')
  const [isDragMode, setIsDragMode] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const { moveCard } = useBoardOperations()
  
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


  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`カード「${card.title}」を削除しますか？`)) {
      onDelete()
    }
  }, [card.title, onDelete])

  // タッチドラッグ機能
  const touchDrag = useTouchDrag({
    onDragStart: () => {
      setIsDragMode(true)
    },
    onDragMove: (_, deltaX, deltaY) => {
      setDragOffset({ x: deltaX, y: deltaY })
    },
    onDragEnd: (_, endX, endY) => {
      // ドロップ位置の要素を取得
      const elementBelow = document.elementFromPoint(endX, endY)
      if (elementBelow) {
        // リストコンテナを探す
        const listContainer = elementBelow.closest('[data-list-id]')
        if (listContainer) {
          const targetListId = listContainer.getAttribute('data-list-id')
          if (targetListId && targetListId !== listId) {
            moveCard(card, targetListId)
          }
        }
      }
      
      // リセット
      setIsDragMode(false)
      setDragOffset({ x: 0, y: 0 })
    },
    dragThreshold: 15
  })

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
        className={`card-view ${isDragOver ? 'card-drag-over' : ''} ${isDragMode ? 'touch-dragging' : ''}`}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={isDragMode ? undefined : handleCardClick}
        onTouchStart={touchDrag.onTouchStart}
        onTouchMove={touchDrag.onTouchMove}
        onTouchEnd={touchDrag.onTouchEnd}
        style={{
          transform: isDragMode ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'none',
          zIndex: isDragMode ? 1000 : 'auto',
          opacity: isDragMode ? 0.8 : 1
        }}
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
          className="delete-card-btn"
          onClick={handleDeleteClick}
        >
          ×
        </button>
      </div>
      
    </>
  )
})

export default CardView