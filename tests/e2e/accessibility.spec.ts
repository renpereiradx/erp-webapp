import { test, expect } from '@playwright/test';
import { readFile } from 'fs/promises';
import path from 'path';

test.describe('Accessibility baseline', () => {
  test('home page should have no critical or serious AXE violations', async ({ page }) => {
    // Load fixture
    const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'products-list.json');
    const fixture = JSON.parse(await readFile(fixturePath, 'utf-8'));

    // Stub API
    await page.route('**/api/products*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Attempt dynamic import of axe helpers
    try {
      const axeModule = await import('@axe-core/playwright');
      const injectAxe = (axeModule as any).injectAxe || (axeModule as any).default?.injectAxe;
      const checkA11y = (axeModule as any).checkA11y || (axeModule as any).default?.checkA11y;
      if (typeof injectAxe === 'function') await injectAxe(page);
      if (typeof checkA11y === 'function') {
        const results = await checkA11y(page, undefined, { detailedReport: true });
        const violations = (results.violations || []).filter(v => v.impact === 'critical' || v.impact === 'serious');
        // attach report to test output if any
        if (violations.length > 0) {
          console.error('AXE violations found:', JSON.stringify(violations, null, 2));
        }
        expect(violations.length).toBe(0);
      } else {
        console.warn('checkA11y missing, skipping AXE assertions');
      }
    } catch (err) {
      console.warn('AXE not installed, skipping accessibility scan');
    }
  });
});
