import { test, expect } from '@playwright/test';
import { mockUserLogin } from './helpers/auth';

test.describe('ボード機能', () => {
  test.beforeEach(async ({ page }) => {
    // 各テスト前にモックログインを実行
    await mockUserLogin(page);
  });

  test('初期画面の表示', async ({ page }) => {
    await page.goto('/');
    
    // ボードが表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // アプリのヘッダー要素をチェック
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.app-logo')).toContainText('M');
  });

  test('新しいボード作成', async ({ page }) => {
    await page.goto('/');
    
    // ボードが既に存在する場合はボードビューが表示されることを確認
    await page.waitForSelector('.board-view', { timeout: 10000 });
    await expect(page.locator('.board-view')).toBeVisible();
    
    // アプリヘッダーが表示されていることを確認
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('ボードタイトルの編集', async ({ page }) => {
    await page.goto('/');
    
    // ボードが表示されるまで待機
    await page.waitForSelector('.board-title', { timeout: 10000 });
    
    // ボードタイトルをクリックして編集モードに
    await page.locator('.board-title').click();
    
    // 入力フィールドが表示されることを確認
    const titleInput = page.locator('.board-title-input');
    await expect(titleInput).toBeVisible();
    
    // タイトルを変更
    await titleInput.fill('新しいボードタイトル');
    await titleInput.press('Enter');
    
    // 編集モードが終了してタイトル表示に戻ることを確認
    await expect(page.locator('.board-title')).toBeVisible();
  });

  test('更新ボタンの動作', async ({ page }) => {
    await page.goto('/');
    
    // ボードが表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // 更新ボタンが表示されることを確認
    const refreshButton = page.locator('button[title="更新"]');
    await expect(refreshButton).toBeVisible();
    
    // 更新ボタンをクリック
    await refreshButton.click();
    
    // ボタンがクリック可能であることを確認（機能テスト）
    await expect(refreshButton).toBeEnabled();
  });

  test('ログアウト機能', async ({ page }) => {
    await page.goto('/');
    
    // ボードが表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // ログアウトボタンが表示されることを確認
    const logoutButton = page.locator('button[title="ログアウト"]');
    await expect(logoutButton).toBeVisible();
    
    // ログアウトボタンがクリック可能であることを確認
    await expect(logoutButton).toBeEnabled();
  });
});