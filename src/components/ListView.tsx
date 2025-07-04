import React, { useState, useCallback } from 'react'
import { List, Card } from '../types'
import ListHeader from './ListHeader'
import CardContainer from './CardContainer'
import ListActions from './ListActions'
import MobileListActions from './MobileListActions'
import MobileOverlay from './MobileOverlay'
import { useSwipeGesture } from '../hooks/useSwipeGesture'
import { useBoardContext } from '../context/BoardContext'
import { useBoardOperations } from '../hooks/useBoardOperations'
import { findDropTarget } from '../utils/dropDetection'
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
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  
  const { board } = useBoardContext()
  const { reorderLists } = useBoardOperations()
  
  const handleLongPress = useCallback(() => {
    setShowMobileActions(true)
  }, [])

  // スワイプでリストを移動（旧ロジック）
  const handleSwipeListOld = useCallback((direction: 'left' | 'right') => {
    const currentIndex = board.lists.findIndex(l => l.id === list.id)
    let targetIndex: number
    
    if (direction === 'left') {
      targetIndex = currentIndex - 1
    } else {
      targetIndex = currentIndex + 1
    }
    
    if (targetIndex >= 0 && targetIndex < board.lists.length) {
      reorderLists(currentIndex, targetIndex)
      
      // スワイプアニメーション
      setSwipeOffset(direction === 'left' ? -300 : 300)
      setTimeout(() => setSwipeOffset(0), 300)
    }
  }, [board.lists, list.id, reorderLists])

  // スワイプ終了時のドロップ処理
  const handleSwipeEnd = useCallback((endX: number, endY: number, deltaX: number, deltaY: number) => {
    console.log('List swipe end:', { endX, endY, deltaX, deltaY })
    
    // 最小移動距離をチェック
    const horizontalDistance = Math.abs(deltaX)
    if (horizontalDistance < 60) {
      setSwipeOffset(0)
      return
    }
    
    // ドロップ位置でターゲットを検索
    const dropTarget = findDropTarget(endX, endY)
    console.log('List drop target found:', dropTarget)
    
    if (dropTarget && dropTarget.type === 'list' && dropTarget.id !== list.id) {
      // 別のリストと交換
      const currentIndex = board.lists.findIndex(l => l.id === list.id)
      const targetIndex = dropTarget.index
      if (currentIndex !== -1 && targetIndex !== -1) {
        reorderLists(currentIndex, targetIndex)
        console.log(`List moved from ${currentIndex} to ${targetIndex}`)
      }
    } else if (!dropTarget) {
      // ドロップターゲットがない場合は隣接リストと交換
      const direction = deltaX > 0 ? 'right' : 'left'
      handleSwipeListOld(direction)
    }
    
    // アニメーションリセット
    setSwipeOffset(0)
  }, [list.id, board.lists, reorderLists, handleSwipeListOld])

  // スワイプジェスチャーの設定
  const swipeGesture = useSwipeGesture({
    threshold: 60,
    onSwipeMove: (deltaX) => {
      // スワイプ中のビジュアルフィードバック
      if (Math.abs(deltaX) > 30) {
        setSwipeOffset(deltaX * 0.6) // 指に追従するアニメーション
      }
    },
    onSwipeEnd: handleSwipeEnd,
    onSwipeLeft: () => {
      console.log('List swipe left fallback')
      handleSwipeListOld('left')
    },
    onSwipeRight: () => {
      console.log('List swipe right fallback')
      handleSwipeListOld('right')
    }
  })

  // 長押し検出（スワイプと併用）
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsSwiping(false)
    swipeGesture.onTouchStart(e)
    
    // 長押しタイマーをもっと長くしてスワイプと競合しにくく
    const timer = setTimeout(() => {
      if (!isSwiping) {
        console.log('Long press triggered for list')
        handleLongPress()
      }
    }, 1000) // 1000ms長押し（スワイプと競合しにくく）
    setPressTimer(timer)
  }, [handleLongPress, isSwiping, swipeGesture])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setIsSwiping(true)
    swipeGesture.onTouchMove(e)
    
    // 移動中は長押しをキャンセル
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
    
    // スワイプ時は他のイベントをブロック
    e.stopPropagation()
  }, [pressTimer, swipeGesture])

  const handleTouchEnd = useCallback(() => {
    swipeGesture.onTouchEnd()
    
    if (pressTimer) {
      clearTimeout(pressTimer)
      setPressTimer(null)
    }
    
    setTimeout(() => setIsSwiping(false), 100)
  }, [pressTimer, swipeGesture])

  return (
    <>
      <div 
        className={`list-view ${isAnimating ? 'list-dropped-animation' : ''} ${isDisplaced ? 'list-displaced-animation' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        data-list-id={list.id}
        data-list-index={board.lists.findIndex(l => l.id === list.id)}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none'
        }}
      >
        <ListHeader 
          list={list}
          onListDragStart={onListDragStart}
          onListDragEnd={onListDragEnd}
          onMobileMenu={() => setShowMobileActions(true)}
        />
        
        <CardContainer 
          list={list}
        onCardDrop={onCardDrop}
      />
      
        <ListActions listId={list.id} />
      </div>
      
      <MobileOverlay 
        isOpen={showMobileActions} 
        onClose={() => setShowMobileActions(false)}
      >
        <MobileListActions 
          list={list}
          onClose={() => setShowMobileActions(false)}
        />
      </MobileOverlay>
    </>
  )
}

export default ListView