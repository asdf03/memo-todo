export interface Card {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  colorIndex?: number;
  list_id?: string;
  position?: number;
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
  colorIndex?: number;
  board_id?: string;
  position?: number;
}

export interface Board {
  id: string;
  title: string;
  lists: List[];
  user_id?: string;
}

// Supabase database types
export interface DBCard {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DBList {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DBBoard {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}