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
      // モバイル用のドラッグ開始処理
      setIsDragging(true)
      onListDragStart?.(e as any, list)
    }, 500)
  }, [isEditingTitle, onListDragStart, list])

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
    
    // ドラッグ中の場合、視覚的フィードバックを提供
    if (isDragging) {
      // ドラッグ中の処理をここに追加可能
    }
  }, [isDragging])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (isDragging) {
      // タッチ終了位置でドロップ処理を実行
      const touch = e.changedTouches[0]
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      
      if (elementBelow) {
        // ドロップ先のリストを見つける
        const listWrapper = elementBelow.closest('.list-wrapper')
        if (listWrapper) {
          const listElements = Array.from(document.querySelectorAll('.list-wrapper'))
          const dropIndex = listElements.indexOf(listWrapper)
          
          if (dropIndex !== -1) {
            // ドロップイベントをシミュレート
            const dropEvent = new Event('drop') as any
            dropEvent.dataTransfer = {
              types: ['text/list'],
              getData: (type: string) => {
                if (type === 'text/list') return list.id
                if (type === 'application/json') return JSON.stringify(list)
                return ''
              }
            }
            
            listWrapper.dispatchEvent(dropEvent)
          }
        }
      }
      
      handleListDragEnd()
    }
    
    touchStartPos.current = null
  }, [isDragging, handleListDragEnd, list])

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