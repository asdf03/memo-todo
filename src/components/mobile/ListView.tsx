import React, { useState } from 'react'
import { List, Card } from '../../types'
import CardViewMobile from './CardViewMobile'
import AddCardForm from './AddCardForm'
import ListHeaderMobile from './ListHeaderMobile'
import { useTouchDrag } from '../../hooks/mobile/useTouchDrag'
import { useTouchDropZone } from '../../hooks/mobile/useTouchDropZone'

interface ListViewProps {
  list: List
  onCardDrop: (card: Card, targetListId: string, targetIndex?: number) => void
  onListDragStart: (list: List) => void
  onListDragEnd: () => void
  onListDrop: (dropIndex: number) => void
  listIndex: number
}

const ListView: React.FC<ListViewProps> = ({
  list,
  onCardDrop,
  onListDragStart,
  onListDragEnd,
  onListDrop,
  listIndex
}) => {
  const [isDragOverCard, setIsDragOverCard] = useState(false)
  
  const {
    isDragging: isListDragging,
    dragHandlers: listDragHandlers
  } = useTouchDrag({
    onDragStart: () => onListDragStart(list),
    onDragEnd: onListDragEnd,
    dragType: 'list',
    dragData: list
  })

  const { dropZoneHandlers: listDropHandlers } = useTouchDropZone({
    onDrop: () => onListDrop(listIndex),
    acceptType: 'list'
  })

  const { dropZoneHandlers: cardDropHandlers } = useTouchDropZone({
    onDrop: (draggedItem: Card | List) => {
      if ('list_id' in draggedItem) {
        onCardDrop(draggedItem as Card, list.id)
      }
      setIsDragOverCard(false)
    },
    onDragOver: () => setIsDragOverCard(true),
    onDragLeave: () => setIsDragOverCard(false),
    acceptType: 'card'
  })

  return (
    <div 
      className={`list-view-mobile ${isListDragging ? 'dragging' : ''} ${isDragOverCard ? 'drag-over' : ''}`}
      {...listDragHandlers}
      {...listDropHandlers}
    >
      <ListHeaderMobile 
        list={list}
        isDragging={isListDragging}
      />
      
      <div 
        className="cards-container-mobile"
        {...cardDropHandlers}
      >
        {list.cards.map((card, index) => (
          <CardViewMobile
            key={card.id}
            card={card}
            onCardDrop={onCardDrop}
            cardIndex={index}
          />
        ))}
        
        <div className="add-card-container-mobile">
          <AddCardForm listId={list.id} />
        </div>
      </div>
    </div>
  )
}

export default ListView