import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// テスト環境でモックが利用可能な場合はそれを使用
const createSupabaseClient = () => {
  if (typeof window !== 'undefined' && (window as any).__supabaseMock) {
    return (window as any).__supabaseMock
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()