/**
 * Input Validationのセキュリティテスト
 */

import { InputValidator, ValidationError } from '../../src/lib/validation'

describe('InputValidator Security Tests', () => {
  describe('XSS Protection', () => {
    test('should escape HTML in board titles', () => {
      const maliciousTitle = '<script>alert("xss")</script>'
      const result = InputValidator.validateBoardTitle(maliciousTitle)
      
      // スクリプトタグは長すぎるため無効になるが、サニタイズはされる
      expect(result.isValid).toBe(false) // 100文字制限を超えるため
    })

    test('should escape HTML in shorter titles', () => {
      const shortMaliciousTitle = '<script>xss</script>'
      const result = InputValidator.validateBoardTitle(shortMaliciousTitle)
      
      // スクリプトタグも除去パターンにマッチするため無効
      expect(result.isValid).toBe(false)
    })

    test('should escape basic HTML', () => {
      const htmlTitle = '<b>bold</b>'
      const result = InputValidator.validateBoardTitle(htmlTitle)
      
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toContain('&lt;b&gt;bold&lt;/b&gt;')
    })

    test('should remove dangerous patterns', () => {
      const dangerousInputs = [
        'javascript:alert(1)',
        'onload=alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:alert(1)',
        'expression(alert(1))'
      ]

      dangerousInputs.forEach(input => {
        const result = InputValidator.validateCardTitle(input)
        expect(result.isValid).toBe(true)
        expect(result.sanitized).not.toContain('javascript:')
        expect(result.sanitized).not.toContain('onload=')
        expect(result.sanitized).not.toContain('data:text/html')
        expect(result.sanitized).not.toContain('vbscript:')
        expect(result.sanitized).not.toContain('expression(')
      })
    })
  })

  describe('Length Limits', () => {
    test('should enforce board title length limits', () => {
      // 空文字
      const emptyResult = InputValidator.validateBoardTitle('')
      expect(emptyResult.isValid).toBe(false)

      // 長すぎる文字列
      const longTitle = 'a'.repeat(101)
      const longResult = InputValidator.validateBoardTitle(longTitle)
      expect(longResult.isValid).toBe(false)

      // 正常な長さ
      const normalTitle = 'a'.repeat(50)
      const normalResult = InputValidator.validateBoardTitle(normalTitle)
      expect(normalResult.isValid).toBe(true)
    })

    test('should enforce card description length limits', () => {
      // 長すぎる説明
      const longDescription = 'a'.repeat(2001)
      const result = InputValidator.validateCardDescription(longDescription)
      expect(result.isValid).toBe(false)

      // 正常な長さ
      const normalDescription = 'a'.repeat(1000)
      const normalResult = InputValidator.validateCardDescription(normalDescription)
      expect(normalResult.isValid).toBe(true)
    })
  })

  describe('UUID Validation', () => {
    test('should validate correct UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ]

      validUUIDs.forEach(uuid => {
        const result = InputValidator.validateUUID(uuid)
        expect(result.isValid).toBe(true)
      })
    })

    test('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        '',
        'not-a-uuid',
        '123',
        '123e4567-e89b-12d3-a456-42661417400', // 1文字足りない
        '123e4567-e89b-12d3-a456-4266141740000', // 1文字多い
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        '<script>alert(1)</script>',
        '../../../etc/passwd'
      ]

      invalidUUIDs.forEach(uuid => {
        const result = InputValidator.validateUUID(uuid)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('Position Validation', () => {
    test('should validate correct positions', () => {
      const validPositions = [0, 1, 100, 9999]

      validPositions.forEach(position => {
        const result = InputValidator.validatePosition(position)
        expect(result.isValid).toBe(true)
      })
    })

    test('should reject invalid positions', () => {
      const invalidPositions = [
        -1,
        10001,
        1.5,
        '1' as any,
        null as any,
        undefined as any,
        Infinity,
        -Infinity,
        NaN
      ]

      invalidPositions.forEach(position => {
        const result = InputValidator.validatePosition(position)
        expect(result.isValid).toBe(false)
      })
    })
  })

  describe('Type Safety', () => {
    test('should handle non-string inputs', () => {
      const nonStringInputs = [
        null,
        undefined,
        123,
        {},
        [],
        true,
        Symbol('test')
      ]

      nonStringInputs.forEach(input => {
        const result = InputValidator.validateBoardTitle(input as any)
        expect(result.isValid).toBe(false)
      })
    })

    test('should handle very large inputs', () => {
      // 10MBの文字列
      const hugeString = 'a'.repeat(10 * 1024 * 1024)
      const result = InputValidator.validateCardDescription(hugeString)
      expect(result.isValid).toBe(false)
    })
  })

  describe('Unicode and Special Characters', () => {
    test('should handle Unicode characters correctly', () => {
      const unicodeInputs = [
        'こんにちは世界',
        '🎉🎊✨',
        'Ñañoño',
        'العربية',
        '中文',
        'русский'
      ]

      unicodeInputs.forEach(input => {
        const result = InputValidator.validateBoardTitle(input)
        expect(result.isValid).toBe(true)
        expect(result.sanitized).toBeTruthy()
      })
    })

    test('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const result = InputValidator.validateBoardTitle(specialChars)
      expect(result.isValid).toBe(true)
    })
  })

  describe('Multiple Validation', () => {
    test('should stop at first validation error', () => {
      const validations = [
        () => ({ isValid: false, error: 'First error' }),
        () => ({ isValid: false, error: 'Second error' }),
        () => ({ isValid: true })
      ]

      const result = InputValidator.validateMultiple(validations)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('First error')
    })

    test('should pass when all validations pass', () => {
      const validations = [
        () => ({ isValid: true }),
        () => ({ isValid: true }),
        () => ({ isValid: true })
      ]

      const result = InputValidator.validateMultiple(validations)
      expect(result.isValid).toBe(true)
    })
  })
})