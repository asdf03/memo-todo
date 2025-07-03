/**
 * Rate Limiterのセキュリティテスト
 */

import { rateLimiter, RateLimitError } from '../../src/lib/rateLimiter'

describe('RateLimiter Security Tests', () => {
  const testUserId = 'test-user-123'

  beforeEach(() => {
    // 各テスト前にクリーンアップ
    rateLimiter.cleanup()
    // 内部状態をリセット
    const anyRateLimiter = rateLimiter as any
    anyRateLimiter.limits.clear()
  })

  describe('Basic Rate Limiting', () => {
    test('should allow requests within limit', () => {
      // デフォルト設定: 1分間に10回
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.check(testUserId, 'default')).toBe(true)
      }
    })

    test('should block requests exceeding limit', () => {
      // 制限まで実行
      for (let i = 0; i < 10; i++) {
        rateLimiter.check(testUserId, 'default')
      }
      
      // 11回目は拒否される
      expect(rateLimiter.check(testUserId, 'default')).toBe(false)
    })

    test('should track remaining requests correctly', () => {
      expect(rateLimiter.getRemainingRequests(testUserId, 'default')).toBe(10)
      
      rateLimiter.check(testUserId, 'default')
      expect(rateLimiter.getRemainingRequests(testUserId, 'default')).toBe(9)
      
      rateLimiter.check(testUserId, 'default')
      expect(rateLimiter.getRemainingRequests(testUserId, 'default')).toBe(8)
    })
  })

  describe('Action-specific Limits', () => {
    test('should apply different limits for different actions', () => {
      // addCard: 1分間に20回
      for (let i = 0; i < 20; i++) {
        expect(rateLimiter.check(testUserId, 'addCard')).toBe(true)
      }
      expect(rateLimiter.check(testUserId, 'addCard')).toBe(false)

      // addList: 1分間に5回（別のカウンター）
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.check(testUserId, 'addList')).toBe(true)
      }
      expect(rateLimiter.check(testUserId, 'addList')).toBe(false)
    })
  })

  describe('User Isolation', () => {
    test('should isolate limits between different users', () => {
      const userId1 = 'user-1'
      const userId2 = 'user-2'

      // user1が制限に達する
      for (let i = 0; i < 10; i++) {
        rateLimiter.check(userId1, 'default')
      }
      expect(rateLimiter.check(userId1, 'default')).toBe(false)

      // user2は影響を受けない
      expect(rateLimiter.check(userId2, 'default')).toBe(true)
    })
  })

  describe('Window Reset', () => {
    test('should reset window correctly', async () => {
      // 制限に達するまで実行
      for (let i = 0; i < 10; i++) {
        rateLimiter.check(testUserId, 'default')
      }
      expect(rateLimiter.check(testUserId, 'default')).toBe(false)

      // 時間を進める（モック）
      jest.useFakeTimers()
      jest.advanceTimersByTime(61000) // 61秒後

      // 制限がリセットされる
      expect(rateLimiter.check(testUserId, 'default')).toBe(true)

      jest.useRealTimers()
    })
  })

  describe('Security Edge Cases', () => {
    test('should handle invalid user IDs', () => {
      expect(() => rateLimiter.check('', 'default')).not.toThrow()
      expect(rateLimiter.check('', 'default')).toBe(true)
    })

    test('should handle invalid actions', () => {
      expect(rateLimiter.check(testUserId, 'nonexistent')).toBe(true)
      expect(rateLimiter.getRemainingRequests(testUserId, 'nonexistent')).toBe(9) // 1回チェック後なので9
    })

    test('should handle rapid successive calls', () => {
      // 同時に多数のリクエスト
      const results = []
      for (let i = 0; i < 15; i++) {
        results.push(rateLimiter.check(testUserId, 'default'))
      }

      // 最初の10個はtrue、残りはfalse
      const firstTenResults = results.slice(0, 10)
      const remainingResults = results.slice(10)
      
      expect(firstTenResults.filter(r => r === true).length).toBe(10)
      expect(remainingResults.filter(r => r === false).length).toBe(5)
    })
  })

  describe('Memory Management', () => {
    test('should cleanup expired entries', () => {
      const manyUsers = Array.from({ length: 5 }, (_, i) => `user-${i}`)
      
      // 少数のユーザーでリクエスト
      manyUsers.forEach(userId => {
        rateLimiter.check(userId, 'default')
      })

      // 直接内部状態を確認
      const anyRateLimiter = rateLimiter as any
      expect(anyRateLimiter.limits.size).toBe(5)

      // 時間を進めてクリーンアップ実行
      jest.useFakeTimers()
      jest.advanceTimersByTime(61000)
      rateLimiter.cleanup()

      expect(anyRateLimiter.limits.size).toBe(0)

      jest.useRealTimers()
    })
  })
})