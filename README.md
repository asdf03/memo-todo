# Memo Todo - タスク管理アプリ

セキュアなタスク管理アプリケーション

## 機能

- ✅ OAuth認証
- ✅ ボード・リスト・カード管理
- ✅ ドラッグ&ドロップ
- ✅ リアルタイム同期
- ✅ セキュリティ対策（Rate Limiting、入力検証、リソース制限）

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **バックエンド**: Supabase
- **テスト**: Jest + Playwright
- **セキュリティ**: 多層防御アーキテクチャ

## ローカル開発環境

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env.local` ファイルを作成：
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 開発サーバーの起動
```bash
npm run dev
```

## デプロイ設定

### Vercel デプロイ

1. **環境変数設定**:
   - `VITE_SUPABASE_URL`: Supabaseプロジェクトの URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase の anon key
   - `VITE_REDIRECT_URL`: (オプション) OAuth リダイレクト URL

2. **Supabase ダッシュボード設定**:
   - Authentication > URL Configuration
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs に以下を追加:
     - `https://your-app.vercel.app/`
     - `https://your-app.vercel.app/**`

3. **Google OAuth設定**:
   - Google Cloud Console で認証済みリダイレクト URI を追加
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

## テスト

### セキュリティテスト
```bash
npm run test:security
```

### E2Eテスト
```bash
npm run test:e2e
```

### 全テスト実行
```bash
npm test
```

## セキュリティ機能

- **Rate Limiting**: ユーザーごと・アクションごとの制限
- **入力検証**: XSS攻撃対策、危険パターン除去
- **リソース制限**: ボード・リスト・カード数制限
- **データベース保護**: RLS ポリシー、トリガー
- **ログ監視**: セキュリティイベントの記録

## ライセンス

MIT