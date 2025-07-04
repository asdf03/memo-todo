import React, { useState, useEffect, memo, useCallback, useRef } from 'react'
import { List } from '../types'
import { useBoardOperations } from '../hooks/useBoardOperations'

interface ListHeaderProps {
  list: List
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListHeader: React.FC<ListHeaderProps> = memo(({ list, onListDragStart, onListDragEnd }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(list.title)
  const [isDragging, setIsDragging] = useState(false)
  const { updateListTitle, deleteList } = useBoardOperations()

  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setTitleInput(list.title)
  }, [list.title])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const handleTitleSave = useCallback(async () => {
    if (titleInput.trim() && titleInput.trim() !== list.title) {
      await updateListTitle(list.id, titleInput.trim())
    } else if (!titleInput.trim()) {
      setTitleInput(list.title)
    }
    setIsEditingTitle(false)
  }, [titleInput, list.title, list.id, updateListTitle])

  const handleListDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/list', list.id)
    e.dataTransfer.setData('application/json', JSON.stringify(list))
    setIsDragging(true)
    onListDragStart?.(e, list)
  }, [list, onListDragStart])

  const handleListDragEnd = useCallback(() => {
    setIsDragging(false)
    onListDragEnd?.()
  }, [onListDragEnd])

  // モバイル長押しドラッグ
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isEditingTitle) return
    
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    
    // 長押しタイマー開始
    longPressTimer.current = setTimeout(() => {
      // PC版のドラッグイベントをシミュレート
      const fakeEvent = {
        dataTransfer: {
          setData: (type: string, data: string) => {},
          effectAllowed: 'move'
        },
        preventDefault: () => {},
        stopPropagation: () => {}
      } as React.DragEvent
      
      handleListDragStart(fakeEvent)
    }, 500)
  }, [isEditingTitle, handleListDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    
    // 一定以上移動したら長押し取消
    if (deltaX > 10 || deltaY > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    
    if (isDragging) {
      handleListDragEnd()
    }
  }, [isDragging, handleListDragEnd])

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    
    if (isDragging) {
      handleListDragEnd()
    }
  }, [isDragging, handleListDragEnd])

  const handleDeleteList = useCallback(async () => {
    if (confirm(`リスト「${list.title}」を削除しますか？`)) {
      await deleteList(list.id)
    }
  }, [list.title, list.id, deleteList])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTitleSave()
    if (e.key === 'Escape') {
      setTitleInput(list.title)
      setIsEditingTitle(false)
    }
  }, [handleTitleSave, list.title])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    handleDeleteList()
  }, [handleDeleteList])

  return (
    <div 
      className={`list-header ${isDragging ? 'dragging' : ''}`}
      draggable={!isEditingTitle}
      onDragStart={handleListDragStart}
      onDragEnd={handleListDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {isEditingTitle ? (
        <input
          className="list-title-input"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <h3 
          className="list-title" 
          onClick={() => setIsEditingTitle(true)}
        >
          {list.title}
        </h3>
      )}
      <button 
        className="delete-list-btn"
        onClick={handleDeleteClick}
      >
        ×
      </button>
    </div>
  )
})

export default ListHeader