import { useCallback } from 'react'
import { Card, List } from '../../types'
import { useBoardContext } from '../../contexts/BoardContext'
import { BoardAPI } from '../../lib/boardApi'

export const useBoardOperations = () => {
  const { board, onUpdateBoard, onRefresh } = useBoardContext()

  // デスクトップ専用：マウス操作向けのエラーハンドリング
  const showDesktopError = (message: string) => {
    // デスクトップではトーストやモーダルでエラー表示
    console.error(message)
    // TODO: デスクトップ用トースト実装
  }

  const addList = useCallback(async (title: string) => {
    if (!board) return

    const tempId = `temp-${Date.now()}`
    const tempList: List = {
      id: tempId,
      title,
      cards: [],
      order: board.lists.length
    }

    // デスクトップ：即座にUI更新（マウス操作は高速）
    onUpdateBoard({ ...board, lists: [...board.lists, tempList] })
    
    try {
      await BoardAPI.addList(board.id, title, board.lists.length)
      onRefresh()
    } catch (error) {
      showDesktopError('リストの追加に失敗しました')
      onRefresh()
    }
  }, [board, onUpdateBoard, onRefresh])

  const updateListTitle = useCallback(async (listId: string, title: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map((list: List) => 
      list.id === listId ? { ...list, title } : list
    )

    // デスクトップ：即座にUI更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.updateList(listId, title)
      onRefresh()
    } catch (error) {
      showDesktopError('リストの更新に失敗しました')
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const deleteList = useCallback(async (listId: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.filter((list: List) => list.id !== listId)

    // デスクトップ：即座にUI更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.deleteList(listId)
      onRefresh()
    } catch (error) {
      showDesktopError('リストの削除に失敗しました')
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

    // デスクトップ：即座にUI更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.addCard(listId, title, list.cards.length)
      onRefresh()
    } catch (error) {
      showDesktopError('カードの追加に失敗しました')
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

    // デスクトップ：即座にUI更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.updateCard(cardId, updates.title || '')
      onRefresh()
    } catch (error) {
      showDesktopError('カードの更新に失敗しました')
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

    // デスクトップ：即座にUI更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.deleteCard(cardId)
      onRefresh()
    } catch (error) {
      showDesktopError('カードの削除に失敗しました')
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

    // デスクトップ：ドラッグ&ドロップ用の滑らかな更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.moveCard(card.id, targetListId, targetIndex)
      onRefresh()
    } catch (error) {
      showDesktopError('カードの移動に失敗しました')
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const reorderLists = useCallback(async (sourceIndex: number, targetIndex: number) => {
    if (!board) return

    const oldBoard = { ...board }
    const newLists = [...board.lists]
    const [moved] = newLists.splice(sourceIndex, 1)
    newLists.splice(targetIndex, 0, moved)

    // デスクトップ：ドラッグ&ドロップ用の滑らかな更新
    onUpdateBoard({ ...board, lists: newLists })
    
    try {
      await BoardAPI.reorderLists(board.id, sourceIndex, targetIndex)
      onRefresh()
    } catch (error) {
      showDesktopError('リストの順序変更に失敗しました')
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