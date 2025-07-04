import React, { useState, useEffect, memo, useCallback } from 'react'
import { Card } from '../types'
import MobileCardActions from './MobileCardActions'
import MobileOverlay from './MobileOverlay'
import { useSwipeGesture } from '../hooks/useSwipeGesture'
import { useBoardContext } from '../context/BoardContext'
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
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [titleInput, setTitleInput] = useState(card.title)
  const [descriptionInput, setDescriptionInput] = useState(card.description || '')
  const [swipeOffset, setSwipeOffset] = useState(0)
  
  const { board } = useBoardContext()
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

  const handleLongPress = useCallback(() => {
    setShowMobileActions(true)
  }, [])

  // スワイプでカードを移動
  const handleSwipeCard = useCallback((direction: 'left' | 'right') => {
    const currentListIndex = board.lists.findIndex(list => list.id === listId)
    let targetListIndex: number
    
    if (direction === 'left') {
      targetListIndex = currentListIndex - 1
    } else {
      targetListIndex = currentListIndex + 1
    }
    
    if (targetListIndex >= 0 && targetListIndex < board.lists.length) {
      const targetList = board.lists[targetListIndex]
      moveCard(card, targetList.id)
      
      // スワイプアニメーション
      setSwipeOffset(direction === 'left' ? -300 : 300)
      setTimeout(() => setSwipeOffset(0), 300)
    }
  }, [board.lists, listId, card, moveCard])

  // スワイプジェスチャーの設定
  const swipeGesture = useSwipeGesture({
    threshold: 50, // より反応しやすく
    onSwipeLeft: () => {
      console.log('Card swipe left handler called')
      handleSwipeCard('left')
    },
    onSwipeRight: () => {
      console.log('Card swipe right handler called')
      handleSwipeCard('right')
    }
  })

  // 長押し検出（スワイプと併用）
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsSwiping(false)
    swipeGesture.onTouchStart(e)
    
    // 長押しタイマーをもっと長くしてスワイプと競合しにくく
    const timer = setTimeout(() => {
      if (!isSwiping) {
        console.log('Long press triggered for card')
        handleLongPress()
      }
    }, 800) // 800ms長押し（スワイプと競合しにくく）
    setPressTimer(timer)
  }, [handleLongPress, isSwiping, swipeGesture])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setIsSwiping(true)
    swipeGesture.onTouchMove(e)
    
    // 移動中は長押しをキャンセル
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
    
    // 編集中でない場合のみスワイプを許可
    if (!isEditing) {
      e.stopPropagation()
    }
  }, [pressTimer, swipeGesture, isEditing])

  const handleTouchEnd = useCallback(() => {
    swipeGesture.onTouchEnd()
    
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
    
    setTimeout(() => setIsSwiping(false), 100)
  }, [pressTimer, swipeGesture])

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
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none'
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