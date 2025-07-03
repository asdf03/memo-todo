import { supabase } from './supabase'
import { Board, List, Card, DBCard } from '../types'

export class BoardAPI {
  // ユーザーのボードを取得
  static async getUserBoard(userId: string): Promise<Board | null> {
    try {
      // テスト環境でモックデータが利用可能な場合はそれを使用
      if (typeof window !== 'undefined' && (window as any).__mockBoardData) {
        console.log('モックボードデータを使用:', userId)
        const mockData = (window as any).__mockBoardData
        return {
          id: mockData.id,
          title: mockData.title,
          user_id: mockData.user_id,
          lists: mockData.lists.map((list: any) => ({
            id: list.id,
            title: list.title,
            position: list.position,
            board_id: list.board_id,
            cards: list.cards.map((card: any) => ({
              id: card.id,
              title: card.title,
              description: card.description,
              position: card.position,
              list_id: card.list_id,
              createdAt: new Date()
            }))
          }))
        }
      }
      
      console.log('Supabaseボード取得開始:', userId)
      // ボードを取得
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      console.log('ボードクエリ結果:', { boardData, boardError })

      if (boardError && boardError.code !== 'PGRST116') {
        throw boardError
      }

      if (!boardData) {
        // ボードが存在しない場合はnullを返す
        return null
      }

      // リストを取得
      const { data: listsData, error: listsError } = await supabase
        .from('lists')
        .select('*')
        .eq('board_id', boardData.id)
        .order('position')

      if (listsError) throw listsError

      // 各リストのカードを取得
      const lists: List[] = []
      for (const listData of listsData || []) {
        const { data: cardsData, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .eq('list_id', listData.id)
          .order('position')

        if (cardsError) throw cardsError

        console.log(`リスト${listData.title}のカードデータ:`, cardsData)
        
        const cards: Card[] = (cardsData || []).map((cardData: DBCard) => {
          console.log('カードデータ変換:', cardData)
          return {
            id: cardData.id,
            title: cardData.title,
            description: cardData.description,
            createdAt: new Date(cardData.created_at),
            list_id: cardData.list_id,
            position: cardData.position
          }
        })

        lists.push({
          id: listData.id,
          title: listData.title,
          cards,
          board_id: listData.board_id,
          position: listData.position
        })
      }

      return {
        id: boardData.id,
        title: boardData.title,
        lists,
        user_id: boardData.user_id
      }
    } catch (error) {
      console.error('Error fetching user board:', error)
      throw error
    }
  }

  // ボードを作成（DBにのみ作成、データは返さない）
  static async createBoard(userId: string, title: string = 'マイボード'): Promise<void> {
    try {
      const { error: boardError } = await supabase
        .from('boards')
        .insert({
          user_id: userId,
          title
        })
        .select()
        .single()

      if (boardError) throw boardError
    } catch (error) {
      console.error('Error creating board:', error)
      throw error
    }
  }

  // ボードのタイトルのみ更新
  static async updateBoardTitle(boardId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('boards')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('id', boardId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating board title:', error)
      throw error
    }
  }

  // リストのタイトルと位置のみ更新
  static async updateList(listId: string, title: string, position?: number): Promise<void> {
    try {
      const updateData: any = {
        title,
        updated_at: new Date().toISOString()
      }
      
      if (position !== undefined) {
        updateData.position = position
      }
      
      const { error } = await supabase
        .from('lists')
        .update(updateData)
        .eq('id', listId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating list:', error)
      throw error
    }
  }

  // 複数リストの位置を一括更新
  static async updateListsPositions(updates: {id: string, position: number}[]): Promise<void> {
    try {
      const promises = updates.map(update => 
        supabase
          .from('lists')
          .update({ 
            position: update.position,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)
      )
      
      const results = await Promise.all(promises)
      
      for (const { error } of results) {
        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating lists positions:', error)
      throw error
    }
  }

  // カードを更新
  static async updateCard(cardId: string, title?: string, description?: string, position?: number, listId?: string): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (position !== undefined) updateData.position = position
      if (listId !== undefined) updateData.list_id = listId
      
      const { error } = await supabase
        .from('cards')
        .update(updateData)
        .eq('id', cardId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating card:', error)
      throw error
    }
  }

  // 複数カードの位置を一括更新
  static async updateCardsPositions(updates: {id: string, position: number, list_id?: string}[]): Promise<void> {
    try {
      const promises = updates.map(update => {
        const updateData: any = {
          position: update.position,
          updated_at: new Date().toISOString()
        }
        
        if (update.list_id !== undefined) {
          updateData.list_id = update.list_id
        }
        
        return supabase
          .from('cards')
          .update(updateData)
          .eq('id', update.id)
      })
      
      const results = await Promise.all(promises)
      
      for (const { error } of results) {
        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating cards positions:', error)
      throw error
    }
  }

  // リストを追加（DBにのみ作成）
  static async addList(boardId: string, title: string, position: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('lists')
        .insert({
          board_id: boardId,
          title,
          position
        })

      if (error) throw error
    } catch (error) {
      console.error('Error adding list:', error)
      throw error
    }
  }

  // カードを追加（DBにのみ作成）
  static async addCard(listId: string, title: string, position: number, description?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cards')
        .insert({
          list_id: listId,
          title,
          description,
          position
        })

      if (error) throw error
    } catch (error) {
      console.error('Error adding card:', error)
      throw error
    }
  }

  // リストを削除
  static async deleteList(listId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting list:', error)
      throw error
    }
  }

  // カードを削除
  static async deleteCard(cardId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting card:', error)
      throw error
    }
  }
}