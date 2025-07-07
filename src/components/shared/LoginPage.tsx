import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signUp, signInWithOAuth } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    try {
      setLoading(true)
      setError(null)
      
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      setLoading(true)
      setError(null)
      await signInWithOAuth(provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="app-logo">📝</div>
          <h1>Memo Todo</h1>
          <p>シンプルなタスク管理アプリ</p>
        </div>
        <div className="login-form-container">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">メールアドレス</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="email@example.com"
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">パスワード</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="パスワード"
                disabled={loading}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary w-full"
              disabled={loading || !email || !password}
            >
              {loading ? '処理中...' : isSignUp ? 'サインアップ' : 'ログイン'}
            </button>
          </form>
          <div className="oauth-buttons">
            <button
              type="button"
              className="btn btn--ghost w-full"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
            >
              Googleでログイン
            </button>
          </div>
          <div className="login-switch">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? 'ログインに切り替え' : 'サインアップに切り替え'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage