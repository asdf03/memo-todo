import React, { useState, useEffect, useCallback } from 'react'
import { Board } from './types'
import BoardView from './components/shared/BoardView'
import BoardTitle from './components/shared/common/BoardTitle'
import LoginPage from './components/LoginPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { BoardProvider } from './context/BoardContext'
import { BoardAPI } from './lib/boardApi'

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

  // ボードを読み込む
  const loadBoard = useCallback(async () => {
    if (!user) {
      console.log('ユーザーが見つかりません')
      return
    }
    
    console.log('ボード読み込み開始:', user.id)
    
    try {
      setBoardLoading(true)
      setError(null)
      console.log('BoardAPI.getUserBoard呼び出し')
      let userBoard = await BoardAPI.getUserBoard(user.id)
      
      // 新規ユーザーの場合、自動的にボードを作成
      if (!userBoard) {
        console.log('ボードが見つかりません。新しいボードを作成します')
        try {
          await BoardAPI.createBoard(user.id)
          userBoard = await BoardAPI.getUserBoard(user.id)
          console.log('新しいボードを作成しました:', userBoard)
        } catch (createError) {
          console.error('ボード作成に失敗しました:', createError)
          throw new Error(`新規ボードの作成に失敗しました: ${createError instanceof Error ? createError.message : String(createError)}`)
        }
      }
      
      console.log('ボード取得成功:', userBoard)
      setBoard(userBoard)
    } catch (err) {
      console.error('ボード読み込みエラー:', err)
      setError(`ボードの読み込みに失敗しました: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBoardLoading(false)
    }
  }, [user?.id])

  // ボードを再読み込みする
  const refreshBoard = useCallback(async () => {
    if (!user) return
    
    try {
      const userBoard = await BoardAPI.getUserBoard(user.id)
      setBoard(userBoard)
    } catch (err) {
      console.error('ボード再読み込みエラー:', err)
      setError('ボードの再読み込みに失敗しました')
    }
  }, [user])

  // ユーザーが変わったらボードを読み込む
  useEffect(() => {
    if (user) {
      loadBoard()
    } else {
      setBoard(null)
      setBoardLoading(false)
    }
  }, [user?.id]) // userの代わりにuser.idを使用


  if (loading || boardLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading-spinner"></div>
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
          <div className="app-header__content">
            <div className="app-header__left">
              <div className="app-logo">📝</div>
              <BoardTitle />
            </div>
            <div className="app-header__right">
              <div className="user-info">
                <img 
                  src={user.user_metadata?.avatar_url} 
                  alt={user.user_metadata?.full_name || 'ユーザー'}
                  className="user-avatar"
                />
                <span className="user-name">{user.user_metadata?.full_name}</span>
              </div>
              <button 
                className="btn btn--ghost btn--icon" 
                onClick={refreshBoard}
                aria-label="更新"
              >
                🔄
              </button>
              <button 
                className="btn btn--ghost btn--icon"
                aria-label="設定"
              >
                ⚙️
              </button>
              <button 
                className="btn btn--ghost btn--icon"
                aria-label="ヘルプ"
              >
                ❓
              </button>
              <button 
                className="btn btn--ghost btn--icon" 
                onClick={handleSignOut}
                aria-label="ログアウト"
              >
                🚪
              </button>
            </div>
          </div>
        </header>
        <main className="app-main">
          <div className="board-container">
            <BoardView />
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