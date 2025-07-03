/**
 * ユーザーごとのリソース制限
 * DBコストを制御し、悪意のある使用を防ぐ
 */

import { supabase } from './supabase'

export interface ResourceLimits {
  maxBoards: number
  maxListsPerBoard: number
  maxCardsPerList: number
  maxTotalCards: number
  maxTotalStorage: number // bytes
}

export class ResourceLimiter {
  // デフォルトの制限値
  static readonly DEFAULT_LIMITS: ResourceLimits = {
    maxBoards: 10,           // 1ユーザーあたり最大10ボード
    maxListsPerBoard: 20,    // 1ボードあたり最大20リスト
    maxCardsPerList: 100,    // 1リストあたり最大100カード
    maxTotalCards: 1000,     // 1ユーザーあたり最大1000カード
    maxTotalStorage: 10 * 1024 * 1024 // 10MB
  }

  // プレミアムユーザーの制限値（将来の拡張用）
  static readonly PREMIUM_LIMITS: ResourceLimits = {
    maxBoards: 50,
    maxListsPerBoard: 50,
    maxCardsPerList: 500,
    maxTotalCards: 10000,
    maxTotalStorage: 100 * 1024 * 1024 // 100MB
  }

  /**
   * ユーザーの現在のリソース使用量を取得
   */
  static async getUserResourceUsage(userId: string): Promise<{
    boardCount: number
    totalCardCount: number
    estimatedStorage: number
  }> {
    try {
      // ボード数を取得
      const { data: boards, error: boardError } = await supabase
        .from('boards')
        .select('id')
        .eq('user_id', userId)

      if (boardError) throw boardError

      const boardCount = boards?.length || 0

      // 総カード数を取得
      const { data: cards, error: cardError } = await supabase
        .from('cards')
        .select('title, description')
        .in('list_id', 
          await supabase
            .from('lists')
            .select('id')
            .in('board_id', boards?.map(b => b.id) || [])
            .then(res => res.data?.map(l => l.id) || [])
        )

      if (cardError) throw cardError

      const totalCardCount = cards?.length || 0

      // ストレージ使用量を推定（タイトル + 説明のバイト数）
      const estimatedStorage = cards?.reduce((total, card) => {
        const titleBytes = new TextEncoder().encode(card.title || '').length
        const descBytes = new TextEncoder().encode(card.description || '').length
        return total + titleBytes + descBytes
      }, 0) || 0

      return {
        boardCount,
        totalCardCount,
        estimatedStorage
      }
    } catch (error) {
      console.error('Error getting user resource usage:', error)
      throw error
    }
  }

  /**
   * ボード作成前の制限チェック
   */
  static async checkBoardCreationLimit(userId: string): Promise<void> {
    const usage = await this.getUserResourceUsage(userId)
    const limits = this.DEFAULT_LIMITS

    if (usage.boardCount >= limits.maxBoards) {
      throw new Error(`ボード数の上限（${limits.maxBoards}個）に達しています`)
    }
  }

  /**
   * リスト作成前の制限チェック
   */
  static async checkListCreationLimit(userId: string, boardId: string): Promise<void> {
    const limits = this.DEFAULT_LIMITS

    // 指定されたボードのリスト数を取得
    const { data: lists, error } = await supabase
      .from('lists')
      .select('id')
      .eq('board_id', boardId)

    if (error) throw error

    const listCount = lists?.length || 0

    if (listCount >= limits.maxListsPerBoard) {
      throw new Error(`1ボードあたりのリスト数の上限（${limits.maxListsPerBoard}個）に達しています`)
    }
  }

  /**
   * カード作成前の制限チェック
   */
  static async checkCardCreationLimit(userId: string, listId: string): Promise<void> {
    const limits = this.DEFAULT_LIMITS

    // 指定されたリストのカード数を取得
    const { data: cards, error: listCardError } = await supabase
      .from('cards')
      .select('id')
      .eq('list_id', listId)

    if (listCardError) throw listCardError

    const listCardCount = cards?.length || 0

    if (listCardCount >= limits.maxCardsPerList) {
      throw new Error(`1リストあたりのカード数の上限（${limits.maxCardsPerList}個）に達しています`)
    }

    // ユーザーの総カード数もチェック
    const usage = await this.getUserResourceUsage(userId)

    if (usage.totalCardCount >= limits.maxTotalCards) {
      throw new Error(`総カード数の上限（${limits.maxTotalCards}個）に達しています`)
    }

    if (usage.estimatedStorage >= limits.maxTotalStorage) {
      throw new Error(`ストレージ容量の上限（${Math.round(limits.maxTotalStorage / 1024 / 1024)}MB）に達しています`)
    }
  }

  /**
   * データサイズの制限チェック
   */
  static checkDataSize(title: string, description?: string): void {
    const limits = this.DEFAULT_LIMITS
    
    const titleBytes = new TextEncoder().encode(title).length
    const descBytes = description ? new TextEncoder().encode(description).length : 0
    const totalBytes = titleBytes + descBytes

    // 単一のカードが1MBを超えないようにチェック
    const maxSingleCardSize = 1024 * 1024 // 1MB
    if (totalBytes > maxSingleCardSize) {
      throw new Error('カードのデータサイズが大きすぎます（上限: 1MB）')
    }
  }

  /**
   * ユーザーの制限情報を取得（UI表示用）
   */
  static async getUserLimitsInfo(userId: string): Promise<{
    limits: ResourceLimits
    usage: {
      boardCount: number
      totalCardCount: number
      estimatedStorage: number
    }
    remaining: {
      boards: number
      cards: number
      storage: number
    }
  }> {
    const limits = this.DEFAULT_LIMITS
    const usage = await this.getUserResourceUsage(userId)

    return {
      limits,
      usage,
      remaining: {
        boards: Math.max(0, limits.maxBoards - usage.boardCount),
        cards: Math.max(0, limits.maxTotalCards - usage.totalCardCount),
        storage: Math.max(0, limits.maxTotalStorage - usage.estimatedStorage)
      }
    }
  }
}

export class ResourceLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResourceLimitError'
  }
}