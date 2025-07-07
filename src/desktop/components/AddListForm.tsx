import React, { useState, useCallback } from 'react'
import { useBoardOperations } from '../../shared/hooks/useBoardOperations'

const AddListForm: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { addList } = useBoardOperations()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isLoading) return

    try {
      setIsLoading(true)
      await addList(title.trim())
      setTitle('')
      setIsAdding(false)
    } catch (error) {
      console.error('Failed to add list:', error)
    } finally {
      setIsLoading(false)
    }
  }, [title, isLoading, addList])

  const handleCancel = useCallback(() => {
    setTitle('')
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
        className="add-list-button"
        onClick={() => setIsAdding(true)}
        aria-label="新しいリストを追加"
      >
        <span className="add-list-icon">+</span>
        <span className="add-list-text">リストを追加</span>
      </button>
    )
  }

  return (
    <div className="add-list-form-container">
      <form onSubmit={handleSubmit} className="add-list-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="リストのタイトルを入力..."
          className="add-list-input"
          autoFocus
          disabled={isLoading}
          maxLength={100}
        />
        <div className="add-list-actions">
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={!title.trim() || isLoading}
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

export default AddListForm