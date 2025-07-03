import { useCallback } from 'react'
import { Board } from '../types'

interface UseOptimisticUpdateProps {
  board: Board
  onUpdateBoard: (board: Board) => void
  onRefresh: () => Promise<void>
}

export const useOptimisticUpdate = ({ board, onUpdateBoard, onRefresh }: UseOptimisticUpdateProps) => {
  
  const executeWithOptimisticUpdate = useCallback(async <T>(
    optimisticUpdate: (board: Board) => Board,
    dbUpdate: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | void> => {
    try {
      // 1. 即座UI更新
      const updatedBoard = optimisticUpdate(board)
      onUpdateBoard(updatedBoard)
      
      // 2. バックグラウンドでDB更新
      const result = await dbUpdate()
      
      // 3. DB更新後に最新データで再読み込み
      await onRefresh()
      
      return result
    } catch (error) {
      console.error('楽観的更新エラー:', error)
      if (errorMessage) {
        alert(errorMessage)
      }
      // 4. エラー時は元の状態に戻す
      await onRefresh()
      throw error
    }
  }, [board, onUpdateBoard, onRefresh])

  const executeWithOptimisticUpdateAsync = useCallback(<T>(
    optimisticUpdate: (board: Board) => Board,
    dbUpdate: () => Promise<T>,
    errorMessage?: string
  ): void => {
    try {
      // 1. 即座UI更新
      const updatedBoard = optimisticUpdate(board)
      onUpdateBoard(updatedBoard)
      
      // 2. バックグラウンドでDB更新
      dbUpdate()
        .then(() => {
          // 3. DB更新後に最新データで再読み込み
          onRefresh()
        })
        .catch(error => {
          console.error('楽観的更新エラー:', error)
          if (errorMessage) {
            alert(errorMessage)
          }
          // 4. エラー時は元の状態に戻す
          onRefresh()
        })
    } catch (error) {
      console.error('楽観的更新エラー:', error)
    }
  }, [board, onUpdateBoard, onRefresh])

  return {
    executeWithOptimisticUpdate,
    executeWithOptimisticUpdateAsync
  }
}