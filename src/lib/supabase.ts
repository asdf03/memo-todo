import { createClient } from '@supabase/supabase-js'

const databaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const databaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!databaseUrl || !databaseAnonKey) {
  throw new Error('Missing database environment variables')
}

// テスト環境でモックが利用可能な場合はそれを使用
const createDatabaseClient = () => {
  if (typeof window !== 'undefined' && (window as any).__databaseMock) {
    return (window as any).__databaseMock
  }
  return createClient(databaseUrl, databaseAnonKey)
}

export const supabase = createDatabaseClient()