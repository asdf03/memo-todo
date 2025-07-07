import React, { useState, useCallback } from 'react'
import { Card, List } from '../../types'
import ListView from '../shared/ListView'
import AddListForm from '../shared/common/AddListForm'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import { useBoardContext } from '../../context/BoardContext'

const BoardViewMobile: React.FC = () => {
  const { board } = useBoardContext()
  const [draggedList, setDraggedList] = useState<List | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)
  const [draggedListIndex, setDraggedListIndex] = useState<number>(-1)
  const [animatingListId, setAnimatingListId] = useState<string | null>(null)
  const [displacedListIds, setDisplacedListIds] = useState<string[]>([])
  
  const { reorderLists, moveCard } = useBoardOperations()

  const handleCardDrop = async (card: Card, targetListId: string, targetIndex?: number) => {
    await moveCard(card, targetListId, targetIndex)
  }

  const handleListDragStart = useCallback((_e: React.DragEvent | any, list: List) => {
    setDraggedList(list)
    const listIndex = board.lists.findIndex(l => l.id === list.id)
    setDraggedListIndex(listIndex)
    
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

  return (
    <div className="board-view-mobile">
      <div 
        className="lists-container-mobile"
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