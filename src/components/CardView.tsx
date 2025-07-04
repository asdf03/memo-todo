import React, { useState, useEffect, memo, useCallback } from 'react'
import { Card } from '../types'
import { useLongPressDrag } from '../hooks/useLongPressDrag'
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
  const [isTouchDragging, setIsTouchDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
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

  // 長押し後ドラッグ機能
  const longPressDrag = useLongPressDrag({
    onDragStart: () => {
      setIsTouchDragging(true)
      
      // PC版と同じようにDragEventをシミュレート
      const fakeEvent = {
        dataTransfer: {
          setData: (type: string, data: string) => {
            // データをグローバルに保存
            (window as any).__dragData = (window as any).__dragData || {}
            ;(window as any).__dragData[type] = data
          },
          types: ['application/json', 'text/card']
        }
      } as any
      
      onDragStart?.(fakeEvent, card, cardIndex)
    },
    onDragMove: (_, deltaX, deltaY) => {
      setDragOffset({ x: deltaX, y: deltaY })
    },
    onDragEnd: (_, endX, endY) => {
      // PC版と同じドロップ処理
      const elementBelow = document.elementFromPoint(endX, endY)
      
      if (elementBelow) {
        // カードのドロップイベントをシミュレート
        const cardElement = elementBelow.closest('.card-view')
        if (cardElement) {
          const fakeDropEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
            dataTransfer: {
              getData: (type: string) => {
                return (window as any).__dragData?.[type] || ''
              },
              types: ['application/json', 'text/card']
            }
          } as any
          
          const cardIndex = parseInt(cardElement.getAttribute('data-card-index') || '0')
          onDrop?.(fakeDropEvent, cardIndex)
        }
        // リストコンテナへのドロップ
        else {
          const listContainer = elementBelow.closest('.cards-container')
          if (listContainer) {
            const fakeDropEvent = {
              preventDefault: () => {},
              stopPropagation: () => {},
              dataTransfer: {
                getData: (type: string) => {
                  return (window as any).__dragData?.[type] || ''
                },
                types: ['application/json', 'text/card']
              }
            } as any
            
            // リストのドロップイベントを発火
            listContainer.dispatchEvent(new CustomEvent('touch-drop', {
              detail: { fakeDropEvent }
            }))
          }
        }
      }
      
      // リセット
      setIsTouchDragging(false)
      setDragOffset({ x: 0, y: 0 })
      delete (window as any).__dragData
    },
    longPressDelay: 500
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
        className={`card-view ${isDragOver ? 'card-drag-over' : ''} ${isTouchDragging ? 'touch-dragging' : ''}`}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={isTouchDragging ? undefined : handleCardClick}
        onTouchStart={longPressDrag.onTouchStart}
        onTouchMove={longPressDrag.onTouchMove}
        onTouchEnd={longPressDrag.onTouchEnd}
        onTouchCancel={longPressDrag.onTouchCancel}
        data-card-index={cardIndex}
        style={{
          transform: isTouchDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'none',
          zIndex: isTouchDragging ? 1000 : 'auto',
          opacity: isTouchDragging ? 0.8 : 1
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