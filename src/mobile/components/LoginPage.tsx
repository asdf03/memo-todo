import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const LoginPage: React.FC = () => {
  const { signInWithOAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOAuthLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithOAuth()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="app-logo">M</div>
          <h1>Memo TODO</h1>
          <p>タスクを整理して、効率的に管理しましょう</p>
        </div>
        
        <div className="login-form">
          <button 
            className="oauth-login-btn"
            onClick={handleOAuthLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#6366f1"/>
              <path d="M12 6c-3.31 0-6 2.69-6 6h2c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4v2c3.31 0 6-2.69 6-6s-2.69-6-6-6z" fill="#8b5cf6"/>
            </svg>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        
        <div className="login-footer">
          <p>ログインすることで、データがクラウドに保存され、どのデバイスからでもアクセスできます</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage