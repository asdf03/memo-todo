import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useBoardOperations } from '../../hooks/useBoardOperations'
import './styles/AddListFormDesktop.css'

const AddListFormDesktop: React.FC = () => {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const { addList } = useBoardOperations()

  const handleShowForm = useCallback(() => {
    setIsFormVisible(true)
    // デスクトップでは即座にフォーカス
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }, [])

  const handleHideForm = useCallback(() => {
    setIsFormVisible(false)
    setTitle('')
    // フォームを閉じた後、ボタンにフォーカスを戻す
    setTimeout(() => {
      buttonRef.current?.focus()
    }, 0)
  }, [])

  const handleSave = useCallback(async () => {
    if (!title.trim() || isLoading) return
    
    try {
      setIsLoading(true)
      await addList(title.trim())
      setTitle('')
      handleHideForm()
    } catch (error) {
      console.error('リスト作成エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }, [title, addList])

  // フォーム外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isFormVisible && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        const formContainer = inputRef.current.closest('.add-list-form-desktop')
        if (formContainer && !formContainer.contains(e.target as Node)) {
          handleHideForm()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isFormVisible, handleHideForm])

  if (!isFormVisible) {
    return (
      <div className="add-list-button-container-desktop">
        <button
          ref={buttonRef}
          className={`add-list-button-desktop ${isHovered ? 'hovered' : ''}`}
          onClick={handleShowForm}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className="add-icon-desktop">+</span>
          <span className="add-text-desktop">リストを追加</span>
        </button>
      </div>
    )
  }

  return (
    <div className="add-list-form-container-desktop">
      <div className="add-list-form-desktop">
        <div className="form-header-desktop">
          <h3>新しいリスト</h3>
        </div>
        
        <div className="form-body-desktop">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="リストのタイトルを入力..."
            className="title-input-desktop"
            disabled={isLoading}
            maxLength={100}
            autoComplete="off"
          />
          
          <div className="input-footer-desktop">
            <div className="character-count-desktop">
              {title.length}/100
            </div>
            <div className="validation-message-desktop">
              {title.length === 0 && 'タイトルを入力してください'}
              {title.length > 50 && 'タイトルが長すぎます'}
            </div>
          </div>
        </div>
        
        <div className="form-actions-desktop">
          <button
            onClick={handleSave}
            disabled={!title.trim() || isLoading}
            className="save-button-desktop"
          >
            {isLoading ? (
              <span className="loading-spinner-desktop"></span>
            ) : (
              '保存'
            )}
          </button>
          
          <button
            onClick={handleHideForm}
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

export default AddListFormDesktop 