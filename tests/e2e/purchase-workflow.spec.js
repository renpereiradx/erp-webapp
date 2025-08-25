import { test, expect } from '@playwright/test';

test.describe('Purchase Workflow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Bypass authentication if needed
    await page.getByTestId('auth-bypass-button')?.click();
    
    // Navigate to purchases page
    await page.getByRole('link', { name: /purchases/i }).click();
    await expect(page).toHaveURL(/purchases/);
  });

  test('should create a new purchase order successfully', async ({ page }) => {
    // Open create modal
    await page.getByRole('button', { name: /create.*purchase/i }).click();
    
    // Verify modal is open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Create Purchase Order')).toBeVisible();

    // Fill purchase form
    await page.getByLabel(/supplier/i).selectOption('Supplier 1');
    await page.getByLabel(/delivery date/i).fill('2025-08-30');
    await page.getByLabel(/notes/i).fill('E2E test purchase order');

    // Add product
    await page.getByRole('button', { name: /add product/i }).click();
    await page.getByLabel(/product/i).first().selectOption('Product 1');
    await page.getByLabel(/quantity/i).first().fill('5');

    // Verify total calculation
    await expect(page.getByText(/total.*500/i)).toBeVisible();

    // Submit form
    await page.getByRole('button', { name: /create/i }).click();

    // Verify success
    await expect(page.getByText(/purchase.*created.*successfully/i)).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Verify purchase appears in list
    await expect(page.getByText('Supplier 1')).toBeVisible();
    await expect(page.getByText('$500.00')).toBeVisible();
  });

  test('should edit an existing purchase order', async ({ page }) => {
    // Assume there's an existing purchase
    await page.getByTestId('purchase-card').first().getByRole('button', { name: /edit/i }).click();

    // Verify edit modal is open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Edit Purchase Order')).toBeVisible();

    // Modify the notes
    await page.getByLabel(/notes/i).fill('Updated E2E test purchase order');

    // Save changes
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success
    await expect(page.getByText(/purchase.*updated.*successfully/i)).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should cancel a purchase order', async ({ page }) => {
    // Click cancel button on first purchase
    await page.getByTestId('purchase-card').first().getByRole('button', { name: /cancel/i }).click();

    // Confirm cancellation in modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/cancel.*purchase/i)).toBeVisible();
    
    await page.getByRole('button', { name: /confirm.*cancel/i }).click();

    // Verify cancellation
    await expect(page.getByText(/purchase.*cancelled.*successfully/i)).toBeVisible();
    await expect(page.getByText('Cancelled')).toBeVisible();
  });

  test('should filter purchases by supplier', async ({ page }) => {
    // Open filters
    await page.getByRole('button', { name: /filters/i }).click();

    // Select supplier filter
    await page.getByLabel(/supplier/i).selectOption('Supplier 1');
    
    // Apply filters
    await page.getByRole('button', { name: /apply.*filters/i }).click();

    // Verify filtered results
    const purchaseCards = page.getByTestId('purchase-card');
    await expect(purchaseCards).toHaveCount(1);
    await expect(purchaseCards.first().getByText('Supplier 1')).toBeVisible();
  });

  test('should search purchases', async ({ page }) => {
    // Use search functionality
    await page.getByPlaceholder(/search.*purchases/i).fill('test');
    
    // Wait for debounced search
    await page.waitForTimeout(500);

    // Verify search results
    const purchaseCards = page.getByTestId('purchase-card');
    await expect(purchaseCards).toHaveCount(1);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/purchases', route => {
      route.abort('internetdisconnected');
    });

    // Try to create a purchase
    await page.getByRole('button', { name: /create.*purchase/i }).click();
    await page.getByLabel(/supplier/i).selectOption('Supplier 1');
    await page.getByLabel(/delivery date/i).fill('2025-08-30');
    await page.getByRole('button', { name: /create/i }).click();

    // Verify error handling
    await expect(page.getByText(/network.*error/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('should maintain purchase data during page refresh', async ({ page }) => {
    // Create a purchase
    await page.getByRole('button', { name: /create.*purchase/i }).click();
    await page.getByLabel(/supplier/i).selectOption('Supplier 1');
    await page.getByLabel(/delivery date/i).fill('2025-08-30');
    await page.getByRole('button', { name: /add product/i }).click();
    await page.getByLabel(/product/i).selectOption('Product 1');
    await page.getByLabel(/quantity/i).fill('3');
    await page.getByRole('button', { name: /create/i }).click();

    // Wait for creation to complete
    await expect(page.getByText(/purchase.*created.*successfully/i)).toBeVisible();

    // Refresh page
    await page.reload();

    // Verify purchase is still there
    await expect(page.getByText('Supplier 1')).toBeVisible();
    await expect(page.getByText('$300.00')).toBeVisible();
  });

  test('should export purchases data', async ({ page }) => {
    // Set up download handling
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByRole('button', { name: /export/i }).click();
    await page.getByRole('menuitem', { name: /csv/i }).click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('purchases.csv');
  });

  test('should show metrics and analytics', async ({ page }) => {
    // Open metrics panel
    await page.getByRole('button', { name: /metrics/i }).click();

    // Verify metrics are displayed
    await expect(page.getByText(/total.*purchases/i)).toBeVisible();
    await expect(page.getByText(/total.*value/i)).toBeVisible();
    await expect(page.getByText(/active.*suppliers/i)).toBeVisible();

    // Verify charts are rendered
    await expect(page.getByTestId('purchase-trends-chart')).toBeVisible();
    await expect(page.getByTestId('supplier-performance-chart')).toBeVisible();
  });

  test('should work offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);

    // Verify offline banner appears
    await expect(page.getByText(/offline/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();

    // Try to create a purchase (should be cached)
    await page.getByRole('button', { name: /create.*purchase/i }).click();
    await page.getByLabel(/supplier/i).selectOption('Supplier 1');
    await page.getByLabel(/delivery date/i).fill('2025-08-30');

    // Verify offline mode message
    await expect(page.getByText(/will.*sync.*online/i)).toBeVisible();

    // Go back online
    await page.context().setOffline(false);
    await page.getByRole('button', { name: /retry/i }).click();

    // Verify data syncs
    await expect(page.getByText(/synced.*successfully/i)).toBeVisible();
  });
});

test.describe('Purchase Accessibility E2E', () => {
  test('should be fully keyboard navigable', async ({ page }) => {
    await page.goto('/purchases');

    // Tab through main navigation
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /purchases/i })).toBeFocused();

    // Navigate to create button
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(page.getByRole('button', { name: /create.*purchase/i })).toBeFocused();

    // Open modal with Enter
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/supplier/i)).toBeFocused();

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should work with screen readers', async ({ page }) => {
    await page.goto('/purchases');

    // Check ARIA labels and roles
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('button', { name: /create.*purchase/i })).toHaveAttribute('aria-label');

    // Check live regions for dynamic content
    await page.getByRole('button', { name: /create.*purchase/i }).click();
    await expect(page.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    await expect(page.getByRole('dialog')).toHaveAttribute('aria-describedby');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/purchases');

    // Test with high contrast theme
    await page.getByRole('button', { name: /theme/i }).click();
    await page.getByRole('menuitem', { name: /high.*contrast/i }).click();

    // Verify high contrast styles are applied
    const button = page.getByRole('button', { name: /create.*purchase/i });
    const buttonStyles = await button.evaluate(el => getComputedStyle(el));
    
    // High contrast mode should have strong borders
    expect(parseInt(buttonStyles.borderWidth)).toBeGreaterThan(2);
  });
});
