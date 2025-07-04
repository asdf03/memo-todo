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
    // モバイルドラッグ時のスクロール復元
    document.body.classList.remove('mobile-dragging')
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
      // モバイルドラッグ時のスクロール無効化
      document.body.classList.add('mobile-dragging')
      onListDragStart?.(e as any, list)
    }, 500)
  }, [isEditingTitle, onListDragStart, list])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    
    // 一定以上移動したら長押し取消（ドラッグ開始前のみ）
    if (!isDragging && (deltaX > 10 || deltaY > 10)) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
    
    // ドラッグ中の場合、視覚的フィードバックを提供
    if (isDragging) {
      e.preventDefault() // スクロールを防止
      
      // ドラッグ中の他のリストにドラッグオーバー効果を適用
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      const allListWrappers = document.querySelectorAll('.list-wrapper')
      
      // 既存のドラッグオーバークラスを削除
      allListWrappers.forEach(wrapper => {
        wrapper.classList.remove('drag-over')
      })
      
      // 現在の位置にあるリストラッパーにドラッグオーバー効果を適用
      if (elementBelow) {
        const targetListWrapper = elementBelow.closest('.list-wrapper')
        if (targetListWrapper && targetListWrapper !== elementBelow.closest(`[data-list-id="${list.id}"]`)?.closest('.list-wrapper')) {
          targetListWrapper.classList.add('drag-over')
        }
      }
    }
  }, [isDragging, list.id])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (isDragging) {
      // タッチ終了位置でドロップ処理を実行
      const touch = e.changedTouches[0]
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      
      // 全てのドラッグオーバークラスを削除
      const allListWrappers = document.querySelectorAll('.list-wrapper')
      allListWrappers.forEach(wrapper => {
        wrapper.classList.remove('drag-over')
      })
      
      if (elementBelow) {
        // ドロップ先のリストラッパーを見つける
        const targetListWrapper = elementBelow.closest('.list-wrapper')
        if (targetListWrapper) {
          const allWrappers = Array.from(document.querySelectorAll('.list-wrapper'))
          const dropIndex = allWrappers.indexOf(targetListWrapper)
          const currentIndex = allWrappers.findIndex(wrapper => 
            wrapper.querySelector(`[data-list-id="${list.id}"]`)
          )
          
          if (dropIndex !== -1 && currentIndex !== -1 && dropIndex !== currentIndex) {
            // カスタムドロップイベントを作成してディスパッチ
            const dropEvent = new CustomEvent('drop', {
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
            }) as any
            
            // dataTransferプロパティを追加
            dropEvent.dataTransfer = {
              types: ['text/list'],
              getData: (type: string) => {
                if (type === 'text/list') return list.id
                if (type === 'application/json') return JSON.stringify(list)
                return ''
              }
            }
            
            targetListWrapper.dispatchEvent(dropEvent)
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
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

export default ListHeader