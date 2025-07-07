import { useCallback } from 'react'
import { Card, List } from '../../types'

interface UseTouchDropZoneOptions {
  onDrop: (draggedItem: Card | List) => void
  onDragOver?: () => void
  onDragLeave?: () => void
  acceptType: 'card' | 'list'
}

export const useTouchDropZone = ({ onDrop, onDragOver, onDragLeave, acceptType }: UseTouchDropZoneOptions) => {
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // ドラッグ中かつ適切なタイプの場合のみ処理
    const dragData = (window as any).__touchDragData
    if (!dragData || dragData.type !== acceptType) return

    // タッチ位置がこの要素上にあるかチェック
    const touch = e.touches[0]
    const element = e.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    
    const isOver = touch.clientX >= rect.left && 
                   touch.clientX <= rect.right && 
                   touch.clientY >= rect.top && 
                   touch.clientY <= rect.bottom

    if (isOver) {
      onDragOver?.()
      e.preventDefault() // スクロール防止
    } else {
      onDragLeave?.()
    }
  }, [onDragOver, onDragLeave, acceptType])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dragData = (window as any).__touchDragData
    if (!dragData || dragData.type !== acceptType) return

    // タッチ終了位置がこの要素上にあるかチェック
    const touch = e.changedTouches[0]
    const element = e.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()
    
    const isDropped = touch.clientX >= rect.left && 
                      touch.clientX <= rect.right && 
                      touch.clientY >= rect.top && 
                      touch.clientY <= rect.bottom

    if (isDropped) {
      onDrop(dragData.data)
      
      // モバイル専用：ドロップ成功のハプティックフィードバック
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30])
      }
    }
    
    onDragLeave?.()
  }, [onDrop, onDragLeave, acceptType])

  const dropZoneHandlers = {
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }

  return {
    dropZoneHandlers
  }
}