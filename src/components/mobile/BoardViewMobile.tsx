import React, { useState, useCallback, useRef } from 'react'
import { Card, List } from '../../types'
import ListView from '../shared/ListView'
import AddListForm from '../shared/common/AddListForm'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import { useBoardContext } from '../../context/BoardContext'
import './styles/BoardViewMobile.css'

const BoardViewMobile: React.FC = () => {
  const { board } = useBoardContext()
  const [draggedList, setDraggedList] = useState<List | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)
  const [draggedListIndex, setDraggedListIndex] = useState<number>(-1)
  const [animatingListId, setAnimatingListId] = useState<string | null>(null)
  const [displacedListIds, setDisplacedListIds] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  
  const { reorderLists, moveCard } = useBoardOperations()

  const handleCardDrop = async (card: Card, targetListId: string, targetIndex?: number) => {
    await moveCard(card, targetListId, targetIndex)
  }

  const handleListDragStart = useCallback((_e: React.DragEvent | any, list: List) => {
    setDraggedList(list)
    const listIndex = board.lists.findIndex(l => l.id === list.id)
    setDraggedListIndex(listIndex)
    setIsDragging(true)
    
    // モバイルでドラッグ開始時にボディのスクロールを無効化
    document.body.classList.add('mobile-dragging')
    
    // ハプティックフィードバック
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [board.lists])

  const handleListDragEnd = useCallback(() => {
    setDraggedList(null)
    setDragOverIndex(-1)
    setDraggedListIndex(-1)
    setIsDragging(false)
    
    // ボディのスクロールを再有効化
    document.body.classList.remove('mobile-dragging')
  }, [])

  const handleListDragOver = useCallback((e: React.DragEvent | any, index: number) => {
    e.preventDefault()
    
    // モバイルのカスタムイベントまたは通常のドラッグイベントを処理
    const hasListData = e.dataTransfer?.types.includes('text/list') || 
                       e.detail?.dataTransfer?.types.includes('text/list')
    
    if (hasListData) {
      setDragOverIndex(index)
    }
  }, [])

  const handleListDragLeave = useCallback((e: React.DragEvent | any) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX || (e.touches && e.touches[0]?.clientX)
    const y = e.clientY || (e.touches && e.touches[0]?.clientY)
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(-1)
    }
  }, [])

  const handleListDrop = useCallback(async (e: React.DragEvent | any, dropIndex: number) => {
    e.preventDefault()
    
    // 通常のドラッグ&ドロップまたはモバイルのカスタムイベントを処理
    let hasListData = false
    let listId = ''
    
    if (e.dataTransfer?.types.includes('text/list')) {
      hasListData = true
      listId = e.dataTransfer.getData('text/list')
    } else if (e.detail?.dataTransfer?.types.includes('text/list')) {
      hasListData = true
      listId = e.detail.dataTransfer.getData('text/list')
    }
    
    if (draggedList && hasListData && listId === draggedList.id) {
      const dragIndex = board.lists.findIndex(l => l.id === draggedList.id)
      
      if (dragIndex !== dropIndex && dragIndex !== -1) {
        try {
          const affectedListIds = board.lists
            .filter((_, index) => {
              if (dragIndex < dropIndex) {
                return index > dragIndex && index <= dropIndex
              } else {
                return index >= dropIndex && index < dragIndex
              }
            })
            .map(list => list.id)
          
          setAnimatingListId(draggedList.id)
          setDisplacedListIds(affectedListIds)
          
          await reorderLists(dragIndex, dropIndex)
          
          // 成功フィードバック
          if (navigator.vibrate) {
            navigator.vibrate([30, 50, 30])
          }
          
          setTimeout(() => {
            setAnimatingListId(null)
            setDisplacedListIds([])
          }, 700)
        } catch (error) {
          console.error('リスト移動エラー:', error)
          // エラーフィードバック
          if (navigator.vibrate) {
            navigator.vibrate([100, 100, 100])
          }
        }
      }
    }
    
    handleListDragEnd()
  }, [draggedList, board.lists, reorderLists, handleListDragEnd])

  // タッチイベントハンドラー
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    
    // 長押しタイマー開始（600ms - リストは少し長めに設定）
    longPressTimer.current = setTimeout(() => {
      const list = board.lists[index]
      if (list) {
        handleListDragStart(e, list)
      }
    }, 600)
  }, [board.lists, handleListDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return
    
    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y)
    
    // 移動閾値（20px）
    if (!isDragging && (deltaX > 20 || deltaY > 20)) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
    
    // ドラッグ中はスクロールを防止
    if (isDragging) {
      e.preventDefault()
      
      // ドラッグ中の視覚的フィードバック
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      if (elementBelow) {
        const listBelow = elementBelow.closest('.list-wrapper')
        if (listBelow) {
          const listIndex = Array.from(listBelow.parentElement?.children || []).indexOf(listBelow)
          if (listIndex !== -1) {
            setDragOverIndex(listIndex)
          }
        }
      }
    }
  }, [isDragging])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (isDragging) {
      const touch = e.changedTouches[0]
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY)
      
      if (elementBelow) {
        const targetList = elementBelow.closest('.list-wrapper')
        if (targetList) {
          const dropIndex = Array.from(targetList.parentElement?.children || []).indexOf(targetList)
          if (dropIndex !== -1) {
            // カスタムドロップイベントを作成
            const dropEvent = new CustomEvent('drop', {
              bubbles: true,
              cancelable: true,
              detail: {
                dataTransfer: {
                  types: ['text/list'],
                  getData: (type: string) => {
                    if (type === 'text/list') return draggedList?.id || ''
                    return ''
                  }
                }
              }
            }) as any
            
            handleListDrop(dropEvent, dropIndex)
          }
        }
      }
    }
    
    touchStartPos.current = null
  }, [isDragging, draggedList, handleListDrop])

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    handleListDragEnd()
  }, [handleListDragEnd])

  return (
    <div className="board-view-mobile">
      <div 
        className="lists-container-mobile"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {board.lists.map((list, index) => {
          const isDraggedList = draggedListIndex === index
          const isDragOver = dragOverIndex === index
          const isPlaceholder = draggedListIndex !== -1 && draggedListIndex !== index && !isDragOver
          const isAnimating = animatingListId === list.id
          const isDisplaced = displacedListIds.includes(list.id)
          
          return (
            <div
              key={list.id}
              className={`list-wrapper-mobile ${isDraggedList ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${isPlaceholder ? 'drag-placeholder' : ''} ${isAnimating ? 'dropped-animation' : ''} ${isDisplaced ? 'displaced-animation' : ''}`}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onDragOver={(e) => handleListDragOver(e, index)}
              onDragLeave={handleListDragLeave}
              onDrop={(e) => handleListDrop(e, index)}
            >
              <ListView
                list={list}
                isAnimating={isAnimating}
                isDisplaced={isDisplaced}
                onCardDrop={handleCardDrop}
                onListDragStart={handleListDragStart}
                onListDragEnd={handleListDragEnd}
              />
            </div>
          )
        })}
        <AddListForm />
      </div>
    </div>
  )
}

export default BoardViewMobile 