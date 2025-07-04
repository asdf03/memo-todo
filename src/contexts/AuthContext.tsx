import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithOAuth: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初期セッションの取得
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithOAuth = async () => {
    // 環境に応じたリダイレクトURL設定
    const getRedirectUrl = () => {
      // 環境変数で設定されている場合はそれを使用
      const customRedirectUrl = (import.meta as any).env.VITE_REDIRECT_URL
      if (customRedirectUrl) {
        return customRedirectUrl
      }
      
      // 自動判別
      if (typeof window !== 'undefined') {
        return `${window.location.origin}/`
      }
      
      // フォールバック
      return 'http://localhost:3000/'
    }

    const redirectUrl = getRedirectUrl()
    console.log('OAuth redirect URL:', redirectUrl)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    })
    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithOAuth,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}