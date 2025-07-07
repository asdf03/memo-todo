import React, { useState } from 'react'
import { Card } from '../../types'
import { useTouchDrag } from '../../hooks/mobile/useTouchDrag'
import { useTouchDropZone } from '../../hooks/mobile/useTouchDropZone'
import { useBoardOperations } from '../../hooks/mobile/useMobileBoardOperations'

interface CardViewMobileProps {
  card: Card
  onCardDrop: (card: Card, targetListId: string, targetIndex?: number) => void
  cardIndex: number
}

const CardViewMobile: React.FC<CardViewMobileProps> = ({
  card,
  onCardDrop,
  cardIndex
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(card.title)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const { updateCard, deleteCard } = useBoardOperations()

  const {
    isDragging,
    dragHandlers
  } = useTouchDrag({
    onDragStart: () => {
      // モバイル専用：ドラッグ開始のハプティックフィードバック
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    },
    onDragEnd: () => {
      // ドラッグ終了処理
    },
    dragType: 'card',
    dragData: card
  })

  const { dropZoneHandlers } = useTouchDropZone({
    onDrop: (draggedItem: any) => {
      if ('list_id' in draggedItem) {
        onCardDrop(draggedItem as Card, card.list_id!, cardIndex)
      }
      setIsDragOver(false)
    },
    onDragOver: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    acceptType: 'card'
  })

  const handleSave = async () => {
    if (editTitle.trim() && editTitle !== card.title) {
      await updateCard(card.id, { title: editTitle.trim() })
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(card.title)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await deleteCard(card.id)
  }

  const handleLongPress = () => {
    // モバイル専用：長押しで編集モード
    if (navigator.vibrate) {
      navigator.vibrate(100)
    }
    setIsEditing(true)
  }

  if (isEditing) {
    return (
      <div className="card-view-mobile editing">
        <div className="card-edit-form-mobile">
          <textarea
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="card-edit-input-mobile"
            autoFocus
            rows={3}
          />
          <div className="card-edit-actions-mobile">
            <button 
              onClick={handleSave}
              className="card-save-btn-mobile"
            >
              保存
            </button>
            <button 
              onClick={handleCancel}
              className="card-cancel-btn-mobile"
            >
              キャンセル
            </button>
            <button 
              onClick={handleDelete}
              className="card-delete-btn-mobile"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`card-view-mobile ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      {...dragHandlers}
      {...dropZoneHandlers}
      onTouchStart={(e) => {
        // 長押し判定のためのタイマー設定
        const timer = setTimeout(handleLongPress, 500)
        
        // タッチ終了時にタイマーをクリア
        const clearTimer = () => {
          clearTimeout(timer)
          document.removeEventListener('touchend', clearTimer)
          document.removeEventListener('touchcancel', clearTimer)
          document.removeEventListener('touchmove', clearTimer)
        }
        
        document.addEventListener('touchend', clearTimer)
        document.addEventListener('touchcancel', clearTimer)
        document.addEventListener('touchmove', clearTimer)
        
        // ドラッグハンドラーも呼び出し
        if (dragHandlers.onTouchStart) {
          dragHandlers.onTouchStart(e)
        }
      }}
    >
      <div className="card-content-mobile">
        <div className="card-title-mobile">{card.title}</div>
        {card.description && (
          <div className="card-description-mobile">{card.description}</div>
        )}
      </div>
      
      <div className="card-drag-handle-mobile">
        <span className="drag-indicator-mobile">⋮⋮</span>
      </div>
    </div>
  )
}

export default CardViewMobile