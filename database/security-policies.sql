-- Supabase Database セキュリティ強化設定
-- 実行前に既存のポリシーを確認してください

-- 1. 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uudi-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 制限関数の作成
CREATE OR REPLACE FUNCTION count_user_boards(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM boards WHERE boards.user_id = count_user_boards.user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_board_lists(board_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM lists WHERE lists.board_id = count_board_lists.board_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_list_cards(list_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM cards WHERE cards.list_id = count_list_cards.list_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_user_total_cards(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(c.*)
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.user_id = count_user_total_cards.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. データサイズ計算関数
CREATE OR REPLACE FUNCTION calculate_user_storage(user_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(
      octet_length(COALESCE(c.title, '')) + 
      octet_length(COALESCE(c.description, ''))
    ), 0)
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.user_id = calculate_user_storage.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 制限チェック関数
CREATE OR REPLACE FUNCTION check_board_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF count_user_boards(NEW.user_id) >= 10 THEN
    RAISE EXCEPTION 'ボード数の上限（10個）に達しています';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_list_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF count_board_lists(NEW.board_id) >= 20 THEN
    RAISE EXCEPTION '1ボードあたりのリスト数の上限（20個）に達しています';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_card_limit()
RETURNS TRIGGER AS $$
DECLARE
  board_user_id UUID;
BEGIN
  -- リストからボードのuser_idを取得
  SELECT b.user_id INTO board_user_id 
  FROM boards b 
  JOIN lists l ON b.id = l.board_id 
  WHERE l.id = NEW.list_id;
  
  IF count_list_cards(NEW.list_id) >= 100 THEN
    RAISE EXCEPTION '1リストあたりのカード数の上限（100個）に達しています';
  END IF;
  
  IF count_user_total_cards(board_user_id) >= 1000 THEN
    RAISE EXCEPTION '総カード数の上限（1000個）に達しています';
  END IF;
  
  IF calculate_user_storage(board_user_id) >= 10485760 THEN -- 10MB
    RAISE EXCEPTION 'ストレージ容量の上限（10MB）に達しています';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. データサイズチェック関数
CREATE OR REPLACE FUNCTION check_card_size()
RETURNS TRIGGER AS $$
BEGIN
  IF octet_length(COALESCE(NEW.title, '')) + octet_length(COALESCE(NEW.description, '')) > 1048576 THEN -- 1MB
    RAISE EXCEPTION 'カードのデータサイズが大きすぎます（上限: 1MB）';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. トリガーの作成
-- ボード制限トリガー
DROP TRIGGER IF EXISTS trigger_check_board_limit ON boards;
CREATE TRIGGER trigger_check_board_limit
  BEFORE INSERT ON boards
  FOR EACH ROW
  EXECUTE FUNCTION check_board_limit();

-- リスト制限トリガー
DROP TRIGGER IF EXISTS trigger_check_list_limit ON lists;
CREATE TRIGGER trigger_check_list_limit
  BEFORE INSERT ON lists
  FOR EACH ROW
  EXECUTE FUNCTION check_list_limit();

-- カード制限トリガー
DROP TRIGGER IF EXISTS trigger_check_card_limit ON cards;
CREATE TRIGGER trigger_check_card_limit
  BEFORE INSERT ON cards
  FOR EACH ROW
  EXECUTE FUNCTION check_card_limit();

-- カードサイズチェックトリガー
DROP TRIGGER IF EXISTS trigger_check_card_size ON cards;
CREATE TRIGGER trigger_check_card_size
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION check_card_size();

-- 7. インデックスの最適化
CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(position);
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(position);

-- 8. 既存RLSポリシーの強化（より厳密に）
-- ボードのRLS強化
DROP POLICY IF EXISTS "Users can view their own boards" ON boards;
CREATE POLICY "Users can view their own boards" ON boards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own boards" ON boards;
CREATE POLICY "Users can create their own boards" ON boards
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    count_user_boards(auth.uid()) < 10
  );

DROP POLICY IF EXISTS "Users can update their own boards" ON boards;
CREATE POLICY "Users can update their own boards" ON boards
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own boards" ON boards;
CREATE POLICY "Users can delete their own boards" ON boards
  FOR DELETE USING (auth.uid() = user_id);

-- リストのRLS強化
DROP POLICY IF EXISTS "Users can view lists in their boards" ON lists;
CREATE POLICY "Users can view lists in their boards" ON lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create lists in their boards" ON lists;
CREATE POLICY "Users can create lists in their boards" ON lists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = lists.board_id 
      AND boards.user_id = auth.uid()
    ) AND
    count_board_lists(board_id) < 20
  );

-- カードのRLS強化
DROP POLICY IF EXISTS "Users can view cards in their lists" ON cards;
CREATE POLICY "Users can view cards in their lists" ON cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists 
      JOIN boards ON lists.board_id = boards.id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create cards in their lists" ON cards;
CREATE POLICY "Users can create cards in their lists" ON cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists 
      JOIN boards ON lists.board_id = boards.id
      WHERE lists.id = cards.list_id 
      AND boards.user_id = auth.uid()
    ) AND
    count_list_cards(list_id) < 100
  );

-- 9. セキュリティ関数の権限設定
REVOKE ALL ON FUNCTION count_user_boards(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION count_board_lists(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION count_list_cards(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION count_user_total_cards(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION calculate_user_storage(UUID) FROM PUBLIC;

-- authenticated roleのみ実行可能
GRANT EXECUTE ON FUNCTION count_user_boards(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_board_lists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_list_cards(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION count_user_total_cards(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_storage(UUID) TO authenticated;

-- 10. ログ関数（監査用）
CREATE OR REPLACE FUNCTION log_suspicious_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- 大量作成の検知（1分間に10個以上のカード作成）
  IF (
    SELECT COUNT(*) 
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.user_id = (
      SELECT boards.user_id 
      FROM boards 
      JOIN lists ON boards.id = lists.board_id 
      WHERE lists.id = NEW.list_id
    )
    AND c.created_at > NOW() - INTERVAL '1 minute'
  ) > 10 THEN
    RAISE LOG 'Suspicious activity: Rapid card creation by user %', 
      (SELECT boards.user_id FROM boards JOIN lists ON boards.id = lists.board_id WHERE lists.id = NEW.list_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 監査トリガー
DROP TRIGGER IF EXISTS trigger_log_suspicious_activity ON cards;
CREATE TRIGGER trigger_log_suspicious_activity
  AFTER INSERT ON cards
  FOR EACH ROW
  EXECUTE FUNCTION log_suspicious_activity();