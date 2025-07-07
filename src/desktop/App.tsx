import React, { useState, useEffect, useCallback } from 'react'
import { Board } from '../shared/types'
import BoardView from './components/BoardView'
import BoardTitle from './components/BoardTitle'
import LoginPage from './components/LoginPage'
import { AuthProvider, useAuth } from '../shared/contexts/AuthContext'
import { BoardProvider } from '../shared/contexts/BoardContext'
import { BoardAPI } from '../shared/lib/boardApi'

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth()
  const [board, setBoard] = useState<Board | null>(null)
  const [boardLoading, setBoardLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const loadBoard = useCallback(async () => {
    if (!user) return
    
    try {
      setBoardLoading(true)
      setError(null)
      let userBoard = await BoardAPI.getUserBoard(user.id)
      
      if (!userBoard) {
        try {
          await BoardAPI.createBoard(user.id)
          userBoard = await BoardAPI.getUserBoard(user.id)
        } catch (createError) {
          throw new Error(`新規ボードの作成に失敗しました: ${createError instanceof Error ? createError.message : String(createError)}`)
        }
      }
      
      setBoard(userBoard)
    } catch (err) {
      setError(`ボードの読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBoardLoading(false)
    }
  }, [user?.id])

  const refreshBoard = useCallback(async () => {
    if (!user) return
    
    try {
      const userBoard = await BoardAPI.getUserBoard(user.id)
      setBoard(userBoard)
    } catch (err) {
      setError('ボードの再読み込みに失敗しました')
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadBoard()
    } else {
      setBoard(null)
      setBoardLoading(false)
    }
  }, [user?.id])

  if (loading || boardLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner" aria-label="読み込み中"></div>
          <div className="loading-text">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-title">エラーが発生しました</div>
          <div className="error-message">{error}</div>
          <button className="btn btn--primary" onClick={loadBoard}>再試行</button>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="app">
        <div className="error-container">
          <div className="error-icon">📋</div>
          <div className="error-title">ボードが見つかりません</div>
          <div className="error-message">新しいボードを作成して始めましょう</div>
          <button 
            className="btn btn--primary"
            onClick={async () => {
              if (user) {
                try {
                  await BoardAPI.createBoard(user.id)
                  await loadBoard()
                } catch (error) {
                  console.error('ボード作成エラー:', error)
                }
              }
            }}
          >
            新しいボードを作成
          </button>
        </div>
      </div>
    )
  }

  return (
    <BoardProvider board={board} onUpdateBoard={setBoard} onRefresh={refreshBoard}>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="app-logo">📝</div>
                <BoardTitle />
              </div>
              <div className="flex items-center gap-2">
                <div className="user-info">
                  <img 
                    src={user.user_metadata?.avatar_url} 
                    alt={user.user_metadata?.full_name || 'ユーザー'}
                    className="user-avatar"
                  />
                  <span className="user-name">{user.user_metadata?.full_name}</span>
                </div>
                <button 
                  className="btn btn--ghost btn--icon focus-ring" 
                  onClick={refreshBoard}
                  aria-label="ボードを更新"
                  title="ボードを更新"
                >
                  🔄
                </button>
                <button 
                  className="btn btn--ghost btn--icon focus-ring"
                  aria-label="設定を開く"
                  title="設定"
                >
                  ⚙️
                </button>
                <button 
                  className="btn btn--ghost btn--icon focus-ring"
                  aria-label="ヘルプを表示"
                  title="ヘルプ"
                >
                  ❓
                </button>
                <button 
                  className="btn btn--ghost btn--icon focus-ring" 
                  onClick={handleSignOut}
                  aria-label="ログアウト"
                  title="ログアウト"
                >
                  🚪
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="app-main">
          <div className="container">
            <div className="board-container">
              <BoardView />
            </div>
          </div>
        </main>
      </div>
    </BoardProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App