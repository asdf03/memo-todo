import React, { useState, useRef, useCallback } from 'react'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { addCard } = useBoardOperations()

  const handleShow = useCallback(() => {
    setIsVisible(true)
    // モバイルでは少し遅延してフォーカス
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  const handleHide = useCallback(() => {
    setIsVisible(false)
    setTitle('')
    setDescription('')
  }, [])

  const handleSave = useCallback(async () => {
    if (!title.trim()) return

    setIsLoading(true)
    try {
      await addCard(listId, title.trim())
      setTitle('')
      setDescription('')
      setIsVisible(false)
    } catch (error) {
      console.error('カード追加エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [listId, title, addCard])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleHide()
    }
  }, [handleSave, handleHide])

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

  // テキストエリアの自動リサイズ
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    
    // 自動リサイズ
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [])

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
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="カードのタイトル"
            className="add-card-input-mobile"
            maxLength={150}
            disabled={isLoading}
          />
          <div className="add-card-count-mobile">
            {title.length}/150
          </div>
        </div>
        
        <div className="add-card-field-mobile">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleKeyDown}
            placeholder="説明（任意）"
            className="add-card-textarea-mobile"
            maxLength={500}
            disabled={isLoading}
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
          onClick={handleHide}
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