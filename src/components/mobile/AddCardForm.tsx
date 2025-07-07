import React, { useState } from 'react'
import { useBoardOperations } from '../../hooks/mobile/useMobileBoardOperations'

interface AddCardFormProps {
  listId: string
}

const AddCardForm: React.FC<AddCardFormProps> = ({ listId }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  
  const { addCard } = useBoardOperations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      await addCard(listId, title.trim())
      setTitle('')
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setIsAdding(false)
  }

  if (isAdding) {
    return (
      <div className="add-card-form-mobile active">
        <form onSubmit={handleSubmit} className="add-card-form-container-mobile">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="カード内容を入力..."
            className="add-card-input-mobile"
            autoFocus
            rows={3}
          />
          <div className="add-card-actions-mobile">
            <button 
              type="submit" 
              className="add-card-save-btn-mobile"
              disabled={!title.trim()}
            >
              追加
            </button>
            <button 
              type="button" 
              onClick={handleCancel}
              className="add-card-cancel-btn-mobile"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="add-card-form-mobile">
      <button 
        onClick={() => setIsAdding(true)}
        className="add-card-trigger-mobile"
      >
        <span className="add-card-icon-mobile">+</span>
        <span className="add-card-text-mobile">カードを追加</span>
      </button>
    </div>
  )
}

export default AddCardForm