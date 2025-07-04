import { useRef, useCallback, useState } from 'react'

interface LongPressDragConfig {
  onDragStart?: (e: React.TouchEvent) => void
  onDragMove?: (e: React.TouchEvent, deltaX: number, deltaY: number) => void
  onDragEnd?: (e: React.TouchEvent, endX: number, endY: number) => void
  longPressDelay?: number
  dragThreshold?: number
}

export const useLongPressDrag = (config: LongPressDragConfig) => {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    longPressDelay = 500, // 500msの長押し
    dragThreshold = 10
  } = config

  const [isDragging, setIsDragging] = useState(false)
  const [isLongPressed, setIsLongPressed] = useState(false)
  
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const hasMovedBeyondThreshold = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
    setIsDragging(false)
    setIsLongPressed(false)
    hasMovedBeyondThreshold.current = false

    // 長押しタイマーを開始
    longPressTimer.current = setTimeout(() => {
      setIsLongPressed(true)
      // 長押し成功時にバイブレーション（対応デバイスのみ）
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, longPressDelay)
  }, [longPressDelay])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPos.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - startPos.current.x
    const deltaY = touch.clientY - startPos.current.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // 長押し中に閾値を超えて移動した場合、長押しをキャンセル
    if (!isLongPressed && distance > dragThreshold) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      hasMovedBeyondThreshold.current = true
      return
    }

    // 長押し完了後のドラッグ処理
    if (isLongPressed) {
      if (!isDragging) {
        // ドラッグ開始
        setIsDragging(true)
        onDragStart?.(e)
        e.preventDefault() // スクロールを防止
        e.stopPropagation()
      } else {
        // ドラッグ中
        onDragMove?.(e, deltaX, deltaY)
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }, [isLongPressed, isDragging, onDragStart, onDragMove, dragThreshold])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // 長押しタイマーをクリア
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (isDragging && isLongPressed) {
      const touch = e.changedTouches[0]
      onDragEnd?.(e, touch.clientX, touch.clientY)
    }

    // リセット
    startPos.current = null
    setIsDragging(false)
    setIsLongPressed(false)
    hasMovedBeyondThreshold.current = false
  }, [isDragging, isLongPressed, onDragEnd])

  const handleTouchCancel = useCallback(() => {
    // タッチがキャンセルされた場合のクリーンアップ
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    startPos.current = null
    setIsDragging(false)
    setIsLongPressed(false)
    hasMovedBeyondThreshold.current = false
  }, [])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    isDragging,
    isLongPressed
  }
}