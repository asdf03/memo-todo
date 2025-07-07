import React, { useState, useCallback } from 'react'
import { Card, List } from '../../types'
import ListView from './ListView'
import AddListForm from './AddListForm'
import { useBoardOperations } from '../../hooks/mobile/useMobileBoardOperations'
import { useBoardContext } from '../../contexts/BoardContext'

const BoardViewMobile: React.FC = () => {
  const { board } = useBoardContext()
  const [draggedList, setDraggedList] = useState<List | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)
  const [draggedListIndex, setDraggedListIndex] = useState<number>(-1)
  
  const { reorderLists, moveCard } = useBoardOperations()

  const handleCardDrop = async (card: Card, targetListId: string, targetIndex?: number) => {
    await moveCard(card, targetListId, targetIndex)
  }

  const handleListDragStart = useCallback((list: List) => {
    setDraggedList(list)
    const listIndex = board.lists.findIndex((l: List) => l.id === list.id)
    setDraggedListIndex(listIndex)
    
    // モバイル専用：ハプティックフィードバック
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    // モバイル専用：スクロール無効化
    document.body.classList.add('mobile-dragging')
  }, [board.lists])

  const handleListDragEnd = useCallback(() => {
    setDraggedList(null)
    setDragOverIndex(-1)
    setDraggedListIndex(-1)
    
    // モバイル専用：スクロール再有効化
    document.body.classList.remove('mobile-dragging')
  }, [])

  const handleListDrop = useCallback(async (dropIndex: number) => {
    if (!draggedList || draggedListIndex === -1) return
    
    if (draggedListIndex !== dropIndex) {
      await reorderLists(draggedListIndex, dropIndex)
      
      // モバイル専用：成功フィードバック
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30])
      }
    }
    
    setDragOverIndex(-1)
    setDraggedList(null)
    setDraggedListIndex(-1)
  }, [draggedList, draggedListIndex, reorderLists])

  if (!board) return null

  return (
    <div className="board-view-mobile">
      <div className="lists-container-mobile">
        {board.lists.map((list: List, index: number) => (
          <div
            key={list.id}
            className={`list-wrapper-mobile ${dragOverIndex === index ? 'drag-over' : ''}`}
          >
            <ListView
              list={list}
              onCardDrop={handleCardDrop}
              onListDragStart={handleListDragStart}
              onListDragEnd={handleListDragEnd}
              onListDrop={handleListDrop}
              listIndex={index}
            />
          </div>
        ))}
        <div className="add-list-container-mobile">
          <AddListForm />
        </div>
      </div>
    </div>
  )
}

export default BoardViewMobile