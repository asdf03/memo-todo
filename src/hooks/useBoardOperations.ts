import { useCallback } from 'react'
import { Card } from '../types'
import { BoardAPI } from '../lib/boardApi'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { useBoardContext } from '../context/BoardContext'
import { useAuth } from '../contexts/AuthContext'
import { RateLimitError } from '../lib/rateLimiter'
import { ValidationError } from '../lib/validation'
import { ResourceLimitError } from '../lib/resourceLimiter'

export const useBoardOperations = () => {
  const { board, onUpdateBoard, onRefresh } = useBoardContext()
  const { user } = useAuth()
  const { executeWithOptimisticUpdateAsync, executeWithOptimisticUpdate } = useOptimisticUpdate({
    board,
    onUpdateBoard,
    onRefresh
  })

  // セキュリティエラーハンドリング
  const handleSecurityError = useCallback((error: any): string => {
    if (error instanceof RateLimitError) {
      return error.message
    }
    if (error instanceof ValidationError) {
      return error.message
    }
    if (error instanceof ResourceLimitError) {
      return error.message
    }
    return 'エラーが発生しました'
  }, [])

  // リスト操作
  const addList = useCallback(async (title: string) => {
    const tempId = `temp-${Date.now()}`
    
    try {
      await executeWithOptimisticUpdate(
        // 楽観的更新
        (currentBoard) => ({
          ...currentBoard,
          lists: [...currentBoard.lists, {
            id: tempId,
            title,
            cards: [],
            board_id: currentBoard.id,
            position: currentBoard.lists.length
          }]
        }),
        // DB更新
        () => BoardAPI.addList(board.id, title, board.lists.length, user?.id),
        // エラーメッセージ
        'リストの追加に失敗しました'
      )
    } catch (error) {
      const errorMessage = handleSecurityError(error)
      alert(errorMessage) // TODO: より良いエラー表示に改善
      throw error
    }
  }, [board.id, board.lists.length, executeWithOptimisticUpdate, user?.id, handleSecurityError])

  const deleteList = useCallback(async (listId: string) => {
    try {
      executeWithOptimisticUpdateAsync(
        // 楽観的更新
        (currentBoard) => ({
          ...currentBoard,
          lists: currentBoard.lists.filter(l => l.id !== listId)
        }),
        // DB更新
        () => BoardAPI.deleteList(listId, user?.id),
        // エラーメッセージ
        'リストの削除に失敗しました'
      )
    } catch (error) {
      const errorMessage = handleSecurityError(error)
      alert(errorMessage)
      throw error
    }
  }, [executeWithOptimisticUpdateAsync, user?.id, handleSecurityError])

  const updateListTitle = useCallback((listId: string, title: string) => {
    executeWithOptimisticUpdateAsync(
      // 楽観的更新
      (currentBoard) => ({
        ...currentBoard,
        lists: currentBoard.lists.map(l =>
          l.id === listId ? { ...l, title } : l
        )
      }),
      // DB更新
      () => BoardAPI.updateList(listId, title),
      // エラーメッセージ
      'リストタイトルの更新に失敗しました'
    )
  }, [executeWithOptimisticUpdateAsync])

  const reorderLists = useCallback((dragIndex: number, dropIndex: number) => {
    executeWithOptimisticUpdateAsync(
      // 楽観的更新
      (currentBoard) => {
        const newLists = [...currentBoard.lists]
        const [draggedItem] = newLists.splice(dragIndex, 1)
        newLists.splice(dropIndex, 0, draggedItem)
        return {
          ...currentBoard,
          lists: newLists
        }
      },
      // DB更新
      () => {
        const newLists = [...board.lists]
        const [draggedItem] = newLists.splice(dragIndex, 1)
        newLists.splice(dropIndex, 0, draggedItem)
        
        const updates = newLists.map((list, index) => ({
          id: list.id,
          position: index
        }))
        
        return BoardAPI.updateListsPositions(updates)
      },
      // エラーメッセージ
      'リストの並び替えに失敗しました'
    )
  }, [board.lists, executeWithOptimisticUpdateAsync])

  // カード操作
  const addCard = useCallback(async (listId: string, title: string) => {
    const list = board.lists.find(l => l.id === listId)
    if (!list) return

    const tempId = `temp-${Date.now()}`
    
    try {
      executeWithOptimisticUpdateAsync(
        // 楽観的更新
        (currentBoard) => ({
          ...currentBoard,
          lists: currentBoard.lists.map(l =>
            l.id === listId
              ? {
                  ...l,
                  cards: [...l.cards, {
                    id: tempId,
                    title,
                    description: undefined,
                    createdAt: new Date(),
                    list_id: listId,
                    position: l.cards.length
                  }]
                }
              : l
          )
        }),
        // DB更新
        () => BoardAPI.addCard(listId, title, list.cards.length, undefined, user?.id),
        // エラーメッセージ
        'カードの追加に失敗しました'
      )
    } catch (error) {
      const errorMessage = handleSecurityError(error)
      alert(errorMessage)
      throw error
    }
  }, [board.lists, executeWithOptimisticUpdateAsync, user?.id, handleSecurityError])

  const deleteCard = useCallback(async (listId: string, cardId: string) => {
    try {
      executeWithOptimisticUpdateAsync(
        // 楽観的更新
        (currentBoard) => ({
          ...currentBoard,
          lists: currentBoard.lists.map(l =>
            l.id === listId
              ? { ...l, cards: l.cards.filter(c => c.id !== cardId) }
              : l
          )
        }),
        // DB更新
        () => BoardAPI.deleteCard(cardId, user?.id),
        // エラーメッセージ
        'カードの削除に失敗しました'
      )
    } catch (error) {
      const errorMessage = handleSecurityError(error)
      alert(errorMessage)
      throw error
    }
  }, [executeWithOptimisticUpdateAsync, user?.id, handleSecurityError])

  const updateCard = useCallback((listId: string, cardId: string, updates: { title?: string, description?: string }) => {
    executeWithOptimisticUpdateAsync(
      // 楽観的更新
      (currentBoard) => ({
        ...currentBoard,
        lists: currentBoard.lists.map(l =>
          l.id === listId
            ? {
                ...l,
                cards: l.cards.map(c =>
                  c.id === cardId ? { ...c, ...updates } : c
                )
              }
            : l
        )
      }),
      // DB更新
      () => BoardAPI.updateCard(cardId, updates.title, updates.description),
      // エラーメッセージ
      'カードの更新に失敗しました'
    )
  }, [executeWithOptimisticUpdateAsync])

  const moveCard = useCallback((card: Card, targetListId: string, targetIndex?: number) => {
    const targetList = board.lists.find(l => l.id === targetListId)
    if (!targetList) return

    const newPosition = typeof targetIndex === 'number' ? targetIndex : targetList.cards.length

    executeWithOptimisticUpdateAsync(
      // 楽観的更新
      (currentBoard) => ({
        ...currentBoard,
        lists: currentBoard.lists.map(l => {
          if (l.id === targetListId) {
            // 対象リストにカードを追加
            const newCards = [...l.cards.filter(c => c.id !== card.id)]
            newCards.splice(newPosition, 0, { ...card, list_id: targetListId, position: newPosition })
            return { ...l, cards: newCards }
          } else {
            // 他のリストからカードを削除
            return { ...l, cards: l.cards.filter(c => c.id !== card.id) }
          }
        })
      }),
      // DB更新
      () => BoardAPI.updateCard(card.id, undefined, undefined, newPosition, targetListId),
      // エラーメッセージ
      'カードの移動に失敗しました'
    )
  }, [board.lists, executeWithOptimisticUpdateAsync])

  const reorderCards = useCallback((listId: string, dragIndex: number, dropIndex: number) => {
    executeWithOptimisticUpdateAsync(
      // 楽観的更新
      (currentBoard) => ({
        ...currentBoard,
        lists: currentBoard.lists.map(l => {
          if (l.id === listId) {
            const newCards = [...l.cards]
            const [draggedItem] = newCards.splice(dragIndex, 1)
            newCards.splice(dropIndex, 0, draggedItem)
            return { ...l, cards: newCards }
          }
          return l
        })
      }),
      // DB更新
      () => {
        const list = board.lists.find(l => l.id === listId)
        if (!list) return Promise.resolve()
        
        const newCards = [...list.cards]
        const [draggedItem] = newCards.splice(dragIndex, 1)
        newCards.splice(dropIndex, 0, draggedItem)
        
        const updates = newCards.map((card, index) => ({
          id: card.id,
          position: index
        }))
        
        return BoardAPI.updateCardsPositions(updates)
      },
      // エラーメッセージ
      'カードの並び替えに失敗しました'
    )
  }, [board.lists, executeWithOptimisticUpdateAsync])

  // ボード操作
  const updateBoardTitle = useCallback((title: string) => {
    executeWithOptimisticUpdateAsync(
      // 楽観的更新
      (currentBoard) => ({ ...currentBoard, title }),
      // DB更新
      () => BoardAPI.updateBoardTitle(board.id, title),
      // エラーメッセージ
      'ボードタイトルの更新に失敗しました'
    )
  }, [board.id, executeWithOptimisticUpdateAsync])

  return {
    // リスト操作
    addList,
    deleteList,
    updateListTitle,
    reorderLists,
    
    // カード操作
    addCard,
    deleteCard,
    updateCard,
    moveCard,
    reorderCards,
    
    // ボード操作
    updateBoardTitle
  }
}