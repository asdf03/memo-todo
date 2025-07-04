import React, { useState } from 'react'
import { Card, List } from '../types'
import ListView from './ListView'
import AddListForm from './AddListForm'
import { useBoardOperations } from '../hooks/useBoardOperations'
import { useBoardContext } from '../context/BoardContext'
import './BoardView.css'

const BoardView: React.FC = () => {
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

  const handleListDragStart = (_e: React.DragEvent | any, list: List) => {
    setDraggedList(list)
    const listIndex = board.lists.findIndex(l => l.id === list.id)
    setDraggedListIndex(listIndex)
  }

  const handleListDragEnd = () => {
    // ドラッグ終了時に状態をリセット
    setDraggedList(null)
    setDragOverIndex(-1)
    setDraggedListIndex(-1)
  }

  const handleListDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (e.dataTransfer?.types.includes('text/list')) {
      setDragOverIndex(index)
    }
  }

  const handleListDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(-1)
    }
  }

  const handleListDrop = async (e: React.DragEvent | any, dropIndex: number) => {
    e.preventDefault()
    
    // 通常のドラッグ&ドロップまたはモバイルのカスタムイベントを処理
    let hasListData = false
    let listId = ''
    
    if (e.dataTransfer?.types.includes('text/list') || e.dataTransfer?.getData) {
      // 通常のドラッグ&ドロップ
      hasListData = true
      listId = e.dataTransfer.getData('text/list')
    } else if (e.detail?.dataTransfer?.types.includes('text/list')) {
      // モバイルのカスタムイベント
      hasListData = true
      listId = e.detail.dataTransfer.getData('text/list')
    }
    
    if (draggedList && hasListData && listId === draggedList.id) {
      const dragIndex = board.lists.findIndex(l => l.id === draggedList.id)
      
      if (dragIndex !== dropIndex && dragIndex !== -1) {
        try {
          // 移動によって影響を受けるリストを特定
          const affectedListIds = board.lists
            .filter((_, index) => {
              if (dragIndex < dropIndex) {
                return index > dragIndex && index <= dropIndex
              } else {
                return index >= dropIndex && index < dragIndex
              }
            })
            .map(list => list.id)
          
          // アニメーション開始
          setAnimatingListId(draggedList.id)
          setDisplacedListIds(affectedListIds)
          
          // リストの並び替えを実行
          reorderLists(dragIndex, dropIndex)
          
          // アニメーション終了
          setTimeout(() => {
            setAnimatingListId(null)
            setDisplacedListIds([])
          }, 700)
        } catch (error) {
          console.error('リスト移動エラー:', error)
        }
      }
    }
    
    setDraggedList(null)
    setDragOverIndex(-1)
    setDraggedListIndex(-1)
  }

  return (
    <div className="board-view">
      <div className="lists-container">
        {board.lists.map((list, index) => {
          const isDragging = draggedListIndex === index
          const isDragOver = dragOverIndex === index
          const isPlaceholder = draggedListIndex !== -1 && draggedListIndex !== index && !isDragOver
          const isAnimating = animatingListId === list.id
          const isDisplaced = displacedListIds.includes(list.id)
          
          return (
            <div
              key={list.id}
              className={`list-wrapper ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${isPlaceholder ? 'drag-placeholder' : ''} ${isAnimating ? 'dropped-animation' : ''} ${isDisplaced ? 'displaced-animation' : ''}`}
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

export default BoardView