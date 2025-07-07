import React, { useCallback } from 'react'
import { List, Card } from '../../types'
import ListHeader from './ListHeader'
import CardContainer from './CardContainer'
import ListActions from './ListActions'

interface ListViewProps {
  list: List
  onCardDrop?: (card: Card, targetListId: string) => void
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListView: React.FC<ListViewProps> = ({ 
  list, 
  onCardDrop, 
  onListDragStart, 
  onListDragEnd 
}) => {
  const handleListDragStart = useCallback((e: React.DragEvent) => {
    onListDragStart?.(e, list)
  }, [list, onListDragStart])

  const handleListDragEnd = useCallback(() => {
    onListDragEnd?.()
  }, [onListDragEnd])

  return (
    <div 
      className="list-view-desktop"
      data-list-id={list.id}
    >
      <div className="list-header-desktop">
        <ListHeader 
          list={list}
          onListDragStart={handleListDragStart}
          onListDragEnd={handleListDragEnd}
        />
      </div>
      
      <div className="cards-container-desktop">
        <CardContainer 
          list={list}
          onCardDrop={onCardDrop}
        />
      </div>
    
      <div className="list-actions-desktop">
        <ListActions listId={list.id} />
      </div>
    </div>
  )
}

export default ListView