import React, { useCallback } from 'react'
import { List, Card } from '../../shared/types'
import ListHeader from './ListHeaderMobile'
import CardContainer from './CardContainer'
import ListActions from './ListActionsMobile'

interface ListViewProps {
  list: List
  isAnimating?: boolean
  isDisplaced?: boolean
  onCardDrop?: (card: Card, targetListId: string) => void
  onListDragStart?: (list: List) => void
  onListDragEnd?: () => void
  onListDragOver?: (index: number) => void
  onListDrop?: (index: number) => void
  dragOverIndex?: number
  listIndex?: number
}

const ListView: React.FC<ListViewProps> = ({ 
  list, 
  isAnimating = false, 
  isDisplaced = false, 
  onCardDrop, 
  onListDragStart, 
  onListDragEnd,
  onListDragOver,
  onListDrop,
  dragOverIndex,
  listIndex = 0
}) => {
  const handleListDragStart = useCallback(() => {
    onListDragStart?.(list)
  }, [list, onListDragStart])

  const handleListDragEnd = useCallback(() => {
    onListDragEnd?.()
  }, [onListDragEnd])

  return (
    <div 
      className={`list-mobile ${isAnimating ? 'animate-bounce' : ''} ${isDisplaced ? 'animate-fade-in-left' : ''}`}
      data-list-id={list.id}
    >
      <div className="list__header-mobile">
        <ListHeader 
          list={list}
          onListDragStart={handleListDragStart}
          onListDragEnd={handleListDragEnd}
          onListDragOver={onListDragOver}
          onListDrop={onListDrop}
          dragOverIndex={dragOverIndex}
          listIndex={listIndex}
        />
      </div>
      
      <div className="list__content-mobile">
        <div className="list__cards-mobile">
          <CardContainer 
            list={list}
            onCardDrop={onCardDrop}
          />
        </div>
      </div>
    
      <div className="list__actions-mobile">
        <ListActions listId={list.id} />
      </div>
    </div>
  )
}

export default ListView