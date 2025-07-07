/**
 * セキュリティログとエラートラッキング
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  VALIDATION_FAILED = 'validation_failed',
  RESOURCE_LIMIT_EXCEEDED = 'resource_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  AUTH_FAILURE = 'auth_failure',
  LARGE_PAYLOAD = 'large_payload'
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  userId?: string
  userAgent?: string
  ip?: string
  eventType?: SecurityEventType
  metadata?: Record<string, any>
}

class SecurityLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // メモリ内で保持する最大ログ数

  private createLogEntry(
    level: LogLevel,
    message: string,
    eventType?: SecurityEventType,
    userId?: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      userId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ip: 'client-side', // クライアントサイドでは取得不可
      eventType,
      metadata
    }
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry)
    
    // メモリ制限
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // コンソール出力
    this.outputToConsole(entry)

    // 本番環境では外部ログサービスに送信
    if (entry.level >= LogLevel.ERROR) {
      this.sendToExternalService(entry)
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const message = `[${entry.timestamp}] ${LogLevel[entry.level]} ${entry.message}`
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata)
        break
      case LogLevel.INFO:
        console.info(message, entry.metadata)
        break
      case LogLevel.WARN:
        console.warn(message, entry.metadata)
        break
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.metadata)
        break
    }
  }

  private async sendToExternalService(_entry: LogEntry): Promise<void> {
    // 本番環境では実際のログサービスに送信
    // 現在はコンソールログのみ
    if (process.env.NODE_ENV === 'production') {
      try {
        // 外部ログサービスへの送信処理をここに実装
        // 例: 任意のログサービスへの送信
        // await logService.send(_entry)
      } catch (error) {
        console.error('Failed to send log to external service:', error)
      }
    }
  }

  // セキュリティイベントのログ
  logSecurityEvent(
    eventType: SecurityEventType,
    message: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const level = this.getLogLevelForSecurityEvent(eventType)
    const entry = this.createLogEntry(level, message, eventType, userId, metadata)
    this.addLog(entry)
  }

  // 一般的なログメソッド
  debug(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, undefined, undefined, metadata)
    this.addLog(entry)
  }

  info(message: string, userId?: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, undefined, userId, metadata)
    this.addLog(entry)
  }

  warn(message: string, userId?: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, undefined, userId, metadata)
    this.addLog(entry)
  }

  error(message: string, userId?: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(
      LogLevel.ERROR, 
      message, 
      undefined, 
      userId, 
      { 
        ...metadata, 
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined 
      }
    )
    this.addLog(entry)
  }

  critical(message: string, userId?: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(
      LogLevel.CRITICAL, 
      message, 
      undefined, 
      userId, 
      { 
        ...metadata, 
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined 
      }
    )
    this.addLog(entry)
  }

  private getLogLevelForSecurityEvent(eventType: SecurityEventType): LogLevel {
    switch (eventType) {
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
        return LogLevel.WARN
      case SecurityEventType.VALIDATION_FAILED:
        return LogLevel.WARN
      case SecurityEventType.RESOURCE_LIMIT_EXCEEDED:
        return LogLevel.WARN
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return LogLevel.ERROR
      case SecurityEventType.AUTH_FAILURE:
        return LogLevel.ERROR
      case SecurityEventType.LARGE_PAYLOAD:
        return LogLevel.WARN
      default:
        return LogLevel.INFO
    }
  }

  // 統計情報の取得
  getSecurityStats(): {
    totalEvents: number
    eventsByType: Record<SecurityEventType, number>
    recentEvents: LogEntry[]
  } {
    const securityLogs = this.logs.filter(log => log.eventType)
    const eventsByType: Record<SecurityEventType, number> = {} as any

    for (const eventType of Object.values(SecurityEventType)) {
      eventsByType[eventType] = securityLogs.filter(log => log.eventType === eventType).length
    }

    return {
      totalEvents: securityLogs.length,
      eventsByType,
      recentEvents: this.logs.slice(-10) // 最新10件
    }
  }

  // ログのエクスポート（デバッグ用）
  exportLogs(): LogEntry[] {
    return [...this.logs]
  }

  // ログのクリア
  clearLogs(): void {
    this.logs = []
  }
}

// シングルトンインスタンス
export const securityLogger = new SecurityLogger()

// セキュリティエラー用のヘルパー関数
export const logRateLimitError = (userId: string, action: string, remaining: number) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    `Rate limit exceeded for action: ${action}`,
    userId,
    { action, remaining }
  )
}

export const logValidationError = (userId: string, field: string, value: any) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.VALIDATION_FAILED,
    `Validation failed for field: ${field}`,
    userId,
    { field, value: typeof value === 'string' ? value.substring(0, 100) : value }
  )
}

export const logResourceLimitError = (userId: string, resource: string, current: number, limit: number) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.RESOURCE_LIMIT_EXCEEDED,
    `Resource limit exceeded for: ${resource}`,
    userId,
    { resource, current, limit }
  )
}

export const logSuspiciousActivity = (userId: string, activity: string, metadata?: Record<string, any>) => {
  securityLogger.logSecurityEvent(
    SecurityEventType.SUSPICIOUS_ACTIVITY,
    `Suspicious activity detected: ${activity}`,
    userId,
    metadata
  )
}