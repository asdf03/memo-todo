import React, { useState, useEffect, memo, useCallback, useRef } from 'react'
import { Card } from '../types'
import './CardView.css'

interface CardViewProps {
  card: Card
  cardIndex: number
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
  const [isDragging, setIsDragging] = useState(false)
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  
  // cardが変更されたらinputも更新
  useEffect(() => {
    setTitleInput(card.title)
    setDescriptionInput(card.description || '')
  }, [card.title, card.description])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

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


  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true)
    onDragStart?.(e, card, cardIndex)
  }, [card, cardIndex, onDragStart])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // モバイル長押しドラッグ
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isEditing) return
    
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    
    // 長押しタイマー開始（400msに短縮）
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true)
      
      // ハプティックフィードバック
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      // PC版のドラッグイベントをシミュレート
      const fakeEvent = {
        dataTransfer: {
          setData: (_type: string, _data: string) => {},
          effectAllowed: 'move'
        },
        preventDefault: () => {},
        stopPropagation: () => {}
      } as React.DragEvent
      
      onDragStart?.(fakeEvent, card, cardIndex)
    }, 400) // 400msに短縮
  }, [isEditing, card, cardIndex, onDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    
    // 移動閾値を緩くする（10px → 15px）
    if (!isDragging && (deltaX > 15 || deltaY > 15)) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
    
    // ドラッグ中はスクロールを防止
    if (isDragging) {
      e.preventDefault()
      
      // ドラッグ中の視覚的フィードバック
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      if (elementBelow) {
        const cardBelow = elementBelow.closest('.card-view')
        if (cardBelow && cardBelow !== e.currentTarget) {
          // 他のカードにドラッグオーバー効果を適用
          const allCards = document.querySelectorAll('.card-view')
          allCards.forEach(card => card.classList.remove('card-drag-over'))
          cardBelow.classList.add('card-drag-over')
        }
      }
    }
  }, [isDragging])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (isDragging) {
      const touch = e.changedTouches[0]
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      
      if (elementBelow) {
        const cardBelow = elementBelow.closest('.card-view')
        if (cardBelow) {
          // ドロップイベントをシミュレート
          const dropEvent = new CustomEvent('drop', {
            bubbles: true,
            cancelable: true,
            detail: {
              card: card,
              cardIndex: cardIndex
            }
          })
          
          // dataTransferプロパティを設定
          Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
              getData: (type: string) => {
                if (type === 'text/card') return card.id
                if (type === 'application/json') return JSON.stringify(card)
                return ''
              }
            },
            writable: false
          })
          
          // preventDefault メソッドを追加
          Object.defineProperty(dropEvent, 'preventDefault', {
            value: () => {},
            writable: false
          })
          
          cardBelow.dispatchEvent(dropEvent)
          
          // 成功フィードバック
          if (navigator.vibrate) {
            navigator.vibrate([30, 50, 30])
          }
        }
      }
      
      // ドラッグオーバー効果を削除
      const allCards = document.querySelectorAll('.card-view')
      allCards.forEach(card => card.classList.remove('card-drag-over'))
      
      setIsDragging(false)
    }
    
    touchStartPos.current = null
  }, [isDragging, card, cardIndex])

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    
    if (isDragging) {
      handleDragEnd()
    }
  }, [isDragging, handleDragEnd])

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
        className={`card-view ${isDragOver ? 'card-drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
        draggable={!isEditing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
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