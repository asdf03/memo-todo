import React, { useState, useRef, useCallback, useEffect } from 'react'
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
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [validationError, setValidationError] = useState('')
  
  const { addCard } = useBoardOperations()

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
    setDescription('')
    // フォームを閉じた後、ボタンにフォーカスを戻す
    setTimeout(() => {
      buttonRef.current?.focus()
    }, 0)
  }, [])

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setValidationError('タイトルを入力してください')
      return
    }

    setIsLoading(true)
    setValidationError('')

    try {
      await addCard(listId, title.trim())
      setTitle('')
      setDescription('')
      setIsFormVisible(false)
      setValidationError('')
    } catch (error) {
      console.error('カードの追加エラー:', error)
      setValidationError('カードの追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [listId, title, addCard])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleHideForm()
    } else if (e.key === 'Tab' && e.target === inputRef.current) {
      // Tabキーでテキストエリアにフォーカス移動
      e.preventDefault()
      textareaRef.current?.focus()
    }
  }, [handleSave, handleHideForm])

  // フォーム外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isFormVisible && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        const formContainer = inputRef.current.closest('.add-card-form-desktop')
        if (formContainer && !formContainer.contains(e.target as Node)) {
          handleHideForm()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isFormVisible, handleHideForm])

  // テキストエリアの自動リサイズ
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    
    // 自動リサイズ
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  }, [])

  if (!isFormVisible) {
    return (
      <div className="add-card-button-container-desktop">
        <button
          ref={buttonRef}
          className={`add-card-button-desktop ${isHovered ? 'hovered' : ''}`}
          onClick={handleShowForm}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="新しいカードを追加"
          title="新しいカードを追加"
        >
          <span className="add-icon-desktop">+</span>
          <span className="add-text-desktop">カードを追加</span>
        </button>
      </div>
    )
  }

  return (
    <div className="add-card-form-container-desktop">
      <div className="add-card-form-desktop">
        <div className="form-header-desktop">
          <h3>新しいカード</h3>
          <div className="keyboard-hint-desktop">
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 保存 / <kbd>Esc</kbd> キャンセル / <kbd>Tab</kbd> 次の項目
          </div>
        </div>
        
        <div className="form-body-desktop">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="カードのタイトル..."
            className="title-input-desktop"
            disabled={isLoading}
            maxLength={200}
            autoComplete="off"
          />
          
          <textarea
            ref={textareaRef}
            value={description}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="説明（オプション）... Shift+Enterで改行"
            className="description-input-desktop"
            disabled={isLoading}
            maxLength={1000}
            rows={3}
          />
          
          <div className="input-footer-desktop">
            <div className="character-count-desktop">
              タイトル: {title.length}/200 | 説明: {description.length}/1000
            </div>
            <div className="validation-message-desktop">
              {validationError}
            </div>
          </div>
        </div>
        
        <div className="form-actions-desktop">
          <button
            onClick={handleSave}
            disabled={!title.trim() || isLoading}
            className="save-button-desktop"
            aria-label="カードを保存 (Ctrl+Enter)"
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
            aria-label="キャンセル (Esc)"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}

export default ListActionsDesktop 