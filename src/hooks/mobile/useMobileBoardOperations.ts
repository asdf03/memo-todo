import { useCallback } from 'react'
import { Card, List } from '../../types'
import { useBoardContext } from '../../contexts/BoardContext'
import { BoardAPI } from '../../lib/boardApi'

export const useBoardOperations = () => {
  const { board, onUpdateBoard, onRefresh } = useBoardContext()

  // モバイル専用：タッチ操作向けのエラーハンドリング
  const showMobileError = (message: string) => {
    // モバイルではハプティックフィードバックとネイティブアラートを使用
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
    
    // モバイル向けのユーザーフレンドリーなアラート
    alert(message)
    console.error(message)
  }

  // モバイル専用：成功フィードバック
  const showMobileSuccess = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
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

    // モバイル：タッチ操作の応答性を重視して即座にUI更新
    onUpdateBoard({ ...board, lists: [...board.lists, tempList] })
    
    try {
      await BoardAPI.addList(board.id, title, board.lists.length)
      showMobileSuccess()
      onRefresh()
    } catch (error) {
      showMobileError('リストの追加に失敗しました')
      onRefresh()
    }
  }, [board, onUpdateBoard, onRefresh])

  const updateListTitle = useCallback(async (listId: string, title: string) => {
    if (!board) return

    const oldBoard = { ...board }
    const updatedLists = board.lists.map((list: List) => 
      list.id === listId ? { ...list, title } : list
    )

    // モバイル：即座にフィードバック
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.updateList(listId, title)
      showMobileSuccess()
      onRefresh()
    } catch (error) {
      showMobileError('リストの更新に失敗しました')
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const deleteList = useCallback(async (listId: string) => {
    if (!board) return

    // モバイル：削除前の確認ダイアログ
    if (!confirm('このリストを削除しますか？')) {
      return
    }

    const oldBoard = { ...board }
    const updatedLists = board.lists.filter((list: List) => list.id !== listId)

    // モバイル：即座にUI更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.deleteList(listId)
      showMobileSuccess()
      onRefresh()
    } catch (error) {
      showMobileError('リストの削除に失敗しました')
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

    // モバイル：タッチ操作の応答性重視
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.addCard(listId, title, list.cards.length)
      showMobileSuccess()
      onRefresh()
    } catch (error) {
      showMobileError('カードの追加に失敗しました')
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

    // モバイル：即座にUI更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.updateCard(cardId, updates.title || '')
      showMobileSuccess()
      onRefresh()
    } catch (error) {
      showMobileError('カードの更新に失敗しました')
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const deleteCard = useCallback(async (cardId: string) => {
    if (!board) return

    // モバイル：削除前の確認
    if (!confirm('このカードを削除しますか？')) {
      return
    }

    const oldBoard = { ...board }
    const updatedLists = board.lists.map((list: List) => ({
      ...list,
      cards: list.cards.filter((card: Card) => card.id !== cardId)
    }))

    // モバイル：即座にUI更新
    onUpdateBoard({ ...board, lists: updatedLists })
    
    try {
      await BoardAPI.deleteCard(cardId)
      showMobileSuccess()
      onRefresh()
    } catch (error) {
      showMobileError('カードの削除に失敗しました')
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

    // モバイル：タッチドラッグ用の滑らかな更新とハプティックフィードバック
    onUpdateBoard({ ...board, lists: updatedLists })
    showMobileSuccess()
    
    try {
      await BoardAPI.moveCard(card.id, targetListId, targetIndex)
      onRefresh()
    } catch (error) {
      showMobileError('カードの移動に失敗しました')
      onUpdateBoard(oldBoard)
    }
  }, [board, onUpdateBoard, onRefresh])

  const reorderLists = useCallback(async (sourceIndex: number, targetIndex: number) => {
    if (!board) return

    const oldBoard = { ...board }
    const newLists = [...board.lists]
    const [moved] = newLists.splice(sourceIndex, 1)
    newLists.splice(targetIndex, 0, moved)

    // モバイル：タッチドラッグ用の滑らかな更新とハプティックフィードバック
    onUpdateBoard({ ...board, lists: newLists })
    
    // モバイル：ドロップ成功時のハプティックパターン
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30])
    }
    
    try {
      await BoardAPI.reorderLists(board.id, sourceIndex, targetIndex)
      onRefresh()
    } catch (error) {
      showMobileError('リストの順序変更に失敗しました')
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