import React, { useState } from 'react'
import { useBoardOperations } from '../../hooks/mobile/useMobileBoardOperations'

const AddListForm: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  
  const { addList } = useBoardOperations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      await addList(title.trim())
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
      <div className="add-list-form-mobile active">
        <form onSubmit={handleSubmit} className="add-list-form-container-mobile">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="リスト名を入力..."
            className="add-list-input-mobile"
            autoFocus
          />
          <div className="add-list-actions-mobile">
            <button 
              type="submit" 
              className="add-list-save-btn-mobile"
              disabled={!title.trim()}
            >
              追加
            </button>
            <button 
              type="button" 
              onClick={handleCancel}
              className="add-list-cancel-btn-mobile"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="add-list-form-mobile">
      <button 
        onClick={() => setIsAdding(true)}
        className="add-list-trigger-mobile"
      >
        <span className="add-list-icon-mobile">+</span>
        <span className="add-list-text-mobile">リストを追加</span>
      </button>
    </div>
  )
}

export default AddListForm