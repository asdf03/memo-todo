import React, { useState, useEffect, memo } from 'react'
import { useBoardOperations } from '../../../hooks/useBoardOperations'
import { useBoardContext } from '../../../context/BoardContext'
import './BoardTitle.css'

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
        className="board-title-input"
        value={titleInput}
        onChange={(e) => setTitleInput(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder="ボードタイトル"
      />
    )
  }

  return (
    <h1 
      className="board-title" 
      onClick={() => setIsEditing(true)}
    >
      {board.title}
    </h1>
  )
})

export default BoardTitle