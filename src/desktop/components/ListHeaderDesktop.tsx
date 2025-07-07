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
    <div className="flex items-center justify-between w-full">
      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="input flex-1"
          autoFocus
          maxLength={100}
          aria-label="リストタイトルを編集"
        />
      ) : (
        <h3
          className={`list__title focus-ring ${isDragging ? 'dragging' : ''}`}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          draggable={!isEditing}
          onDragStart={handleListDragStart}
          onDragEnd={handleListDragEnd}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleDoubleClick()
            }
          }}
          aria-label={`リスト: ${list.title}。ダブルクリックで編集`}
          title="ダブルクリックで編集"
        >
          {list.title}
        </h3>
      )}
      <button 
        className="btn btn--ghost btn--icon btn--sm focus-ring"
        onClick={handleDeleteList}
        aria-label={`リスト「${list.title}」を削除`}
        title="リストを削除"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
})

export default ListHeaderDesktop 