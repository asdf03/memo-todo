import React, { useState, useEffect, memo, useCallback } from 'react'
import { List } from '../../types'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import './styles/desktop.css'

interface ListHeaderDesktopProps {
  list: List
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListHeaderDesktop: React.FC<ListHeaderDesktopProps> = memo(({ list, onListDragStart, onListDragEnd }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(list.title)
  const [isDragging, setIsDragging] = useState(false)
  const { updateListTitle, deleteList } = useBoardOperations()

  useEffect(() => {
    setTitleInput(list.title)
  }, [list.title])

  const handleTitleSave = useCallback(async () => {
    if (titleInput.trim() && titleInput.trim() !== list.title) {
      await updateListTitle(list.id, titleInput.trim())
    } else if (!titleInput.trim()) {
      setTitleInput(list.title)
    }
    setIsEditingTitle(false)
  }, [titleInput, list.title, list.id, updateListTitle])

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
          draggable={!isEditingTitle}
          onDragStart={handleListDragStart}
          onDragEnd={handleListDragEnd}
          style={{
            cursor: !isEditingTitle ? 'grab' : 'text',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
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

export default ListHeaderDesktop 