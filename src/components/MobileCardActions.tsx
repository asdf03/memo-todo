import React, { memo, useState, useCallback } from 'react'
import { Card } from '../types'
import { useBoardOperations } from '../hooks/useBoardOperations'
import { useBoardContext } from '../context/BoardContext'

interface MobileCardActionsProps {
  card: Card
  currentListId: string
  onClose: () => void
}

const MobileCardActions: React.FC<MobileCardActionsProps> = memo(({ card, currentListId, onClose }) => {
  const { board } = useBoardContext()
  const { moveCard, deleteCard } = useBoardOperations()
  const [isMoving, setIsMoving] = useState(false)

  const handleMoveCard = useCallback(async (targetListId: string) => {
    if (targetListId !== currentListId) {
      try {
        await moveCard(card, targetListId)
        onClose()
      } catch (error) {
        console.error('カード移動エラー:', error)
      }
    }
  }, [card, currentListId, moveCard, onClose])

  const handleDeleteCard = useCallback(async () => {
    if (confirm('このカードを削除しますか？')) {
      try {
        await deleteCard(currentListId, card.id)
        onClose()
      } catch (error) {
        console.error('カード削除エラー:', error)
      }
    }
  }, [card.id, currentListId, deleteCard, onClose])

  if (isMoving) {
    return (
      <div className="mobile-card-actions">
        <div className="mobile-action-header">
          <h3>カードを移動</h3>
          <button className="mobile-action-close" onClick={() => setIsMoving(false)}>
            ✕
          </button>
        </div>
        <div className="mobile-move-options">
          {board.lists.map((list) => (
            <button
              key={list.id}
              className={`mobile-move-option ${list.id === currentListId ? 'current' : ''}`}
              onClick={() => handleMoveCard(list.id)}
              disabled={list.id === currentListId}
            >
              <span className="move-option-title">{list.title}</span>
              {list.id === currentListId && (
                <span className="move-option-current">現在のリスト</span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-card-actions">
      <div className="mobile-action-header">
        <h3>カードアクション</h3>
        <button className="mobile-action-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="mobile-action-buttons">
        <button className="mobile-action-btn move" onClick={() => setIsMoving(true)}>
          📋 移動
        </button>
        <button className="mobile-action-btn delete" onClick={handleDeleteCard}>
          🗑️ 削除
        </button>
      </div>
    </div>
  )
})

export default MobileCardActions