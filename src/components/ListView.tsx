import React, { useRef, useState, useEffect, useCallback } from 'react'
import { List, Card } from '../types'
import ListHeader from './ListHeader'
import CardContainer from './CardContainer'
import ListActions from './ListActions'
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
  const [isDragging, setIsDragging] = useState(false)

  // PC版のドラッグイベントハンドラー
  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true)
    onListDragStart?.(e, list)
  }, [list, onListDragStart])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    onListDragEnd?.()
  }, [onListDragEnd])

  return (
    <>
      <div 
        className={`list-view ${isAnimating ? 'list-dropped-animation' : ''} ${isDisplaced ? 'list-displaced-animation' : ''} ${isDragging ? 'dragging' : ''}`}
        data-list-id={list.id}
      >
        <ListHeader 
          list={list}
          onListDragStart={handleDragStart}
          onListDragEnd={handleDragEnd}
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