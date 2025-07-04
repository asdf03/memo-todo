import React, { useCallback } from 'react'
import { List, Card } from '../../types'
import ListHeader from './ListHeader'
import CardContainer from '../CardContainer'
import ListActions from './common/ListActions'
import '../ListView.css'

interface ListViewProps {
  list: List
  isAnimating?: boolean
  isDisplaced?: boolean
  onCardDrop?: (card: Card, targetListId: string) => void
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListView: React.FC<ListViewProps> = ({ list, isAnimating = false, isDisplaced = false, onCardDrop, onListDragStart, onListDragEnd }) => {
  const handleListDragStart = useCallback((e: React.DragEvent) => {
    onListDragStart?.(e, list)
  }, [list, onListDragStart])

  const handleListDragEnd = useCallback(() => {
    onListDragEnd?.()
  }, [onListDragEnd])

  return (
    <>
      <div 
        className={`list-view ${isAnimating ? 'list-dropped-animation' : ''} ${isDisplaced ? 'list-displaced-animation' : ''}`}
        data-list-id={list.id}
      >
        <ListHeader 
          list={list}
          onListDragStart={handleListDragStart}
          onListDragEnd={handleListDragEnd}
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