import React, { useState, useCallback } from 'react'
import { Card, List } from '../../types'
import ListView from './ListView'
import AddListForm from './AddListForm'
import { useBoardOperations } from '../../hooks/desktop/useDesktopBoardOperations'
import { useBoardContext } from '../../contexts/BoardContext'

const BoardViewDesktop: React.FC = () => {
  const { board } = useBoardContext()
  const [draggedList, setDraggedList] = useState<List | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)
  const [draggedListIndex, setDraggedListIndex] = useState<number>(-1)
  
  const { reorderLists, moveCard } = useBoardOperations()

  const handleCardDrop = async (card: Card, targetListId: string, targetIndex?: number) => {
    await moveCard(card, targetListId, targetIndex)
  }

  const handleListDragStart = useCallback((e: React.DragEvent, list: List) => {
    setDraggedList(list)
    const listIndex = board.lists.findIndex((l: List) => l.id === list.id)
    setDraggedListIndex(listIndex)
    
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/list', list.id)
    e.dataTransfer.setData('application/json', JSON.stringify(list))
  }, [board.lists])

  const handleListDragEnd = useCallback(() => {
    setDraggedList(null)
    setDragOverIndex(-1)
    setDraggedListIndex(-1)
  }, [])

  const handleListDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    
    if (e.dataTransfer.types.includes('text/list')) {
      setDragOverIndex(index)
    }
  }, [])

  const handleListDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!draggedList || draggedListIndex === -1) return
    
    if (draggedListIndex !== dropIndex) {
      await reorderLists(draggedListIndex, dropIndex)
    }
    
    setDragOverIndex(-1)
    setDraggedList(null)
    setDraggedListIndex(-1)
  }, [draggedList, draggedListIndex, reorderLists])

  const handleListDragLeave = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(-1)
    }
  }, [])

  if (!board) return null

  return (
    <div className="board-view-desktop">
      <div className="lists-container-desktop">
        {board.lists.map((list: List, index: number) => (
          <div
            key={list.id}
            className={`list-wrapper-desktop ${dragOverIndex === index ? 'drag-over' : ''}`}
            onDragOver={(e) => handleListDragOver(e, index)}
            onDrop={(e) => handleListDrop(e, index)}
            onDragLeave={handleListDragLeave}
          >
            <ListView
              list={list}
              onCardDrop={handleCardDrop}
              onListDragStart={handleListDragStart}
              onListDragEnd={handleListDragEnd}
            />
          </div>
        ))}
        <div className="add-list-container-desktop">
          <AddListForm />
        </div>
      </div>
    </div>
  )
}

export default BoardViewDesktop