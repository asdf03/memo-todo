/**
 * 入力値検証とサニタイゼーション
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitized?: string
}

export class InputValidator {
  // 最大長制限
  static readonly MAX_LENGTHS = {
    BOARD_TITLE: 100,
    LIST_TITLE: 50,
    CARD_TITLE: 200,
    CARD_DESCRIPTION: 2000,
    USER_NAME: 100
  }

  // 最小長制限
  static readonly MIN_LENGTHS = {
    BOARD_TITLE: 1,
    LIST_TITLE: 1,
    CARD_TITLE: 1,
    CARD_DESCRIPTION: 0,
    USER_NAME: 1
  }

  // 禁止されたパターン
  static readonly FORBIDDEN_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,  // スクリプトタグ
    /javascript:/gi,                 // javascript: プロトコル
    /on\w+\s*=/gi,                  // イベントハンドラ
    /data:text\/html/gi,            // データURL
    /vbscript:/gi,                  // VBScript
    /expression\s*\(/gi             // CSS expression
  ]

  /**
   * HTMLエスケープ
   */
  static escapeHtml(text: string): string {
    if (typeof document !== 'undefined') {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    } else {
      // Node.js環境用の代替実装
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
    }
  }

  /**
   * 危険なパターンを除去
   */
  static sanitize(input: string): string {
    let sanitized = input.trim()
    
    // 危険なパターンを除去
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      sanitized = sanitized.replace(pattern, '')
    }

    // HTMLエスケープ
    sanitized = this.escapeHtml(sanitized)

    return sanitized
  }

  /**
   * ボードタイトルの検証
   */
  static validateBoardTitle(title: string): ValidationResult {
    if (!title || typeof title !== 'string') {
      return { isValid: false, error: 'ボードタイトルは必須です' }
    }

    const sanitized = this.sanitize(title)

    if (sanitized.length < this.MIN_LENGTHS.BOARD_TITLE) {
      return { isValid: false, error: 'ボードタイトルは1文字以上で入力してください' }
    }

    if (sanitized.length > this.MAX_LENGTHS.BOARD_TITLE) {
      return { isValid: false, error: `ボードタイトルは${this.MAX_LENGTHS.BOARD_TITLE}文字以下で入力してください` }
    }

    return { isValid: true, sanitized }
  }

  /**
   * リストタイトルの検証
   */
  static validateListTitle(title: string): ValidationResult {
    if (!title || typeof title !== 'string') {
      return { isValid: false, error: 'リストタイトルは必須です' }
    }

    const sanitized = this.sanitize(title)

    if (sanitized.length < this.MIN_LENGTHS.LIST_TITLE) {
      return { isValid: false, error: 'リストタイトルは1文字以上で入力してください' }
    }

    if (sanitized.length > this.MAX_LENGTHS.LIST_TITLE) {
      return { isValid: false, error: `リストタイトルは${this.MAX_LENGTHS.LIST_TITLE}文字以下で入力してください` }
    }

    return { isValid: true, sanitized }
  }

  /**
   * カードタイトルの検証
   */
  static validateCardTitle(title: string): ValidationResult {
    if (!title || typeof title !== 'string') {
      return { isValid: false, error: 'カードタイトルは必須です' }
    }

    const sanitized = this.sanitize(title)

    if (sanitized.length < this.MIN_LENGTHS.CARD_TITLE) {
      return { isValid: false, error: 'カードタイトルは1文字以上で入力してください' }
    }

    if (sanitized.length > this.MAX_LENGTHS.CARD_TITLE) {
      return { isValid: false, error: `カードタイトルは${this.MAX_LENGTHS.CARD_TITLE}文字以下で入力してください` }
    }

    return { isValid: true, sanitized }
  }

  /**
   * カード説明の検証
   */
  static validateCardDescription(description: string): ValidationResult {
    if (!description) {
      return { isValid: true, sanitized: '' }
    }

    if (typeof description !== 'string') {
      return { isValid: false, error: '説明は文字列である必要があります' }
    }

    const sanitized = this.sanitize(description)

    if (sanitized.length > this.MAX_LENGTHS.CARD_DESCRIPTION) {
      return { isValid: false, error: `説明は${this.MAX_LENGTHS.CARD_DESCRIPTION}文字以下で入力してください` }
    }

    return { isValid: true, sanitized }
  }

  /**
   * 位置の検証
   */
  static validatePosition(position: number): ValidationResult {
    if (typeof position !== 'number') {
      return { isValid: false, error: '位置は数値である必要があります' }
    }

    if (!Number.isInteger(position)) {
      return { isValid: false, error: '位置は整数である必要があります' }
    }

    if (position < 0) {
      return { isValid: false, error: '位置は0以上である必要があります' }
    }

    if (position > 10000) {
      return { isValid: false, error: '位置が大きすぎます' }
    }

    return { isValid: true, sanitized: position.toString() }
  }

  /**
   * UUIDの検証
   */
  static validateUUID(id: string): ValidationResult {
    if (!id || typeof id !== 'string') {
      return { isValid: false, error: 'IDは必須です' }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(id)) {
      return { isValid: false, error: '無効なID形式です' }
    }

    return { isValid: true, sanitized: id }
  }

  /**
   * 複数の検証を一度に実行
   */
  static validateMultiple(validations: Array<() => ValidationResult>): ValidationResult {
    for (const validation of validations) {
      const result = validation()
      if (!result.isValid) {
        return result
      }
    }
    return { isValid: true }
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}