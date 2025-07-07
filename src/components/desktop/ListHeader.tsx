import React, { useState, memo, useCallback } from 'react'
import { List } from '../../types'
import { useBoardOperations } from '../../hooks/shared/useBoardOperations'

interface ListHeaderProps {
  list: List
  onListDragStart?: (e: React.DragEvent) => void
  onListDragEnd?: () => void
}

const ListHeader: React.FC<ListHeaderProps> = memo(({ 
  list, 
  onListDragStart, 
  onListDragEnd 
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(list.title)
  const { deleteList, updateListTitle } = useBoardOperations()
  const [isLoading] = useState(false)

  const handleTitleSave = useCallback(async () => {
    if (titleInput.trim() && titleInput !== list.title) {
      try {
        await updateListTitle(list.id, titleInput.trim())
      } catch (error) {
        console.error('Failed to update list title:', error)
        setTitleInput(list.title)
      }
    }
    setIsEditingTitle(false)
  }, [titleInput, list.title, list.id, updateListTitle])

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
      className="list-header"
      draggable={!isEditingTitle}
      onDragStart={onListDragStart}
      onDragEnd={onListDragEnd}
      data-list-id={list.id}
    >
      {isEditingTitle ? (
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyPress}
          className="list-title-input"
          autoFocus
          disabled={isLoading}
          maxLength={100}
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
        onClick={handleDeleteList}
        aria-label="リストを削除"
      >
        ×
      </button>
    </div>
  )
})

export default ListHeader