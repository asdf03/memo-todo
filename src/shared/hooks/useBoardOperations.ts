import { useCallback } from 'react'
import { Card, List } from '../types'
import { useBoardContext } from '../contexts/BoardContext'
import { BoardAPI } from '../lib/boardApi'
import { useOptimisticUpdate } from './useOptimisticUpdate'

export const useBoardOperations = () => {
  const { board, onUpdateBoard, onRefresh } = useBoardContext()
  const { optimisticUpdate } = useOptimisticUpdate()

  const addList = useCallback(async (title: string) => {
    if (!board) return

    const tempId = `temp-${Date.now()}`
    const tempList: List = {
      id: tempId,
      title,
      cards: [],
      order: board.lists.length
    }

    optimisticUpdate(
      () => onUpdateBoard({ ...board, lists: [...board.lists, tempList] }),
      async () => {
        const newList = await BoardAPI.addList(board.id, title, board.lists.length)
        onUpdateBoard({ ...board, lists: [...board.lists, newList] })
      },
      () => onRefresh()
    )
  }, [board, onUpdateBoard, onRefresh, optimisticUpdate])

  const updateListTitle = useCallback(async (listId: string, title: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map(list => 
      list.id === listId ? { ...list, title } : list
    )

    optimisticUpdate(
      () => onUpdateBoard({ ...board, lists: updatedLists }),
      async () => {
        await BoardAPI.updateList(listId, title)
        onRefresh()
      },
      () => onUpdateBoard(oldBoard)
    )
  }, [board, onUpdateBoard, onRefresh, optimisticUpdate])

  const deleteList = useCallback(async (listId: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.filter(list => list.id !== listId)

    optimisticUpdate(
      () => onUpdateBoard({ ...board, lists: updatedLists }),
      async () => {
        await BoardAPI.deleteList(listId)
        onRefresh()
      },
      () => onUpdateBoard(oldBoard)
    )
  }, [board, onUpdateBoard, onRefresh, optimisticUpdate])

  const addCard = useCallback(async (listId: string, title: string) => {
    if (!board) return

    const list = board.lists.find(l => l.id === listId)
    if (!list) return

    const tempId = `temp-${Date.now()}`
    const tempCard: Card = {
      id: tempId,
      title,
      order: list.cards.length,
      list_id: listId
    }

    const updatedLists = board.lists.map(l => 
      l.id === listId ? { ...l, cards: [...l.cards, tempCard] } : l
    )

    optimisticUpdate(
      () => onUpdateBoard({ ...board, lists: updatedLists }),
      async () => {
        await BoardAPI.addCard(listId, title, list.cards.length)
        onRefresh()
      },
      () => onRefresh()
    )
  }, [board, onUpdateBoard, onRefresh, optimisticUpdate])

  const updateCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map(list => ({
      ...list,
      cards: list.cards.map(card => 
        card.id === cardId ? { ...card, ...updates } : card
      )
    }))

    optimisticUpdate(
      () => onUpdateBoard({ ...board, lists: updatedLists }),
      async () => {
        await BoardAPI.updateCard(cardId, updates.title || '')
        onRefresh()
      },
      () => onUpdateBoard(oldBoard)
    )
  }, [board, onUpdateBoard, onRefresh, optimisticUpdate])

  const deleteCard = useCallback(async (cardId: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map(list => ({
      ...list,
      cards: list.cards.filter(card => card.id !== cardId)
    }))

    optimisticUpdate(
      () => onUpdateBoard({ ...board, lists: updatedLists }),
      async () => {
        await BoardAPI.deleteCard(cardId)
        onRefresh()
      },
      () => onUpdateBoard(oldBoard)
    )
  }, [board, onUpdateBoard, onRefresh, optimisticUpdate])

  const moveCard = useCallback(async (card: Card, targetListId: string, targetIndex?: number) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map(list => {
      if (list.id === card.list_id) {
        return { ...list, cards: list.cards.filter(c => c.id !== card.id) }
      }
      if (list.id === targetListId) {
        const newCards = [...list.cards]
        const insertIndex = targetIndex !== undefined ? targetIndex : newCards.length
        newCards.splice(insertIndex, 0, { ...card, list_id: targetListId })
        return { ...list, cards: newCards }
      }
      return list
    })

    optimisticUpdate(
      () => onUpdateBoard({ ...board, lists: updatedLists }),
      async () => {
        await BoardAPI.moveCard(card.id, targetListId, targetIndex)
        onRefresh()
      },
      () => onUpdateBoard(oldBoard)
    )
  }, [board, onUpdateBoard, onRefresh, optimisticUpdate])

  const reorderLists = useCallback(async (sourceIndex: number, targetIndex: number) => {
    if (!board) return

    const oldBoard = { ...board }
    const newLists = [...board.lists]
    const [moved] = newLists.splice(sourceIndex, 1)
    newLists.splice(targetIndex, 0, moved)

    optimisticUpdate(
      () => onUpdateBoard({ ...board, lists: newLists }),
      async () => {
        await BoardAPI.reorderLists(board.id, sourceIndex, targetIndex)
        onRefresh()
      },
      () => onUpdateBoard(oldBoard)
    )
  }, [board, onUpdateBoard, onRefresh, optimisticUpdate])

  return {
    addList,
    updateListTitle,
    deleteList,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
    reorderLists
  }
}