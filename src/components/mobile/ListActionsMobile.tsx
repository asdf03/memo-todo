import React, { useState, useCallback } from 'react'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import './styles/ListActionsMobile.css'

interface ListActionsMobileProps {
  listId: string
}

const ListActionsMobile: React.FC<ListActionsMobileProps> = ({ listId }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { addCard } = useBoardOperations()

  const handleShow = useCallback(() => {
    setIsVisible(true)
  }, [])

  const handleHide = useCallback(() => {
    setIsVisible(false)
    setTitle('')
    setDescription('')
  }, [])

  const handleSave = useCallback(async () => {
    if (!title.trim() || isLoading) return
    
    try {
      setIsLoading(true)
      await addCard(listId, title.trim())
      setTitle('')
      setDescription('')
      setIsVisible(false)
    } catch (error) {
      console.error('カード追加エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [listId, title, addCard, isLoading])

  const handleCancel = useCallback(() => {
    setTitle('')
    setDescription('')
    setIsVisible(false)
  }, [])

  // スワイプジェスチャーでフォームを閉じる
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const startY = touch.clientY
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0]
      const deltaY = moveTouch.clientY - startY
      
      // 下方向に100px以上スワイプでフォームを閉じる
      if (deltaY > 100) {
        handleHide()
        document.removeEventListener('touchmove', handleTouchMove)
      }
    }
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchend', handleTouchEnd, { once: true })
  }, [handleHide])

  if (!isVisible) {
    return (
      <button 
        className="add-card-btn-mobile"
        onClick={handleShow}
        aria-label="カードを追加"
      >
        <span className="add-card-icon-mobile">+</span>
        <span className="add-card-text-mobile">カードを追加</span>
      </button>
    )
  }

  return (
    <div className="add-card-form-mobile" onTouchStart={handleTouchStart}>
      <div className="add-card-header-mobile">
        <span className="add-card-title-mobile">新しいカード</span>
        <button 
          className="add-card-close-mobile"
          onClick={handleHide}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
      
      <div className="add-card-content-mobile">
        <div className="add-card-field-mobile">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="カードタイトル"
            className="title-input-mobile"
            disabled={isLoading}
            maxLength={100}
          />
          <div className="add-card-count-mobile">
            {title.length}/100
          </div>
        </div>
        
        <div className="add-card-field-mobile">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="説明（オプション）"
            className="description-input-mobile"
            disabled={isLoading}
            maxLength={500}
            rows={3}
          />
          <div className="add-card-count-mobile">
            {description.length}/500
          </div>
        </div>
      </div>
      
      <div className="add-card-actions-mobile">
        <button
          className="add-card-save-mobile"
          onClick={handleSave}
          disabled={!title.trim() || isLoading}
          aria-label="カードを保存"
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
        <button
          className="add-card-cancel-mobile"
          onClick={handleCancel}
          disabled={isLoading}
          aria-label="キャンセル"
        >
          キャンセル
        </button>
      </div>
      
      <div className="add-card-hint-mobile">
        下にスワイプして閉じる
      </div>
    </div>
  )
}

export default ListActionsMobile 