import React, { useState } from 'react'
import { List } from '../../types'
import { useBoardOperations } from '../../hooks/mobile/useMobileBoardOperations'

interface ListHeaderMobileProps {
  list: List
  isDragging: boolean
}

const ListHeaderMobile: React.FC<ListHeaderMobileProps> = ({
  list,
  isDragging
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)
  
  const { updateListTitle, deleteList } = useBoardOperations()

  const handleSave = async () => {
    if (editTitle.trim() && editTitle !== list.title) {
      await updateListTitle(list.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(list.title)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await deleteList(list.id)
  }

  const handleLongPress = () => {
    // モバイル専用：長押しで編集モード
    if (navigator.vibrate) {
      navigator.vibrate(100)
    }
    setIsEditing(true)
  }

  if (isEditing) {
    return (
      <div className="list-header-mobile editing">
        <div className="list-edit-form-mobile">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="list-edit-input-mobile"
            autoFocus
          />
          <div className="list-edit-actions-mobile">
            <button 
              onClick={handleSave}
              className="list-save-btn-mobile"
            >
              ✓
            </button>
            <button 
              onClick={handleCancel}
              className="list-cancel-btn-mobile"
            >
              ✕
            </button>
            <button 
              onClick={handleDelete}
              className="list-delete-btn-mobile"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`list-header-mobile ${isDragging ? 'dragging' : ''}`}
      onTouchStart={(_e) => {
        // 長押し判定のためのタイマー設定
        const timer = setTimeout(handleLongPress, 500)
        
        // タッチ終了時にタイマーをクリア
        const clearTimer = () => {
          clearTimeout(timer)
          document.removeEventListener('touchend', clearTimer)
          document.removeEventListener('touchcancel', clearTimer)
          document.removeEventListener('touchmove', clearTimer)
        }
        
        document.addEventListener('touchend', clearTimer)
        document.addEventListener('touchcancel', clearTimer)
        document.addEventListener('touchmove', clearTimer)
      }}
    >
      <div className="list-title-mobile">{list.title}</div>
      <div className="list-card-count-mobile">{list.cards.length}</div>
      <div className="list-drag-handle-mobile">
        <span className="drag-indicator-mobile">⋮⋮</span>
      </div>
    </div>
  )
}

export default ListHeaderMobile