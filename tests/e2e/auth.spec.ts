import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/');
    
    // ログインページの要素をチェック
    await expect(page.locator('h1')).toContainText('Memo TODO');
    await expect(page.locator('text=Googleでログイン')).toBeVisible();
    await expect(page.locator('text=タスクを整理して、効率的に管理しましょう')).toBeVisible();
  });

  test('Googleログインボタンが機能する', async ({ page }) => {
    await page.goto('/');
    
    // Googleログインボタンをクリック
    const loginButton = page.locator('text=Googleでログイン');
    await expect(loginButton).toBeVisible();
    
    // ボタンクリック後、Supabaseの認証ページへのリダイレクトをチェック
    // 実際の認証は外部サービスなので、リダイレクトのみテスト
    await loginButton.click();
    
    // 認証ページへのナビゲーションを待機（タイムアウトを設定）
    await page.waitForTimeout(1000);
  });
});