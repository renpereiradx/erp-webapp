import { test, expect } from '@playwright/test';
import { autoLogin } from './auth-helpers';

async function stubAuthEndpoints(page) {
  const payload = {
    token: 'e2e-test-token',
    user: { id: 1, email: 'e2e@local', role_id: 1 },
  };

  const handler = route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });

  await page.route('**/api/login*', handler);
  await page.route('**/api/auth/me*', handler);
  await page.route('**/auth/me*', handler);
  await page.route('**/login*', handler);
}

test.describe('Purchase payments register modal', () => {
  test.beforeEach(async ({ page }) => {
    await autoLogin(page);
    await stubAuthEndpoints(page);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('opens from list CTA after selecting a pending order', async ({ page }) => {
    await page.goto('/pagos/compras-mvp', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/pagos/compras-mvp');

    const firstPendingRow = page.locator('[data-order-id="PO-2025-0101"]');
    await firstPendingRow.waitFor({ state: 'visible', timeout: 15000 });

    await firstPendingRow.click();
    await expect(firstPendingRow).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('button', { name: /Registrar pago/i }).click();

    const modal = page.locator('.purchase-payments-mvp-register');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('PO-2025-0101');
  });

  test('opens from detail CTA when order has pending amount', async ({ page }) => {
    await page.goto('/pagos/compras-mvp/PO-2025-0101', {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForURL('**/pagos/compras-mvp/PO-2025-0101');

    await page.getByRole('button', { name: /Registrar nuevo pago/i }).click();

    const modal = page.locator('.purchase-payments-mvp-register');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('PO-2025-0101');
  });
});
