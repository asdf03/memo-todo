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
      className="bg-white rounded-lg shadow-sm border h-fit max-h-full flex flex-col"
      data-list-id={list.id}
    >
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <ListHeader 
          list={list}
          onListDragStart={handleListDragStart}
          onListDragEnd={handleListDragEnd}
        />
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto max-h-96">
        <CardContainer 
          list={list}
          onCardDrop={onCardDrop}
        />
      </div>
    
      <div className="p-4 border-t">
        <ListActions listId={list.id} />
      </div>
    </div>
  )
}

export default ListView