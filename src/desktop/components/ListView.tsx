import React, { useCallback } from 'react'
import { List, Card } from '../../shared/types'
import ListHeader from './ListHeaderDesktop'
import CardContainer from './CardContainer'
import ListActions from './ListActionsDesktop'

interface ListViewProps {
  list: List
  isAnimating?: boolean
  isDisplaced?: boolean
  onCardDrop?: (card: Card, targetListId: string) => void
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListView: React.FC<ListViewProps> = ({ 
  list, 
  isAnimating = false, 
  isDisplaced = false, 
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
      className={`list ${isAnimating ? 'animate-bounce' : ''} ${isDisplaced ? 'animate-fade-in-left' : ''}`}
      data-list-id={list.id}
    >
      <div className="list__header">
        <ListHeader 
          list={list}
          onListDragStart={handleListDragStart}
          onListDragEnd={handleListDragEnd}
        />
      </div>
      
      <div className="list__content">
        <div className="list__cards">
          <CardContainer 
            list={list}
            onCardDrop={onCardDrop}
          />
        </div>
      </div>
    
      <div className="list__actions">
        <ListActions listId={list.id} />
      </div>
    </div>
  )
}

export default ListView