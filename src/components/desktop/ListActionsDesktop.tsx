import React, { useState, useCallback } from 'react'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import './styles/ListActionsDesktop.css'

interface ListActionsDesktopProps {
  listId: string
}

const ListActionsDesktop: React.FC<ListActionsDesktopProps> = ({ listId }) => {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { addCard } = useBoardOperations()

  const handleSave = useCallback(async () => {
    if (!title.trim() || isLoading) return
    
    try {
      setIsLoading(true)
      await addCard(listId, title.trim())
      setTitle('')
      setDescription('')
      setIsFormVisible(false)
    } catch (error) {
      console.error('カード追加エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [listId, title, addCard, isLoading])

  const handleCancel = useCallback(() => {
    setTitle('')
    setDescription('')
    setIsFormVisible(false)
  }, [])

  const handleShowForm = useCallback(() => {
    setIsFormVisible(true)
  }, [])

  // フォーム外クリックで閉じる（必要なら後で再実装）

  if (!isFormVisible) {
    return (
      <div className="add-card-container-desktop">
        <button
          className="add-card-button-desktop"
          onClick={handleShowForm}
        >
          <span className="add-icon-desktop">+</span>
          <span className="add-text-desktop">カードを追加</span>
        </button>
      </div>
    )
  }

  return (
    <div className="add-card-form-desktop">
      <div className="form-content-desktop">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="カードのタイトルを入力..."
          className="card-title-input-desktop"
          disabled={isLoading}
          maxLength={200}
          autoFocus
        />
        
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="説明（オプション）..."
          className="card-description-input-desktop"
          disabled={isLoading}
          maxLength={500}
          rows={3}
        />
        
        <div className="form-actions-desktop">
          <button
            onClick={handleSave}
            disabled={!title.trim() || isLoading}
            className="save-button-desktop"
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="cancel-button-desktop"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

export default ListActionsDesktop 