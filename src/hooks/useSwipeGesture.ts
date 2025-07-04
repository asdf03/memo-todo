import { useRef, useCallback } from 'react'

interface SwipeGestureConfig {
  threshold?: number // スワイプを検出する最小距離（px）
  velocity?: number // スワイプの最小速度（px/ms）
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface TouchPosition {
  x: number
  y: number
  time: number
}

export const useSwipeGesture = (config: SwipeGestureConfig) => {
  const {
    threshold = 50,
    velocity = 0.3,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown
  } = config

  const touchStart = useRef<TouchPosition | null>(null)
  const touchEnd = useRef<TouchPosition | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
      touchEnd.current = null
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart.current) {
      const touch = e.touches[0]
      touchEnd.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return

    const deltaX = touchEnd.current.x - touchStart.current.x
    const deltaY = touchEnd.current.y - touchStart.current.y
    const deltaTime = touchEnd.current.time - touchStart.current.time
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const swipeVelocity = distance / deltaTime

    // 最小距離と速度をチェック
    if (distance < threshold || swipeVelocity < velocity) {
      return
    }

    // スワイプ方向を判定（横方向を優先）
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 横スワイプ
      if (deltaX > 0) {
        onSwipeRight?.()
      } else {
        onSwipeLeft?.()
      }
    } else {
      // 縦スワイプ
      if (deltaY > 0) {
        onSwipeDown?.()
      } else {
        onSwipeUp?.()
      }
    }

    touchStart.current = null
    touchEnd.current = null
  }, [threshold, velocity, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}