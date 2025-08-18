import { Page } from '@playwright/test';

export async function autoLogin(page: Page) {
  const payload = JSON.stringify({
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.mock',
    user: { id: '1', username: 'e2e', email: 'e2e@local.test', role: 'admin', role_id: 'JZkiQB', name: 'E2E Tester' }
  });

  await page.addInitScript((data) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      // Use the same localStorage keys the app expects
      localStorage.setItem('authToken', parsed.token);
      localStorage.setItem('userData', JSON.stringify(parsed.user));
    } catch (e) {
      // ignore
    }
  }, payload);
}
