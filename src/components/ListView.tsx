import React, { useState, useCallback } from 'react'
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
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // PC版のドラッグイベントハンドラー
  const handleDragStart = useCallback((e: React.DragEvent) => {
    // タイトル編集中はドラッグを無効化
    if (isEditingTitle) {
      e.preventDefault()
      return
    }
    
    setIsDragging(true)
    onListDragStart?.(e, list)
  }, [list, onListDragStart, isEditingTitle])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    onListDragEnd?.()
  }, [onListDragEnd])

  return (
    <>
      <div 
        className={`list-view ${isAnimating ? 'list-dropped-animation' : ''} ${isDisplaced ? 'list-displaced-animation' : ''} ${isDragging ? 'dragging' : ''}`}
        data-list-id={list.id}
        draggable={!isEditingTitle}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ListHeader 
          list={list}
          onListDragStart={handleDragStart}
          onListDragEnd={handleDragEnd}
          onEditingChange={setIsEditingTitle}
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