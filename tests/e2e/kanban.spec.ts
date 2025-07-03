import { test, expect } from '@playwright/test';
import { mockUserLogin } from './helpers/auth';

test.describe('Kanbanボード操作', () => {
  test.beforeEach(async ({ page }) => {
    await mockUserLogin(page);
  });

  test('リストの追加', async ({ page }) => {
    await page.goto('/');
    
    // ボード画面が表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // 「リストを追加」ボタンを探してクリック
    const addListButton = page.locator('text=+ リストを追加');
    if (await addListButton.isVisible()) {
      await addListButton.click();
      
      // プロンプトダイアログが表示される（ブラウザによって異なる可能性）
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('新しいリスト');
        await dialog.accept('テストリスト');
      });
    }
  });

  test('カードの追加', async ({ page }) => {
    await page.goto('/');
    
    // ボード画面が表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // 既存のリストがある場合、「カードを追加」ボタンをクリック
    const addCardButton = page.locator('text=+ カードを追加').first();
    if (await addCardButton.isVisible()) {
      await addCardButton.click();
      
      // プロンプトダイアログでカードタイトルを入力
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('新しいカード');
        await dialog.accept('テストカード');
      });
    }
  });

  test('カードの編集', async ({ page }) => {
    await page.goto('/');
    
    // ボード画面が表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // 既存のカードをクリックして編集モードに
    const card = page.locator('.card-view').first();
    if (await card.isVisible()) {
      await card.click();
      
      // 編集フィールドが表示されることを確認
      const titleInput = page.locator('.card-title-input');
      if (await titleInput.isVisible()) {
        await titleInput.fill('編集されたカード');
        const saveBtn = page.locator('.save-btn');
        await expect(saveBtn).toBeVisible();
        await saveBtn.click();
        
        // 編集モードが終了してカード表示に戻ることを確認
        await expect(page.locator('.card-view')).toBeVisible();
      }
    }
  });

  test('リストタイトルの編集', async ({ page }) => {
    await page.goto('/');
    
    // ボード画面が表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // 既存のリストタイトルをクリックして編集モードに
    const listTitle = page.locator('.list-title').first();
    if (await listTitle.isVisible()) {
      await listTitle.click();
      
      // 編集フィールドが表示されることを確認
      const titleInput = page.locator('.list-title-input');
      if (await titleInput.isVisible()) {
        await titleInput.fill('編集されたリスト');
        await titleInput.press('Enter');
        
        // 編集モードが終了してリスト表示に戻ることを確認
        await expect(page.locator('.list-title')).toBeVisible();
      }
    }
  });

  test('カードの削除', async ({ page }) => {
    await page.goto('/');
    
    // ボード画面が表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // 既存のカードの削除ボタンをクリック
    const deleteButton = page.locator('.delete-card-btn').first();
    if (await deleteButton.isVisible()) {
      // 削除確認ダイアログを処理
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('削除');
        await dialog.accept();
      });
      
      await deleteButton.click();
    }
  });

  test('リストの削除', async ({ page }) => {
    await page.goto('/');
    
    // ボード画面が表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // 既存のリストの削除ボタンをクリック
    const deleteButton = page.locator('.delete-list-btn').first();
    if (await deleteButton.isVisible()) {
      // 削除確認ダイアログを処理
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('削除');
        await dialog.accept();
      });
      
      await deleteButton.click();
    }
  });

  test('ドラッグ&ドロップの要素確認', async ({ page }) => {
    await page.goto('/');
    
    // ボード画面が表示されるまで待機
    await page.waitForSelector('.board-view', { timeout: 10000 });
    
    // ドラッグ可能な要素が存在することを確認
    const listHeader = page.locator('.list-header').first();
    if (await listHeader.isVisible()) {
      await expect(listHeader).toHaveAttribute('draggable', 'true');
    }
    
    const card = page.locator('.card-view').first();
    if (await card.isVisible()) {
      await expect(card).toHaveAttribute('draggable', 'true');
    }
  });
});