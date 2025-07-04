import React, { useState, useCallback, useEffect } from 'react'
import { Card, List } from '../../types'
import ListView from '../shared/ListView'
import AddListForm from '../shared/common/AddListForm'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import { useBoardContext } from '../../context/BoardContext'
import './styles/BoardViewDesktop.css'

const BoardViewDesktop: React.FC = () => {
  const { board } = useBoardContext()
  const [draggedList, setDraggedList] = useState<List | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1)
  const [draggedListIndex, setDraggedListIndex] = useState<number>(-1)
  const [animatingListId, setAnimatingListId] = useState<string | null>(null)
  const [displacedListIds, setDisplacedListIds] = useState<string[]>([])
  const [hoveredListIndex, setHoveredListIndex] = useState<number>(-1)
  const [selectedListIndex, setSelectedListIndex] = useState<number>(-1)
  
  const { reorderLists, moveCard } = useBoardOperations()

  const handleCardDrop = async (card: Card, targetListId: string, targetIndex?: number) => {
    await moveCard(card, targetListId, targetIndex)
  }

  const handleListDragStart = useCallback((e: React.DragEvent, list: List) => {
    setDraggedList(list)
    const listIndex = board.lists.findIndex(l => l.id === list.id)
    setDraggedListIndex(listIndex)
    
    // ドラッグ中の視覚的フィードバック
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/list', list.id)
    
    // カスタムドラッグイメージを設定
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.transform = 'rotate(5deg)'
    e.dataTransfer.setDragImage(dragImage, 0, 0)
  }, [board.lists])

  const handleListDragEnd = useCallback(() => {
    setDraggedList(null)
    setDragOverIndex(-1)
    setDraggedListIndex(-1)
  }, [])

  const handleListDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    
    if (e.dataTransfer.types.includes('text/list')) {
      e.dataTransfer.dropEffect = 'move'
      setDragOverIndex(index)
    }
  }, [])

  const handleListDragLeave = useCallback((e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(-1)
    }
  }, [])

  const handleListDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedList && e.dataTransfer.types.includes('text/list')) {
      const listId = e.dataTransfer.getData('text/list')
      
      if (listId === draggedList.id) {
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
            
            setTimeout(() => {
              setAnimatingListId(null)
              setDisplacedListIds([])
            }, 500)
          } catch (error) {
            console.error('リスト移動エラー:', error)
          }
        }
      }
    }
    
    handleListDragEnd()
  }, [draggedList, board.lists, reorderLists, handleListDragEnd])

  const handleListMouseEnter = useCallback((index: number) => {
    setHoveredListIndex(index)
  }, [])

  const handleListMouseLeave = useCallback(() => {
    setHoveredListIndex(-1)
  }, [])

  const handleListClick = useCallback((index: number) => {
    setSelectedListIndex(index === selectedListIndex ? -1 : index)
  }, [selectedListIndex])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault()
            setSelectedListIndex(prev => Math.max(0, prev - 1))
            break
          case 'ArrowRight':
            e.preventDefault()
            setSelectedListIndex(prev => Math.min(board.lists.length - 1, prev + 1))
            break
          case 'n':
            e.preventDefault()
            // 新しいリスト作成にフォーカス
            const addListButton = document.querySelector('.add-list-button') as HTMLElement
            addListButton?.focus()
            break
        }
      }
      
      if (e.key === 'Escape') {
        setSelectedListIndex(-1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [board.lists.length])

  return (
    <div className="board-view-desktop">
      <div className="lists-container-desktop">
        {board.lists.map((list, index) => {
          const isDraggedList = draggedListIndex === index
          const isDragOver = dragOverIndex === index
          const isPlaceholder = draggedListIndex !== -1 && draggedListIndex !== index && !isDragOver
          const isAnimating = animatingListId === list.id
          const isDisplaced = displacedListIds.includes(list.id)
          const isHovered = hoveredListIndex === index
          const isSelected = selectedListIndex === index
          
          return (
            <div
              key={list.id}
              className={`list-wrapper-desktop ${isDraggedList ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${isPlaceholder ? 'drag-placeholder' : ''} ${isAnimating ? 'dropped-animation' : ''} ${isDisplaced ? 'displaced-animation' : ''} ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
              onMouseEnter={() => handleListMouseEnter(index)}
              onMouseLeave={handleListMouseLeave}
              onClick={() => handleListClick(index)}
              onDragOver={(e) => handleListDragOver(e, index)}
              onDragLeave={handleListDragLeave}
              onDrop={(e) => handleListDrop(e, index)}
              tabIndex={0}
              role="button"
              aria-label={`リスト: ${list.title}`}
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
      
      {/* キーボードショートカットヘルプ */}
      <div className="keyboard-shortcuts-hint">
        <div className="shortcuts-item">
          <kbd>Ctrl</kbd> + <kbd>←</kbd> / <kbd>→</kbd> リスト選択
        </div>
        <div className="shortcuts-item">
          <kbd>Ctrl</kbd> + <kbd>N</kbd> 新しいリスト
        </div>
        <div className="shortcuts-item">
          <kbd>Esc</kbd> 選択解除
        </div>
      </div>
    </div>
  )
}

export default BoardViewDesktop 