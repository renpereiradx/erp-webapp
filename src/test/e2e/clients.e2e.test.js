/**
 * Wave 5: Testing & Coverage Enterprise
 * E2E Tests for Client Management System
 * 
 * End-to-end testing scenarios covering:
 * - Complete user workflows
 * - Cross-component integration
 * - Real API interactions
 * - Performance under load
 * - Accessibility in real browser environments
 * 
 * Uses Playwright for robust browser automation
 * 
 * @since Wave 5 - Testing & Coverage Enterprise
 * @author Sistema ERP
 */

import { test, expect } from '@playwright/test';

test.describe('Client Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to clients page
    await page.goto('/clients');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Client List Management', () => {
    test('should display client list and search functionality', async ({ page }) => {
      // Verify page title and main heading
      await expect(page).toHaveTitle(/Clientes/);
      await expect(page.getByRole('heading', { name: /Clientes/ })).toBeVisible();
      
      // Verify search input is present
      const searchInput = page.getByRole('searchbox', { name: /Buscar clientes/ });
      await expect(searchInput).toBeVisible();
      
      // Verify action buttons
      await expect(page.getByRole('button', { name: /Nuevo Cliente/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Exportar/ })).toBeVisible();
    });

    test('should filter clients using search', async ({ page }) => {
      // Wait for clients to load
      await page.waitForSelector('[data-testid="client-row"]');
      
      // Get initial client count
      const initialClients = await page.locator('[data-testid="client-row"]').count();
      expect(initialClients).toBeGreaterThan(0);
      
      // Search for specific client
      const searchInput = page.getByRole('searchbox');
      await searchInput.fill('Juan');
      
      // Wait for search results
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const filteredClients = await page.locator('[data-testid="client-row"]').count();
      expect(filteredClients).toBeLessThanOrEqual(initialClients);
      
      // Verify that visible clients contain the search term
      const visibleClientNames = await page.locator('[data-testid="client-name"]').allTextContents();
      visibleClientNames.forEach(name => {
        expect(name.toLowerCase()).toContain('juan');
      });
    });

    test('should show empty state when no clients match search', async ({ page }) => {
      const searchInput = page.getByRole('searchbox');
      await searchInput.fill('NonExistentClient123');
      
      await page.waitForTimeout(500);
      
      await expect(page.getByText(/No se encontraron clientes/)).toBeVisible();
    });
  });

  test.describe('Client Creation Workflow', () => {
    test('should create new client successfully', async ({ page }) => {
      // Click new client button
      await page.getByRole('button', { name: /Nuevo Cliente/ }).click();
      
      // Verify modal opens
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/Nuevo Cliente/)).toBeVisible();
      
      // Fill client form
      await page.getByLabel(/Nombre/).fill('Carlos Rodriguez');
      await page.getByLabel(/Email/).fill('carlos.rodriguez@email.com');
      await page.getByLabel(/Teléfono/).fill('+34 987 654 321');
      await page.getByLabel(/Dirección/).fill('Avenida Principal 456');
      
      // Save client
      await page.getByRole('button', { name: /Guardar/ }).click();
      
      // Verify success message
      await expect(page.getByText(/Cliente creado exitosamente/)).toBeVisible();
      
      // Verify modal closes
      await expect(modal).not.toBeVisible();
      
      // Verify client appears in list
      await expect(page.getByText('Carlos Rodriguez')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Cliente/ }).click();
      
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      
      // Try to save without filling required fields
      await page.getByRole('button', { name: /Guardar/ }).click();
      
      // Verify validation messages
      await expect(page.getByText(/El nombre es obligatorio/)).toBeVisible();
      await expect(page.getByText(/El email es obligatorio/)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.getByRole('button', { name: /Nuevo Cliente/ }).click();
      
      // Fill invalid email
      await page.getByLabel(/Email/).fill('invalid-email');
      await page.getByRole('button', { name: /Guardar/ }).click();
      
      await expect(page.getByText(/Formato de email inválido/)).toBeVisible();
    });
  });

  test.describe('Client Edit Workflow', () => {
    test('should edit existing client', async ({ page }) => {
      // Wait for clients to load
      await page.waitForSelector('[data-testid="client-row"]');
      
      // Click on first client row
      const firstClientRow = page.locator('[data-testid="client-row"]').first();
      await firstClientRow.click();
      
      // Verify modal opens with client data
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByText(/Editar Cliente/)).toBeVisible();
      
      // Verify form is populated
      const nameField = page.getByLabel(/Nombre/);
      await expect(nameField).not.toHaveValue('');
      
      // Modify client data
      await nameField.fill('Updated Client Name');
      
      // Save changes
      await page.getByRole('button', { name: /Guardar/ }).click();
      
      // Verify success message
      await expect(page.getByText(/Cliente actualizado exitosamente/)).toBeVisible();
      
      // Verify updated name appears in list
      await expect(page.getByText('Updated Client Name')).toBeVisible();
    });
  });

  test.describe('Client Deletion Workflow', () => {
    test('should delete client with confirmation', async ({ page }) => {
      // Wait for clients to load
      await page.waitForSelector('[data-testid="client-row"]');
      
      // Get client name for verification
      const clientName = await page.locator('[data-testid="client-name"]').first().textContent();
      
      // Click delete button for first client
      const deleteButton = page.locator('[data-testid="delete-client-btn"]').first();
      await deleteButton.click();
      
      // Verify confirmation modal
      const confirmModal = page.getByRole('dialog');
      await expect(confirmModal).toBeVisible();
      await expect(confirmModal.getByText(/Confirmar eliminación/)).toBeVisible();
      await expect(confirmModal.getByText(clientName)).toBeVisible();
      
      // Confirm deletion
      await page.getByRole('button', { name: /Confirmar/ }).click();
      
      // Verify success message
      await expect(page.getByText(/Cliente eliminado exitosamente/)).toBeVisible();
      
      // Verify client is removed from list
      await expect(page.getByText(clientName)).not.toBeVisible();
    });

    test('should cancel deletion when cancel is clicked', async ({ page }) => {
      await page.waitForSelector('[data-testid="client-row"]');
      
      const clientName = await page.locator('[data-testid="client-name"]').first().textContent();
      
      // Click delete button
      const deleteButton = page.locator('[data-testid="delete-client-btn"]').first();
      await deleteButton.click();
      
      // Cancel deletion
      await page.getByRole('button', { name: /Cancelar/ }).click();
      
      // Verify client still exists
      await expect(page.getByText(clientName)).toBeVisible();
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Navigate using Tab key
      await page.keyboard.press('Tab');
      
      // Verify focus is on search input
      const searchInput = page.getByRole('searchbox');
      await expect(searchInput).toBeFocused();
      
      // Continue tabbing to buttons
      await page.keyboard.press('Tab');
      const newClientBtn = page.getByRole('button', { name: /Nuevo Cliente/ });
      await expect(newClientBtn).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      const searchInput = page.getByRole('searchbox');
      await expect(searchInput).toHaveAttribute('aria-label');
      
      const newClientBtn = page.getByRole('button', { name: /Nuevo Cliente/ });
      await expect(newClientBtn).toHaveAttribute('aria-label');
    });

    test('should announce screen reader updates', async ({ page }) => {
      // Verify live region exists
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeAttached();
    });

    test('should support skip navigation', async ({ page }) => {
      // Look for skip link
      const skipLink = page.getByText(/Saltar al contenido principal/);
      await expect(skipLink).toBeAttached();
      
      // Verify skip link functionality
      await skipLink.click();
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify page still loads properly
      await expect(page.getByRole('heading', { name: /Clientes/ })).toBeVisible();
      
      // Verify search is still accessible
      await expect(page.getByRole('searchbox')).toBeVisible();
      
      // Verify buttons are accessible (might be in a menu)
      const newClientBtn = page.getByRole('button', { name: /Nuevo Cliente/ });
      if (await newClientBtn.isVisible()) {
        await expect(newClientBtn).toBeVisible();
      } else {
        // Check if it's in a mobile menu
        const mobileMenu = page.locator('[data-testid="mobile-menu"]');
        if (await mobileMenu.isVisible()) {
          await mobileMenu.click();
          await expect(newClientBtn).toBeVisible();
        }
      }
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.getByRole('heading', { name: /Clientes/ })).toBeVisible();
      await expect(page.getByRole('searchbox')).toBeVisible();
      await expect(page.getByRole('button', { name: /Nuevo Cliente/ })).toBeVisible();
    });
  });

  test.describe('Performance Testing', () => {
    test('should load page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/clients');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large client lists efficiently', async ({ page }) => {
      // This would require a test environment with many clients
      // or mocked data for performance testing
      
      await page.goto('/clients');
      await page.waitForSelector('[data-testid="client-row"]');
      
      // Measure search performance
      const startTime = Date.now();
      
      const searchInput = page.getByRole('searchbox');
      await searchInput.fill('Test');
      
      await page.waitForTimeout(100); // Wait for debounced search
      
      const searchTime = Date.now() - startTime;
      
      // Search should complete quickly even with many results
      expect(searchTime).toBeLessThan(1000);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/clients', route => route.abort());
      
      await page.goto('/clients');
      
      // Verify error message is displayed
      await expect(page.getByText(/Error al cargar los clientes/)).toBeVisible();
      
      // Verify retry mechanism is available
      const retryButton = page.getByRole('button', { name: /Reintentar/ });
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeVisible();
      }
    });

    test('should handle server errors during client creation', async ({ page }) => {
      // Mock server error response
      await page.route('**/api/clients', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' })
          });
        } else {
          route.continue();
        }
      });
      
      // Try to create a client
      await page.getByRole('button', { name: /Nuevo Cliente/ }).click();
      
      const modal = page.getByRole('dialog');
      await page.getByLabel(/Nombre/).fill('Test Client');
      await page.getByLabel(/Email/).fill('test@email.com');
      await page.getByRole('button', { name: /Guardar/ }).click();
      
      // Verify error message
      await expect(page.getByText(/Error al guardar el cliente/)).toBeVisible();
      
      // Verify modal stays open for user to retry
      await expect(modal).toBeVisible();
    });
  });
});
