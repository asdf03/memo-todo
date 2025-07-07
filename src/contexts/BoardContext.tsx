import React, { createContext, useContext } from 'react'
import { Board } from '../types'

interface BoardContextType {
  board: Board
  onUpdateBoard: (board: Board) => void
  onRefresh: () => Promise<void>
}

const BoardContext = createContext<BoardContextType | undefined>(undefined)

export const useBoardContext = () => {
  const context = useContext(BoardContext)
  if (context === undefined) {
    throw new Error('useBoardContext must be used within a BoardProvider')
  }
  return context
}

interface BoardProviderProps {
  children: React.ReactNode
  board: Board
  onUpdateBoard: (board: Board) => void
  onRefresh: () => Promise<void>
}

export const BoardProvider: React.FC<BoardProviderProps> = ({ 
  children, 
  board, 
  onUpdateBoard, 
  onRefresh 
}) => {
  const value = {
    board,
    onUpdateBoard,
    onRefresh,
  }

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  )
}