import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'

const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
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
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28z"/>
              <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42c.68-2.05 2.62-3.3 4.48-2.7z"/>
            </svg>
            {loading ? 'ログイン中...' : 'Googleでログイン'}
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