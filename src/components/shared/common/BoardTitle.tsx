import React, { useState, useEffect, memo } from 'react'
import { useBoardOperations } from '../../../hooks/useBoardOperations'
import { useBoardContext } from '../../../context/BoardContext'

const BoardTitle: React.FC = memo(() => {
  const { board } = useBoardContext()
  const [isEditing, setIsEditing] = useState(false)
  const [titleInput, setTitleInput] = useState(board.title)
  const { updateBoardTitle } = useBoardOperations()

  useEffect(() => {
    setTitleInput(board.title)
  }, [board.title])

  const handleSave = async () => {
    if (titleInput.trim() && titleInput.trim() !== board.title) {
      await updateBoardTitle(titleInput.trim())
    } else if (!titleInput.trim()) {
      setTitleInput(board.title)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitleInput(board.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <input
        className="input"
        value={titleInput}
        onChange={(e) => setTitleInput(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder="ボードタイトル"
        style={{ 
          fontSize: 'var(--font-size-xl)', 
          fontWeight: 'var(--font-weight-bold)',
          minWidth: '200px',
          maxWidth: '400px'
        }}
      />
    )
  }

  return (
    <h1 
      className="app-title" 
      onClick={() => setIsEditing(true)}
      style={{ cursor: 'pointer' }}
    >
      {board.title}
    </h1>
  )
})

export default BoardTitle