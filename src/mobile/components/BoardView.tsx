import React, { useState, useCallback } from 'react'
import { Card, List } from '../../shared/types'
import ListView from './ListView'
import AddListForm from './AddListFormMobile'
import { useBoardOperations } from '../../shared/hooks/useBoardOperations'
import { useBoardContext } from '../../shared/contexts/BoardContext'

const BoardView: React.FC = () => {
  const { board } = useBoardContext()
  const [draggedList, setDraggedList] = useState<List | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)
  const [draggedListIndex, setDraggedListIndex] = useState<number>(-1)
  const [animatingListId, setAnimatingListId] = useState<string | null>(null)
  const [displacedListIds, setDisplacedListIds] = useState<string[]>([])
  
  const { reorderLists, moveCard } = useBoardOperations()

  const handleCardDrop = async (card: Card, targetListId: string, targetIndex?: number) => {
    await moveCard(card, targetListId, targetIndex)
  }

  const handleListDragStart = useCallback((list: List) => {
    setDraggedList(list)
    const listIndex = board.lists.findIndex(l => l.id === list.id)
    setDraggedListIndex(listIndex)
    
    document.body.classList.add('mobile-dragging')
    
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [board.lists])

  const handleListDragEnd = useCallback(() => {
    setDraggedList(null)
    setDragOverIndex(-1)
    setDraggedListIndex(-1)
    
    document.body.classList.remove('mobile-dragging')
  }, [])

  const handleListDragOver = useCallback((index: number) => {
    setDragOverIndex(index)
  }, [])

  const handleListDrop = useCallback(async (dropIndex: number) => {
    if (!draggedList || draggedListIndex === -1) return
    
    if (draggedListIndex !== dropIndex) {
      setAnimatingListId(draggedList.id)
      
      const affectedLists = board.lists.filter((_, index) => 
        index >= Math.min(draggedListIndex, dropIndex) && 
        index <= Math.max(draggedListIndex, dropIndex)
      )
      setDisplacedListIds(affectedLists.map(l => l.id))
      
      await reorderLists(draggedListIndex, dropIndex)
      
      setTimeout(() => {
        setAnimatingListId(null)
        setDisplacedListIds([])
      }, 600)
    }
    
    setDragOverIndex(-1)
    setDraggedList(null)
    setDraggedListIndex(-1)
  }, [draggedList, draggedListIndex, board.lists, reorderLists])

  if (!board) return null

  return (
    <div className="board-view-mobile">
      <div className="lists-container-mobile">
        {board.lists.map((list, index) => (
          <div
            key={list.id}
            className={`list-wrapper-mobile ${dragOverIndex === index ? 'drag-over' : ''}`}
          >
            <ListView
              list={list}
              isAnimating={animatingListId === list.id}
              isDisplaced={displacedListIds.includes(list.id)}
              onCardDrop={handleCardDrop}
              onListDragStart={handleListDragStart}
              onListDragEnd={handleListDragEnd}
              onListDragOver={handleListDragOver}
              onListDrop={handleListDrop}
              dragOverIndex={dragOverIndex}
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

export default BoardView