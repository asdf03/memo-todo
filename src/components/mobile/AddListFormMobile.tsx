import React, { useState, useRef, useCallback } from 'react'
import { useBoardOperations } from '../../hooks/useBoardOperations'

const AddListFormMobile: React.FC = () => {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  
  const { addList } = useBoardOperations()

  const handleShowForm = useCallback(() => {
    setIsFormVisible(true)
    // モバイルでは少し遅延を入れてフォーカス
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  const handleHideForm = useCallback(() => {
    setIsFormVisible(false)
    setTitle('')
  }, [])

  const handleSave = useCallback(async () => {
    if (!title.trim() || isLoading) return
    
    try {
      setIsLoading(true)
      await addList(title.trim())
      setTitle('')
      setIsFormVisible(false)
      
      // 成功フィードバック
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } catch (error) {
      console.error('リスト追加エラー:', error)
      // エラーフィードバック
      if (navigator.vibrate) {
        navigator.vibrate([100, 100, 100])
      }
    } finally {
      setIsLoading(false)
    }
  }, [title, addList, isLoading])

  const handleCancel = useCallback(() => {
    setTitle('')
    setIsFormVisible(false)
  }, [])

  // スワイプジェスチャーでフォームを閉じる
  const handleTouchStart = useRef<{ x: number; y: number } | null>(null)
  
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleTouchStart.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!handleTouchStart.current) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - handleTouchStart.current.x
    const deltaY = touch.clientY - handleTouchStart.current.y
    
    // 右スワイプでフォームを閉じる
    if (deltaX > 50 && Math.abs(deltaY) < 30) {
      handleHideForm()
    }
    
    handleTouchStart.current = null
  }, [handleHideForm])

  if (!isFormVisible) {
    return (
      <div className="add-list-button-container-mobile">
        <button
          className="add-list-button-mobile"
          onClick={handleShowForm}
          aria-label="新しいリストを追加"
        >
          <span className="add-icon-mobile">+</span>
          <span className="add-text-mobile">リストを追加</span>
        </button>
      </div>
    )
  }

  return (
    <div 
      className="add-list-form-container-mobile"
      ref={formRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="add-list-form-mobile">
        <div className="form-header-mobile">
          <h3>新しいリスト</h3>
          <div className="swipe-hint-mobile">← スワイプで閉じる</div>
        </div>
        
        <div className="form-body-mobile">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="リスト名を入力"
            className="add-list-input-mobile"
            disabled={isLoading}
            maxLength={50}
            autoFocus
          />
          
          <div className="character-count-mobile">
            {title.length}/50
          </div>
        </div>
        
        <div className="form-actions-mobile">
          <button
            onClick={handleSave}
            disabled={!title.trim() || isLoading}
            className="save-button-mobile"
            aria-label="リストを保存"
          >
            {isLoading ? (
              <span className="loading-spinner-mobile"></span>
            ) : (
              '保存'
            )}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="cancel-button-mobile"
            aria-label="キャンセル"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddListFormMobile 