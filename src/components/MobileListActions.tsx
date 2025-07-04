import React, { memo, useState, useCallback } from 'react'
import { List } from '../types'
import { useBoardOperations } from '../hooks/useBoardOperations'
import { useBoardContext } from '../context/BoardContext'

interface MobileListActionsProps {
  list: List
  onClose: () => void
}

const MobileListActions: React.FC<MobileListActionsProps> = memo(({ list, onClose }) => {
  const { board } = useBoardContext()
  const { reorderLists, deleteList } = useBoardOperations()
  const [isMoving, setIsMoving] = useState(false)

  const currentIndex = board.lists.findIndex(l => l.id === list.id)

  const handleMoveList = useCallback(async (targetIndex: number) => {
    if (targetIndex !== currentIndex && targetIndex >= 0 && targetIndex < board.lists.length) {
      try {
        await reorderLists(currentIndex, targetIndex)
        onClose()
      } catch (error) {
        console.error('リスト移動エラー:', error)
      }
    }
  }, [currentIndex, board.lists.length, reorderLists, onClose])

  const handleDeleteList = useCallback(async () => {
    if (confirm('このリストとすべてのカードを削除しますか？')) {
      try {
        await deleteList(list.id)
        onClose()
      } catch (error) {
        console.error('リスト削除エラー:', error)
      }
    }
  }, [list.id, deleteList, onClose])

  if (isMoving) {
    return (
      <div className="mobile-list-actions">
        <div className="mobile-action-header">
          <h3>リストを移動</h3>
          <button className="mobile-action-close" onClick={() => setIsMoving(false)}>
            ✕
          </button>
        </div>
        <div className="mobile-move-options">
          {board.lists.map((targetList, index) => (
            <button
              key={targetList.id}
              className={`mobile-move-option ${index === currentIndex ? 'current' : ''}`}
              onClick={() => handleMoveList(index)}
              disabled={index === currentIndex}
            >
              <span className="move-option-number">位置 {index + 1}</span>
              <span className="move-option-title">{targetList.title}</span>
              {index === currentIndex && (
                <span className="move-option-current">現在の位置</span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-list-actions">
      <div className="mobile-action-header">
        <h3>リストアクション</h3>
        <button className="mobile-action-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="mobile-action-buttons">
        <button className="mobile-action-btn move" onClick={() => setIsMoving(true)}>
          🔄 移動
        </button>
        <button className="mobile-action-btn delete" onClick={handleDeleteList}>
          🗑️ 削除
        </button>
      </div>
    </div>
  )
})

export default MobileListActions