/**
 * クライアントサイドRate Limiter
 * セキュリティの多層防御として実装
 */

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  skipSuccessfulRequests?: boolean
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private configs: Map<string, RateLimitConfig> = new Map()

  constructor() {
    // デフォルト設定
    this.setConfig('default', { maxRequests: 10, windowMs: 60000 }) // 1分間に10回
    this.setConfig('addCard', { maxRequests: 20, windowMs: 60000 }) // 1分間に20回
    this.setConfig('addList', { maxRequests: 5, windowMs: 60000 })  // 1分間に5回
    this.setConfig('updateCard', { maxRequests: 30, windowMs: 60000 }) // 1分間に30回
    this.setConfig('updateList', { maxRequests: 20, windowMs: 60000 }) // 1分間に20回
    this.setConfig('deleteCard', { maxRequests: 10, windowMs: 60000 }) // 1分間に10回
    this.setConfig('deleteList', { maxRequests: 3, windowMs: 60000 })  // 1分間に3回
  }

  setConfig(action: string, config: RateLimitConfig) {
    this.configs.set(action, config)
  }

  check(userId: string, action: string = 'default'): boolean {
    const key = `${userId}:${action}`
    const config = this.configs.get(action) || this.configs.get('default')!
    const now = Date.now()

    let entry = this.limits.get(key)

    // エントリが存在しないか、ウィンドウが期限切れの場合は新しく作成
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs
      }
      this.limits.set(key, entry)
      return true
    }

    // 制限に達している場合
    if (entry.count >= config.maxRequests) {
      console.warn(`Rate limit exceeded for user ${userId}, action ${action}`)
      // ログ記録は外部で行う（循環依存を避けるため）
      return false
    }

    // カウントを増加
    entry.count++
    return true
  }

  getRemainingRequests(userId: string, action: string = 'default'): number {
    const key = `${userId}:${action}`
    const config = this.configs.get(action) || this.configs.get('default')!
    const entry = this.limits.get(key)

    if (!entry || Date.now() >= entry.resetTime) {
      return config.maxRequests
    }

    return Math.max(0, config.maxRequests - entry.count)
  }

  getResetTime(userId: string, action: string = 'default'): number {
    const key = `${userId}:${action}`
    const entry = this.limits.get(key)
    return entry?.resetTime || 0
  }

  // 定期的にクリーンアップ
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }

  // デバッグ用
  getStats() {
    return {
      totalEntries: this.limits.size,
      configs: Array.from(this.configs.entries())
    }
  }
}

export const rateLimiter = new RateLimiter()

// 定期的にクリーンアップを実行
setInterval(() => {
  rateLimiter.cleanup()
}, 300000) // 5分ごと

export class RateLimitError extends Error {
  constructor(
    message: string,
    public remainingRequests: number,
    public resetTime: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}