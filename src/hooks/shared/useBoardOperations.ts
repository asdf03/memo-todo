import { useCallback } from 'react'
import { Card, List } from '../../types'
import { useBoardContext } from '../../contexts/BoardContext'
import { BoardAPI } from '../../lib/boardApi'

export const useBoardOperations = () => {
  const { board, onUpdateBoard, onRefresh } = useBoardContext()

  const addList = useCallback(async (title: string) => {
    if (!board) return

    const tempId = `temp-${Date.now()}`
    const tempList: List = {
      id: tempId,
      title,
      cards: [],
      order: board.lists.length
    }

    // Optimistic update
    onUpdateBoard({ ...board, lists: [...board.lists, tempList] })
    
    try {
      await BoardAPI.addList(board.id, title, board.lists.length)
      onRefresh()
    } catch (error) {
      console.error('Failed to add list:', error)
      onRefresh()
    }
  }, [board, onUpdateBoard, onRefresh])

  const updateListTitle = useCallback(async (listId: string, title: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map((list: List) => 
      list.id === listId ? { ...list, title } : list
    )

    // Optimistic update
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.updateList(listId, title)
      onRefresh()
    } catch (error) {
      console.error('Failed to update list title:', error)
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const deleteList = useCallback(async (listId: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.filter((list: List) => list.id !== listId)

    // Optimistic update
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.deleteList(listId)
      onRefresh()
    } catch (error) {
      console.error('Failed to delete list:', error)
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const addCard = useCallback(async (listId: string, title: string) => {
    if (!board) return

    const list = board.lists.find((l: List) => l.id === listId)
    if (!list) return

    const tempId = `temp-${Date.now()}`
    const tempCard: Card = {
      id: tempId,
      title,
      order: list.cards.length,
      list_id: listId
    }

    const updatedLists = board.lists.map((l: List) => 
      l.id === listId ? { ...l, cards: [...l.cards, tempCard] } : l
    )

    // Optimistic update
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.addCard(listId, title, list.cards.length)
      onRefresh()
    } catch (error) {
      console.error('Failed to add card:', error)
      onRefresh()
    }
  }, [board, onUpdateBoard, onRefresh])

  const updateCard = useCallback(async (cardId: string, updates: Partial<Card>) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map((list: List) => ({
      ...list,
      cards: list.cards.map((card: Card) => 
        card.id === cardId ? { ...card, ...updates } : card
      )
    }))

    // Optimistic update
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.updateCard(cardId, updates.title || '')
      onRefresh()
    } catch (error) {
      console.error('Failed to update card:', error)
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const deleteCard = useCallback(async (cardId: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map((list: List) => ({
      ...list,
      cards: list.cards.filter((card: Card) => card.id !== cardId)
    }))

    // Optimistic update
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.deleteCard(cardId)
      onRefresh()
    } catch (error) {
      console.error('Failed to delete card:', error)
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const moveCard = useCallback(async (card: Card, targetListId: string, targetIndex?: number) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map((list: List) => {
      if (list.id === card.list_id) {
        return { ...list, cards: list.cards.filter((c: Card) => c.id !== card.id) }
      }
      if (list.id === targetListId) {
        const newCards = [...list.cards]
        const insertIndex = targetIndex !== undefined ? targetIndex : newCards.length
        newCards.splice(insertIndex, 0, { ...card, list_id: targetListId })
        return { ...list, cards: newCards }
      }
      return list
    })

    // Optimistic update
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.moveCard(card.id, targetListId, targetIndex)
      onRefresh()
    } catch (error) {
      console.error('Failed to move card:', error)
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const reorderLists = useCallback(async (sourceIndex: number, targetIndex: number) => {
    if (!board) return

    const oldBoard = { ...board }
    const newLists = [...board.lists]
    const [moved] = newLists.splice(sourceIndex, 1)
    newLists.splice(targetIndex, 0, moved)

    // Optimistic update
    onUpdateBoard({ ...board, lists: newLists })
    
    try {
      await BoardAPI.reorderLists(board.id, sourceIndex, targetIndex)
      onRefresh()
    } catch (error) {
      console.error('Failed to reorder lists:', error)
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

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