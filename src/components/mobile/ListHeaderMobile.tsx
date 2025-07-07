import React, { useState, memo, useCallback, useRef, useEffect } from 'react'
import { List } from '../../types'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import { useTouchDrag } from '../../hooks/useTouchDrag'
import { useTouchDropZone } from '../../hooks/useTouchDropZone'

interface ListHeaderMobileProps {
  list: List
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListHeaderMobile: React.FC<ListHeaderMobileProps> = memo(({ list, onListDragStart, onListDragEnd }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(list.title)
  const { deleteList, updateList } = useBoardOperations()
  const [isLoading] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [currentDropZone, setCurrentDropZone] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<HTMLElement | null>(null)

  // Touch drop zone setup
  const { registerDropZone, handleTouchMove: dropZoneTouchMove, handleTouchEnd: dropZoneTouchEnd } = useTouchDropZone({
    onDragEnter: (dropZone) => {
      setCurrentDropZone(dropZone.id)
      dropZone.element.classList.add('drag-over')
    },
    onDragLeave: (dropZone) => {
      setCurrentDropZone(null)
      dropZone.element.classList.remove('drag-over')
    },
    onDrop: (dropZone) => {
      const allWrappers = Array.from(document.querySelectorAll('.list-wrapper-mobile'))
      const dropIndex = allWrappers.indexOf(dropZone.element)
      const currentIndex = allWrappers.findIndex(wrapper => 
        wrapper.querySelector(`[data-list-id="${list.id}"]`)
      )
      
      if (dropIndex !== -1 && currentIndex !== -1 && dropIndex !== currentIndex) {
        // Create synthetic drop event for existing logic
        const dropEvent = new CustomEvent('drop', {
          bubbles: true,
          cancelable: true,
          detail: {
            listId: list.id,
            dropIndex: dropIndex,
            dataTransfer: {
              types: ['text/list'],
              getData: (type: string) => {
                if (type === 'text/list') return list.id
                if (type === 'application/json') return JSON.stringify(list)
                return ''
              }
            }
          }
        })
        
        // Add dataTransfer property
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: {
            types: ['text/list'],
            getData: (type: string) => {
              if (type === 'text/list') return list.id
              if (type === 'application/json') return JSON.stringify(list)
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
      dropZone.element.classList.remove('drag-over')
    }
  })

  // Touch drag setup
  const { dragState, touchHandlers, isDragging } = useTouchDrag({
    threshold: 15,
    onDragStart: (event, element) => {
      if (isEditingTitle) return
      
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
      preview.classList.add('drag-preview')
      document.body.appendChild(preview)
      setDragPreview(preview)
      
      // Register all list wrappers as drop zones
      const allWrappers = document.querySelectorAll('.list-wrapper-mobile')
      allWrappers.forEach((wrapper, index) => {
        registerDropZone(wrapper as HTMLElement, `list-${index}`, { index })
      })
      
      // Call original drag start handler
      const fakeEvent = {
        dataTransfer: {
          setData: () => {},
          getData: (type: string) => {
            if (type === 'text/list') return list.id
            if (type === 'application/json') return JSON.stringify(list)
            return ''
          }
        }
      } as unknown as React.DragEvent
      
      onListDragStart?.(fakeEvent, list)
    },
    onDragMove: (event, state) => {
      if (!dragState.currentPosition) return
      
      // Update drag preview position
      if (dragPreview) {
        dragPreview.style.top = `${dragState.currentPosition.y - 30}px`
        dragPreview.style.left = `${dragState.currentPosition.x - 50}px`
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
      
      // Remove drag over classes
      const allWrappers = document.querySelectorAll('.list-wrapper-mobile')
      allWrappers.forEach(wrapper => {
        wrapper.classList.remove('drag-over')
      })
      
      onListDragEnd?.()
    }
  })

  // Register list wrappers as drop zones when component mounts
  useEffect(() => {
    const allWrappers = document.querySelectorAll('.list-wrapper-mobile')
    const cleanup: (() => void)[] = []
    
    allWrappers.forEach((wrapper, index) => {
      const unregister = registerDropZone(wrapper as HTMLElement, `list-${index}`, { index })
      cleanup.push(unregister)
    })
    
    return () => {
      cleanup.forEach(fn => fn())
    }
  }, [registerDropZone])

  const handleTitleSave = useCallback(async () => {
    if (titleInput.trim() && titleInput !== list.title) {
      try {
        await updateList(list.id, { title: titleInput.trim() })
      } catch (error) {
        console.error('Failed to update list title:', error)
        setTitleInput(list.title) // Revert on error
      }
    }
    setIsEditingTitle(false)
  }, [titleInput, list.title, list.id, updateList])

  const handleTitleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setTitleInput(list.title)
      setIsEditingTitle(false)
    }
  }, [handleTitleSave, list.title])

  const handleDeleteList = useCallback(async () => {
    if (confirm(`リスト「${list.title}」を削除しますか？`)) {
      await deleteList(list.id)
    }
  }, [list.title, list.id, deleteList])

  return (
    <div 
      ref={headerRef}
      className={`list-header-mobile ${isDragging ? 'dragging' : ''} ${currentDropZone ? 'drag-over' : ''}`}
      data-list-id={list.id}
    >
      {isEditingTitle ? (
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyPress}
          className="list-title-input-mobile"
          autoFocus
          disabled={isLoading}
          maxLength={100}
        />
      ) : (
        <h3 
          className="list-title-mobile" 
          onClick={() => !isDragging && setIsEditingTitle(true)}
          {...touchHandlers}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none'
          }}
        >
          {list.title}
        </h3>
      )}
      <button 
        className="delete-list-btn-mobile"
        onClick={handleDeleteList}
        aria-label="リストを削除"
        disabled={isDragging}
      >
        ×
      </button>
    </div>
  )
})

export default ListHeaderMobile