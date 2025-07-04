import React, { useState, useEffect, memo, useCallback, useRef } from 'react'
import { List } from '../../types'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import './styles/mobile.css'

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
  const { updateListTitle, deleteList } = useBoardOperations()

  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  const dragStartTime = useRef<number>(0)

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

  const startDragging = useCallback(() => {
    setIsDragging(true)
    setLongPressStarted(true)
    dragStartTime.current = Date.now()
    
    // モバイルドラッグ時のスクロール無効化
    document.body.classList.add('mobile-dragging')
    
    // ハプティックフィードバック（対応デバイスのみ）
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    // 親コンポーネントに通知
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
    
    // モバイルドラッグ時のスクロール復元
    document.body.classList.remove('mobile-dragging')
    
    // 全てのドラッグオーバークラスを削除
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
    
    // イベント伝播を停止してBoardViewMobileのタッチイベントと競合しないようにする
    e.stopPropagation()
    
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    
    // 長押しタイマー開始
    longPressTimer.current = setTimeout(() => {
      if (touchStartPos.current) {
        startDragging()
      }
    }, 400)
  }, [isEditingTitle, isDragging, startDragging])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) {
      return
    }
    
    // イベント伝播を停止
    e.stopPropagation()
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    
    // ドラッグ開始前の移動判定を緩くする
    if (!isDragging && !longPressStarted && (deltaX > 15 || deltaY > 15)) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      return
    }
    
    // ドラッグ中の場合、視覚的フィードバックを提供
    if (isDragging) {
      e.preventDefault() // スクロールを防止
      
      // ドラッグ中の他のリストにドラッグオーバー効果を適用
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      const allListWrappers = document.querySelectorAll('.list-wrapper-mobile')
      
      // 既存のドラッグオーバークラスを削除
      allListWrappers.forEach(wrapper => {
        wrapper.classList.remove('drag-over')
      })
      
      // 現在の位置にあるリストラッパーにドラッグオーバー効果を適用
      if (elementBelow) {
        const targetListWrapper = elementBelow.closest('.list-wrapper-mobile')
        if (targetListWrapper && targetListWrapper !== elementBelow.closest(`[data-list-id="${list.id}"]`)?.closest('.list-wrapper-mobile')) {
          targetListWrapper.classList.add('drag-over')
        }
      }
    }
  }, [isDragging, longPressStarted, list.id])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // イベント伝播を停止
    e.stopPropagation()
    
    // 長押しタイマーをクリア
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
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
            // カスタムドロップイベントを作成してディスパッチ
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
            
            // dataTransferプロパティを直接設定
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
            
            // preventDefault メソッドを追加
            Object.defineProperty(dropEvent, 'preventDefault', {
              value: () => {},
              writable: false
            })
            
            targetListWrapper.dispatchEvent(dropEvent)
            
            // 成功フィードバック
            if (navigator.vibrate) {
              navigator.vibrate([30, 50, 30])
            }
          }
        }
      }
      
      endDragging()
    }
    
    touchStartPos.current = null
  }, [isDragging, endDragging, list])

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    
    if (isDragging) {
      endDragging()
    }
  }, [isDragging, endDragging])

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
      className={`list-header-mobile ${isDragging ? 'dragging' : ''}`}
      data-list-id={list.id}
    >
      {isEditingTitle ? (
        <input
          className="list-title-input-mobile"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleKeyDown}
          autoFocus
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
        onClick={handleDeleteClick}
        aria-label="リストを削除"
      >
        ×
      </button>
    </div>
  )
})

export default ListHeaderMobile 