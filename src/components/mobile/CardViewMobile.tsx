import React, { useState, useEffect, memo, useCallback, useRef } from 'react'
import { Card } from '../../types'
import './styles/CardViewMobile.css'

interface CardViewMobileProps {
  card: Card
  cardIndex: number
  listId: string
  onDelete: (cardId: string) => void
  onUpdate: (cardId: string, updatedCard: Partial<Card>) => void
  onDragStart: (e: React.DragEvent, card: Card, cardIndex: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetIndex: number) => void
  isDragOver?: boolean
}

const CardViewMobile: React.FC<CardViewMobileProps> = memo(({ 
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

  // モバイル長押しドラッグ
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isEditing) return
    
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    
    // 長押しタイマー開始（400ms）
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
      
      onDragStart(fakeEvent, card, cardIndex)
    }, 400)
  }, [isEditing, card, onDragStart, cardIndex])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    
    // 移動閾値を緩くする（15px）
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
        const cardBelow = elementBelow.closest('.card-view-mobile')
        if (cardBelow && cardBelow !== e.currentTarget) {
          // 他のカードにドラッグオーバー効果を適用
          const allCards = document.querySelectorAll('.card-view-mobile')
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
        // 他のカードにドロップする場合
        const targetCard = elementBelow.closest('.card-view-mobile')
        if (targetCard && targetCard !== e.currentTarget) {
          const targetCardIndex = parseInt(targetCard.getAttribute('data-card-index') || '0')
          
          // カスタムドロップイベントを作成
          const dropEvent = new CustomEvent('drop', {
            bubbles: true,
            cancelable: true
          }) as any
          
          // dataTransferプロパティを設定
          Object.defineProperty(dropEvent, 'dataTransfer', {
            value: {
              types: ['text/card', 'application/json', 'text/sourceList'],
              getData: (type: string) => {
                if (type === 'text/card') return card.id
                if (type === 'application/json') return JSON.stringify(card)
                if (type === 'text/sourceList') return listId
                return ''
              }
            },
            writable: false
          })
          
          Object.defineProperty(dropEvent, 'preventDefault', {
            value: () => {},
            writable: false
          })
          
          onDrop(dropEvent, targetCardIndex)
          
          // 成功フィードバック
          if (navigator.vibrate) {
            navigator.vibrate([30, 50, 30])
          }
        } else {
          // 空のスペースまたはカードコンテナにドロップ
          const targetContainer = elementBelow.closest('.cards-container')
          if (targetContainer) {
            // カスタムドロップイベントを作成
            const dropEvent = new CustomEvent('drop', {
              bubbles: true,
              cancelable: true
            }) as any
            
            // dataTransferプロパティを設定
            Object.defineProperty(dropEvent, 'dataTransfer', {
              value: {
                types: ['text/card', 'application/json', 'text/sourceList'],
                getData: (type: string) => {
                  if (type === 'text/card') return card.id
                  if (type === 'application/json') return JSON.stringify(card)
                  if (type === 'text/sourceList') return listId
                  return ''
                }
              },
              writable: false
            })
            
            Object.defineProperty(dropEvent, 'preventDefault', {
              value: () => {},
              writable: false
            })
            
            targetContainer.dispatchEvent(dropEvent)
            
            // 成功フィードバック
            if (navigator.vibrate) {
              navigator.vibrate([30, 50, 30])
            }
          }
        }
      }
      
      // ドラッグオーバー効果を削除
      const allCards = document.querySelectorAll('.card-view-mobile')
      allCards.forEach(card => card.classList.remove('card-drag-over'))
      
      setIsDragging(false)
    }
    
    touchStartPos.current = null
  }, [isDragging, card, onDrop, listId])

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    
    if (isDragging) {
      setIsDragging(false)
    }
  }, [isDragging])

  if (isEditing) {
    return (
      <div className="card-edit-mobile">
        <input
          className="card-title-input-mobile"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="カードのタイトル"
          autoFocus
        />
        <textarea
          className="card-description-input-mobile"
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          placeholder="説明（オプション）"
          rows={3}
        />
        <div className="card-edit-actions-mobile">
          <button className="save-btn-mobile" onClick={handleSave}>
            保存
          </button>
          <button className="cancel-btn-mobile" onClick={handleCancel}>
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`card-view-mobile ${isDragOver ? 'card-drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onDragOver={onDragOver}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: 'none'
      }}
      data-card-index={cardIndex}
    >
      <div className="card-content-mobile">
        <h4 className="card-title-mobile">
          {card.title}
        </h4>
        {card.description && (
          <p className="card-description-mobile">
            {card.description}
          </p>
        )}
      </div>
      <button 
        className="delete-card-btn-mobile"
        onClick={handleDeleteClick}
      >
        ×
      </button>
    </div>
  )
})

export default CardViewMobile 