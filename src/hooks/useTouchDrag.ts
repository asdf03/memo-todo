import { useRef, useCallback } from 'react'

interface TouchDragConfig {
  onDragStart?: (e: React.TouchEvent) => void
  onDragMove?: (e: React.TouchEvent, deltaX: number, deltaY: number) => void
  onDragEnd?: (e: React.TouchEvent, endX: number, endY: number) => void
  dragThreshold?: number
}

export const useTouchDrag = (config: TouchDragConfig) => {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    dragThreshold = 10
  } = config

  const startPos = useRef<{ x: number; y: number } | null>(null)
  const isDragging = useRef(false)
  const dragStarted = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
    isDragging.current = false
    dragStarted.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPos.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - startPos.current.x
    const deltaY = touch.clientY - startPos.current.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // ドラッグ開始の閾値を超えた場合
    if (!dragStarted.current && distance > dragThreshold) {
      dragStarted.current = true
      isDragging.current = true
      onDragStart?.(e)
    }

    if (isDragging.current) {
      e.preventDefault()
      e.stopPropagation()
      onDragMove?.(e, deltaX, deltaY)
    }
  }, [onDragStart, onDragMove, dragThreshold])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isDragging.current && dragStarted.current) {
      const touch = e.changedTouches[0]
      onDragEnd?.(e, touch.clientX, touch.clientY)
    }

    startPos.current = null
    isDragging.current = false
    dragStarted.current = false
  }, [onDragEnd])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isDragging: isDragging.current
  }
}