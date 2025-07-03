import { test, expect } from '@playwright/test';

test.describe('スモークテスト', () => {
  test('アプリが正常に起動する', async ({ page }) => {
    await page.goto('/');
    
    // ページタイトルをチェック
    await expect(page).toHaveTitle(/Memo Todo/);
    
    // ページが読み込まれることを確認
    await expect(page.locator('body')).toBeVisible();
    
    // React appがマウントされることを確認
    await expect(page.locator('#root')).toBeVisible();
  });

  test('基本的なナビゲーション', async ({ page }) => {
    await page.goto('/');
    
    // ページが応答することを確認
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });
});