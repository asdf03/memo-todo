import React, { useState } from 'react'
import { List, Card } from '../types'
import ListHeader from './ListHeader'
import CardContainer from './CardContainer'
import ListActions from './ListActions'
import { useTouchDrag } from '../hooks/useTouchDrag'
import { useBoardOperations } from '../hooks/useBoardOperations'
import { useBoardContext } from '../context/BoardContext'
import './ListView.css'

interface ListViewProps {
  list: List
  isAnimating?: boolean
  isDisplaced?: boolean
  onCardDrop?: (card: Card, targetListId: string) => void
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListView: React.FC<ListViewProps> = ({ list, isAnimating = false, isDisplaced = false, onCardDrop, onListDragStart, onListDragEnd }) => {
  const [isDragMode, setIsDragMode] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const { board } = useBoardContext()
  const { reorderLists } = useBoardOperations()
  
  // タッチドラッグ機能
  const touchDrag = useTouchDrag({
    onDragStart: () => {
      setIsDragMode(true)
    },
    onDragMove: (_, deltaX, deltaY) => {
      setDragOffset({ x: deltaX, y: deltaY })
    },
    onDragEnd: (_, endX, endY) => {
      // ドロップ位置の要素を取得
      const elementBelow = document.elementFromPoint(endX, endY)
      if (elementBelow) {
        // 別のリストを探す
        const targetList = elementBelow.closest('[data-list-id]')
        if (targetList) {
          const targetListId = targetList.getAttribute('data-list-id')
          if (targetListId && targetListId !== list.id) {
            const currentIndex = board.lists.findIndex(l => l.id === list.id)
            const targetIndex = board.lists.findIndex(l => l.id === targetListId)
            if (currentIndex !== -1 && targetIndex !== -1) {
              reorderLists(currentIndex, targetIndex)
            }
          }
        }
      }
      
      // リセット
      setIsDragMode(false)
      setDragOffset({ x: 0, y: 0 })
    },
    dragThreshold: 20
  })
  

  return (
    <>
      <div 
        className={`list-view ${isAnimating ? 'list-dropped-animation' : ''} ${isDisplaced ? 'list-displaced-animation' : ''} ${isDragMode ? 'touch-dragging' : ''}`}
        data-list-id={list.id}
        onTouchStart={touchDrag.onTouchStart}
        onTouchMove={touchDrag.onTouchMove}
        onTouchEnd={touchDrag.onTouchEnd}
        style={{
          transform: isDragMode ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'none',
          zIndex: isDragMode ? 1000 : 'auto',
          opacity: isDragMode ? 0.8 : 1
        }}
      >
        <ListHeader 
          list={list}
          onListDragStart={onListDragStart}
          onListDragEnd={onListDragEnd}
        />
        
        <CardContainer 
          list={list}
        onCardDrop={onCardDrop}
      />
      
        <ListActions listId={list.id} />
      </div>
      
    </>
  )
}

export default ListView