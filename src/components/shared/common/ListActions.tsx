import React, { memo, useCallback, useState } from 'react'
import { useBoardOperations } from '../../../hooks/useBoardOperations'

interface ListActionsProps {
  listId: string
}

const ListActions: React.FC<ListActionsProps> = memo(({ listId }) => {
  const { addCard } = useBoardOperations()
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [cardTitle, setCardTitle] = useState('')

  const handleAddCard = useCallback(async () => {
    if (cardTitle.trim()) {
      try {
        await addCard(listId, cardTitle.trim())
        setCardTitle('')
        setIsAddingCard(false)
      } catch (error) {
        console.error('カード追加エラー:', error)
      }
    }
  }, [listId, addCard, cardTitle])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCard()
    } else if (e.key === 'Escape') {
      setIsAddingCard(false)
      setCardTitle('')
    }
  }, [handleAddCard])

  const handleCancel = useCallback(() => {
    setIsAddingCard(false)
    setCardTitle('')
  }, [])

  if (isAddingCard) {
    return (
      <div className="add-card-form">
        <input
          type="text"
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="カードのタイトルを入力..."
          className="add-card-input"
          autoFocus
        />
        <div className="add-card-actions">
          <button className="add-card-save" onClick={handleAddCard} disabled={!cardTitle.trim()}>
            追加
          </button>
          <button className="add-card-cancel" onClick={handleCancel}>
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <button className="add-card-btn" onClick={() => setIsAddingCard(true)}>
      + カードを追加
    </button>
  )
})

export default ListActions