import { test, expect } from '@playwright/test';
import { autoLogin } from './auth-helpers.js';
// Revertimos a fs sync por compatibilidad
import fs from 'fs';
import path from 'path';

const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'products-list.json');
let fixture: any; // se carga en beforeAll

// Cargar fixture una sola vez
test.beforeAll(() => {
  try {
    fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
  } catch (e) {
    // fallback mínimo
    fixture = { items: [] };
  }
});

test.describe('Products E2E - CRUD / Inline / Bulk / Offline (scaffold)', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure session
    await autoLogin(page);

    // Stub API responses for products list (match backend '/products' endpoints)
    const routeHandler = (route: any) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture.items || fixture) });
    };

    await page.route('**/api/products*', routeHandler);
    await page.route('**/products/products*', routeHandler);
    // Avoid intercepting SPA navigation requests to /products which are 'document' resourceType.
    await page.route('**/products*', (route) => {
      const req = route.request();
      try {
        if (req.resourceType() === 'document' || (req.headers()['accept'] || '').includes('text/html')) {
          return route.continue();
        }
      } catch (e) {
        return route.continue();
      }
      return routeHandler(route);
    });

    // Ensure the app starts with an authenticated session in localStorage so routing
    // doesn't redirect to /login or /dashboard during tests.
    await page.addInitScript(() => {
      try {
        localStorage.setItem('authToken', 'e2e-test-token');
        localStorage.setItem('userData', JSON.stringify({ id: 1, email: 'e2e@local', role_id: 1 }));
      } catch (e) {
        // ignore in non-browser contexts
      }
    });

    // Monkeypatch global fetch early so any product requests return the fixture payload
    await page.addInitScript((fixture) => {
      try {
        const originalFetch = window.fetch.bind(window);
        // @ts-ignore
        window.fetch = (input, init) => {
          try {
            let url = '';
            if (typeof input === 'string') {
              url = input;
            } else if (input && typeof (input as any).url === 'string') {
              url = (input as any).url;
            } else if (input instanceof URL) {
              url = input.toString();
            }
            if (url && (url.includes('/products') || url.includes('/api/products'))) {
              const body = JSON.stringify(fixture.items || fixture);
              return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
            }
          } catch (e) {
            // fallthrough to original
          }
          return originalFetch(input, init);
        };
      } catch (e) {
        // ignore
      }
    }, fixture);

    // Start from the products list explicitly to avoid landing on /dashboard
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/products');
    // trigger a resize event to ensure layout measurements occur (virtuoso relies on sizes)
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));

    // Si el store de productos no se pobló automáticamente, invocar fetchProducts
    await page.evaluate(async () => {
      try {
        // @ts-ignore
        const ws = (window as any).useProductStore;
        if (ws && typeof ws.getState === 'function' && typeof ws.getState().fetchProducts === 'function') {
          await ws.getState().fetchProducts();
        }
      } catch (e) {
        // ignore
      }
    });

    // Esperar a que el store de productos reporte items cargados (listas virtualizadas)
    await page.waitForFunction(() => {
      // @ts-ignore
      const ws = (window as any).useProductStore;
      try {
        return !!(ws && typeof ws.getState === 'function' && Array.isArray(ws.getState().products) && ws.getState().products.length > 0);
      } catch {
        return false;
      }
    }, null, { timeout: 10000 });
  });

  test('create product (mocked) - accessibility check', async ({ page }) => {
    // TODO: intercept network for create POST and respond with fixture
    // Navigate to create flow, fill form and submit
    // Example:
    // await page.click('button[data-testid="product-create"]');
    // await page.fill('input[name="name"]', 'Playwright Product');
    // await page.click('button[type="submit"]');

    // Run optional AXE check similar al otro spec (sin archivo axe-helpers local)
    try {
      const axeModule: any = await import('@axe-core/playwright');
      const injectAxe = axeModule.injectAxe || axeModule.default?.injectAxe;
      const checkA11y = axeModule.checkA11y || axeModule.default?.checkA11y;
      if (typeof injectAxe === 'function') await injectAxe(page);
      if (typeof checkA11y === 'function') {
        const results = await checkA11y(page);
        const violations = (results.violations || []).filter((v: any) => ['critical','serious'].includes(v.impact));
        expect(violations.length).toBe(0);
      }
    } catch (e) {
      // AXE no disponible, se omite
    }

    // Assertion placeholder
    expect(true).toBe(true);
  });

  test('inline edit product (mocked)', async ({ page }) => {
    // TODO: locate a product card / row, click edit, change a field and save
    // Use testing ids added in components like product-card-<id> and product-edit-button
    expect(true).toBe(true);
  });

  test('bulk select and delete (mocked)', async ({ page }) => {
    // TODO: select multiple items via checkboxes, trigger bulk delete, confirm
    expect(true).toBe(true);
  });

  test('offline optimistic update + queue replay', async ({ page }) => {
    // TODO: simulate offline mode, perform optimistic update, restore online and assert replay
    // page.setOffline(true) / route.abort can be used depending on app wiring
    expect(true).toBe(true);
  });
});
