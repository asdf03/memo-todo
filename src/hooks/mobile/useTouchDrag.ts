import { useState, useCallback } from 'react'
import { Card, List } from '../../types'

interface UseTouchDragOptions {
  onDragStart?: () => void
  onDragEnd?: () => void
  dragType: 'card' | 'list'
  dragData: Card | List
}

export const useTouchDrag = ({ onDragStart, onDragEnd, dragType, dragData }: UseTouchDragOptions) => {
  const [isDragging, setIsDragging] = useState(false)
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [dragThreshold] = useState(10) // ドラッグ開始のしきい値

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setStartPosition({ x: touch.clientX, y: touch.clientY })
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - startPosition.x)
    const deltaY = Math.abs(touch.clientY - startPosition.y)
    
    // しきい値を超えたらドラッグ開始
    if (deltaX > dragThreshold || deltaY > dragThreshold) {
      setIsDragging(true)
      onDragStart?.()
      
      // モバイル専用：ドラッグ開始のハプティックフィードバック
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      // ドラッグ中のスクロール無効化
      e.preventDefault()
      
      // グローバルドラッグ状態を設定
      document.body.classList.add('touch-dragging')
      
      // ドラッグデータをグローバルに保存（ドロップゾーンで参照）
      ;(window as any).__touchDragData = {
        type: dragType,
        data: dragData
      }
    }
  }, [isDragging, startPosition, dragThreshold, onDragStart, dragType, dragData])

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      onDragEnd?.()
      
      // グローバル状態をクリア
      document.body.classList.remove('touch-dragging')
      ;(window as any).__touchDragData = null
      
      // モバイル専用：ドラッグ終了のハプティックフィードバック
      if (navigator.vibrate) {
        navigator.vibrate(30)
      }
    }
  }, [isDragging, onDragEnd])

  const dragHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  }

  return {
    isDragging,
    dragHandlers
  }
}