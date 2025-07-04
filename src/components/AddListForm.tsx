import React, { memo, useCallback, useState } from 'react'
import { useBoardOperations } from '../hooks/useBoardOperations'

const AddListForm: React.FC = memo(() => {
  const { addList } = useBoardOperations()
  const [isAddingList, setIsAddingList] = useState(false)
  const [listTitle, setListTitle] = useState('')

  const handleAddList = useCallback(async () => {
    if (listTitle.trim()) {
      try {
        await addList(listTitle.trim())
        setListTitle('')
        setIsAddingList(false)
      } catch (error) {
        console.error('リスト追加エラー:', error)
      }
    }
  }, [addList, listTitle])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddList()
    } else if (e.key === 'Escape') {
      setIsAddingList(false)
      setListTitle('')
    }
  }, [handleAddList])

  const handleCancel = useCallback(() => {
    setIsAddingList(false)
    setListTitle('')
  }, [])

  if (isAddingList) {
    return (
      <div className="add-list-form">
        <input
          type="text"
          value={listTitle}
          onChange={(e) => setListTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="リストのタイトルを入力..."
          className="add-list-input"
          autoFocus
        />
        <div className="add-list-actions">
          <button className="add-list-save" onClick={handleAddList} disabled={!listTitle.trim()}>
            追加
          </button>
          <button className="add-list-cancel" onClick={handleCancel}>
            キャンセル
          </button>
        </div>
      </div>
    )
  }

  return (
    <button className="add-list-btn" onClick={() => setIsAddingList(true)}>
      + リストを追加
    </button>
  )
})

export default AddListForm