import React, { useState, useEffect, memo, useCallback, useRef } from 'react'
import { Card } from '../../types'
import { useTouchDrag } from '../../hooks/useTouchDrag'
import { useTouchDropZone } from '../../hooks/useTouchDropZone'

interface CardViewMobileProps {
  card: Card
  cardIndex: number
  listId: string
  onDelete: (cardId: string) => void
  onUpdate: (cardId: string, updatedCard: Partial<Card>) => void
  onDragStart: (e: React.DragEvent, card: Card, cardIndex: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetIndex: number) => void
  isDragOver?: boolean
}

const CardViewMobile: React.FC<CardViewMobileProps> = memo(({ 
  card, 
  cardIndex,
  listId,
  onDelete, 
  onUpdate, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  isDragOver
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [titleInput, setTitleInput] = useState(card.title)
  const [descriptionInput, setDescriptionInput] = useState(card.description || '')
  const cardRef = useRef<HTMLDivElement>(null)
  const [dragPreview, setDragPreview] = useState<HTMLElement | null>(null)
  const [currentDropZone, setCurrentDropZone] = useState<string | null>(null)

  // Touch drop zone setup
  const { registerDropZone, handleTouchMove: dropZoneTouchMove, handleTouchEnd: dropZoneTouchEnd } = useTouchDropZone({
    onDragEnter: (dropZone) => {
      setCurrentDropZone(dropZone.id)
      dropZone.element.classList.add('card-drag-over')
    },
    onDragLeave: (dropZone) => {
      setCurrentDropZone(null)
      dropZone.element.classList.remove('card-drag-over')
    },
    onDrop: (dropZone) => {
      if (dropZone.data?.cardIndex !== undefined) {
        // Drop on another card
        const targetIndex = dropZone.data.cardIndex
        
        // Create synthetic drop event
        const dropEvent = new CustomEvent('drop', {
          bubbles: true,
          cancelable: true
        }) as any
        
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: {
            types: ['text/card', 'application/json', 'text/sourceList'],
            getData: (type: string) => {
              if (type === 'text/card') return card.id
              if (type === 'application/json') return JSON.stringify(card)
              if (type === 'text/sourceList') return listId
              return ''
            }
          },
          writable: false
        })
        
        Object.defineProperty(dropEvent, 'preventDefault', {
          value: () => {},
          writable: false
        })
        
        onDrop(dropEvent, targetIndex)
      } else if (dropZone.data?.isContainer) {
        // Drop on container (append to end)
        const dropEvent = new CustomEvent('drop', {
          bubbles: true,
          cancelable: true
        }) as any
        
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: {
            types: ['text/card', 'application/json', 'text/sourceList'],
            getData: (type: string) => {
              if (type === 'text/card') return card.id
              if (type === 'application/json') return JSON.stringify(card)
              if (type === 'text/sourceList') return listId
              return ''
            }
          },
          writable: false
        })
        
        Object.defineProperty(dropEvent, 'preventDefault', {
          value: () => {},
          writable: false
        })
        
        dropZone.element.dispatchEvent(dropEvent)
      }
      
      // Clean up
      setCurrentDropZone(null)
      dropZone.element.classList.remove('card-drag-over')
    }
  })

  // Touch drag setup
  const { dragState, touchHandlers, isDragging } = useTouchDrag({
    threshold: 15,
    onDragStart: (event, element) => {
      if (isEditing) return
      
      // Add mobile dragging class
      document.body.classList.add('mobile-dragging')
      
      // Create drag preview
      const preview = element.cloneNode(true) as HTMLElement
      preview.style.position = 'fixed'
      preview.style.top = '-1000px'
      preview.style.left = '-1000px'
      preview.style.pointerEvents = 'none'
      preview.style.opacity = '0.8'
      preview.style.zIndex = '9999'
      preview.style.transform = 'rotate(3deg)'
      preview.classList.add('drag-preview')
      document.body.appendChild(preview)
      setDragPreview(preview)
      
      // Register all cards as drop zones
      const allCards = document.querySelectorAll('.card-view-mobile')
      allCards.forEach((cardElement, index) => {
        if (cardElement !== element) {
          const cardIndex = parseInt(cardElement.getAttribute('data-card-index') || '0')
          registerDropZone(cardElement as HTMLElement, `card-${index}`, { cardIndex })
        }
      })
      
      // Register card containers as drop zones
      const allContainers = document.querySelectorAll('.cards-container')
      allContainers.forEach((container, index) => {
        registerDropZone(container as HTMLElement, `container-${index}`, { isContainer: true })
      })
      
      // Call original drag start handler
      const fakeEvent = {
        dataTransfer: {
          setData: () => {},
          getData: (type: string) => {
            if (type === 'text/card') return card.id
            if (type === 'application/json') return JSON.stringify(card)
            if (type === 'text/sourceList') return listId
            return ''
          }
        }
      } as unknown as React.DragEvent
      
      onDragStart(fakeEvent, card, cardIndex)
    },
    onDragMove: (event, state) => {
      if (!dragState.currentPosition) return
      
      // Update drag preview position
      if (dragPreview) {
        dragPreview.style.top = `${dragState.currentPosition.y - 40}px`
        dragPreview.style.left = `${dragState.currentPosition.x - 100}px`
      }
      
      // Handle drop zone detection
      dropZoneTouchMove(dragState.currentPosition)
    },
    onDragEnd: (event, state) => {
      if (!dragState.currentPosition) return
      
      // Handle drop
      dropZoneTouchEnd(dragState.currentPosition)
      
      // Clean up
      document.body.classList.remove('mobile-dragging')
      
      if (dragPreview) {
        document.body.removeChild(dragPreview)
        setDragPreview(null)
      }
      
      // Remove drag over classes from all cards
      const allCards = document.querySelectorAll('.card-view-mobile')
      allCards.forEach(cardElement => {
        cardElement.classList.remove('card-drag-over')
      })
      
      const allContainers = document.querySelectorAll('.cards-container')
      allContainers.forEach(container => {
        container.classList.remove('card-drag-over')
      })
    }
  })

  // cardが変更されたらinputも更新
  useEffect(() => {
    setTitleInput(card.title)
    setDescriptionInput(card.description || '')
  }, [card.title, card.description])

  // Register card drop zones when component mounts
  useEffect(() => {
    if (cardRef.current) {
      const unregister = registerDropZone(
        cardRef.current, 
        `card-${cardIndex}`, 
        { cardIndex }
      )
      return unregister
    }
  }, [registerDropZone, cardIndex])

  const handleSave = useCallback(() => {
    if (titleInput.trim()) {
      onUpdate(card.id, {
        title: titleInput.trim(),
        description: descriptionInput.trim() || undefined
      })
    } else {
      setTitleInput(card.title)
      setDescriptionInput(card.description || '')
    }
    setIsEditing(false)
  }, [titleInput, descriptionInput, onUpdate, card.title, card.description, card.id])

  const handleCancel = useCallback(() => {
    setTitleInput(card.title)
    setDescriptionInput(card.description || '')
    setIsEditing(false)
  }, [card.title, card.description])

  const handleCardClick = useCallback(() => {
    if (!isEditing && !isDragging) {
      setIsEditing(true)
    }
  }, [isEditing, isDragging])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`カード「${card.title}」を削除しますか？`)) {
      onDelete(card.id)
    }
  }, [card.title, onDelete, card.id])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }, [handleSave, handleCancel])

  if (isEditing) {
    return (
      <div className="card-edit-mobile">
        <input
          className="card-title-input-mobile"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="カードのタイトル"
          autoFocus
        />
        <textarea
          className="card-description-input-mobile"
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="説明（オプション）"
          rows={3}
        />
        <div className="card-edit-actions-mobile">
          <button className="save-btn-mobile" onClick={handleSave}>
            保存
          </button>
          <button className="cancel-btn-mobile" onClick={handleCancel}>
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={cardRef}
      className={`card-view-mobile ${isDragOver ? 'card-drag-over' : ''} ${isDragging ? 'dragging' : ''} ${currentDropZone ? 'hover-drop-zone' : ''}`}
      onClick={handleCardClick}
      {...touchHandlers}
      onDragOver={onDragOver}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: isDragging ? 'none' : 'manipulation'
      }}
      data-card-index={cardIndex}
    >
      <div className="card-content-mobile">
        <h4 className="card-title-mobile">
          {card.title}
        </h4>
        {card.description && (
          <p className="card-description-mobile">
            {card.description}
          </p>
        )}
      </div>
      <button 
        className="delete-card-btn-mobile"
        onClick={handleDeleteClick}
        disabled={isDragging}
        aria-label="カードを削除"
      >
        ×
      </button>
    </div>
  )
})

export default CardViewMobile