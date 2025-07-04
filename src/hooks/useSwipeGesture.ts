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
    onSwipeLeft,
    onSwipeRight
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
    if (!touchStart.current) return

    // touchEnd がない場合（タップのみ）は何もしない
    if (!touchEnd.current) {
      touchStart.current = null
      return
    }

    const deltaX = touchEnd.current.x - touchStart.current.x
    const deltaY = touchEnd.current.y - touchStart.current.y
    
    const horizontalDistance = Math.abs(deltaX)
    const verticalDistance = Math.abs(deltaY)
    
    // 横スワイプを優先し、縦方向の動きが大きい場合はスワイプとして認識しない
    if (verticalDistance > horizontalDistance * 1.5) {
      touchStart.current = null
      touchEnd.current = null
      return
    }

    // 最小距離をチェック（速度チェックは削除してより反応しやすく）
    if (horizontalDistance < threshold) {
      touchStart.current = null
      touchEnd.current = null
      return
    }

    console.log('Swipe detected:', { deltaX, deltaY, horizontalDistance, threshold })

    // 横スワイプ
    if (deltaX > 0) {
      console.log('Swipe right triggered')
      onSwipeRight?.()
    } else {
      console.log('Swipe left triggered')
      onSwipeLeft?.()
    }

    touchStart.current = null
    touchEnd.current = null
  }, [threshold, onSwipeLeft, onSwipeRight])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }
}