import { test, expect } from '@playwright/test';
import { autoLogin } from './auth-helpers.js';

// Utilidades simples para interceptar suppliers (endpoints reales usan singular /supplier)
// Estado mutable en memoria para simular backend CRUD
interface Supplier { id: string; name: string; status?: boolean; tax_id?: string; created_at?: string; contact_info?: any }

const initialSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Alpha Supplies', status: true, tax_id: 'RUC-1', created_at: new Date().toISOString() },
  { id: 'sup-2', name: 'Beta Traders', status: true, tax_id: 'RUC-2', created_at: new Date().toISOString() }
];

function makeListPayload(list: Supplier[]) {
  return { success: true, data: { data: list, pagination: { current_page: 1, per_page: 10, total_pages: 1, total: list.length } } };
}

// Helper para actualizar fetch en el navegador antes de que cargue la app
async function installFetchMock(page, state: { suppliers: Supplier[] }) {
  await page.addInitScript((state) => {
    try {
      const originalFetch = window.fetch.bind(window);
      // @ts-ignore
      window.fetch = async (input, init) => {
        let url = '';
        if (typeof input === 'string') url = input; else if (input && typeof (input as any).url === 'string') url = (input as any).url; else if (input instanceof URL) url = input.toString();
        const isSupplier = url.includes('/supplier/');
        if (!isSupplier) return originalFetch(input, init);
        const method = (init?.method || 'GET').toUpperCase();
        const bodyObj = (() => { try { return init?.body ? JSON.parse(init.body as string) : {}; } catch { return {}; } })();
        // @ts-ignore
        window.__SUPPLIERS_DB__ = window.__SUPPLIERS_DB__ || [...state.suppliers];
        // @ts-ignore
        const db = window.__SUPPLIERS_DB__;
        const json = (obj: any, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
        const makePayload = (list) => ({ success: true, data: { data: list, pagination: { current_page: 1, per_page: list.length, total_pages: 1, total: list.length } } });
        if (method === 'GET') {
          // Búsqueda: /supplier/name/<term>
            if (url.includes('/supplier/name/')) {
              const term = decodeURIComponent(url.split('/supplier/name/')[1].split(/[/?#]/)[0]).toLowerCase();
              const filtered = db.filter((s: any) => s.name.toLowerCase().includes(term));
              return json(makePayload(filtered));
            }
            // Paginación: /supplier/:page/:limit
            const m = url.match(/\/supplier\/(\d+)\/(\d+)/);
            if (m) {
              const pageNum = parseInt(m[1], 10) || 1;
              const limit = parseInt(m[2], 10) || 10;
              const start = (pageNum - 1) * limit;
              const slice = db.slice(start, start + limit);
              return json({ success: true, data: { data: slice, pagination: { current_page: pageNum, per_page: limit, total_pages: Math.max(1, Math.ceil(db.length / limit)), total: db.length } } });
            }
            // Fallback lista completa
            return json(makePayload(db));
        }
        if (method === 'POST' && url.endsWith('/supplier/')) {
          const id = `sup-${Date.now()}`;
          const created = { id, name: bodyObj.name || 'Nuevo Proveedor', status: true, tax_id: bodyObj.tax_id || 'RUC-X', created_at: new Date().toISOString() };
          db.push(created);
          return json({ success: true, data: { data: created } });
        }
        if (method === 'PUT') {
          if (url.includes('/supplier/delete/')) {
            const id = url.split('/supplier/delete/')[1];
            const idx = db.findIndex((s: any) => s.id === id);
            if (idx >= 0) db.splice(idx, 1);
            return json({ success: true, data: true });
          }
          const parts = url.split('/supplier/');
          const maybeId = parts[1]?.split(/[/?#]/)[0];
          if (maybeId && maybeId.startsWith('sup-')) {
            const idx = db.findIndex((s: any) => s.id === maybeId);
            if (idx >= 0) {
              db[idx] = { ...db[idx], ...bodyObj };
              return json({ success: true, data: { data: db[idx] } });
            }
            return json({ success: false, error: 'Not found' }, 404);
          }
        }
        return originalFetch(input, init);
      };
    } catch (e) { /* ignore */ }
  }, { suppliers: state.suppliers });
}

// Helper diagnóstico: capturar logs de consola/errores
async function attachLogging(page) {
  const logs = [];
  page.on('console', msg => {
    logs.push(`[console.${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    logs.push(`[pageerror] ${err.message}`);
  });
  // Exponer para inspección manual si se desea
  // @ts-ignore
  page.__getLogs = () => logs;
  return () => logs;
}

test.describe('Suppliers E2E CRUD (mocked backend)', () => {
  test.beforeEach(async ({ page }) => {
    // Adjuntar logging antes de cualquier navegación
    const getLogs = await attachLogging(page);
    // Mover autoLogin ANTES de montar la app para que ProtectedRoute lea credenciales al inicializar
    await autoLogin(page);
    await installFetchMock(page, { suppliers: initialSuppliers });
    await page.goto('/');
    // Navegar al módulo Proveedores usando el testid confiable
    const navBtn = await page.getByTestId('nav-proveedores');
    await navBtn.click();
    const currentUrl = page.url();
    // Log inmediato de URL
    console.log('[E2E][DEBUG] URL tras click nav-proveedores:', currentUrl);
    // Afirmar que no redirigió a /login
    expect(currentUrl.includes('/login')).toBeFalsy();
    // Esperar página de proveedores
    await page.waitForSelector('[data-testid="suppliers-page"]', { timeout: 10000 }).catch(async (e) => {
      // Dump de logs si falla para diagnóstico y relanzar
      console.log('[E2E][DEBUG] Logs capturados antes de fallo wait suppliers-page:\n' + getLogs().join('\n'));
      console.log('[E2E][DEBUG] URL final en fallo:', page.url());
      throw e;
    });
    // NEW: wait for store suppliers to populate (more robust than DOM wait alone)
    await page.waitForFunction(() => {
      // @ts-ignore
      const st = window.useSupplierStore?.getState?.();
      return !!(st && Array.isArray(st.suppliers) && st.suppliers.length > 0);
    }, { timeout: 8000 }).catch(async (e) => {
      console.log('[E2E][DEBUG] Store snapshot when waiting for suppliers:', await page.evaluate(() => {
        // @ts-ignore
        const st = window.useSupplierStore?.getState?.();
        return st ? { len: st.suppliers?.length, keys: Object.keys(st || {}) } : null;
      }));
      throw e;
    });
    // Forzar carga si todavía no pobló (fallback)
    await page.evaluate(async () => {
      // @ts-ignore
      const store = window.useSupplierStore;
      if (store?.getState) {
        const st = store.getState();
        if (!st.suppliers || st.suppliers.length === 0) {
          await st.loadPage(1, 10, '');
        }
      }
    });
    // Esperar cards en DOM (permitir que React pinte tras estado listo)
    await page.waitForSelector('[data-testid^="supplier-card-"]', { timeout: 10000 }).catch(async (e) => {
      console.log('[E2E][DEBUG] HTML body length (chars):', (await page.content()).length);
      console.log('[E2E][DEBUG] Store suppliers detail:', await page.evaluate(() => {
        // @ts-ignore
        const st = window.useSupplierStore?.getState?.();
        return st ? st.suppliers : null;
      }));
      throw e;
    });
  });

  test('list shows initial suppliers', async ({ page }) => {
    const cards = await page.locator('[data-testid^="supplier-card-"]').all();
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  test('create supplier flow (modal)', async ({ page }) => {
    await page.getByTestId('suppliers-create-btn').click();
    await page.waitForSelector('[data-testid="supplier-modal"]');
    const nameInput = page.getByTestId('supplier-name-input');
    await nameInput.fill('Proveedor Playwright');
    await page.getByTestId('supplier-modal-submit').click();
    await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-testid^="supplier-card-"]')).some(c => c.textContent?.includes('Proveedor Playwright')));
  });

  test('edit supplier (rename first)', async ({ page }) => {
    const firstEditBtn = page.locator('[data-testid^="supplier-edit-"]').first();
    await firstEditBtn.click();
    await page.waitForSelector('[data-testid="supplier-modal"]');
    const nameInput = page.getByTestId('supplier-name-input');
    await nameInput.fill('Proveedor Editado');
    let responseCaptured = null;
    try {
      const [resp] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/supplier/') && ['PUT','POST'].includes(r.request().method()), { timeout: 5000 }),
        page.getByTestId('supplier-modal-submit').click()
      ]);
      responseCaptured = resp;
    } catch (_) {
      // fallback: still click without failing test prematurely
      await page.getByTestId('supplier-modal-submit').click({ trial: true }).catch(()=>{});
    }
    if (responseCaptured) expect(responseCaptured.ok()).toBeTruthy();
    // Esperar re-render natural (sin mutación manual del store)
    await page.waitForFunction(() => Array.from(document.querySelectorAll('[data-testid^="supplier-card-"]')).some(n => /Proveedor Editado/.test(n.textContent || '')), { timeout: 8000 });
  });

  test('delete supplier (first)', async ({ page }) => {
    const firstCardId = await page.locator('[data-testid^="supplier-card-"]').first().getAttribute('data-testid');
    const firstDelete = page.locator('[data-testid^="supplier-delete-"]').first();
    await firstDelete.click();
    await page.waitForSelector('[data-testid="delete-supplier-modal"]');
    await page.getByTestId('delete-supplier-confirm').click();
    await page.waitForFunction((id) => !document.querySelector(`[data-testid='${id}']`), firstCardId!, { timeout: 7000 });
  });

  test('search and stale badge logic (triggered)', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/NOMBRE O CONTACTO/i);
    await searchInput.fill('Alpha');
    const searchBtn = page.getByRole('button', { name: /BUSCAR|Buscar/ }).first();
    await searchBtn.click();
    await page.waitForFunction(() => {
      const nodes = Array.from(document.querySelectorAll('[data-testid^="supplier-card-"]'));
      return nodes.length === 1 && /Alpha Supplies/i.test(nodes[0].textContent || '');
    });
    const cardTexts = await page.locator('[data-testid^="supplier-card-"]').allTextContents();
    expect(cardTexts.length).toBe(1);
    expect(cardTexts[0]).toMatch(/Alpha Supplies/);
  });
});
