import React, { useState, memo, useCallback } from 'react'
import { List } from '../../types'
import { useBoardOperations } from '../../hooks/useBoardOperations'

interface ListHeaderDesktopProps {
  list: List
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListHeaderDesktop: React.FC<ListHeaderDesktopProps> = memo(({ list, onListDragStart, onListDragEnd }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [isDragging, setIsDragging] = useState(false)
  const { updateListTitle, deleteList } = useBoardOperations()

  const handleSave = useCallback(() => {
    if (isEditing && title.trim() && title !== list.title) {
      updateListTitle(list.id, title.trim())
    }
    setIsEditing(false)
  }, [isEditing, title, list.title, list.id, updateListTitle])

  const handleMouseDown = useCallback(() => {
    if (!isEditing) {
      setIsDragging(false)
    }
  }, [isEditing])

  const handleListDragStart = useCallback((e: React.DragEvent) => {
    console.log('[Desktop] Drag start:', list.title)
    e.dataTransfer.setData('text/list', list.id)
    e.dataTransfer.setData('application/json', JSON.stringify(list))
    setIsDragging(true)
    onListDragStart?.(e, list)
  }, [list, onListDragStart])

  const handleListDragEnd = useCallback(() => {
    console.log('[Desktop] Drag end:', list.title)
    setIsDragging(false)
    onListDragEnd?.()
  }, [onListDragEnd, list.title])

  const handleDeleteList = useCallback(async () => {
    if (confirm(`リスト「${list.title}」を削除しますか？`)) {
      await deleteList(list.id)
    }
  }, [list.title, list.id, deleteList])

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  return (
    <div 
      className={`list-header ${isDragging ? 'dragging' : ''}`}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          className="list-title-input-desktop"
          autoFocus
          maxLength={100}
        />
      ) : (
        <h3
          className="list-title-desktop"
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          draggable={!isEditing}
          onDragStart={handleListDragStart}
          onDragEnd={handleListDragEnd}
        >
          {list.title}
        </h3>
      )}
      <button 
        className="delete-list-btn"
        onClick={handleDeleteList}
      >
        ×
      </button>
    </div>
  )
})

export default ListHeaderDesktop 