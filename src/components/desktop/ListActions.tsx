import React, { useState, useCallback } from 'react'
import { useBoardOperations } from '../../hooks/shared/useBoardOperations'

interface ListActionsProps {
  listId: string
}

const ListActions: React.FC<ListActionsProps> = ({ listId }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [cardTitle, setCardTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { addCard } = useBoardOperations()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardTitle.trim() || isLoading) return

    try {
      setIsLoading(true)
      await addCard(listId, cardTitle.trim())
      setCardTitle('')
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add card:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cardTitle, isLoading, listId, addCard])

  const handleCancel = useCallback(() => {
    setCardTitle('')
    setIsAdding(false)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }, [handleCancel])

  if (!isAdding) {
    return (
      <button
        className="add-card-button"
        onClick={() => setIsAdding(true)}
        aria-label="新しいカードを追加"
      >
        <span className="add-card-icon">+</span>
        <span className="add-card-text">カードを追加</span>
      </button>
    )
  }

  return (
    <div className="add-card-form-container">
      <form onSubmit={handleSubmit} className="add-card-form">
        <textarea
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="カードのタイトルを入力..."
          className="add-card-input"
          autoFocus
          disabled={isLoading}
          maxLength={200}
          rows={3}
        />
        <div className="add-card-actions">
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={!cardTitle.trim() || isLoading}
          >
            {isLoading ? '追加中...' : '追加'}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={handleCancel}
            disabled={isLoading}
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}

export default ListActions