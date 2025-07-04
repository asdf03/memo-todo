-- Database schema for memo-todo application
-- Run this in your Supabase SQL editor

-- Enable Row Level Security (RLS)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'マイボード',
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boards
CREATE POLICY "Users can view their own boards" ON boards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" ON boards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" ON boards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" ON boards
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lists
CREATE POLICY "Users can view lists in their boards" ON lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lists in their boards" ON lists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lists in their boards" ON lists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lists in their boards" ON lists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- RLS Policies for cards
CREATE POLICY "Users can view cards in their lists" ON cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      JOIN boards ON lists.board_id = boards.id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create cards in their lists" ON cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists 
      JOIN boards ON lists.board_id = boards.id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cards in their lists" ON cards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lists 
      JOIN boards ON lists.board_id = boards.id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cards in their lists" ON cards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lists 
      JOIN boards ON lists.board_id = boards.id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(position);
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(position);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();