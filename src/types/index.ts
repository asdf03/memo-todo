export interface Card {
  id: string
  title: string
  description?: string
  list_id: string
  order: number
  created_at?: string
  updated_at?: string
}

export interface List {
  id: string
  title: string
  cards: Card[]
  board_id?: string
  order: number
  position?: number
  created_at?: string
  updated_at?: string
}

export interface Board {
  id: string
  title: string
  lists: List[]
  user_id: string
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithOAuth: (provider?: 'google' | 'github') => Promise<void>
}

export interface BoardContextType {
  board: Board
  onUpdateBoard: (board: Board) => void
  onRefresh: () => Promise<void>
}