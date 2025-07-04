import React, { useState, useEffect, memo, useCallback } from 'react'
import { List } from '../types'
import { useBoardOperations } from '../hooks/useBoardOperations'

interface ListHeaderProps {
  list: List
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
  onMobileMenu?: () => void
}

const ListHeader: React.FC<ListHeaderProps> = memo(({ list, onListDragStart, onListDragEnd, onMobileMenu }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(list.title)
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
    e.dataTransfer.setData('text/list', list.id)
    e.dataTransfer.setData('application/json', JSON.stringify(list))
    onListDragStart?.(e, list)
  }, [list, onListDragStart])

  const handleListDragEnd = useCallback(() => {
    onListDragEnd?.()
  }, [onListDragEnd])

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
      className="list-header"
      draggable={!isEditingTitle}
      onDragStart={handleListDragStart}
      onDragEnd={handleListDragEnd}
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
        className="delete-list-btn desktop-only"
        onClick={handleDeleteClick}
      >
        ×
      </button>
      <button 
        className="mobile-list-menu mobile-only"
        onClick={(e) => {
          e.stopPropagation()
          onMobileMenu?.()
        }}
      >
        ⋮
      </button>
    </div>
  )
})

export default ListHeader