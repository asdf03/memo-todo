import React, { useState, useCallback } from 'react'
import { List, Card } from '../types'
import ListHeader from './ListHeader'
import CardContainer from './CardContainer'
import ListActions from './ListActions'
import MobileListActions from './MobileListActions'
import MobileOverlay from './MobileOverlay'
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
  const [showMobileActions, setShowMobileActions] = useState(false)
  
  const handleLongPress = useCallback(() => {
    setShowMobileActions(true)
  }, [])

  // 長押し検出
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  
  const handleTouchStart = useCallback(() => {
    const timer = setTimeout(() => {
      handleLongPress()
    }, 700) // 700ms長押し（カードより少し長め）
    setPressTimer(timer)
  }, [handleLongPress])

  const handleTouchEnd = useCallback(() => {
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
  }, [pressTimer])

  return (
    <>
      <div 
        className={`list-view ${isAnimating ? 'list-dropped-animation' : ''} ${isDisplaced ? 'list-displaced-animation' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <ListHeader 
          list={list}
          onListDragStart={onListDragStart}
          onListDragEnd={onListDragEnd}
          onMobileMenu={() => setShowMobileActions(true)}
        />
        
        <CardContainer 
          list={list}
        onCardDrop={onCardDrop}
      />
      
        <ListActions listId={list.id} />
      </div>
      
      <MobileOverlay 
        isOpen={showMobileActions} 
        onClose={() => setShowMobileActions(false)}
      >
        <MobileListActions 
          list={list}
          onClose={() => setShowMobileActions(false)}
        />
      </MobileOverlay>
    </>
  )
}

export default ListView