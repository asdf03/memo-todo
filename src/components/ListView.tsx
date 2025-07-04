import React, { useRef, useState, useEffect, useCallback } from 'react'
import { List, Card } from '../types'
import ListHeader from './ListHeader'
import CardContainer from './CardContainer'
import ListActions from './ListActions'
import './ListView.css'

interface ListViewProps {
  list: List
  isAnimating?: boolean
  isDisplaced?: boolean
  onCardDrop?: (card: Card, targetListId: string) => void
  onListDragStart?: (e: React.DragEvent, list: List) => void
  onListDragEnd?: () => void
}

const ListView: React.FC<ListViewProps> = ({ list, isAnimating = false, isDisplaced = false, onCardDrop, onListDragStart, onListDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false)
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  // PC版のドラッグイベントハンドラー
  const handleDragStart = useCallback((e: React.DragEvent) => {
    setIsDragging(true)
    onListDragStart?.(e, list)
  }, [list, onListDragStart])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    onListDragEnd?.()
  }, [onListDragEnd])

  // モバイル長押しドラッグ（カードコンテナエリアでのみ）
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // リストヘッダーの編集モード時やカードコンテナエリア以外では無効
    const target = e.target as HTMLElement
    if (!target.closest('.cards-container')) return
    
    const touch = e.touches[0]
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }
    
    // 長押しタイマー開始
    longPressTimer.current = setTimeout(() => {
      // PC版のドラッグイベントをシミュレート
      const fakeEvent = {
        dataTransfer: {
          setData: (type: string, data: string) => {},
          effectAllowed: 'move'
        },
        preventDefault: () => {},
        stopPropagation: () => {}
      } as React.DragEvent
      
      handleDragStart(fakeEvent)
    }, 500)
  }, [handleDragStart])

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
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    
    if (isDragging) {
      handleDragEnd()
    }
  }, [isDragging, handleDragEnd])

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    
    if (isDragging) {
      handleDragEnd()
    }
  }, [isDragging, handleDragEnd])

  return (
    <>
      <div 
        className={`list-view ${isAnimating ? 'list-dropped-animation' : ''} ${isDisplaced ? 'list-displaced-animation' : ''} ${isDragging ? 'dragging' : ''}`}
        data-list-id={list.id}
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
        <ListHeader 
          list={list}
          onListDragStart={handleDragStart}
          onListDragEnd={handleDragEnd}
        />
        
        <CardContainer 
          list={list}
          onCardDrop={onCardDrop}
        />
      
        <ListActions listId={list.id} />
      </div>
    </>
  )
}

export default ListView