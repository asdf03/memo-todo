import { Page } from '@playwright/test';

export async function mockUserLogin(page: Page) {
  // Supabase APIコールをモック
  await page.route('**/auth/v1/**', async route => {
    const url = route.request().url();
    if (url.includes('/session')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer',
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            user_metadata: {
              full_name: 'テストユーザー',
              avatar_url: 'https://via.placeholder.com/40'
            },
            app_metadata: {},
            aud: 'authenticated',
            created_at: '2023-01-01T00:00:00Z',
            role: 'authenticated',
            updated_at: '2023-01-01T00:00:00Z'
          }
        })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    }
  });
  
  // ボードデータのAPIコールをモック
  await page.route('**/rest/v1/boards**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'test-board-123',
          title: 'テストボード',
          user_id: 'test-user-123',
          lists: [
            {
              id: 'list-1',
              title: 'To Do',
              position: 0,
              board_id: 'test-board-123',
              cards: [
                {
                  id: 'card-1',
                  title: 'テストカード',
                  description: 'テスト用のカードです',
                  position: 0,
                  list_id: 'list-1'
                }
              ]
            }
          ]
        }
      ])
    });
  });
  
  await page.route('**/rest/v1/lists**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'list-1',
          title: 'To Do',
          position: 0,
          board_id: 'test-board-123',
          cards: [
            {
              id: 'card-1',
              title: 'テストカード',
              description: 'テスト用のカードです',
              position: 0,
              list_id: 'list-1'
            }
          ]
        }
      ])
    });
  });
  
  await page.route('**/rest/v1/cards**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'card-1',
          title: 'テストカード',
          description: 'テスト用のカードです',
          position: 0,
          list_id: 'list-1'
        }
      ])
    });
  });
  
  // POST, PUT, DELETEリクエストもモック
  await page.route('**/rest/v1/**', async route => {
    if (route.request().method() === 'POST' || route.request().method() === 'PUT' || route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    } else {
      await route.continue();
    }
  });
  
  // Supabaseの認証状態をモック
  await page.addInitScript(() => {
    // モックユーザーデータ
    const mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'テストユーザー',
        avatar_url: 'https://via.placeholder.com/40'
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00Z',
      role: 'authenticated',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    const mockSession = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000, // 1時間後
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    };
    
    // Supabaseクライアントを完全にモック
    const mockSupabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: mockSession }, error: null }),
        getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
        onAuthStateChange: (callback) => {
          // すぐに認証状態を通知
          setTimeout(() => callback('SIGNED_IN', mockSession), 0);
          return {
            data: {
              subscription: {
                unsubscribe: () => {}
              }
            }
          };
        },
        signOut: () => Promise.resolve({ error: null }),
        signInWithOAuth: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null })
      })
    };
    
    // グローバルにSupabaseモックを設定
    (window as any).__supabaseMock = mockSupabase;
    
    // モックボードデータを設定
    (window as any).__mockBoardData = {
      id: 'test-board-123',
      title: 'テストボード',
      user_id: 'test-user-123',
      lists: [
        {
          id: 'list-1',
          title: 'To Do',
          position: 0,
          board_id: 'test-board-123',
          cards: [
            {
              id: 'card-1',
              title: 'テストカード',
              description: 'テスト用のカードです',
              position: 0,
              list_id: 'list-1'
            }
          ]
        }
      ]
    };
  });
}

export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    delete (window as any).__supabaseMock;
    delete (window as any).__mockBoardData;
  });
}