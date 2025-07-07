import { useCallback, useRef, useState } from 'react'

export interface TouchDragState {
  isDragging: boolean
  dragStartPosition: { x: number; y: number } | null
  currentPosition: { x: number; y: number } | null
  dragOffset: { x: number; y: number }
}

export interface UseTouchDragOptions {
  onDragStart?: (event: TouchEvent, element: HTMLElement) => void
  onDragMove?: (event: TouchEvent, state: TouchDragState) => void
  onDragEnd?: (event: TouchEvent, state: TouchDragState) => void
  threshold?: number // minimum distance to start drag (default: 10px)
  enableHapticFeedback?: boolean
}

export const useTouchDrag = (options: UseTouchDragOptions = {}) => {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    threshold = 10,
    enableHapticFeedback = true
  } = options

  const [dragState, setDragState] = useState<TouchDragState>({
    isDragging: false,
    dragStartPosition: null,
    currentPosition: null,
    dragOffset: { x: 0, y: 0 }
  })

  const dragElementRef = useRef<HTMLElement | null>(null)
  const initialTouchRef = useRef<{ x: number; y: number } | null>(null)
  const hasDragStartedRef = useRef(false)

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch) return

    const startPosition = { x: touch.clientX, y: touch.clientY }
    initialTouchRef.current = startPosition
    hasDragStartedRef.current = false
    dragElementRef.current = event.currentTarget as HTMLElement

    setDragState(prev => ({
      ...prev,
      dragStartPosition: startPosition,
      currentPosition: startPosition,
      dragOffset: { x: 0, y: 0 }
    }))

    // Prevent scrolling when dragging starts
    event.preventDefault()
  }, [])

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touch = event.touches[0]
    if (!touch || !initialTouchRef.current) return

    const currentPosition = { x: touch.clientX, y: touch.clientY }
    const dragOffset = {
      x: currentPosition.x - initialTouchRef.current.x,
      y: currentPosition.y - initialTouchRef.current.y
    }

    const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2)

    // Check if we've moved far enough to start dragging
    if (!hasDragStartedRef.current && distance >= threshold) {
      hasDragStartedRef.current = true
      
      // Haptic feedback when drag starts
      if (enableHapticFeedback && navigator.vibrate) {
        navigator.vibrate(50)
      }

      setDragState(prev => ({
        ...prev,
        isDragging: true
      }))

      if (onDragStart && dragElementRef.current) {
        onDragStart(event, dragElementRef.current)
      }
    }

    if (hasDragStartedRef.current) {
      const newState: TouchDragState = {
        isDragging: true,
        dragStartPosition: initialTouchRef.current,
        currentPosition,
        dragOffset
      }

      setDragState(newState)

      if (onDragMove) {
        onDragMove(event, newState)
      }

      // Prevent scrolling while dragging
      event.preventDefault()
    }
  }, [threshold, enableHapticFeedback, onDragStart, onDragMove])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (hasDragStartedRef.current && dragState.isDragging) {
      // Haptic feedback when drag ends
      if (enableHapticFeedback && navigator.vibrate) {
        navigator.vibrate([30, 50, 30])
      }

      if (onDragEnd) {
        onDragEnd(event, dragState)
      }
    }

    // Reset state
    setDragState({
      isDragging: false,
      dragStartPosition: null,
      currentPosition: null,
      dragOffset: { x: 0, y: 0 }
    })

    initialTouchRef.current = null
    hasDragStartedRef.current = false
    dragElementRef.current = null
  }, [dragState, enableHapticFeedback, onDragEnd])

  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  }

  return {
    dragState,
    touchHandlers,
    isDragging: dragState.isDragging
  }
}

export default useTouchDrag