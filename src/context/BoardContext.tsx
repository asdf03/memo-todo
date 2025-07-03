import React, { createContext, useContext, ReactNode } from 'react'
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
  board: Board
  onUpdateBoard: (board: Board) => void
  onRefresh: () => Promise<void>
  children: ReactNode
}

export const BoardProvider: React.FC<BoardProviderProps> = ({
  board,
  onUpdateBoard,
  onRefresh,
  children
}) => {
  return (
    <BoardContext.Provider value={{ board, onUpdateBoard, onRefresh }}>
      {children}
    </BoardContext.Provider>
  )
}