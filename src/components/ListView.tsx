import React, { useState } from 'react'
import { List, Card } from '../types'
import ListHeader from './ListHeader'
import CardContainer from './CardContainer'
import ListActions from './ListActions'
import { useLongPressDrag } from '../hooks/useLongPressDrag'
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
  const [isTouchDragging, setIsTouchDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  const { board } = useBoardContext()
  const { reorderLists } = useBoardOperations()
  
  // 長押し後リストドラッグ機能（カードコンテナエリアのみ）
  const longPressDrag = useLongPressDrag({
    onDragStart: () => {
      setIsTouchDragging(true)
      
      // PC版と同じようにDragEventをシミュレート
      const fakeEvent = {
        dataTransfer: {
          setData: (type: string, data: string) => {
            (window as any).__listDragData = (window as any).__listDragData || {}
            ;(window as any).__listDragData[type] = data
          },
          types: ['text/list', 'application/json']
        }
      } as any
      
      onListDragStart?.(fakeEvent, list)
    },
    onDragMove: (_, deltaX, deltaY) => {
      setDragOffset({ x: deltaX, y: deltaY })
    },
    onDragEnd: (_, endX, endY) => {
      // PC版と同じドロップ処理
      const elementBelow = document.elementFromPoint(endX, endY)
      if (elementBelow) {
        const targetListElement = elementBelow.closest('[data-list-id]')
        if (targetListElement) {
          const targetListId = targetListElement.getAttribute('data-list-id')
          if (targetListId && targetListId !== list.id) {
            const currentIndex = board.lists.findIndex(l => l.id === list.id)
            const targetIndex = board.lists.findIndex(l => l.id === targetListId)
            if (currentIndex !== -1 && targetIndex !== -1) {
              reorderLists(currentIndex, targetIndex)
            }
          }
        }
      }
      
      onListDragEnd?.()
      
      // リセット
      setIsTouchDragging(false)
      setDragOffset({ x: 0, y: 0 })
      delete (window as any).__listDragData
    },
    longPressDelay: 500
  })
  

  return (
    <>
      <div 
        className={`list-view ${isAnimating ? 'list-dropped-animation' : ''} ${isDisplaced ? 'list-displaced-animation' : ''} ${isTouchDragging ? 'touch-dragging' : ''}`}
        data-list-id={list.id}
        style={{
          transform: isTouchDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'none',
          zIndex: isTouchDragging ? 1000 : 'auto',
          opacity: isTouchDragging ? 0.8 : 1
        }}
      >
        <ListHeader 
          list={list}
          onListDragStart={onListDragStart}
          onListDragEnd={onListDragEnd}
        />
        
        <div 
          className="list-drag-handle"
          onTouchStart={longPressDrag.onTouchStart}
          onTouchMove={longPressDrag.onTouchMove}
          onTouchEnd={longPressDrag.onTouchEnd}
          onTouchCancel={longPressDrag.onTouchCancel}
        >
          <CardContainer 
            list={list}
            onCardDrop={onCardDrop}
          />
        </div>
      
        <ListActions listId={list.id} />
      </div>
      
    </>
  )
}

export default ListView