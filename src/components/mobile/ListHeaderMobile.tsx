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
  
  // デバッグ用
  const debugMode = useRef(true)
  const debugLog = useCallback((message: string, data?: any) => {
    if (debugMode.current) {
      console.log(`[Mobile Debug] ${message}`, data || '')
    }
  }, [])

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
    debugLog('Starting drag mode')
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
  }, [list, onListDragStart, debugLog])

  const endDragging = useCallback(() => {
    debugLog('Ending drag mode')
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
  }, [onListDragEnd, debugLog])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    debugLog('Touch start', { isEditingTitle, touchesLength: e.touches.length })
    
    if (isEditingTitle || isDragging) {
      debugLog('Touch start ignored', { isEditingTitle, isDragging })
      return
    }
    
    // イベント伝播を停止してBoardViewMobileのタッチイベントと競合しないようにする
    e.stopPropagation()
    
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    
    debugLog('Touch start position set', touchStartPos.current)
    
    // 長押しタイマー開始（少し短めに設定）
    longPressTimer.current = setTimeout(() => {
      debugLog('Long press timer fired')
      if (touchStartPos.current) {
        startDragging()
      }
    }, 400) // 400msに短縮
    
    debugLog('Long press timer started (400ms)')
  }, [isEditingTitle, isDragging, startDragging, debugLog])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) {
      debugLog('Touch move ignored - no start position')
      return
    }
    
    // イベント伝播を停止
    e.stopPropagation()
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    
    debugLog('Touch move', { deltaX, deltaY, isDragging, longPressStarted })
    
    // ドラッグ開始前の移動判定を緩くする
    if (!isDragging && !longPressStarted && (deltaX > 15 || deltaY > 15)) {
      debugLog('Canceling long press due to movement')
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      return
    }
    
    // ドラッグ中の場合、視覚的フィードバックを提供
    if (isDragging) {
      debugLog('Providing drag feedback')
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
  }, [isDragging, longPressStarted, list.id, debugLog])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    debugLog('Touch end', { isDragging, hasTimer: !!longPressTimer.current })
    
    // イベント伝播を停止
    e.stopPropagation()
    
    // 長押しタイマーをクリア
    if (longPressTimer.current) {
      debugLog('Clearing long press timer')
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (isDragging) {
      debugLog('Processing drag end')
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
          
          debugLog('Drop calculation', { dropIndex, currentIndex })
          
          if (dropIndex !== -1 && currentIndex !== -1 && dropIndex !== currentIndex) {
            debugLog('Dispatching drop event')
            
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
    debugLog('Touch end cleanup completed')
  }, [isDragging, endDragging, list, debugLog])

  const handleTouchCancel = useCallback(() => {
    debugLog('Touch cancel')
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    
    if (isDragging) {
      endDragging()
    }
  }, [isDragging, endDragging, debugLog])

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
      {/* デバッグ情報表示 */}
      {debugMode.current && (
        <div style={{ 
          fontSize: '10px', 
          color: '#666', 
          position: 'absolute', 
          top: '-20px', 
          left: '0',
          background: 'rgba(255,255,255,0.8)',
          padding: '2px 4px',
          borderRadius: '2px',
          zIndex: 1000
        }}>
          {isDragging ? 'DRAGGING' : 'IDLE'} | Timer: {longPressTimer.current ? 'ON' : 'OFF'} | LongPress: {longPressStarted ? 'YES' : 'NO'}
        </div>
      )}
      
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            touchAction: 'none'
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

export default ListHeaderMobile 