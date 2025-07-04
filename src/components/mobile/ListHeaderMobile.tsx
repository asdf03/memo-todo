import React, { useState, memo, useCallback } from 'react'
import { List } from '../../types'
import { useBoardOperations } from '../../hooks/useBoardOperations'

interface ListHeaderMobileProps {
  list: List
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListHeaderMobile: React.FC<ListHeaderMobileProps> = memo(({ list, onListDragStart, onListDragEnd }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(list.title)
  const [isDragging, setIsDragging] = useState(false)
  const [longPressStarted, setLongPressStarted] = useState(false)
  const { deleteList } = useBoardOperations()
  const [isLoading] = useState(false)
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const startDragging = useCallback(() => {
    setIsDragging(true)
    setLongPressStarted(true)
    document.body.classList.add('mobile-dragging')
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
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
  }, [list, onListDragStart])

  const endDragging = useCallback(() => {
    setIsDragging(false)
    setLongPressStarted(false)
    document.body.classList.remove('mobile-dragging')
    const allListWrappers = document.querySelectorAll('.list-wrapper-mobile')
    allListWrappers.forEach(wrapper => {
      wrapper.classList.remove('drag-over')
    })
    onListDragEnd?.()
  }, [onListDragEnd])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isEditingTitle || isDragging) {
      return
    }
    e.stopPropagation()
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
    const timer = setTimeout(() => {
      if (touchStartPos) {
        startDragging()
      }
    }, 400)
    setLongPressTimer(timer)
  }, [isEditingTitle, isDragging, startDragging, touchStartPos])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos) return;
    e.stopPropagation()
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.y)
    if (!isDragging && !longPressStarted && (deltaX > 15 || deltaY > 15)) {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      setTouchStartPos(null)
      return
    }
    if (isDragging) {
      e.preventDefault()
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      const allListWrappers = document.querySelectorAll('.list-wrapper-mobile')
      allListWrappers.forEach(wrapper => {
        wrapper.classList.remove('drag-over')
      })
      if (elementBelow) {
        const targetListWrapper = elementBelow.closest('.list-wrapper-mobile')
        if (targetListWrapper && targetListWrapper !== elementBelow.closest(`[data-list-id="${list.id}"]`)?.closest('.list-wrapper-mobile')) {
          targetListWrapper.classList.add('drag-over')
        }
      }
    }
  }, [isDragging, longPressStarted, list.id, touchStartPos, longPressTimer])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTouchStartPos(null)
    if (isDragging) {
      const touch = e.changedTouches[0]
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      if (elementBelow) {
        const targetListWrapper = elementBelow.closest('.list-wrapper-mobile')
        if (targetListWrapper) {
          const allWrappers = Array.from(document.querySelectorAll('.list-wrapper-mobile'))
          const dropIndex = allWrappers.indexOf(targetListWrapper)
          const currentIndex = allWrappers.findIndex(wrapper => 
            wrapper.querySelector(`[data-list-id="${list.id}"]`)
          )
          if (dropIndex !== -1 && currentIndex !== -1 && dropIndex !== currentIndex) {
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
            targetListWrapper.dispatchEvent(dropEvent)
            if (navigator.vibrate) {
              navigator.vibrate([30, 50, 30])
            }
          }
        }
      }
      endDragging()
    }
  }, [isDragging, endDragging, list])

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTouchStartPos(null)
    if (isDragging) {
      endDragging()
    }
  }, [isDragging, endDragging, longPressTimer])

  const handleDeleteList = useCallback(async () => {
    if (confirm(`リスト「${list.title}」を削除しますか？`)) {
      await deleteList(list.id)
    }
  }, [list.title, list.id, deleteList])

  return (
    <div 
      className={`list-header-mobile ${isDragging ? 'dragging' : ''}`}
      data-list-id={list.id}
    >
      {isEditingTitle ? (
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          className="list-title-input-mobile"
          autoFocus
          disabled={isLoading}
          maxLength={100}
        />
      ) : (
        <h3 
          className="list-title-mobile" 
          onClick={() => setIsEditingTitle(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {list.title}
        </h3>
      )}
      <button 
        className="delete-list-btn-mobile"
        onClick={handleDeleteList}
        aria-label="リストを削除"
      >
        ×
      </button>
    </div>
  )
})

export default ListHeaderMobile 